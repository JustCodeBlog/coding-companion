import * as events from 'events';
import * as _ from 'lodash';
import { MessageProcessedEvent } from '../events';
import {
  DefaultIntent,
  IIntent,
  IIntentObject,
  WelcomeIntent,
} from '../intents';
import { IUser } from '../models';
import {
  GitService,
  GoogleService,
  IGoogleResult,
  IStackOverflowResult,
  SlackClient,
  StackOverflowService,
} from '../services';
import { en_EN, it_IT } from './dictionaries';
import { LanguageMemory } from './memory';

interface IResponse {
  label: string;
  user: string;
  channel: string;
  message: string;
  attachments?: any;
}

interface IProcessor {
  getResponse(user: IUser, label: string, data?: any, tries?: number): string;
  handleCommand(commandData: any): void;
  emitResponse(data: IResponse): void;
  emitError(user: IUser, err: any): void;
  getUtterances(label: string): string[];
  getSlots(label: string): any;
  getUserInterface(data: any): IUser;
}

class LanguageProcessor extends events.EventEmitter {
  private nlc: any;
  private dict: any;

  private memory: LanguageMemory;
  private git: GitService;
  private slack: SlackClient;

  constructor(
    gitService: GitService,
    languageMemory: LanguageMemory,
    slackClient: SlackClient
  ) {
    super();

    const NLC = require('natural-language-commander');

    this.git = gitService;
    this.slack = slackClient;
    this.memory = languageMemory;

    this.dict = this.loadDefaultDictionary();

    this.nlc = new NLC();
    this.nlc.registerNotFound((data: any) => {
      const user: IUser = this.getUserInterface(data);

      this.emitResponse({
        label: 'UNKNOWN',
        user: data.user,
        channel: data.channel,
        message: this.getResponse(user, 'UNKNOWN'),
      });
    });

    this.registerIntents();
    this.registerDialogs();
  }

  public getResponse(
    user: IUser,
    label: string,
    data?: any,
    tries: number = 0
  ): string {
    // TODO: Use "user" for customized messages

    const isRecent = async () => {
      const ret = await this.memory.isRecent(user, out);
      return ret;
    };

    const response = this.dict[label]
      ? this.dict[label].answers
      : this.dict.UNKNOWN.answers;

    let out = response;
    if (typeof response === 'object') {
      out = this.hydrateDataInResponse(
        data,
        response[Math.floor(Math.random() * response.length)]
      );
    } else {
      out = this.hydrateDataInResponse(data, out);
    }

    if (response.length > 1 && isRecent() && tries < response.length) {
      return this.getResponse(user, label, data, ++tries);
    }

    this.memory.store(user, out);
    return out;
  }

  public handleCommand(commandData: any) {
    const { user, channel, command } = commandData;
    this.nlc.handleCommand(
      // This object will be sent to every intent callback func.
      {
        user,
        channel,
      },
      // The string to be parsed
      command
    );
  }

  public emitResponse(data: IResponse) {
    const event: MessageProcessedEvent = new MessageProcessedEvent(data);
    this.emit(event.type, event.data);
  }

  public emitError(user: IUser, err: any) {
    this.emitResponse({
      label: 'ERROR',
      user: user.user,
      channel: user.channel,
      message: this.getResponse(user, 'ERROR'),
    });
  }

  public getUtterances(label: string): string[] {
    return this.dict[label] ? this.dict[label].utterances : [];
  }

  public getSlots(label: string): any {
    return this.dict[label] && this.dict[label].slots
      ? this.dict[label].slots
      : [];
  }

  public getUserInterface(data: any): IUser {
    let output: IUser = {
      user: '',
      channel: '',
    };

    if (typeof data.user === 'undefined' || data.channel === 'undefined') {
      console.error('Trying to get user interface from invalid source', data);
    } else {
      output = {
        user: data.user,
        channel: data.channel,
      };
    }

    return output;
  }

