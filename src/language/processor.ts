import * as events from 'events';
import * as _ from 'lodash';
import { MessageProcessedEvent } from '../events';
import {
  CheckRepoIntent,
  DefaultIntent,
  IIntent,
  IIntentObject,
  RemoveMessageIntent,
  SolveProblemIntent,
  WatchRepoIntent,
  WelcomeIntent,
} from '../intents';
import { IUser } from '../models';
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

  constructor(
    languageMemory: LanguageMemory,
  ) {
    super();

    const NLC = require('natural-language-commander');

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
      command,
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
    return this.dict[label]
      ? this.dict[label].utterances
      : [];
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

  private registerIntents() {
    const intents = [
      /**
       *
       */
      new DefaultIntent(this, 'TEST').toObject(),
      /**
       *
       */
      new WelcomeIntent(this).toObject(),
      /**
       *
       */
      new WatchRepoIntent(this).toObject(),
      /**
       *
       */
      new CheckRepoIntent(this).toObject(),
      /**
       *
       */
      new RemoveMessageIntent(this).toObject(),
      /**
       *
       */
      new SolveProblemIntent(this).toObject(),
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
