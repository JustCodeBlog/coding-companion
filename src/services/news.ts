import { CronJob } from 'cron';
import * as events from 'events';
import * as _ from 'lodash';
import { DateTime } from 'luxon';
import * as request from 'request-promise';
import { NewsEvent } from '../events';
import { IUser } from '../models';
import { ConfigService, Db } from '../services';

interface INews {
  user: string;
  source: string;
  title: string;
  description: string;
  publishedAt: Date;
  url: string;
}

class NewsService extends events.EventEmitter {
  public static getInstance(): NewsService {
    return NewsService.instance;
  }

  private static instance: NewsService = new NewsService();

  private jobs: any[] = [];
  private newsApi: any;

  constructor() {
    super();

    if (NewsService.instance) {
      throw new Error(
        'Error: Instantiation failed: Use getInstance() instead of new.'
      );
    }

    NewsService.instance = this;

    const NewsApi: any = require('newsapi');
    this.newsApi = new NewsApi(ConfigService.params.newsApi.apiKey);
  }

  public initWatch() {
    const job = new CronJob({
      cronTime: '00 30 16 */2 * *',
      onTick: () => {
        this.doCheck();
      },
      start: false,
    });
    job.start();
    this.jobs.push(job);
  }

  public stopWatch() {
    this.jobs.forEach((job: any) => {
      job.stop();
    });
  }

  private async doCheck(user?: string) {
    const db = Db.getInstance();
    const where = typeof user !== 'undefined' ? { user } : {};
    const users: IUser[] = await db.findUser(user);

    _.each(users, (v: IUser) => {
      const interests: string[] | undefined = v.interests;
      if (typeof interests === 'undefined') {
        return;
      }

      const query: string = interests.join(' OR ');
      this.newsApi.v2
        .everything({
          q: query,
          language: ConfigService.params.newsLocale,
          from: DateTime.local()
            .minus({ days: 2 })
            .startOf('day')
            .toISODate(),
          to: DateTime.local()
            .endOf('day')
            .toISODate(),
          sortBy: 'relevancy',
        })
        .then((res: any) => {
          let news: INews[] = [];
          _.each(res.articles, (vv: any) => {
            news = [
              ...news,
              {
                user: v.user,
                source: vv.source.name,
                title: vv.title,
                description: vv.description,
                publishedAt: new Date(vv.publishedAt),
                url: vv.url,
              },
            ];
          });

          const event: NewsEvent = new NewsEvent(NewsEvent.NEWS_EVENT, news);
          this.emit(event.type, {
            channel: v.channel,
            data: event.data,
          });
        })
        .catch(console.error);
    });
  }
}

export { NewsService, INews };
