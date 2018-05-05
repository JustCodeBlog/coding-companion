import BaseMongoModel from './baseMongoModel';

interface IUser {
  user: string;
  channel: string;
  ack?: boolean;
  interests?: string[];
  bookmarks?: string[];
}

class User extends BaseMongoModel {
  constructor(data?: IUser) {
    super(
      'Users',
      {
        user: String,
        channel: String,
        ack: Boolean,
        interests: [String],
        bookmarks: [String],
      },
      data
    );
  }

  public getInterests(): Promise<string[]> {
    return this.getProperty('interests', {
      user: this.data.user,
      channel: this.data.channel,
    });
  }

  public saveInterests(data: any): Promise<any> {
    return this.update(
      {
        user: this.data.user,
        channel: this.data.channel,
      },
      {
        interests: data,
      }
    );
  }

  public getBookmarks(): Promise<string[]> {
    return this.getProperty('bookmarks', {
      user: this.data.user,
      channel: this.data.channel,
    });
  }

  public saveBookmarks(data: any): Promise<any> {
    return this.update(
      {
        user: this.data.user,
        channel: this.data.channel,
      },
      {
        bookmarks: data,
      }
    );
  }

  public isAck(): Promise<boolean> {
    return this.getProperty('ack', {
      user: this.data.user,
      channel: this.data.channel,
    });
  }

  public setAck(): void {
    this.update(
      {
        user: this.data.user,
        channel: this.data.channel,
      },
      {
        ack: true,
      }
    );
  }
}

export { IUser, User };
