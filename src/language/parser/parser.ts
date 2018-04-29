// NOTE: Take in consideration to implement https://github.com/NaturalNode/natural
// NOTE: Wolfram example: https://repl.it/@MarcelloBarile/Wolfram-Example

import * as fs from 'fs';
import * as _ from 'lodash';
import { ConfigService } from '../../services';
import { ParsedMessage } from './parsedMessage';

class Parser {
  private sentiment: any;
  private tokenizer: any;
  private stopWords: any;

  constructor() {
    const Tokenizer = require('wink-tokenizer');
    this.sentiment = require('multilang-sentiment');
    this.stopWords = require('../dictionaries/stopWords_all').default[ConfigService.params.locale];
    this.tokenizer = new Tokenizer();
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

  public getTokens(input: string): any[] {
    const tokens: any[] = this.tokenizer.tokenize(input);
    _.each(tokens, (token: any) => {
      if (this.isStopWord(token.value)) {
        token.tag = "stopword";
      }
    })
    return tokens;
  }

  private isStopWord(input: string): boolean {
    return this.stopWords.indexOf(input) > -1;
  }
}

export { Parser };
