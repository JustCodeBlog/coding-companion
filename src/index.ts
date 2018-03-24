import * as _ from 'lodash';
import * as moment from 'moment-timezone';
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
const confs = new ConfigService();
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
  let depsList = '';
  let vulnsList = '';

  _.each(data.vulns, vuln => {
    vulnsList +=
      `*${vuln.path[0]}* => ${vuln.module} ${vuln.version} ` +
      `(CVSS Score ${vuln.cvss_score}) - *fixed* @ ${vuln.patched_versions} ` +
      `-- ${languageProcessor.getResponse('READ_MORE')}: ${vuln.advisory}\n`;
  });
  _.each(data.updates, (update: any, index: any) => {
    depsList += `*${index}* => ${update}\n`;
  });

  let message = languageProcessor.getResponse('GIT_REPO_ADVICE').replace('{repo}', repo);
  // TODO: Create single entries in the language dictionary
  message += vulnsList !== '' ? '\n' + vulnsMsg.replace('{repo}', repo).replace('{vulnerabilities}', vulnsList) : '';
  message += depsList !== '' ? '\n' + depsMsg.replace('{repo}', repo).replace('{dependencies_updates}', depsList) : '';

  const outcomingMessageEvent: OutcomingMessageEvent = new OutcomingMessageEvent(
    {
      channel,
      text: message
    }
  );
  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
});

git.on(GitEvent.COMMITS, (evt: any) => {
  const channel = evt.channel;
  const repo = evt.repo;

  let commitsList = '';
  _.each(evt.data, (commit: ICommit) => {
    commitsList += languageProcessor.getResponse('GIT_SINGLE_COMMIT')
      .replace('{human_date}', moment(commit.date).format('MMMM Do YYYY, h:mm:ss a'))
      .replace('{committer}', commit.author)
      .replace('{message}', commit.message)
      .replace('{url}', commit.url);
  })

  const message = languageProcessor
    .getResponse('GIT_COMMITS')
    .replace('{repo}', repo)
    .replace('{commits}', commitsList);

  const outcomingMessageEvent: OutcomingMessageEvent = new OutcomingMessageEvent(
    {
      channel,
      text: message
    }
  );
  slack.emit(outcomingMessageEvent.type, outcomingMessageEvent.data);
});

//
// Init/Config routines
moment().tz(ConfigService.params.timezone).format()
slack.setAuth(ConfigService.params.slackToken);
slack.connect();
git.setAuth({'bitbucket': ConfigService.params.bitbucketAppPassword});
git.initWatch();
