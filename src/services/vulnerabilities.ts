import * as _ from 'lodash';
import * as request from 'request-promise';

class VulnerabilitiesService {
  private nodeSecurityAPI = 'https://api.nodesecurity.io/check/{package}/{version}';

  constructor() {
    // ...
  }

  public async getDependenciesVulns(dependencies: any[]): Promise<any> {
    let promises: any = [];

    _.each(dependencies, (version: any, index: any) => {
      const url = this.nodeSecurityAPI
        .replace('{package}', encodeURI(index))
        .replace('{version}', version.replace(/[^\d\.]/, ''));

      promises = [
        ...promises,
        request.get(url, { json: true }).catch(err => console.error),
      ];
    });

    return Promise.all(promises);
  }
}

export default VulnerabilitiesService;
