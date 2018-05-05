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

  protected processor: IProcessor | any = {};

  constructor(processor: IProcessor, label: string, callback?: any) {
    this.processor = processor;
    this.label = label;
    this.utterances = processor.getUtterances(label);
    this.slots = processor.getSlots(label);
    this.callback =
      typeof callback === 'undefined' ? this.action.bind(this) : callback;
  }

  public toObject(): IIntentObject {
    return {
      intent: this.label,
      utterances: this.utterances,
      slots: this.slots,
      callback: this.callback,
    };
  }

  protected action(data: any, ...args: any[]): void {
    // TODO: Check processor type

    const userInfo: IUser = this.processor.getUserInterface(data);
    const user: string = userInfo.user;
    const channel: string = userInfo.channel;
    const message: string = this.processor.getResponse(userInfo, this.label);
    this.emitProcessorResponse(user, channel, message);
  }

  protected emitProcessorResponse(
    user: string,
    channel: string,
    message: string,
    attachments?: any
  ): void {
    if (typeof this.processor === 'undefined') {
      throw new Error('An intent cannot be working without a processor.');
    }

    this.processor.emitResponse({
      label: this.label,
      user,
      channel,
      message,
      attachments,
    });
  }
}

export { DefaultIntent, IIntent, IIntentObject };
