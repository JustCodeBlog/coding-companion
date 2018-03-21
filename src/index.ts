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
git.on(GitEvent.GIT_EVENT, (data: any) => {
  console.log('GENERIC GIT EVENT', data);
});
git.on(GitEvent.GIT_ERROR, (data: any) => {
  console.log('GIT ERROR EVENT', data);
});
git.on(GitEvent.PACKAGE_ANALYSIS, (data: any) => {
  console.log('PACKAGE ANALYSIS EVENT', data);
  const channel = data.channel;
  const repo = data.repo;

  const depsMsg = languageProcessor.getResponse('GIT_DEPENDENCIES_UPDATES');
  const depsList = '';
  const vulnsMsg = languageProcessor.getResponse('GIT_VULNERABILITIES');
  const vulnsList = '';
  _.each(data.vulns, vuln => {
    //
  });
  _.each(data.updates, update => {
    //
  });
  // TODO: Emit outComingMessageEvent towards slack client
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
