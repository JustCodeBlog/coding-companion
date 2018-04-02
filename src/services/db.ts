import * as mongoose from 'mongoose';
import { IPersistedMemory, IRepository, IUser, PersistedMemory, Repository, User } from '../models';
import { ConfigService } from './';

class Db {
  public static getInstance(): Db {
    return Db.instance;
  }

  private static instance: Db = new Db();

  constructor(autoConnect: boolean = true) {
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
    mongoose.connect(`mongodb://localhost:${ConfigService.params.dbPort}/${ConfigService.params.dbName}`);
  }

  public createUser(data: IUser): Promise<any> {
    const user = new User(data);
    return new Promise((resolve, reject) => {
      user
        .find({
          user: data.user,
        })
        .then(res => {
          if (res.length === 0) {
            // If not existing
            user
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
  }

  public findUser(where: any): Promise<any> {
    return new User().find(where);
  }

  public findMemories(where: any): Promise<any> {
    return new PersistedMemory().find(where);
  }

  public createMemory(data: IPersistedMemory): Promise<any> {
    const memory = new PersistedMemory(data);
    return new Promise((resolve, reject) => {
      memory
        .find({
          channel: data.channel,
          hash: data.hash,
        })
        .then(res => {
          if (res.length === 0) {
            // If not existing
            memory
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
  }

  public updateMemory(where: any, data: IPersistedMemory): Promise<any> {
    return new PersistedMemory().update(where, data);
  }

  public deleteMemory(hash: string): Promise<any> {
    return new PersistedMemory().remove({hash});
  }

  public createRepository(data: IRepository): Promise<any> {
    const repo = new Repository(data);
    return new Promise((resolve, reject) => {
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
  }

  public deleteRepository(url: string) {
    return new Repository().remove({url});
  }

  public findRepositories(where: any): Promise<any> {
    return new Repository().find(where);
  }
}

export default Db;
