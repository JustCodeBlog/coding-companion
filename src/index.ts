import * as _ from 'lodash';
import {
  GitEvent,
  IncomingMessageEvent,
  MessageProcessedEvent,
  OutcomingMessageEvent,
} from './events';
import { LanguageMemory, LanguageProcessor } from './language';
import { IUser } from './models';
import { ConfigService, Db, GitService, ICommit, SlackClient } from './services';

//
// Define services / clients
const slack = new SlackClient();
const languageProcessor = new LanguageProcessor();

// Singleton objects
const languageMemory = LanguageMemory.getInstance() as LanguageMemory;
const git: GitService = GitService.getInstance() as GitService;
const db: Db = Db.getInstance() as Db;

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

  const depsMsg = languageProcessor.getResponse(user[0], 'GIT_DEPENDENCIES_UPDATES');
  const vulnsMsg = languageProcessor.getResponse(user[0], 'GIT_VULNERABILITIES');
  const singleDepMsg = languageProcessor.getResponse(user[0], 'GIT_SINGLE_DEPENDENCY');
  const singleVulnMsg = languageProcessor.getResponse(user[0], 'GIT_SINGLE_VULNERABILITY');

  let depsList = '';
  let vulnsList = '';

  _.each(data.vulns, vuln => {
    // Payload to be memorized
    mnemonicPayload += singleVulnMsg
    .replace('{tree}', vuln.path[0])
    .replace('{module}', vuln.module)
    .replace('{version}', vuln.version)
    .replace('{cvssScore}', '')
    .replace('{patchedVersion}', '')
    .replace('{url}', '')
    .replace('{more}', '');

    vulnsList += singleVulnMsg
      .replace('{tree}', vuln.path[0])
      .replace('{module}', vuln.module)
      .replace('{version}', vuln.version)
      .replace('{cvssScore}', vuln.cvss_score)
      .replace('{patchedVersion}', vuln.patched_versions)
      .replace('{url}', vuln.advisory)
      .replace('{more}', languageProcessor.getResponse(user[0], 'READ_MORE')) + '\n';
  });

  _.each(data.updates, (update: any, index: any) => {
    const line = singleDepMsg.replace('{module}', index).replace('{version}', update);
    // Payload to be memorized
    mnemonicPayload += line;
    depsList += line + '\n';
  });

  // Constructing the final message
  let message = languageProcessor
    .getResponse(user[0], 'GIT_REPO_ADVICE')
    .replace('{repo}', repo);

  message += vulnsList !== ''
    ? '\n' + vulnsMsg
      .replace('{repo}', repo)
      .replace('{vulnerabilities}', vulnsList)
    : '';

  message += depsList !== ''
    ? '\n' + depsMsg
      .replace('{repo}', repo)
      .replace('{dependencies_updates}', depsList)
    : '';

  if (await languageMemory.isRecent(user[0], mnemonicPayload)) {
    console.log('%s seems to be a recent memory', mnemonicPayload);
  } else {
    const outcomingMessageEvent: OutcomingMessageEvent = new OutcomingMessageEvent(
      {
        channel,
        text: message
      }
    );
    slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
    languageMemory.store(user[0], mnemonicPayload);
  }
});

git.on(GitEvent.COMMITS, async (evt: any) => {
  let mnemonicPayload: string = '';
  const channel = evt.channel;
  const repo = evt.repo;
  const user: IUser[] = await db.findUser({ channel });
  const actionMsg = languageProcessor.getResponse(user[0], 'GIT_OPEN_COMMIT');

  const text = languageProcessor
    .getResponse(user[0], 'GIT_COMMITS')
    .replace('{repo}', repo);

  const attachments: any = [];
  _.each(evt.data, (commit: ICommit) => {
    const fallback = languageProcessor
      .getResponse(user[0], 'GIT_SINGLE_COMMIT')
      .replace('{human_date}', commit.date.toLocaleDateString(ConfigService.params.languageAlt, ConfigService.params.dateConf))
      .replace('{committer}', commit.author)
      .replace('{email}', commit.email)
      .replace('{message}', commit.message);

    mnemonicPayload += fallback;

      attachments.push({
      fallback,
      color: "#2eb886",
      author_name: commit.author,
      author_link: commit.email,
      title: commit.date.toLocaleDateString(ConfigService.params.languageAlt, ConfigService.params.dateConf),
      text: commit.message,
      actions: [
        {
          type: "button",
          text: actionMsg,
          url: commit.url
        }
      ]
    });
  });

  if (await languageMemory.isRecent(user[0], mnemonicPayload)) {
    console.log('%s seems to be a recent memory', mnemonicPayload);
  } else {
    const outcomingMessageEvent: OutcomingMessageEvent = new OutcomingMessageEvent(
      {
        channel,
        text,
        attachments
      }
    );
    slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
    languageMemory.store(user[0], mnemonicPayload);
  }
});

//
// Init/Config routines
git.setAuth({'bitbucket': ConfigService.params.bitbucketAppPassword});
git.initWatch();
slack.setAuth(
  ConfigService.params.botName,
  ConfigService.params.botPicture,
  ConfigService.params.slackToken
);
slack.connect();
