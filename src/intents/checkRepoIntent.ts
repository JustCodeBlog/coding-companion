import { IProcessor } from '../language/processor';
import { IUser } from '../models';
import {
  GitService,
} from '../services';
import { DefaultIntent } from './defaultIntent';

class CheckRepoIntent extends DefaultIntent {
  public static LABEL_ALL: string = 'CHECK_ALL_REPOS';

  constructor(processor: IProcessor) {
    super(processor, CheckRepoIntent.LABEL_ALL);
  }

  protected action(data: any): void {
    // TODO: Check processor type

    const userInfo: IUser = this.processor.getUserInterface(data);
    const user: string = userInfo.user;
    const channel: string = userInfo.channel;

    // The "checkAll" will fire an event,
    // this event is handled in the main controller.
    GitService.getInstance().checkAll(user);

    const message: string = this.processor.getResponse(userInfo, this.label);
    this.emitProcessorResponse(user, channel, message);
  }
}

export { CheckRepoIntent };
