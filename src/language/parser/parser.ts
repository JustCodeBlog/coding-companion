// NOTE: Take in consideration to implement https://github.com/NaturalNode/natural
// NOTE: Wolfram example: https://repl.it/@MarcelloBarile/Wolfram-Example

import { ConfigService } from '../../services';
import { ParsedMessage } from './parsedMessage';

class Parser {
  private sentiment: any;

  constructor() {
    this.sentiment = require('multilang-sentiment');
  }

  public parseMessage(input: string): Promise<ParsedMessage> {
    return new Promise((resolve, reject) => {
      const output: ParsedMessage = new ParsedMessage(input);
      output.sentiment = this.sentiment(input, ConfigService.params.locale);

      // TODO: Extract knowledge from phrase

      resolve(output);
    });
  }

  public getSentiment(input: string): any {
    return this.sentiment(input, ConfigService.params.locale);
  }
}

export { Parser };
