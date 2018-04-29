import { IProcessor, LanguageProcessor } from '../language/processor';
import { IUser } from '../models';

interface IDialog {
  user: IUser;
  name: string;
  start(): void;
  handleAnswer(answer: string, tokens: any[]): void;
}

class DefaultDialog implements IDialog {
  public user: IUser;
  public name: string;

  protected startedAt: Date | undefined;
  protected processor: IProcessor | any = {};

  protected SUCCESS_LABEL: string;
  protected CANCEL_LABEL: string;
  protected FAIL_LABEL: string;
  protected TTL: number = 120000; // 2 mins.
  protected ttlTimeout: any;

  protected hasFollowUp: boolean = false;
  protected consumedFollowUp: boolean = false;
  protected lastAnswerTime: number = 0;
  protected utteranceIndex: number = 0;

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

  public handleAnswer(answer: string, tokens: any[]): void {
    this.lastAnswerTime = new Date().getTime();

    if (this.validateAnswer(answer)) {
      const followUp = this.processor.dialogHasFollowUp(this.name);

      const knowledgeLabel = this.hasFollowUp
        ? this.processor.getDialogKnowledgeLabel(followUp)
        : this.processor.getDialogKnowledgeLabel(this.name);

      if (typeof followUp !== 'undefined' && !this.consumedFollowUp) {
        // If the dialog has a follow up which has not been yet consumed
        // we propose it
        this.hasFollowUp = true;
        this.consumedFollowUp = true;
        this.handleInternalOperation(followUp, this.user);
      } else {
        this.handleInternalOperation(this.SUCCESS_LABEL, this.user);
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

  protected handleInternalOperation(label: string, data: any, ...args: any[]):void {
    // TODO: Check processor type
    const userInfo: IUser = this.processor.getUserInterface(data);
    const user: string = userInfo.user;
    const channel: string = userInfo.channel;
    const message: string = this.processor.getResponse(userInfo, label);
    this.emitProcessorResponse(user, channel, message);
  }

  protected complete(): void {
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
