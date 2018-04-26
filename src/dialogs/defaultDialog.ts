import { IProcessor, LanguageProcessor } from '../language/processor';
import { IUser } from '../models';

interface IDialog {
  user: IUser;
  name: string;
  start(): void;
  handleAnswer(answer: string): void;
}

class DefaultDialog implements IDialog {
  public user: IUser;
  public name: string;

  protected startedAt: Date | undefined;
  protected processor: IProcessor | any = {};

  private SUCCESS_LABEL: string;
  private CANCEL_LABEL: string;
  private FAIL_LABEL: string;
  private TTL: number = 120000; // 2 mins.
  private ttlTimeout: any;

  private hasFollowUp: boolean = false;
  private consumedFollowUp: boolean = false;
  private lastAnswerTime: number = 0;

  constructor(
    processor: IProcessor,
    user: IUser,
    name: string,
  ) {
    this.processor = processor;
    this.user = user;
    this.name = name;
    this.SUCCESS_LABEL = `${this.name}_SUCCESS`;
    this.CANCEL_LABEL  = `${this.name}_CANCEL`;
    this.FAIL_LABEL  = `${this.name}_FAIL`;
  }

  public start(...args: any[]): void {
    this.startedAt = new Date();
    this.handleInternalOperation(this.name, this.user, args);

    if (typeof this.ttlTimeout === 'undefined') {
      this.initTimeout();
    }
  }

  public handleAnswer(answer: string): void {
    this.lastAnswerTime = new Date().getTime();

    if (this.validateAnswer(answer)) {
      const followUp = this.processor.dialogHasFollowUp(this.name);

      if (typeof followUp !== 'undefined' && !this.consumedFollowUp) {
        // If the dialog has a follow up which has not been yet consumed
        // we propose it
        this.hasFollowUp = true;
        this.consumedFollowUp = true;
        this.handleInternalOperation(followUp, this.user);
      } else {
        const sentimentScore = this.processor.getUtteranceSentiment(answer);
        // In case of negative answer we avoid
        // to display a positive answer, taking by granted
        // that the user want to cancel (quit) the dialog
        if (
          sentimentScore >= LanguageProcessor.NEGATIVE_UTTERANCE[1]
          && sentimentScore <= LanguageProcessor.NEGATIVE_UTTERANCE[0]
        ) {
          this.handleInternalOperation(this.CANCEL_LABEL, this.user);
        } else {
          this.handleInternalOperation(this.SUCCESS_LABEL, this.user);
        }
        this.complete();
      }
    } else {
      this.consumedFollowUp = true;
      this.handleInternalOperation(this.CANCEL_LABEL, this.user);
      this.complete();
    }
  }

  protected validateAnswer(input: string): boolean {
    const sentimentScore = this.processor.getUtteranceSentiment(input);
    return input !== '' && !(
      sentimentScore >= LanguageProcessor.NEGATIVE_UTTERANCE[1]
      && sentimentScore <= LanguageProcessor.NEGATIVE_UTTERANCE[0]
    );
  }

  protected emitProcessorResponse(
    user: string,
    channel: string,
    message: string,
    attachments?: any,
  ): void {
    if (typeof this.processor === 'undefined') {
      throw new Error('A dialog cannot be working without a processor.');
    }

    this.processor.emitResponse({
      label: this.name,
      user,
      channel,
      message,
      attachments,
    });
  }

  private handleInternalOperation(label: string, data: any, ...args: any[]):void {
    // TODO: Check processor type
    const userInfo: IUser = this.processor.getUserInterface(data);
    const user: string = userInfo.user;
    const channel: string = userInfo.channel;
    const message: string = this.processor.getResponse(userInfo, label);
    this.emitProcessorResponse(user, channel, message);
  }

  private complete(): void {
    this.processor.completeDialog(this.user, this.name);
    this.stopTimeout();
  }

  private initTimeout(): void {
    this.ttlTimeout = setTimeout(() => {
      const dt = new Date().getTime() - this.lastAnswerTime;
      if (dt >= this.TTL) {
        this.handleInternalOperation(this.CANCEL_LABEL, this.user);
        this.complete();
      } else {
        this.initTimeout();
      }
    }, this.TTL);
  }

  private stopTimeout(): void {
    clearTimeout(this.ttlTimeout);
  }
}

export { DefaultDialog, IDialog };
