import { IProcessor } from '../language/processor';
import { DefaultIntent } from './defaultIntent';

class WelcomeIntent extends DefaultIntent {
  public static LABEL: string = 'WELCOME';

  constructor(processor: IProcessor) {
    super(processor, WelcomeIntent.LABEL);
  }
}

export { WelcomeIntent };
