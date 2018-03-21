import { RTMClient } from '@slack/client';
import * as events from 'events';

import { IncomingMessageEvent, OutcomingMessageEvent } from '../events';

class SlackClient extends events.EventEmitter {
  private token: string | undefined;
  private rtm: any;
  private rtmOpts = {};

  constructor(token: string | undefined) {
    super();

    if (typeof token === 'undefined') {
      throw new Error('The slack token is missing.');
    }

    this.token = token;
    this.rtm = new RTMClient(this.token);
  }

  public connect() {
    this.listenForChatMessages();
    this.listenForOutcomingMessages();
    this.rtm.start(this.rtmOpts);
  }

  public sendMessage(conversationId: string, message: string) {
    this.rtm
      .sendMessage(message, conversationId)
      // .then((res: any) => {
      //   console.log('Message sent: ', res.ts);
      // })
      .catch(console.error);
  }

  private listenForOutcomingMessages() {
    this.on(OutcomingMessageEvent.LABEL, (data: any) => {
      this.sendMessage(data.channel, data.text);
    });
  }

  private listenForChatMessages() {
    this.rtm.on('message', (data: any) => {
      // For structure of `event`, see https://api.slack.com/events/message

      // Skip empty messages or messages that are from a bot or my own user ID
      if (
        data.text === undefined ||
        (data.subtype && data.subtype === 'bot_message') ||
        (!data.subtype && data.user === this.rtm.activeUserId)
      ) {
        return;
      }

      const incomingMessageEvent: IncomingMessageEvent = new IncomingMessageEvent(
        data
      );
      this.emit(incomingMessageEvent.type, incomingMessageEvent.data);
    });
  }
}

export default SlackClient;
