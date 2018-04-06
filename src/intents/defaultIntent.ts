import { IProcessor } from '../language/processor';
import { IUser } from '../models';

interface IIntent {
  label?: string;
  utterances: any;
  slots: any;
  callback?: any;
  toObject(): IIntentObject;
}

interface IIntentObject {
  intent?: string;
  utterances: any;
  slots: any;
  callback?: any;
}

class DefaultIntent implements IIntent {
  public label: string;
  public utterances: any;
  public slots: any;
  public callback: any;

  private processor: IProcessor | undefined;

  constructor(processor: IProcessor, label: string, callback?: any) {
    this.processor = processor;
    this.label = label;
    this.utterances = processor.getUtterances(label);
    this.slots = processor.getSlots(label);
    this.callback =
      typeof callback === 'undefined'
        ? (data: any) => {
            const user: IUser = processor.getUserInterface(data);
            processor.emitResponse({
              label,
              user: data.user,
              channel: data.channel,
              message: processor.getResponse(user, label),
            });
          }
        : callback;
  }

  public toObject(): IIntentObject {
    return {
      intent: this.label,
      utterances: this.utterances,
      slots: this.slots,
      callback: this.callback,
    };
  }
}

export { DefaultIntent, IIntent, IIntentObject };
