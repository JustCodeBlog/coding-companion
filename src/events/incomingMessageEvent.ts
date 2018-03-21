class IncomingMessageEvent {
  public static LABEL = 'Incoming-message';

  public type = IncomingMessageEvent.LABEL;
  public data: any = {};

  constructor(data: any) {
    this.data = data;
  }
}

export { IncomingMessageEvent };
