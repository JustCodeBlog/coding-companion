import { RTMClient, WebClient } from '@slack/client';
import * as events from 'events';
import * as _ from 'lodash';

import { IncomingMessageEvent, OutcomingMessageEvent } from '../events';

class SlackClient extends events.EventEmitter {

  public static getInstance(): SlackClient {
    return SlackClient.instance;
  }

  private static instance: SlackClient = new SlackClient();

  private botName: string | undefined;
  private botPictureUrl: string | undefined;
  private token: string | undefined;
  private rtm: any;
  private web: any;
  private rtmOpts = {};

  constructor() {
    super();

    if (SlackClient.instance) {
      throw new Error(
        'Error: Instantiation failed: Use getInstance() instead of new.'
      );
    }

    SlackClient.instance = this;
  }

  public setAuth(botName: string, pictureUrl: string, token: string) {
    this.token = token;
    this.botName = botName;
    this.botPictureUrl = pictureUrl;
  }
  public connect() {
    if (typeof this.token === 'undefined') {
      throw new Error('The slack token is missing.');
    }

    this.rtm = new RTMClient(this.token);
    this.web = new WebClient(this.token);

    this.listenForChatMessages();
    this.listenForOutcomingMessages();

    this.rtm.start(this.rtmOpts);
  }

  public sendMessage(conversationId: string, message: string, attachments?: any) {
    this.web.chat
      .postMessage({
        username: this.botName,
        icon_url: this.botPictureUrl,
        channel: conversationId,
        text: message,
        attachments,
        mrkdwn: true
      })
      .catch(console.error);
  }

  public sendRtmMessage(conversationId: string, message: string) {
    this.rtm
      .send('message', {
        channel: conversationId,
        text: message,
        mrkdwn: true
      })
      .catch(console.error);
  }

  public deleteAllMessagesFromConversation(conversationId: string, userId: string) {
    this.web
      .conversations.history({
        channel: conversationId
      })
      .then((res: any) => {
        _.each(res.messages, (message: any) => {
          if (message.subtype === 'bot_message' ) {
            // Deleting the iterated message
            this.web.chat
            .delete({
              channel: conversationId,
              ts: message.ts
            })
            .catch(console.error);
          }
        });
      })
      .catch(console.error);
  }

  private listenForOutcomingMessages() {
    this.on(OutcomingMessageEvent.LABEL, (data: any) => {
      this.sendMessage(data.channel, data.text, data.attachments);
    });
  }

  private listenForChatMessages() {
    this.rtm.on('message', (data: any) => {
      // For structure of `event`, see https://api.slack.com/events/message

      // Skip empty messages or messages that are from a bot or my own user ID
      if (
        data.text === undefined
        || (data.subtype && data.subtype === 'bot_message')
        || (!data.subtype && data.user === this.rtm.activeUserId)
      ) {
        return;
      }

      const incomingMessageEvent: IncomingMessageEvent = new IncomingMessageEvent(data);
      this.emit(incomingMessageEvent.type, incomingMessageEvent.data);
    });
  }
}

export default SlackClient;
