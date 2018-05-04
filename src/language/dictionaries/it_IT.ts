export default {
  // ----------------------------------------------------------------------------------------------------------
  // Messages from human to bot
  //
  WELCOME: {
    utterances: ['ciao', 'hola', 'hey', 'buon giorno', 'buongiorno', 'buondì'],
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
      'cancella tutti i messaggi',
      'rimuovi tutti i messaggi',
      'cancella tutto',
      'cancella tutti i nostri messaggi',
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
      'dimmi chi è {problem}',
      'sai chi è {problem}',
      'chi è {problem}',
      'cosa vuol dire {problem}',
      'che vuol dire {problem}',
      'cosa è un {problem}',
      'cosa è una {problem}',
      "cos'è un {problem}",
      "cos'è una {problem}",
      'cerca {problem}',
      'risolvi {problem}',
      'quanto fa {problem}',
      'cacola {problem}',
    ],
    slots: [
      {
        name: 'problem',
        type: 'STRING',
      },
    ],
    answers: ['Provo a cercare...', 'Vediamo...', 'Ok, attendi un attimo', 'Arriva!'],
  },
  // ----------------------------------------------------------------------------------------------------------

  // ----------------------------------------------------------------------------------------------------------
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
  TELLME_MORE: {
    answers: [
      'Dimmi di più perché non ho capito',
      'Aggiungi qualche dettaglio per favore',
      'Non riesco a seguirti, cosa intendi?',
    ],
  },
  STIMULATE: {
    answers: [
      'Grandioso!',
      'Bellissimo!!!',
      'Grandeee',
      'Che bello quando mi dici così',
    ],
  },
  DENY: {
    answers: [
      'Non sono cose da dirsi...',
      'Ti invito a cambiare tono.',
      'Non saprei cosa dirti sinceramente.',
    ],
  },
  IS_RECENT_MEMORY: {
    answers: [
      "Per quel che ricordo non è cambiato nulla rispetto all'ultimo messaggio di questo tipo :S",
      'Da quel che noto non è cambiato nulla rispetto a prima.',
    ],
  },
  NO_NEW_VULNS_OR_DEPS: {
    answers: [
      'Non ci sono nuove vulnerabilità o dipendenze da aggiornare su *{repo}*',
      'Nessuna nuova vulnerabilità o dipendenza aggiornata su *{repo}*',
    ],
  },
  NO_NEW_COMMIT: {
    answers: [
      "Nessun nuovo commit dall'ultima volta su *{repo}*",
      'Non ho trovato nessuna attività recente su *{repo}*',
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
    answers: ['*{module}@{current}* => {update}'],
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
  NEWS: {
    answers: [
      'Ecco degli articoli che potrebbero interessarti...',
      'Ti sto per mandare degli articoli che forse ti interesseranno',
      'Ci sono degli articoli che secondo me ti possono interessare.',
    ],
  },
  SINGLE_NEWS: {
    answers: ['[{source}] {title} - {description} ({url})'],
  },
  OPEN_NEWS: {
    answers: ['apri la notizia', 'leggi la notizia', "apri l\'articolo"],
  },
  // ----------------------------------------------------------------------------------------------------------

  // ----------------------------------------------------------------------------------------------------------
  // Emotional reactions
  //
  ANGRY: {
    answers: ['😠', '😡', '😤', '😫', '🤬', '👿'],
  },
  SAD: {
    answers: ['😥', '😯', '😕', '🙁', '😞', '😟', '😭'],
  },
  HAPPY: {
    answers: ['😀', '😁', '😃', '😆', '😉', '😊', '🙂', '☺️'],
  },
  EXCITED: {
    answers: ['🤣', '😎', '😍', '😘', '🤗', '🤩'],
  },
  NEUTRAL: {
    answers: ['🤔', '😐', '🤨', '😶', '🙄'],
  },
  // ----------------------------------------------------------------------------------------------------------

  // ----------------------------------------------------------------------------------------------------------
  // Dialogs
  //
  NEW_USER: {
    answers: ["Non ci conosciamo ancora, parlami un po' di te... inizia a dirmi, ad esempio, di cosa ti occupi e quali sono le tecnologie che ti interessano!"],
    knowledgeLabel: 'interests',
    followUp: 'NEW_USER_BOOKMARKS',
  },
  NEW_USER_BOOKMARKS: {
    knowledgeLabel: 'bookmarks',
    answers: ["Se hai dei siti web che frequenti di solito puoi elencarli qui, gli darò un'occhiata anche io ;)"]
  },
  NEW_USER_SUCCESS: {
    answers: ['Ottimo! Grazie 😉', 'bene :-)', 'ooook!'],
  },
  NEW_USER_CANCEL: {
    answers: ['😥 Ok, fa nulla...', 'ok ok fa nulla', 'va bene, fa nulla'],
  },
  NEW_USER_FAIL: {
    answers: ['Mmm... riproviamoci perché mi è sfuggito qualcosa :('],
  },
  // ----------------------------------------------------------------------------------------------------------
};
