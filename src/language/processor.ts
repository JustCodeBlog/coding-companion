import * as events from 'events';
import * as _ from 'lodash';
import { DefaultDialog, IDialog, NewUserDialog } from '../dialogs';
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
import { IUser, User } from '../models';
import { en_EN, it_IT } from './dictionaries';
import { LanguageMemory } from './memory';
import { IParsedData, ParsedMessage, Parser } from './parser';

interface IResponse {
  label: string;
  user: string;
  channel: string;
  message: string;
  attachments?: any;
}

interface IInput {
  user: string;
  channel: string;
  input: string;
}

interface IProcessor {
  getResponse(user: IUser, label: string, data?: any, tries?: number): string;
  dialogHasFollowUp(label: string): string;
  getDialogKnowledgeLabel(label: string): string;
  startDialog(user: IUser, name: string): void;
  completeDialog(user: IUser, name: string): void;
  handleCommand(commandData: any): void;
  emitResponse(data: IResponse): void;
  emitError(user: IUser, err: any): void;
  getUtterances(label: string): string[];
  getSlots(label: string): any;
  getUserInterface(data: any): IUser;
  getUtteranceSentiment(input: string): number;
}

class LanguageProcessor extends events.EventEmitter {
  public static POSITIVE_UTTERANCE = [1, 5];
  public static NEUTRAL_UTTERANCE = 0;
  public static NEGATIVE_UTTERANCE = [-1, -5];

  private sleep: any;
  private nlc: any;
  private dict: any;

  private memory: LanguageMemory;
  private parser: Parser;
  private dialogs: any[] = [];

  constructor(languageMemory: LanguageMemory) {
    super();

    const NLC = require('natural-language-commander');

    this.sleep = require('sleep-async')().Promise;
    this.memory = languageMemory;
    this.dict = this.loadDefaultDictionary();
    this.parser = new Parser();
    this.nlc = new NLC();

    this.nlc.registerNotFound((data: IInput) => {
      const user: IUser = this.getUserInterface(data);

      if (this.isUserDialoguing(user)) {
        // Avoid to process the unknown command
        // if there is a dialog in course.
        return;
      }

      this.parser
        .parseMessage(data.input)
        .then((parsedMessage: ParsedMessage) => {
          // Constructing an emotional response based on
          // the polarity of the given input
          let emotion = 'NEUTRAL';
          let emotionResponse = 'TELLME_MORE';
          if (
            parsedMessage.data.sentiment.score >= -5 &&
            parsedMessage.data.sentiment.score <= -3
          ) {
            emotion = 'ANGRY';
            emotionResponse = 'DENY';
          } else if (
            parsedMessage.data.sentiment.score > -3 &&
            parsedMessage.data.sentiment.score < 0
          ) {
            emotion = 'SAD';
            emotionResponse = 'DENY';
          } else if (
            parsedMessage.data.sentiment.score > 0 &&
            parsedMessage.data.sentiment.score <= 3
          ) {
            emotion = 'HAPPY';
            emotionResponse = 'STIMULATE';
          } else if (
            parsedMessage.data.sentiment.score > 3 &&
            parsedMessage.data.sentiment.score <= 5
          ) {
            emotion = 'EXCITED';
            emotionResponse = 'STIMULATE';
          }

          this.emitResponse({
            label: 'UNKNOWN',
            user: data.user,
            channel: data.channel,
            message: `${this.getResponse(user, emotion)} ${this.getResponse(
              user,
              emotionResponse
            )}`,
          });
        })
        .catch(err => console.error);
    });

    this.registerIntents();
  }

  public getResponse(
    user: IUser,
    label: string,
    data?: any,
    tries: number = 0
  ): string {
    // TODO: Use "user" for customized messages

    const isRecent = async () => {
      return this.memory.isRecent(user, out);
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

  public dialogHasFollowUp(label: string): string {
    return this.dict[label].hasOwnProperty('followUp')
      ? this.dict[label].followUp
      : undefined;
  }

  public getDialogKnowledgeLabel(label: string): string {
    return this.dict[label].hasOwnProperty('knowledgeLabel')
      ? this.dict[label].knowledgeLabel
      : undefined;
  }

  public async handleCommand(commandData: any) {
    const { user, channel, command } = commandData;
    const oUser: IUser = { user, channel };
    const userModel: User = new User(oUser);
    const input: IInput = {
      user,
      channel,
      input: command,
    };

    if (this.isUserDialoguing(oUser)) {
      // Redirect all commands towards the ongoing dialog
      const tokens = this.parser.getTokens(command);
      this.getDialog(oUser).handleAnswer(command, tokens);
    } else {
      // If the user is unknown let's start
      // a first dialog
      if (!(await userModel.isAck())) {
        userModel.setAck();
        this.startDialog(oUser, 'NEW_USER');
      } else {
        // Use NLC to process the command
        this.nlc.handleCommand(
          // This object will be sent to every intent callback func.
          input,
          command
        );
      }
    }
  }

  public emitResponse(data: IResponse) {
    // We use a random sleep time to avoid
    // immediate responses which perceived to be
    // too much artificial.
    this.sleep.sleep(Math.random() * 250 + 250).then(() => {
      const event: MessageProcessedEvent = new MessageProcessedEvent(data);
      this.emit(event.type, event.data);
    });
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

  public getUtteranceSentiment(message: string): number {
    return this.parser.getSentiment(message).score;
  }

  public getSlots(label: string): any {
    return this.dict[label] && this.dict[label].slots
      ? this.dict[label].slots
      : [];
  }

  public startDialog(user: IUser, name: string): void {
    const dialog: IDialog = new NewUserDialog(this, user, name);
    dialog.start();

    this.dialogs = [...this.dialogs, dialog];
  }

  public completeDialog(user: IUser, name: string): void {
    this.dialogs = _.filter(
      this.dialogs,
      (dialog: IDialog) =>
        dialog.user.channel !== user.channel && dialog.name !== name
    );
  }

  /**
   * Returns a user interface if the input, no
   * matters what it is, contains the user and
   * channel properties
   * @param data The input object
   */
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
      new DefaultIntent(this, 'TEST').toObject(),
      new WelcomeIntent(this).toObject(),
      new WatchRepoIntent(this).toObject(),
      new CheckRepoIntent(this).toObject(),
      new RemoveMessageIntent(this).toObject(),
      new SolveProblemIntent(this).toObject(),
    ];

    _.each(intents, intent => {
      this.nlc.registerIntent(intent);
    });
  }

  private isUserDialoguing(user: IUser) {
    let output = false;
    _.each(this.dialogs, (dialog: IDialog) => {
      if (dialog.user.channel === user.channel) {
        output = true;
        return true;
      }
    });
    return output;
  }
  private getDialog(user: IUser): IDialog {
    return _.filter(
      this.dialogs,
      (dialog: IDialog) => dialog.user.channel === user.channel
    )[0];
  }
}

export { LanguageProcessor, IResponse, IProcessor };
