import { IProcessor } from '../language/processor';
import { IUser } from '../models';
import {
  SlackClient,
} from '../services';
import { DefaultIntent } from './defaultIntent';

class RemoveMessageIntent extends DefaultIntent {
  public static LABEL_ALL: string = 'REMOVE_ALL_MESSAGES';

  constructor(processor: IProcessor) {
    super(processor, RemoveMessageIntent.LABEL_ALL);
  }

  protected action(data: any): void {
    // TODO: Check processor type

    const userInfo: IUser = this.processor.getUserInterface(data);
    const user: string = userInfo.user;
    const channel: string = userInfo.channel;

    SlackClient.getInstance()
      .deleteAllMessagesFromConversation(channel, user);

    const message: string = this.processor.getResponse(userInfo, this.label);
    this.emitProcessorResponse(user, channel, message);
  }
}

export { RemoveMessageIntent };
