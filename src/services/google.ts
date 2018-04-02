import * as _ from 'lodash';
import { ConfigService } from './';

interface IGoogleResult {
  title: string;
  summary: string;
  url: string;
}

class GoogleService {
  private googleIt = require('google-it');

  public async searchAnswer(query: string, size: number=10): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let output: IGoogleResult[] = [];

      this.googleIt({
        query,
        numResults: size,
        disableConsole: true
      })
        .then((res: any) => {
          _.each(res, (v: any) => {
            output = [
              ...output,
              {
                title: v.title,
                summary: v.snippet,
                url: v.link
              }
            ]
          });
          resolve(output);
        }).catch((err: any) => {
          reject(err);
        })
    });
  }

}

export { GoogleService, IGoogleResult };

