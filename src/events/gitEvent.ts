class GitEvent {
  public static GIT_EVENT = 'git-event';
  public static GIT_ERROR = 'git-error';
  public static PACKAGE_ANALYSIS = 'package-analysis';
  public static COMMITS = 'commits';

  public static MSG_ERROR_UNKNOWN_REPO = 'error_unknown-repo';

  public type: any;
  public data: any;
  public isAutomated: boolean;

  constructor(label: string, data: any = {}, isAutomated: boolean = false) {
    this.type = label;
    this.data = data;
    this.isAutomated = isAutomated;
  }
}

export { GitEvent };
