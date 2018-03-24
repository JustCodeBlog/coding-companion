import * as fs from 'fs';

class ConfigService {
  public static params: any;

  constructor() {
    ConfigService.params = JSON.parse(fs.readFileSync('botconfig.json', 'utf8'));
  }
}

export { ConfigService };
