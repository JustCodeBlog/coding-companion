export default {
  //
  // Messages from human to bot
  //
  WELCOME: {
    utterances: ['ciao', 'hola'],
    answers: ['ciao!', 'hey!', 'hoy :-)', 'hola :D'],
  },
  WATCH_REPO: {
    utterances: [
      'segui il repo {repo}',
      'segui questo repo {repo}',
      'segui il repository {repo}',
      "tieni d'occhio {repo}",
    ],
    slots: [
      {
        name: 'repo',
        type: 'STRING',
      },
    ],
    answers: [
      'Ok, verrai aggiornato ogni volta che ci saranno cambiamenti o sarà richiesta una tua azione.',
      'Va bene, non appena ci saranno cambiamenti o sarà necessaria una tua azione ti avviserò.',
    ],
  },
  CHECK_ALL_REPOS: {
    utterances: [
      'analizza tutti i repo',
      'analizza tutti i repositories',
      'controlla tutti i repo',
      'controlla tutti i repositories',
    ],
    slots: [],
    answers: [
      "Ok, potrei metterci un po'...",
      'Va bene, fra poco riceverai un report.',
    ],
  },
  REMOVE_ALL_MESSAGES: {
    utterances: [
      'rimuovi tutti i messaggi',
      'cancella tutto',
      'rimuovi tutti i nostri messaggi',
      'rimuovi la conversazione',
      'cancella la nostra conversazione',
      'cancella la conversazione',
    ],
    slots: [],
    answers: ['Ok!', 'Va bene', 'Lo faccio subito'],
  },
  TEST: {
    utterances: ['prova', 'test', 'facciamo una prova', 'proviamo'],
    slots: [],
    answers: [
      'Cosa proviamo?',
      'Ok, cosa?',
      'Devo fare qualcosa?',
      'Va bene... inizi tu?',
      'Ooook!',
    ],
  },
  SOLVE_PROBLEM: {
    utterances: [
      'cosa vuol dire {problem}',
      'che vuol dire {problem}',
      'cerca {problem}',
      'risolvi {problem}',
    ],
    slots: [
      {
        name: 'problem',
        type: 'STRING',
      },
    ],
    answers: ['Provo a cercare...', 'Vediamo...', 'Ok, attendi un attimo'],
  },

  //
  // Messages from bot to human
  //
  UNKNOWN: {
    answers: [
      'Perdonami, non ho capito',
      'Come?',
      'Potresti ripetere? Non ho ben capito...',
    ],
  },
  ERROR: {
    answers: [
      'Oops.. qualcosa è andato storto :S',
      'Si è verificato un errore',
      "Aspetta, c'è qualcosa che non va...",
      'Controlla i log, qualcosa non ha funzionato!',
    ],
  },
  IS_RECENT_MEMORY: {
    answers: [
      "Per quel che ricordo non è cambiato nulla rispetto all'ultimo messaggio di questo tipo :S",
      'Da quel che noto non è cambiato nulla rispetto a prima.',
    ],
  },
  READ_MORE: {
    answers: [
      'leggi di più',
      'per maggiori info',
      'per più info',
      'per saperne di più',
    ],
  },
  REPO_EXISTS: {
    answers: [
      'Il repository che mi hai passato è già sotto controllo',
      'Sto già monitorando questo repository ;)',
      'Questo repository è già sotto controllo',
      'Mi hai già fatto controllare questo repository, non è necessario aggiungerlo di nuovo.',
    ],
  },
  GIT_REPO_ADVICE: {
    answers: ['Ecco i risultati per *{repo}*\n'],
  },
  GIT_VULNERABILITIES: {
    answers: [
      '🐞 Ho trovato queste vulnerabilità\n{vulnerabilities}',
      '🐞 Ho trovato queste vulnerabilità\n{vulnerabilities}',
      '🐞 Ci sono queste vulnerabilità\n{vulnerabilities}',
    ],
  },
  GIT_SINGLE_VULNERABILITY: {
    answers: [
      '*{tree}* => {module} {version} (CVSS Score {cvssScore}) - *fixed* @ {patchedVersion} ℹ️ <{url}|{more}>',
    ],
  },
  GIT_SINGLE_DEPENDENCY: {
    answers: ['*{module}* => {version}'],
  },
  GIT_DEPENDENCIES_UPDATES: {
    answers: [
      '😰 Ci sono alcuni pacchetti che possono essere aggiornati, eccoli\n{dependencies_updates}',
      '😰 Alcuni pacchetti possono essere aggiornati\n{dependencies_updates}',
    ],
  },
  GIT_COMMITS: {
    answers: [
      '🔥 Ecco la lista degli ultimi commit effettuati su *{repo}*',
      '🔥 Ecco i commit fatti su *{repo}*',
    ],
  },
  GIT_SINGLE_COMMIT: {
    answers: [
      '{human_date} effettuato da *<mailto:{email}|{committer}>*\n"{message}"',
    ],
  },
  GIT_OPEN_COMMIT: {
    answers: ["Da un'occhiata 🔨", 'Apri 🔨', 'Maggiori info 🔨'],
  },
  PROBLEM_SOLUTION: {
    answers: [
      'Ecco cosa ho trovato\n{solution}',
      'Ho trovato questo\n{solution}',
      'Fatto, ecco cosa è risultato\n{solution}',
    ],
  },
};
