import * as _ from 'lodash';
import {
  GitEvent,
  IncomingMessageEvent,
  MessageProcessedEvent,
  OutcomingMessageEvent,
} from './events';
import { LanguageMemory, LanguageProcessor } from './language';
import { IUser } from './models';
import {
  ConfigService,
  Db,
  GitService,
  ICommit,
  IStackOverflowResult,
  SlackClient,
  StackOverflowService,
} from './services';

// Singleton objects
const languageMemory = LanguageMemory.getInstance() as LanguageMemory;
const slack = SlackClient.getInstance();
const git: GitService = GitService.getInstance() as GitService;
const db: Db = Db.getInstance() as Db;

//
// Define services / clients
const languageProcessor = new LanguageProcessor(languageMemory);
const stackOverflowService = new StackOverflowService();

// Listen on slack client events
slack.on(IncomingMessageEvent.LABEL, (res: any) => {
  const user: string = res.user;
  const channel: string = res.channel;
  const msg: string = res.text;

  // This internally performs a check if it does exist
  // TODO: Perform this call only when a first message is sent
  db.createUser({ user, channel });

  languageProcessor.handleCommand({
    user,
    channel,
    command: msg,
  });
});

//
// Listen on language processor events
languageProcessor.on(MessageProcessedEvent.LABEL, (res: any) => {
  const outcomingMessageEvent: OutcomingMessageEvent = new OutcomingMessageEvent(
    {
      channel: res.channel,
      text: res.message,
      user: res.user,
      attachments: res.attachments || undefined,
    }
  );
  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
});

//
// Listen on Git client events
git.on(GitEvent.GIT_EVENT, (res: any) => {
  console.log('GENERIC GIT EVENT', res);
});

git.on(GitEvent.GIT_ERROR, (res: any) => {
  console.log('GIT ERROR EVENT', res);
});

git.on(GitEvent.PACKAGE_ANALYSIS, async (res: any) => {
  let mnemonicPayload: string = '';
  const channel = res.channel;
  const user: IUser[] = await db.findUser({ channel });
  const repo = res.repo;
  const data = res.data;

  let depsList = '';
  let vulnsList = '';

  _.each(data.vulns, vuln => {
    // Payload to be memorized
    mnemonicPayload += languageProcessor.getResponse(
      user[0],
      'GIT_SINGLE_VULNERABILITY',
      {
        tree: vuln.path[0],
        module: vuln.module,
        version: vuln.version,
        cvssScore: '',
        patchedVersion: '',
        url: '',
        more: '',
      }
    );

    // Part of the message to be sent
    vulnsList +=
      languageProcessor.getResponse(user[0], 'GIT_SINGLE_VULNERABILITY', {
        tree: vuln.path[0],
        module: vuln.module,
        version: vuln.version,
        cvssScore: vuln.cvss_score,
        patchedVersion: vuln.patched_versions,
        url: vuln.advisory,
        more: languageProcessor.getResponse(user[0], 'READ_MORE'),
      }) + '\n';
  });

  _.each(data.updates, (item: any) => {
    const lineData = { ...item };
    const line = languageProcessor.getResponse(
      user[0],
      'GIT_SINGLE_DEPENDENCY',
      lineData
    );

    // Payload to be memorized
    mnemonicPayload += line;

    // Part of the message to be sent
    depsList += line + '\n';
  });

  // Constructing the final message
  let message = languageProcessor.getResponse(user[0], 'GIT_REPO_ADVICE', {
    repo,
  });
  message +=
    vulnsList !== ''
      ? '\n' +
        languageProcessor.getResponse(user[0], 'GIT_VULNERABILITIES', {
          repo,
          vulnerabilities: vulnsList,
        })
      : '';

  message +=
    depsList !== ''
      ? '\n' +
        languageProcessor.getResponse(user[0], 'GIT_DEPENDENCIES_UPDATES', {
          repo,
          dependencies_updates: depsList,
        })
      : '';

  let outcomingMessageEvent: OutcomingMessageEvent;
  if (await languageMemory.isRecent(user[0], mnemonicPayload, true)) {
    if (res.isAutomated) {
      // Say nothing if the response is recent and there is no
      // direct interaction with the user.
      return;
    }

    outcomingMessageEvent = new OutcomingMessageEvent({
      channel,
      text: languageProcessor.getResponse(user[0], 'NO_NEW_VULNS_OR_DEPS', {
        repo,
      }),
    });
  } else {
    outcomingMessageEvent = new OutcomingMessageEvent({
      channel,
      text: message,
    });
    languageMemory.store(user[0], mnemonicPayload);
  }

  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
});

git.on(GitEvent.COMMITS, async (res: any) => {
  let mnemonicPayload: string = '';
  const channel = res.channel;
  const repo = res.repo;
  const user: IUser[] = await db.findUser({ channel });
  const actionMsg = languageProcessor.getResponse(user[0], 'GIT_OPEN_COMMIT');

  const text = languageProcessor.getResponse(user[0], 'GIT_COMMITS', { repo });

  const attachments: any = [];
  _.each(res.data, (commit: ICommit) => {
    const fallback = languageProcessor.getResponse(
      user[0],
      'GIT_SINGLE_COMMIT',
      {
        human_date: commit.date.toLocaleDateString(
          ConfigService.params.languageAlt,
          ConfigService.params.dateConf
        ),
        committer: commit.author,
        email: commit.email,
        message: commit.message,
      }
    );

    mnemonicPayload += fallback;

    attachments.push({
      fallback,
      color: '#2eb886',
      author_name: commit.author,
      author_link: commit.email,
      title: commit.date.toLocaleDateString(
        ConfigService.params.languageAlt,
        ConfigService.params.dateConf
      ),
      text: commit.message,
      actions: [
        {
          type: 'button',
          text: actionMsg,
          url: commit.url,
        },
      ],
    });
  });

  let outcomingMessageEvent: OutcomingMessageEvent;
  if (await languageMemory.isRecent(user[0], mnemonicPayload, true)) {
    if (res.isAutomated) {
      // Say nothing if the response is recent and there is no
      // direct interaction with the user.
      return;
    }

    outcomingMessageEvent = new OutcomingMessageEvent({
      channel,
      text: languageProcessor.getResponse(user[0], 'NO_NEW_COMMIT', { repo }),
    });
  } else {
    outcomingMessageEvent = new OutcomingMessageEvent({
      channel,
      text,
      attachments,
    });
    languageMemory.store(user[0], mnemonicPayload);
  }

  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
});

// ------------------------------------------------------------------
//
// Init/Config routines
git.setAuth({
  bitbucket: ConfigService.params.bitbucketAppPassword,
});
git.initWatch();

slack.setAuth(
  ConfigService.params.botName,
  ConfigService.params.botPicture,
  ConfigService.params.slackToken
);
slack.connect();
//
// ------------------------------------------------------------------
