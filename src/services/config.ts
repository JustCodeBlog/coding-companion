import * as fs from 'fs';

class ConfigService {
  private static locParams: any;

  private static loadConf() {
    ConfigService.locParams = JSON.parse(
      fs.readFileSync('botconfig.json', 'utf8')
    );
  }

  constructor() {
    ConfigService.loadConf();
  }

  public static get params(): any {
    if (typeof this.locParams === 'undefined') {
      this.loadConf();
    }
    return this.locParams;
  }
}

export { ConfigService };
