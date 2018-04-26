import { IProcessor } from '../language/processor';
import { IUser } from '../models';
import { GitService } from '../services';
import { DefaultIntent } from './defaultIntent';

class WatchRepoIntent extends DefaultIntent {
  public static LABEL_WATCH: string = 'WATCH_REPO';
  public static LABEL_EXISTING: string = 'REPO_EXISTS';

  constructor(processor: IProcessor) {
    super(processor, WatchRepoIntent.LABEL_WATCH);
  }

  protected action(data: any, repo: string): void {
    // TODO: Check processor type

    const userInfo: IUser = this.processor.getUserInterface(data);
    const user: string = userInfo.user;
    const channel: string = userInfo.channel;

    GitService.getInstance()
      .createRepository(data.user, data.channel, repo)
      .then((res: any) => {
        this.label = !res ? 'REPO_EXISTS' : 'WATCH_REPO';
        const message: string = this.processor.getResponse(
          userInfo,
          this.label
        );
        this.emitProcessorResponse(user, channel, message);
      })
      .catch((err: any) => this.processor.emitError(userInfo, err));
  }
}

export { WatchRepoIntent };
