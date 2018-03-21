class OutcomingMessageEvent {
  public static LABEL = 'Outcoming-message';

  public type = OutcomingMessageEvent.LABEL;
  public data: any = {};

  constructor(data: any) {
    this.data = data;
  }
}

export { OutcomingMessageEvent };
