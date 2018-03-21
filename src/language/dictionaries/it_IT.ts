export default {
  //
  // Messages from human to bot
  //
  UNKNOWN: {
    utterances: [],
    answers: [
      'Perdonami, non ho capito',
      'Come?',
      'Potresti ripetere? Non ho ben capito...',
    ],
  },
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
  REPO_EXISTS: {
    answers: [
      'Il repository che mi hai passato è già sotto controllo',
      'sto già monitorando questo repository ;)',
      'questo repository è già sotto controllo',
      'mi hai già fatto controllare questo repository, non è necessario aggiungerlo di nuovo.',
    ],
  },

  //
  // Messages from bot to human
  //
  ERROR: {
    answers: [
      'Oops.. qualcosa è andato storto :S',
      'Si è verificato un errore',
      "Aspetta, c'è qualcosa che non va...",
      'Controlla i log, qualcosa non ha funzionato!',
    ],
  },
  GIT_VULNERABILITIES: {
    answers: [
      'Ok... ho trovato queste vulnerabilità nel repo {repo}\n{vulnerabilities}',
      'Allora, ho trovato queste vulnerabilità nel repository {repo}\n{vulnerabilities}',
      'Fatto ci sono queste vulnerabilità nel repo {repo}\n{vulnerabilities}',
    ],
  },
  GIT_DEPENDENCIES_UPDATES: {
    answers: [
      'Ci sono alcuni pacchetti sul progetto {repo} che possono essere aggiornati, eccoli\n{dependencies_updates}',
      'Alcuni pacchetti di {repo} possono essere aggiornati\n{dependencies_updates}',
    ],
  },
  GIT_COMMITS: {
    answers: [
      'Ecco la lista degli ultimi commit effettuati sul repo {repo}\n{commits}',
      'Hey, ecco i commit fatti su {repo}\n{commits}',
    ],
  },
};
