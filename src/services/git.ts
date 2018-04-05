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

interface ICommit {
  author: string;
  email: string;
  message: string;
  date: Date;
  url: string;
}

class GitService extends events.EventEmitter {
  public static getInstance(): GitService {
    return GitService.instance;
  }

  private static instance: GitService = new GitService();

  private static GITHUB_BASEURL = 'https://api.github.com';
  private static BITBUCKET_BASEURL = 'https://api.bitbucket.org/2.0';
  private static GITHUB_CONTENT_ENDPOINT = '/repos/{owner}/{repo}/contents/{path}';
  private static BITBUCKET_CONTENT_ENDPOINT = '/repositories/{owner}/{repo}/src/master/{path}'; // TODO: Make node (master) dynamic
  private static GITHUB_COMMITS_ENDPOINT = '/repos/{owner}/{repo}/commits';
  private static BITBUCKET_COMMITS_ENDPOINT = '/repositories/{owner}/{repo}/commits';

  private db = Db.getInstance();
  private jobs: any[] = [];
  private bitbucketAppPassword = '';

  constructor() {
    super();

    if (GitService.instance) {
      throw new Error(
        'Error: Instantiation failed: Use getInstance() instead of new.'
      );
    }

    GitService.instance = this;
  }

  public setAuth(authObj: any) {
    this.bitbucketAppPassword = authObj.bitbucket;
  }

  public initWatch() {
    // TODO: Configure watch per user

    const checkDependenciesJob = new CronJob({
      cronTime: '00 05 11 * * 1-5',
      onTick: () => {
        this.doCheck(true, false);
      },
      start: false,
    });
    checkDependenciesJob.start();

    const checkCommitsJob = new CronJob({
      cronTime: '00 05 15 * * 1-5',
      onTick: () => {
        this.doCheck(true, false);
      },
      start: false,
    });
    checkCommitsJob.start();

    this.jobs.push(checkDependenciesJob);
    this.jobs.push(checkCommitsJob);
  }

  public stopWatch() {
    this.jobs.forEach((job: any) => {
      job.stop();
    });
  }

  public createRepository(
    user: string,
    channel: string,
    repo: string
  ): Promise<any> {
    return Db.getInstance().createRepository({
      user,
      channel,
      url: repo.substring(1, repo.length - 1), // the URL comes in such a format <URL>
    });
  }

  public checkAll(user: string) {
    this.doCheck(true, true, user);
  }

  private doCheck(
    checkDependencies: boolean = true,
    checkCommits: boolean = true,
    user?: string
  ) {
    const db = Db.getInstance();
    const where = typeof user !== 'undefined' ? { user } : {};

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
            const errorEvent = new GitEvent(
              GitEvent.GIT_ERROR,
              GitEvent.MSG_ERROR_UNKNOWN_REPO
            );
            this.emit(errorEvent.type, { channel, data: errorEvent.data });
            return;
          }

          const owner = matches[1];
          const repo = matches[2];
          const platform = this.isGithub(url) ? 'github' : 'bitbucket';

          // package.json
          if (checkDependencies) {
            this.getDependenciesUpdatesAndVulnsFromPackageFile(
              owner,
              repo,
              platform
            ).then(packageRes => {
              const event = new GitEvent(GitEvent.PACKAGE_ANALYSIS, packageRes);
              this.emit(event.type, { channel, repo, data: event.data });
            });

            // TODO: Support other dependencies
            // ...
          }

          if (checkCommits) {
            this.getLastCommits(owner, repo, platform).then(commitsRes => {
              const event = new GitEvent(GitEvent.COMMITS, commitsRes);
              this.emit(event.type, { channel, repo, data: event.data });
            });
          }
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
      let url =
        platform === 'github'
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
          auth: this.getAuthByPlatform(platform, owner),
          headers: this.getHeadersByPlatform(platform),
          json: true,
        })
        .then(res => {
          const { content, contentStr } = this.getContentFromResponse(
            res,
            platform
          );

          const dependencies = this.getDependenciesFromPackageFile(content);
          const localRepoPath = `${__dirname}/../../tmp/${owner}_${repo}`;
          const tmpPackagePath = `${localRepoPath}/package.json`;

          this.storePackageContent(localRepoPath, tmpPackagePath, contentStr);

          Promise.all([
            new UpdatesService().getDependenciesUpdates(tmpPackagePath),
            new VulnerabilitiesService().getDependenciesVulns(dependencies),
          ])
            .then(depsRes => {
              this.disposeLocalRepo(localRepoPath);

              const updates = depsRes[0];
              const vulns = depsRes[1].filter((v: any) => !_.isEmpty(v))[0];

              resolve({ updates, vulns });
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
          auth: this.getAuthByPlatform(platform, owner),
          headers,
          json: true,
        })
        .then(res => {
          let commits: ICommit[] = [];

          if (platform === 'github') {
            _.each(res, (val: any) => {
              const commit: ICommit = {
                author: val.commit.committer.name,
                email: val.commit.committer.email,
                message: val.commit.message,
                date: new Date(val.commit.committer.date),
                url: val.html_url,
              };
              commits = [...commits, commit];
            });
          } else if (platform === 'bitbucket') {
            if (typeof res.values !== 'undefined') {
              _.each(res.values, (val: any) => {
                const commit: ICommit = {
                  author: val.author.user.display_name,
                  email: '',
                  message: val.message.replace('\n', ''),
                  date: new Date(val.date),
                  url: val.links.html.href,
                };
                commits = [...commits, commit];
              });
            }
          }

          resolve(commits);
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

  private getAuthByPlatform(platform: string, user: string): any {
    let output;

    if (platform === 'bitbucket') {
      output = {
        user,
        pass: this.bitbucketAppPassword,
        sendImmediately: true,
      };
    }

    return output;
  }

  private getHeadersByPlatform(platform: string): any {
    return platform === 'github'
      ? {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0',
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

  private storePackageContent(
    localRepoPath: string,
    path: string,
    body: string
  ) {
    try {
      if (!fs.existsSync(localRepoPath)) {
        fs.mkdirSync(localRepoPath);
      }
      fs.writeFileSync(path, body);
    } catch (err) {
      console.log(err);
    }
  }

  private getDependenciesFromPackageFile(content: any): any[] {
    return _.merge({}, content.devDependencies, content.dependencies);
  }

  private getContentFromResponse(response: any, platform: string): any {
    let content: any = '';
    let contentStr: string = '';

    if (platform === 'github') {
      contentStr = Buffer.from(response.content, 'base64').toString();
      content = JSON.parse(contentStr);
    } else if (platform === 'bitbucket') {
      content = response;
      contentStr = JSON.stringify(content);
    }

    return { content, contentStr };
  }
}

export { GitService, ICommit };
