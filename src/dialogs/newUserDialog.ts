import * as _ from 'lodash';
import { IProcessor, LanguageProcessor } from '../language/processor';
import { IUser, User } from '../models';
import { DefaultDialog } from './';

class NewUserDialog extends DefaultDialog {
  private userModel: User;

  constructor(processor: IProcessor, user: IUser, name: string) {
    super(processor, user, name);
    this.userModel = new User(user);
  }

  public handleAnswer(answer: string, tokens: any[]): void {
    this.lastAnswerTime = new Date().getTime();

    if (this.validateAnswer(answer)) {
      const followUp = this.processor.dialogHasFollowUp(this.name);

      const knowledgeLabel = this.hasFollowUp
        ? this.processor.getDialogKnowledgeLabel(followUp)
        : this.processor.getDialogKnowledgeLabel(this.name);

      //
      // Saving knowledge
      if (knowledgeLabel === 'interests') {
        let interests: any = [];
        _.each(tokens, (token: any) => {
          if (token.tag === 'word') {
            interests = [...interests, token.value];
          }
        });
        this.userModel.saveInterests(interests);
      } else if (knowledgeLabel === 'bookmarks') {
        let bookmarks: any = [];
        _.each(tokens, (token: any) => {
          if (token.tag === 'url') {
            bookmarks = [...bookmarks, token.value];
          }
        });
        this.userModel.saveBookmarks(bookmarks);
      }

      if (typeof followUp !== 'undefined' && !this.consumedFollowUp) {
        // If the dialog has a follow up which has not been yet consumed
        // we propose it
        this.hasFollowUp = true;
        this.consumedFollowUp = true;
        this.handleInternalOperation(followUp, this.user);
      } else {
        // otherwise we consider the dialogue complete
        this.handleInternalOperation(this.SUCCESS_LABEL, this.user);
        this.complete();
      }
    } else {
      // the answer has not been validated.
      // We cancel the dialogue.
      this.consumedFollowUp = true;
      this.handleInternalOperation(this.CANCEL_LABEL, this.user);
      this.complete();
    }
  }
}

export { NewUserDialog };
