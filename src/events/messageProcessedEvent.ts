class MessageProcessedEvent {
  public static LABEL = 'message-processed';

  public type = MessageProcessedEvent.LABEL;
  public data: any = {};

  constructor(data: any) {
    this.data = data;
  }
}

export { MessageProcessedEvent };
