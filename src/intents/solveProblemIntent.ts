import * as _ from 'lodash';
import { IProcessor } from '../language/processor';
import { IUser } from '../models';
import {
  GoogleService,
  IGoogleResult,
  IStackOverflowResult,
  StackOverflowService,
} from '../services';
import { DefaultIntent } from './defaultIntent';

class SolveProblemIntent extends DefaultIntent {
  public static LABEL: string = 'SOLVE_PROBLEM';

  constructor(processor: IProcessor) {
    super(processor, SolveProblemIntent.LABEL);
  }

  protected action(data: any, problem: string): void {
    // TODO: Check processor type

    const userInfo: IUser = this.processor.getUserInterface(data);
    const user: string = userInfo.user;
    const channel: string = userInfo.channel;

    // TODO: Handle different kind of problems
    let promises = [];
    promises = [
      new StackOverflowService().searchAnswer(problem, 3),
      new GoogleService().searchAnswer(problem, 3),
    ];

    Promise.all(promises)
      .then((res: any) => {
        const stackOverflowResults: IStackOverflowResult[] = res[0];
        const googleResults: IGoogleResult[] = res[1];

        const attachments: any = [];
        _.each(googleResults, (result: IGoogleResult) => {
          attachments.push({
            fallback: '',
            color: '#2196F3',
            author_name: result.title,
            author_link: result.url,
            title: 'Dal web',
            text: result.summary,
          });
        });

        _.each(stackOverflowResults, (result: IStackOverflowResult) => {
          attachments.push({
            fallback: '',
            color: '#2196F3',
            author_name: result.title,
            author_link: result.url,
            title: 'Su StackOverflow',
            text: result.tags.join(','),
          });
        });

        this.emitProcessorResponse(user, channel, '');
      })
      .catch(console.error);

    const message: string = this.processor.getResponse(userInfo, this.label);
    this.emitProcessorResponse(user, channel, message);
  }
}

export { SolveProblemIntent };