  private hydrateDataInResponse(data: any, message: string): string {
    _.each(data, (d: any, i: number) => {
      message = message.replace(new RegExp(`{${i}}`, 'igm'), d);
    });
    return message;
  }

  private loadDefaultDictionary(): any {
    // TODO: This has to be improved a little bit :)
    return it_IT.default;
  }

  private getDefaultIntent(label: string, cb?: any): IIntentObject {
    return new DefaultIntent(this, label, cb).toObject();
  }

  private registerIntents() {
    const intents = [
      /**
       *
       */
      new WelcomeIntent(this).toObject(),

      /**
       *
       */
      this.getDefaultIntent('TEST'),

      /**
       *
       */
      this.getDefaultIntent('WATCH_REPO', (data: any, repo: string) => {
        const user: IUser = this.getUserInterface(data);

        this.git
          .createRepository(data.user, data.channel, repo)
          .then((res: any) => {
            const label = !res ? 'REPO_EXISTS' : 'WATCH_REPO';
            this.emitResponse({
              label,
              user: data.user,
              channel: data.channel,
              message: this.getResponse(user, label),
            });
          })
          .catch((err: any) => this.emitError(user, err));
      }),

      /**
       *
       */
      this.getDefaultIntent('CHECK_ALL_REPOS', (data: any) => {
        const user: IUser = this.getUserInterface(data);

        // The "checkAll" will fire an event,
        // this event is handled in the main controller.
        this.git.checkAll(data.user);

        this.emitResponse({
          label: 'CHECK_ALL_REPOS',
          user: data.user,
          channel: data.channel,
          message: this.getResponse(user, 'CHECK_ALL_REPOS'),
        });
      }),

      /**
       *
       */
      this.getDefaultIntent('REMOVE_ALL_MESSAGES', (data: any) => {
        const user: IUser = this.getUserInterface(data);

        this.slack.deleteAllMessagesFromConversation(data.channel, data.user);

        this.emitResponse({
          label: 'REMOVE_ALL_MESSAGES',
          user: data.user,
          channel: data.channel,
          message: this.getResponse(user, 'REMOVE_ALL_MESSAGES'),
        });
      }),

      /**
       *
       */
      this.getDefaultIntent('SOLVE_PROBLEM', (data: any, problem: string) => {
        const user: IUser = this.getUserInterface(data);

        // TODO: Handle different kind of problems
        // TODO: Move the construction of the message somewhere else?
        let promises = [];
        promises = [
          new StackOverflowService().searchAnswer(problem, 3),
          new GoogleService().searchAnswer(problem, 3),
        ];

        Promise.all(promises)
          .then((res: any) => {
            const stackOverflowResults: IStackOverflowResult[] = res[0];
            const googleResults: IGoogleResult[] = res[1];

            const attachments: any = [];
            _.each(googleResults, (result: IGoogleResult) => {
              attachments.push({
                fallback: '',
                color: '#2196F3',
                author_name: result.title,
                author_link: result.url,
                title: 'Dal web',
                text: result.summary,
              });
            });

            _.each(stackOverflowResults, (result: IStackOverflowResult) => {
              attachments.push({
                fallback: '',
                color: '#2196F3',
                author_name: result.title,
                author_link: result.url,
                title: 'Su StackOverflow',
                text: result.tags.join(','),
              });
            });

            this.emitResponse({
              label: 'SOLVE_PROBLEM',
              user: data.user,
              channel: data.channel,
              message: '',
              attachments,
            });
          })
          .catch(console.error);

        this.emitResponse({
          label: 'SOLVE_PROBLEM',
          user: data.user,
          channel: data.channel,
          message: this.getResponse(user, 'SOLVE_PROBLEM'),
        });
      }),
    ];

    _.each(intents, intent => {
      this.nlc.registerIntent(intent);
    });
  }

  private registerDialogs() {
    // TODO: TBD
  }
}

export { LanguageProcessor, IResponse, IProcessor };
