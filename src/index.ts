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
  StackOverflowService
} from './services';

// Singleton objects
const languageMemory = LanguageMemory.getInstance() as LanguageMemory;
const slack = SlackClient.getInstance();
const git: GitService = GitService.getInstance() as GitService;
const db: Db = Db.getInstance() as Db;

//
// Define services / clients
const languageProcessor = new LanguageProcessor(
  git,
  languageMemory,
  slack
);
const stackOverflowService = new StackOverflowService();

// Listen on slack client events
slack.on(IncomingMessageEvent.LABEL, (data: any) => {
  const user: string = data.user;
  const channel: string = data.channel;
  const msg: string = data.text;

  // This internally performs a check if it does exist
  // TODO: Perform this call only when a first message is sent
  db.createUser({user, channel});

  languageProcessor.handleCommand({
    user,
    channel,
    command: msg,
  });
});

//
// Listen on language processor events
languageProcessor.on(MessageProcessedEvent.LABEL, (data: any) => {
  const outcomingMessageEvent: OutcomingMessageEvent = new OutcomingMessageEvent(
    {
      channel: data.channel,
      text: data.message,
      user: data.user,
      attachments: data.attachments || undefined
    }
  );
  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
});

//
// Listen on Git client events
git.on(GitEvent.GIT_EVENT, (evt: any) => {
  console.log('GENERIC GIT EVENT', evt);
});

git.on(GitEvent.GIT_ERROR, (evt: any) => {
  console.log('GIT ERROR EVENT', evt);
});

git.on(GitEvent.PACKAGE_ANALYSIS, async (evt: any) => {
  let mnemonicPayload: string = '';
  const channel = evt.channel;
  const user: IUser[] = await db.findUser({ channel });
  const repo = evt.repo;
  const data = evt.data;

  let depsList = '';
  let vulnsList = '';

  _.each(data.vulns, vuln => {
    // Payload to be memorized
    mnemonicPayload += languageProcessor.getResponse(user[0], 'GIT_SINGLE_VULNERABILITY', {
      tree: vuln.path[0],
      module: vuln.module,
      version: vuln.version,
      cvssScore: '',
      patchedVersion: '',
      url: '',
      more: ''
    });

    // Part of the message to be sent
    vulnsList += languageProcessor.getResponse(user[0], 'GIT_SINGLE_VULNERABILITY', {
      tree: vuln.path[0],
      module: vuln.module,
      version: vuln.version,
      cvssScore: vuln.cvss_score,
      patchedVersion: vuln.patched_versions,
      url: vuln.advisory,
      more: languageProcessor.getResponse(user[0], 'READ_MORE')
    }) + '\n';
  });

  _.each(data.updates, (update: any, index: any) => {
    const lineData = { module: index, version: update };
    const line = languageProcessor.getResponse(user[0], 'GIT_SINGLE_DEPENDENCY', lineData);

    // Payload to be memorized
    mnemonicPayload += line;

    // Part of the message to be sent
    depsList += line + '\n';
  });

  // Constructing the final message
  let message = languageProcessor.getResponse(user[0], 'GIT_REPO_ADVICE', {repo});
  message += vulnsList !== ''
    ? '\n' + languageProcessor.getResponse(user[0], 'GIT_VULNERABILITIES', {repo, vulnerabilities: vulnsList})
    : '';

  message += depsList !== ''
    ? '\n' + languageProcessor.getResponse(user[0], 'GIT_DEPENDENCIES_UPDATES', {repo, dependencies_updates: depsList})
    : '';

  let outcomingMessageEvent: OutcomingMessageEvent;
  if (await languageMemory.isRecent(user[0], mnemonicPayload, true)) {
    outcomingMessageEvent = new OutcomingMessageEvent(
      {
        channel,
        text: languageProcessor.getResponse(user[0], 'IS_RECENT_MEMORY')
      }
    );
  } else {
    outcomingMessageEvent = new OutcomingMessageEvent(
      {
        channel,
        text: message
      }
    );
    languageMemory.store(user[0], mnemonicPayload);
  }
  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
});

git.on(GitEvent.COMMITS, async (evt: any) => {
  let mnemonicPayload: string = '';
  const channel = evt.channel;
  const repo = evt.repo;
  const user: IUser[] = await db.findUser({ channel });
  const actionMsg = languageProcessor.getResponse(user[0], 'GIT_OPEN_COMMIT');

  const text = languageProcessor.getResponse(user[0], 'GIT_COMMITS', {repo});

  const attachments: any = [];
  _.each(evt.data, (commit: ICommit) => {
    const fallback = languageProcessor
      .getResponse(user[0], 'GIT_SINGLE_COMMIT', {
        human_date: commit.date.toLocaleDateString(ConfigService.params.languageAlt, ConfigService.params.dateConf),
        committer: commit.author,
        email: commit.email,
        message: commit.message
      });

    mnemonicPayload += fallback;

    attachments.push({
      fallback,
      color: '#2eb886',
      author_name: commit.author,
      author_link: commit.email,
      title: commit.date.toLocaleDateString(ConfigService.params.languageAlt, ConfigService.params.dateConf),
      text: commit.message,
      actions: [
        {
          type: 'button',
          text: actionMsg,
          url: commit.url
        }
      ]
    });
  });

  let outcomingMessageEvent: OutcomingMessageEvent;
  if (await languageMemory.isRecent(user[0], mnemonicPayload, true)) {
    outcomingMessageEvent = new OutcomingMessageEvent(
      {
        channel,
        text: languageProcessor.getResponse(user[0], 'IS_RECENT_MEMORY')
      }
    );
  } else {
    outcomingMessageEvent = new OutcomingMessageEvent(
      {
        channel,
        text,
        attachments
      }
    );
    languageMemory.store(user[0], mnemonicPayload);
  }
  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
});


// ------------------------------------------------------------------
//
// Init/Config routines
git.setAuth({
  'bitbucket': ConfigService.params.bitbucketAppPassword
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
