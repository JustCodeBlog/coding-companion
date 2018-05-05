import * as mongoose from 'mongoose';

class BaseMongoModel {
  protected static compiledModels: any = [];

  protected collection: any;
  protected schema: any;
  protected model: any;
  protected data: any;

  constructor(collection: string, schema: any, data: any) {
    this.collection = collection;
    this.schema = new mongoose.Schema(schema);

    if (BaseMongoModel.compiledModels[this.collection]) {
      this.model = BaseMongoModel.compiledModels[this.collection];
    } else {
      this.model = mongoose.model(this.collection, this.schema);
      BaseMongoModel.compiledModels[this.collection] = this.model;
    }

    this.data = data;
  }

  public save(data: any = this.data): Promise<any> {
    const model = new this.model(data);
    return model
      .save()
      .then(/* console.log */)
      .catch(console.error);
  }

  public find(where: any): Promise<any> {
    return this.model
      .find(where)
      .then(/* console.log */)
      .catch(console.error);
  }

  public update(where: any, data: any): Promise<any> {
    return this.model
      .update(where, { $set: data })
      .then(/* console.log */)
      .catch(console.error);
  }

  public remove(where: any): Promise<any> {
    return this.model
      .remove(where)
      .then(/* console.log */)
      .catch(console.error);
  }
  protected getProperty(name: string, where: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.find(where)
        .then((res: any) => {
          if (
            typeof res[0] !== 'undefined' &&
            typeof res[0][name] !== 'undefined'
          ) {
            resolve(res[0][name]);
          } else {
            reject(false);
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }
}

export default BaseMongoModel;
