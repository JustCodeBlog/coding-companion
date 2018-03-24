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
  READ_MORE: {
    answers: [
      'leggi di più',
      'per maggiori info',
      'per più info',
      'per saperne di più'
    ]
  },
  REPO_EXISTS: {
    answers: [
      'Il repository che mi hai passato è già sotto controllo',
      'sto già monitorando questo repository ;)',
      'questo repository è già sotto controllo',
      'mi hai già fatto controllare questo repository, non è necessario aggiungerlo di nuovo.',
    ],
  },
  GIT_REPO_ADVICE: {
    answers: [
      'ecco i risultati per *{repo}*\n',
    ],
  },
  GIT_VULNERABILITIES: {
    answers: [
      'ho trovato queste vulnerabilità\n{vulnerabilities}',
      'ho trovato queste vulnerabilità\n{vulnerabilities}',
      'ci sono queste vulnerabilità\n{vulnerabilities}',
    ],
  },
  GIT_DEPENDENCIES_UPDATES: {
    answers: [
      'ci sono alcuni pacchetti che possono essere aggiornati, eccoli\n{dependencies_updates}',
      'alcuni pacchetti possono essere aggiornati\n{dependencies_updates}',
    ],
  },
  GIT_COMMITS: {
    answers: [
      'ecco la lista degli ultimi commit effettuati su *{repo}*\n{commits}',
      'ecco i commit fatti su *{repo}*\n{commits}',
    ],
  },
  GIT_SINGLE_COMMIT: {
    answers: [
      'il {human_date} effettuato da *{committer}* "{message}", per più info {url}\n'
    ]
  }
};
