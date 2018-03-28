import BaseMongoModel from './baseMongoModel';

interface IUser {
  user: string;
  channel: string;
}

class User extends BaseMongoModel {
  constructor(data?: IUser) {
    super('Users', {
      user: String,
      channel: String,
    });
    this.data = data;
  }
}

export { IUser, User };
