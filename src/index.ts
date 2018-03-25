import * as _ from 'lodash';
import {
  GitEvent,
  IncomingMessageEvent,
  MessageProcessedEvent,
  OutcomingMessageEvent,
} from './events';
import { LanguageProcessor } from './language';
import { ConfigService, GitService, ICommit, SlackClient } from './services';

//
// Define objects
const slack = new SlackClient();
const git: GitService = GitService.getInstance() as GitService;
const languageProcessor = new LanguageProcessor();

// Listen on slack client events
slack.on(IncomingMessageEvent.LABEL, (data: any) => {
  const user: string = data.user;
  const channel: string = data.channel;
  const msg: string = data.text;

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

git.on(GitEvent.PACKAGE_ANALYSIS, (evt: any) => {
  const channel = evt.channel;
  const repo = evt.repo;
  const data = evt.data;

  const depsMsg = languageProcessor.getResponse('GIT_DEPENDENCIES_UPDATES');
  const vulnsMsg = languageProcessor.getResponse('GIT_VULNERABILITIES');
  const singleDepMsg = languageProcessor.getResponse('GIT_SINGLE_DEPENDENCY');
  const singleVulnMsg = languageProcessor.getResponse('GIT_SINGLE_VULNERABILITY');

  let depsList = '';
  let vulnsList = '';

  _.each(data.vulns, vuln => {
    vulnsList += singleVulnMsg
      .replace('{tree}', vuln.path[0])
      .replace('{module}', vuln.module)
      .replace('{version}', vuln.version)
      .replace('{cvssScore}', vuln.cvss_score)
      .replace('{patchedVersion}', vuln.patched_versions)
      .replace('{url}', vuln.advisory)
      .replace('{more}', languageProcessor.getResponse('READ_MORE')) + '\n';
  });

  _.each(data.updates, (update: any, index: any) => {
    depsList += singleDepMsg.replace('{module}', index).replace('{version}', update) + '\n';
  });

  let message = languageProcessor
    .getResponse('GIT_REPO_ADVICE')
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

  const outcomingMessageEvent: OutcomingMessageEvent = new OutcomingMessageEvent(
    {
      channel,
      text: message
    }
  );
  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
});

git.on(GitEvent.COMMITS, (evt: any) => {
  const actionMsg = languageProcessor.getResponse('GIT_OPEN_COMMIT');
  const channel = evt.channel;
  const repo = evt.repo;

  const text = languageProcessor
    .getResponse('GIT_COMMITS')
    .replace('{repo}', repo);

  const attachments: any = [];
  _.each(evt.data, (commit: ICommit) => {
    const fallback = languageProcessor
      .getResponse('GIT_SINGLE_COMMIT')
      .replace('{human_date}', commit.date.toLocaleDateString(ConfigService.params.languageAlt, ConfigService.params.dateConf))
      .replace('{committer}', commit.author)
      .replace('{email}', commit.email)
      .replace('{message}', commit.message);

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

  const outcomingMessageEvent: OutcomingMessageEvent = new OutcomingMessageEvent(
    {
      channel,
      text,
      attachments
    }
  );
  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
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