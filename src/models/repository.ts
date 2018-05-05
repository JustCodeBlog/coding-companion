import BaseMongoModel from './baseMongoModel';

interface IRepository {
  user: string;
  channel: string;
  url: string;
}

class Repository extends BaseMongoModel {
  constructor(data?: any) {
    super(
      'Repositories',
      {
        user: String,
        channel: String,
        url: String,
      },
      data
    );
  }
}

export { IRepository, Repository };
