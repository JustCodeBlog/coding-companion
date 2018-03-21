class UpdatesService {
  constructor() {
    // ...
  }

  public getDependenciesUpdates(packageFile: string): Promise<any> {
    return require('npm-check-updates')
      .run({
        packageFile,
        loglevel: 'silent',
        silent: true,
        jsonUpgraded: true
      });
  }

}

export default UpdatesService;
