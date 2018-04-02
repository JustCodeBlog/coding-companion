import * as _ from 'lodash';
import { ConfigService } from './';

interface IStackOverflowResult {
  questionId: string;
  tags: string[];
  viewCount: number;
  score: number;
  creationDate: Date;
  title: string;
  url: string;
}

class StackOverflowService {
  private stackexchange = require('stackexchange-node');
  private apiOptions = { version: 2.2 };
  private api: any;

  constructor() {
    this.api = new this.stackexchange(this.apiOptions);
  }

  public async searchAnswer(query: string, size: number=10): Promise<any> {
    const filter = {
      key: ConfigService.params.stackOverflow.clientKey,
      pagesize: size,
      sort: 'activity',
      order: 'desc',
      q: query,
      wiki: false
    };

    return new Promise((resolve, reject) => {
      let output: IStackOverflowResult[] = [];

      this.api.search.advanced(filter, (err: any, res: any) => {
        if (err) {
          reject(err);
          return;
        }

        _.each(res.items, (item: any) => {
          output = [
            ...output,
            {
              questionId: item.question_id,
              tags: item.tags,
              viewCount: item.view_count,
              score: item.score,
              creationDate: new Date(item.creation_date),
              title: item.title,
              url: item.link
            }
          ]
        });

        resolve(output);
      });
    });
  }

}

export { StackOverflowService, IStackOverflowResult };
