import * as events from 'events';
import * as mongoose from 'mongoose';
import { Repository } from '../models';

class Db extends events.EventEmitter {
  public static getInstance(): Db {
    return Db.instance;
  }

  private static instance: Db = new Db();

  constructor(autoConnect: boolean = true) {
    super();

    if (Db.instance) {
      throw new Error(
        'Error: Instantiation failed: Use getInstance() instead of new.'
      );
    }

    if (autoConnect && !Db.instance) {
      this.connect();
    }

    Db.instance = this;
  }

  public connect() {
    mongoose.connect('mongodb://localhost:27017/coding-companion');
    // TODO: Configure db name / db port
  }

  public createRepository(data: any): Promise<any> {
    const repo = new Repository(data);
    const promise = new Promise((resolve, reject) => {
      repo
        .find({
          url: data.url,
        })
        .then(res => {
          if (res.length === 0) {
            // If not existing
            repo
              .save(data)
              .then(saved => {
                resolve(saved);
              })
              .catch(err => {
                reject(err);
              });
          } else {
            // It does already exist
            resolve(false);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
    return promise;
  }

  public deleteRepository(url: string) {
    // TODO: TBD
  }

  public findRepositories(where: any): Promise<any> {
    const repo = new Repository({});
    return repo.find(where);
  }
}

export default Db;
