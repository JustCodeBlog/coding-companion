import { exec } from 'child_process';
import { CronJob } from 'cron';
import * as events from 'events';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as request from 'request-promise';
import * as rimraf from 'rimraf';
import { GitEvent } from '../events';
import { IRepository } from '../models';
import { Db, UpdatesService, VulnerabilitiesService } from '../services';

class GitService extends events.EventEmitter {
  public static getInstance(): GitService {
    return GitService.instance;
  }

  private static instance: GitService = new GitService();

  private static GITHUB_BASEURL = 'https://api.github.com';
  private static BITBUCKET_BASEURL = 'https://api.bitbucket.org/2.0';
  private static GITHUB_CONTENT_ENDPOINT = '/repos/{owner}/{repo}/contents/{path}';
  private static BITBUCKET_CONTENT_ENDPOINT = '/repositories/{owner}/{repo}/downloads/{path}';
  private static GITHUB_COMMITS_ENDPOINT = '/repos/{owner}/{repo}/commits';
  private static BITBUCKET_COMMITS_ENDPOINT = '/repositories/{owner}/{repo}/commits';

  private db = Db.getInstance();
  private job: any;

  constructor() {
    super();

    if (GitService.instance) {
      throw new Error(
        'Error: Instantiation failed: Use getInstance() instead of new.'
      );
    }

    GitService.instance = this;
  }

  public initWatch() {
    this.job = new CronJob({
      cronTime: '00 30 * * * 1-5',
      onTick: () => {
        this.doCheck();
      },
      start: false,
    });
    this.job.start();
  }

  public stopWatch() {
    this.job.stop();
  }

  public checkAll() {
    this.doCheck();
  }

  private doCheck() {
    const db = Db.getInstance();
    const where = {};

    db
      .findRepositories(where)
      .then(docs => {
        _.each(docs, (doc: any) => {
          const url = doc.url;
          const channel = doc.channel;
          const regExp = this.isGithub(url)
            ? /^https?:\/\/github.com\/(.*)\/(.*)\.git$/
            : /^https?:\/\/(?:.*)@bitbucket.org\/(.*)\/(.*)\.git$/;
          const matches: RegExpMatchArray | null = url.match(regExp);

          if (!matches) {
            const errorEvent = new GitEvent(GitEvent.GIT_ERROR, GitEvent.MSG_ERROR_UNKNOWN_REPO);
            this.emit(errorEvent.type, {channel, data: errorEvent.data});
            return;
          }

          const owner = matches[1];
          const repo = matches[2];
          const platform = this.isGithub(url) ? 'github' : 'bitbucket';

          // package.json
          this.getDependenciesUpdatesAndVulnsFromPackageFile(owner, repo, platform)
            .then(packageRes => {
              const event = new GitEvent(GitEvent.PACKAGE_ANALYSIS, packageRes);
              this.emit(event.type, {channel, repo, data: event.data});
            });

          // TODO: Support other dependencies
          // ...

          this.getLastCommits(owner, repo, platform)
            .then(comRes => {
              const event = new GitEvent(GitEvent.COMMITS, comRes);
              this.emit(event.type, {channel, repo, data: event.data});
            });
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  private getDependenciesUpdatesAndVulnsFromPackageFile(
    owner: string,
    repo: string,
    platform: string
  ): Promise<any> {

    return new Promise((resolve, reject) => {
      let url = platform === 'github'
        ? `${GitService.GITHUB_BASEURL}${GitService.GITHUB_CONTENT_ENDPOINT}`
        : `${GitService.BITBUCKET_BASEURL}${
            GitService.BITBUCKET_CONTENT_ENDPOINT
          }`;

      url = url
        .replace('{owner}', owner)
        .replace('{repo}', repo)
        .replace('{path}', 'package.json');

      request
        .get(url, {
          headers: this.getHeadersByPlatform(platform),
          json: true,
        })
        .then(res => {
          const dependencies = this.getDependenciesFromPackageFile(res.content);
          const localRepoPath = `${__dirname}/../../tmp/${owner}_${repo}`;
          const tmpPackagePath = `${localRepoPath}/package.json`;

          this.storePackageContent(localRepoPath, tmpPackagePath, Buffer.from(res.content, 'base64').toString());

          Promise
            .all(
              [
                new UpdatesService().getDependenciesUpdates(tmpPackagePath),
                new VulnerabilitiesService().getDependenciesVulns(dependencies)
              ]
            )
            .then(depsRes => {
              this.disposeLocalRepo(localRepoPath);

              const updates = depsRes[0];
              const vulns = depsRes[1].filter((v: any) => !_.isEmpty(v));

              resolve({updates, vulns});
            })
            .catch(err => {
              this.disposeLocalRepo(localRepoPath);
              reject(err);
            });
        })
        .catch(err => {
          reject(err);
        });
    });

  }

  private getLastCommits(
    owner: string,
    repo: string,
    platform: string
  ): Promise<any> {

    return new Promise((resolve, reject) => {
      let url =
        platform === 'github'
          ? `${GitService.GITHUB_BASEURL}${GitService.GITHUB_COMMITS_ENDPOINT}`
          : `${GitService.BITBUCKET_BASEURL}${
              GitService.BITBUCKET_COMMITS_ENDPOINT
            }`;
      url = url.replace('{owner}', owner).replace('{repo}', repo);

      const headers = this.getHeadersByPlatform(platform);

      request
        .get(url, {
          headers,
          json: true,
        })
        .then(res => {
          // TODO: Return commits
        })
        .catch(err => {
          reject(err);
        });

    });
  }

  private isGithub(url: string): boolean {
    return url.indexOf('github.com') > -1;
  }

  private isBitbucket(url: string): boolean {
    return url.indexOf('bitbucket.org') > -1;
  }

  private getHeadersByPlatform(platform: string): any {
    return platform === 'github'
      ? {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0',
        }
      : {};
  }

  private disposeLocalRepo(localRepoPath: string) {
    rimraf(localRepoPath, (err: any) => {
      if (err) {
        console.log(err);
      }
    });
  }

  private storePackageContent(localRepoPath: string, path: string, body: string) {
    try {
      if (!fs.existsSync(localRepoPath)){
        fs.mkdirSync(localRepoPath);
      }
      fs.writeFileSync(path, body);
    } catch(err) {
      console.log(err);
    }
  }

  private getDependenciesFromPackageFile(content: string): any[] {
    const packageObject = JSON.parse(Buffer.from(content, 'base64').toString());
    return  _.merge({}, packageObject.devDependencies, packageObject.dependencies);
  }

}

export default GitService;
