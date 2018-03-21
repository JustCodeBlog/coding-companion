import * as events from 'events';
import * as _ from 'lodash';
import { MessageProcessedEvent } from '../events';
import { Db, GitClient } from '../services';
import { en_EN, it_IT } from './dictionaries';

interface IResponse {
  label: string;
  user: string;
  channel: string;
  message: string;
}

class LanguageProcessor extends events.EventEmitter {
  private nlc: any;
  private dict: any;

  constructor() {
    super();

    const NLC = require('natural-language-commander');

    this.dict = this.loadDefaultDictionary();
    this.nlc = new NLC();

    this.registerIntents();
    this.registerDialogs();

    this.nlc.registerNotFound((data: any) => {
      this.emitResponse({
        label: 'UNKNOWN',
        user: data.user,
        channel: data.channel,
        message: this.getResponse('UNKNOWN'),
      });
    });
  }

  public getResponse(label: string, data?: any): string {
    // TODO: Apply data values if they are expected in the response

    const response = this.dict[label]
      ? this.dict[label].answers
      : this.dict.UNKNOWN.answers;

    let out = response;
    if (typeof response === 'object') {
      // TODO: Introduce a coeff. to order the responses
      // based on the last time they got returned.
      out = response[Math.floor(Math.random() * (response.length - 1))];
    }

    return out;
  }

  public handleCommand(commandData: any) {
    const { user, channel, command } = commandData;
    this.nlc.handleCommand(
      {
        user,
        channel,
      },
      command
    );
  }

  private emitResponse(data: IResponse) {
    const event: MessageProcessedEvent = new MessageProcessedEvent(data);
    this.emit(event.type, event.data);
  }

  private loadDefaultDictionary(): any {
    // TODO: This has to be improved a little bit :)
    return it_IT.default;
  }

  private getUtterances(label: string): string[] {
    return this.dict[label] ? this.dict[label].utterances : [];
  }

  private getSlots(label: string): any {
    return this.dict[label] && this.dict[label].slots
      ? this.dict[label].slots
      : [];
  }

  private registerIntents() {
    const intents = [
      {
        intent: 'WELCOME',
        utterances: this.getUtterances('WELCOME'),
        slots: this.getSlots('WELCOME'),
        callback: (data: any) => {
          this.emitResponse({
            label: 'WELCOME',
            user: data.user,
            channel: data.channel,
            message: this.getResponse('WELCOME'),
          });
        },
      },

      {
        intent: 'WATCH_REPO',
        utterances: this.getUtterances('WATCH_REPO'),
        slots: this.getSlots('WATCH_REPO'),
        callback: (data: any, repo: string) => {
          //
          // TODO: Move into the GitService ?
          //
          Db.getInstance()
            .createRepository({
              user: data.user,
              channel: data.channel,
              url: repo.substring(1, repo.length - 1), // the URL comes in such a format <URL>
            })
            .then(res => {
              const label = !res ? 'REPO_EXISTS' : 'WATCH_REPO';
              this.emitResponse({
                label,
                user: data.user,
                channel: data.channel,
                message: this.getResponse(label),
              });
            })
            .catch(err => {
              // TODO: Log error

              this.emitResponse({
                label: 'ERROR',
                user: data.user,
                channel: data.channel,
                message: this.getResponse('ERROR'),
              });
            });
        },
      },

      {
        intent: 'CHECK_ALL_REPOS',
        utterances: this.getUtterances('CHECK_ALL_REPOS'),
        slots: this.getSlots('CHECK_ALL_REPOS'),
        callback: (data: any) => {
          // TODO: Only a master user can do this
          GitClient.getInstance().checkAll();

          this.emitResponse({
            label: 'CHECK_ALL_REPOS',
            user: data.user,
            channel: data.channel,
            message: this.getResponse('CHECK_ALL_REPOS'),
          });
        },
      },
    ];

    _.each(intents, intent => {
      this.nlc.registerIntent(intent);
    });
  }

  private registerDialogs() {
    // TODO: TBD
  }
}

export default LanguageProcessor;
