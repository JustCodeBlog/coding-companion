import { DefaultIntent } from '.';
import { IProcessor } from '../language/processor';

class WelcomeIntent extends DefaultIntent {
  public static LABEL: string = 'WELCOME';

  constructor(processor: IProcessor, callback?: any) {
    super(processor, WelcomeIntent.LABEL, callback);
  }
}

export { WelcomeIntent };
