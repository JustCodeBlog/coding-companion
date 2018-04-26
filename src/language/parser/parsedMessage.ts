interface IParsedData {
  sentiment: any;
  entities: any;
}

class ParsedMessage {
  public raw: string;
  public data: IParsedData = {
    sentiment: undefined,
    entities: [],
  };

  constructor(value: string) {
    this.raw = value;
  }

  public set sentiment(data: any) {
    this.data.sentiment = data;
  }

  public get sentiment(): any {
    return this.data.sentiment;
  }

  public set entities(data: any) {
    this.data.entities = data;
  }

  public get entities(): any {
    return this.data.entities;
  }
}

export { ParsedMessage, IParsedData };
