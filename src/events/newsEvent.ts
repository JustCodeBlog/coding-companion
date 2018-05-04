class NewsEvent {
  public static NEWS_EVENT = 'news-event';

  public type: any;
  public data: any;

  constructor(label: string, data: any = {}) {
    this.type = label;
    this.data = data;
  }
}

export { NewsEvent };
