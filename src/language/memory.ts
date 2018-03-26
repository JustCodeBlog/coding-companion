import * as _ from 'lodash';

interface IMemory {
  rawData: string,
  hash: string,
  weight: number,
  lossCoeff: number,
  accessDate: Date,
  creationDate: Date
}

// TODO: Make singleton
class LanguageMemory {

  private SEED = 0xCAFEBABE;
  private XXHash = require('xxhash');
  private memories: IMemory[] = [];

  private SHORT_TERM_THRESHOLD = 300000; // 1m
  private LONG_TERM_THRESHOLD = 86400000 // 1d

  constructor() {
    setInterval(this.forget, this.LONG_TERM_THRESHOLD);
  }

  public store(data: string) {
    let memory: IMemory | undefined = this.getMemoryByContent(data);

    if (!memory) {
      const now = new Date();
      memory = {
        rawData: data,
        hash: this.XXHash.hash(new Buffer(data), this.SEED),
        weight: 0,
        lossCoeff: 0,
        accessDate: now,
        creationDate: now
      }

      this.memories = [
        ...this.memories,
        memory
      ]
    }

    // console.log('------------------');
    // console.log('current memories', this.memories);
    // console.log('------------------');
  }

  public recall(data: string): IMemory | undefined {
    const memory: IMemory | undefined = this.getMemoryByContent(data);

    if (memory) {
      const now = new Date();
      (memory as IMemory).accessDate = new Date();
      (memory as IMemory).weight += 0.05;
      (memory as IMemory).lossCoeff = now.getTime() - (memory as IMemory).creationDate.getTime();

      // console.log('recalled memory', memory);
    }

    return memory;
  }

  public isRecent(data: string): boolean {
    const memory: IMemory | undefined = this.getMemoryByContent(data);
    let output = false;

    if (memory) {
      const dt = new Date().getTime() - memory.creationDate.getTime();
      output = dt <= this.SHORT_TERM_THRESHOLD;
    }

    // console.log('is %s recent = %s', data, output);

    return output;
  }

  private getMemoryByContent(data: string): IMemory | undefined {
    const hash = this.XXHash.hash(new Buffer(data), this.SEED);
    return _.find(this.memories, { hash });
  }

  private forget() {
    this.memories.filter((memory: IMemory) => {
      const dt = new Date().getTime() - memory.creationDate.getTime();
      return dt <= this.LONG_TERM_THRESHOLD;
    });
  }

}

export { LanguageMemory, IMemory };
