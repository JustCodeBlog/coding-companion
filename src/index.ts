import * as _ from 'lodash';
import {
  GitEvent,
  IncomingMessageEvent,
  MessageProcessedEvent,
  OutcomingMessageEvent,
} from './events';
import { LanguageProcessor } from './language';
import { GitClient, SlackClient } from './services';

const slack = new SlackClient(process.env.SLACK_TOKEN);
const git: GitClient = GitClient.getInstance() as GitClient;
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
  let depsList = '';
  const vulnsMsg = languageProcessor.getResponse('GIT_VULNERABILITIES');
  let vulnsList = '';

  _.each(data.vulns, vuln => {
    vulnsList += `*${vuln.path[0]}* => ${vuln.module} ${vuln.version} (CVSS Score ${vuln.cvss_score}) - *fixed* @ ${vuln.patched_versions}` +
                 ` -- ${languageProcessor.getResponse('READ_MORE')}: ${vuln.advisory}\n`;
  });
  _.each(data.updates, (update: any, index: any) => {
    depsList += `*${index}* => ${update}\n`;
  });

  let message = languageProcessor.getResponse('GIT_REPO_ADVICE').replace('{repo}', repo);
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
git.on(GitEvent.COMMITS, (data: any) => {
  console.log('GIT COMMITS EVENT', data);
  const channel = data.channel;
  const repo = data.repo;
  const commitsMsg = languageProcessor.getResponse('GIT_COMMITS');
  // TODO: Emit outComingMessageEvent towards slack client
});

// Init stuff
slack.connect();
git.initWatch();
