import BaseMongoModel from './baseMongoModel';

interface IPersistedMemory {
  user: string;
  channel: string;
  rawData: string,
  hash: string,
  weight: number,
  lossCoeff: number,
  accessDate: Date,
  creationDate: Date
}

class PersistedMemory extends BaseMongoModel {
  constructor(data?: IPersistedMemory) {
    super('Memories', {
      user: String,
      channel: String,
      rawData: String,
      hash: String,
      weight: Number,
      lossCoeff: Number,
      accessDate: Date,
      creationDate: Date
    });
    this.data = data;
  }
}

export { IPersistedMemory, PersistedMemory };
