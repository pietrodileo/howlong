import type { Locale } from '../models/settings';

export type Quote = {
  author: string;
  year: number;
  text: string;
  book?: string;
};

export type MessageTree = {
  nav: {
    welcome: string;
    working: string;
    library: string;
    models: string;
    compare: string;
    settings: string;
    about: string;
    expandSidebar: string;
    collapseSidebar: string;
    resizeSidebar: string;
    navigation: string;
  };
  compare: {
    backToLibrary: string;
    title: string;
    lede: string;
    loading: string;
    selectAtLeastTwo: string;
    availableEstimates: string;
    searchEstimates: string;
    searchEstimatesAria: string;
    selectAllVisible: string;
    clearSelection: string;
    selectedCount: string;
    estimatesSelected: string;
    loadingComparison: string;
    noEstimatesAvailable: string;
    partialLoadWarning: string;
    compareAction: string;
    compareHint: string;
    item: string;
    total: string;
    contingency: string;
    contingencyPercent: string;
  };
  common: {
    save: string;
    open: string;
    reload: string;
    noFileOpen: string;
    close: string;
    export: string;
    import: string;
    delete: string;
    add: string;
    default: string;
    duplicate: string;
    hours: string;
    days: string;
    ore: string;
    expand: string;
    collapse: string;
    expandCol: string;
    dragRow: string;
    dragColumn: string;
    columns: string;
    columnsVisible: string;
    name: string;
    category: string;
    notes: string;
    client: string;
    base: string;
    ctg: string;
    withCtg: string;
    actions: string;
    unsaved: string;
    unsavedF: string;
    cancel: string;
    confirm: string;
    start: string;
  };
  columns: {
    name: string;
    category: string;
    base: string;
    applyCtg: string;
    ctg: string;
    withCtg: string;
    override: string;
    notes: string;
    tags: string;
    client: string;
    actions: string;
    hours: string;
  };
  export: {
    ai: string;
    aiHint: string;
    excel: string;
    excelHint: string;
    backup: string;
    backupHint: string;
  };
  settings: {
    title: string;
    import: string;
    save: string;
    export: string;
    language: string;
    languageHelp: string;
    italian: string;
    english: string;
    appearance: string;
    appearanceHelp: string;
    appearanceLight: string;
    appearanceDark: string;
    username: string;
    usernameHelp: string;
    usernamePh: string;
    usernameDesktopHint: string;
    info: string;
    infoBody: string;
    dataFolder: string;
    estimatesFolder: string;
    estimatesFolderHelp: string;
    estimatesFolderActive: string;
    estimatesFolderCustom: string;
    workspaceFolderHelp: string;
    workspaceFolderActive: string;
    workspaceFolderDefault: string;
    workspaceFolderCustom: string;
    modelsFolderActive: string;
    pickFolder: string;
    resetFolder: string;
    folderLoaded: string;
    folderEmpty: string;
    importExport: string;
    tipImport: string;
    tipExport: string;
    saved: string;
    importOk: string;
    importOkFull: string;
    importOkLegacy: string;
    importBad: string;
    cancelled: string;
    exported: string;
    sectionProfile: string;
    sectionLocale: string;
    sectionAppearance: string;
    sectionEstimate: string;
    sectionPresentation: string;
    sectionExport: string;
    sectionFolder: string;
    sectionWorkspace: string;
    estimateColumnsIntro: string;
    presentationIntro: string;
    managerViewLegend: string;
    clientOutputLegend: string;
    defaultManagerHideNotes: string;
    defaultManagerHideTags: string;
    defaultClientHideNotes: string;
    defaultClientHideTags: string;
    exportFilenameLegend: string;
    exportIncludeDate: string;
    exportIncludeDateHint: string;
    exportIncludeTime: string;
    exportIncludeTimeHint: string;
  };
  about: {
    close: string;
    version: string;
    aim: string;
  };
  welcome: {
    title: string;
    headerPhrases: string[];
    phrases: string[];
    quotes: Quote[];
    description: string;
    newEstimate: string;
    openEstimate: string;
    openLibrary: string;
    recentTitle: string;
    noRecent: string;
    recentUpdated: string;
  };
  library: {
    lede: string;
    searchPh: string;
    searchAria: string;
    refresh: string;
    changeFolder: string;
    loading: string;
    empty: string;
    noResults: string;
    desktopOnly: string;
    opened: string;
    deleted: string;
    deleteTitle: string;
    deleteBody: string;
    renameAria: string;
    renameHint: string;
    selectAll: string;
    selectNone: string;
    selected: string;
    import: string;
    importHint: string;
    importOk: string;
    importPartial: string;
    export: string;
    exportHint: string;
    exportOk: string;
    exportZipHint: string;
    noneSelected: string;
    lastSavedBy: string;
    showPath: string;
    pathTitle: string;
    copyPath: string;
    pathCopied: string;
    pathCopyFailed: string;
    noPath: string;
    duplicated: string;
  };
  working: {
    titlePh: string;
    notesPh: string;
    notesExpand: string;
    notesModalTitle: string;
    notesModalHint: string;
    newFrom: string;
    pickModel: string;
    searchModel: string;
    newFromModel: string;
    noModels: string;
    clientPh: string;
    clientView: string;
    clientViewTitle: string;
    presentationView: string;
    unit: string;
    hoursPerDayTitle: string;
    base: string;
    ctgSumTitle: string;
    total: string;
    addMacro: string;
    addFormula: string;
    addFormulaTitle: string;
    addTask: string;
    editFormula: string;
    duplicateItem: string;
    deleteItem: string;
    deleteTitle: string;
    deleteBody: string;
    deleteBodyMacro: string;
    deleteConfirm: string;
    formulaMark: string;
    expandAll: string;
    collapseAll: string;
    noModelAvail: string;
    modelNotFound: string;
    newEstimateFrom: string;
    opened: string;
    reloaded: string;
    saved: string;
    exported: string;
    lastSavedBy: string;
    auditHistoryTitle: string;
    auditHistoryWhen: string;
    auditHistoryUser: string;
    auditHistoryEmpty: string;
    auditHistoryOpen: string;
    auditHistoryUnavailable: string;
    cycleError: string;
    oneDayEq: string;
    statFmt: string;
    ctgRow: string;
    ctgByCat: string;
    unsavedTitle: string;
    unsavedBody: string;
    unsavedDiscard: string;
    untitled: string;
  };
  tabs: {
    closeConfirm: string;
    closeDirtyTitle: string;
    closeDirtyBody: string;
    closeDirtyDiscard: string;
  };
  models: {
    lede: string;
    listAria: string;
    searchAria: string;
    catsAria: string;
    ctgAria: string;
    defaultBadge: string;
    newMacroName: string;
    newSubName: string;
    hoursFromSubs: string;
    newModel: string;
    newShort: string;
    import: string;
    importHint: string;
    importOk: string;
    importPartial: string;
    importBad: string;
    desktopOnly: string;
    expandList: string;
    collapseList: string;
    searchPh: string;
    noResults: string;
    resizeList: string;
    namePh: string;
    deleteModel: string;
    saveModel: string;
    exportModel: string;
    setDefault: string;
    modelIdTitle: string;
    iconLabel: string;
    icon_letter: string;
    icon_layers: string;
    icon_table: string;
    icon_folder: string;
    icon_gear: string;
    icon_star: string;
    icon_bolt: string;
    icon_check: string;
    icon_code: string;
    icon_chart: string;
    icon_clipboard: string;
    icon_calendar: string;
    icon_users: string;
    icon_flag: string;
    icon_target: string;
    icon_box: string;
    icon_book: string;
    icon_cloud: string;
    icon_rocket: string;
    icon_shield: string;
    icon_grid: string;
    icon_list: string;
    icon_pen: string;
    icon_link: string;
    icon_database: string;
    icon_briefcase: string;
    hoursPerDayTitle: string;
    catsLabel: string;
    newCatPh: string;
    addCat: string;
    needOneCat: string;
    removeCat: string;
    tagsLabel: string;
    tagsAria: string;
    newTagPh: string;
    addTag: string;
    removeTag: string;
    ctgTitle: string;
    ctgLede: string;
    ctgPercentTitle: string;
    howCalc: string;
    howHint: string;
    howP1: string;
    howFormula: string;
    howP2: string;
    hoursDefault: string;
    ctgColTitle: string;
    addMacro: string;
    addFormula: string;
    addFormulaTitle: string;
    empty: string;
    invalid: string;
    saved: string;
    exported: string;
    defaultSet: string;
    needOneModel: string;
    deleteConfirm: string;
    deleteFail: string;
    deleted: string;
    catExists: string;
    tagExists: string;
    editFormula: string;
    ctgOn: string;
    ctgOff: string;
  };
  client: {
    backToEstimate: string;
    titleLabel: string;
    titlePh: string;
    rounding: string;
    roundNone: string;
    roundCeil05: string;
    roundCeil1: string;
    roundRound1: string;
    hideNotes: string;
    hideTags: string;
    hideNotesManager: string;
    hideTagsManager: string;
    hideNotesClient: string;
    hideTagsClient: string;
    managerSectionTitle: string;
    managerSectionLede: string;
    managerViewLegend: string;
    clientOutputLegend: string;
    clientSectionLede: string;
    notesOpen: string;
    notesEmpty: string;
    activity: string;
    presented: string;
    statPresentedTotal: string;
    statDelta: string;
    timeColumn: string;
    presentedHours: string;
    presentedDays: string;
    macroPresentation: string;
    macroSubsCol: string;
    hideSubsCol: string;
    macroRollup: string;
    macroDetail: string;
    exported: string;
    editHint: string;
    reset: string;
    resetHint: string;
    resetOk: string;
    resetConfirmTitle: string;
    resetConfirmBody: string;
    editedMark: string;
    showCol: string;
    showHint: string;
    hiddenRow: string;
    redistribute: string;
    redistributeHint: string;
    redistributeOk: string;
    redistributeFail: string;
    compare: string;
    compareHint: string;
    compareTitle: string;
    compareLede: string;
    compareBefore: string;
    compareAfter: string;
    compareDelta: string;
  };
  formula: {
    title: string;
    lede: string;
    howToggle: string;
    howHint: string;
    howLead: string;
    howFormula_sum: string;
    howFormula_avg: string;
    howFormula_min: string;
    howFormula_max: string;
    howExample: string;
    howUse: string;
    howCtg: string;
    howDerived: string;
    name: string;
    namePh: string;
    aggregate: string;
    agg_sum: string;
    agg_avg: string;
    agg_min: string;
    agg_max: string;
    pct: string;
    optCtg: string;
    optCtgHelp: string;
    optDerived: string;
    optDerivedHelp: string;
    sources: string;
    all: string;
    none: string;
    derivedTag: string;
    subTag: string;
    derivedHint: string;
    emptySources: string;
    cancel: string;
    apply: string;
  };
  tagPicker: {
    placeholder: string;
    filterPh: string;
    all: string;
    none: string;
    create: string;
    remove: string;
  };
  ctg: {
    label: string;
    title: string;
    compare: string;
    compareTitle: string;
    compareLede: string;
    scenario: string;
    applyScenario: string;
    use: string;
  };
};

const it: MessageTree = {
  nav: {
    welcome: 'Benvenuto',
    working: 'Stima',
    library: 'Libreria',
    models: 'Modelli',
    compare: 'Confronta',
    settings: 'Impostazioni',
    about: 'About',
    expandSidebar: 'Apri barra laterale',
    collapseSidebar: 'Chiudi barra laterale',
    resizeSidebar: 'Ridimensiona navigazione',
    navigation: 'Navigazione',
  },
  welcome: {
    title: 'Benvenuto in HowLong',
    headerPhrases: [
      'Cosa facciamo oggi?',
      'Il tempo passa',
      'Da dove iniziamo?',
      'Quanto ci vuole?',
      'Ogni secondo conta',
      'Pronti a iniziare?',
      'Su cosa lavoriamo oggi?',
      'Da dove cominciamo?',
      'Qualche nuova idea su cui lavorare?',
      'Cosa facciamo?',
      'Mettiamoci al lavoro',
      'Cosa c\'è in programma?',
      'Un passo alla volta',
      'È ora di iniziare',
      'Su cosa ci concentriamo?',
      'Un nuovo giorno, un nuovo compito',
      'Qual è il prossimo punto?',
      'Facciamo qualche passo avanti',
      'Quando vuoi, sono pronto',
      'Diamoci da fare',
      'Come passerai il tuo tempo?',
      'Partiamo dall\'inizio',
      'Fai il primo passo',
      'Vediamo cosa possiamo fare',
      'Oggi è un buon giorno per iniziare',
      'Rimbocchiamoci le maniche',
      'Qual è la prima cosa da fare?',
      'Focalizziamoci sui prossimi obiettivi',
      'Concentriamoci',
      'Diamoci dentro',
      'Diamo il via alle operazioni',
    ],
    phrases: [
      'Ogni stima comincia da un momento ben speso.',
      'Il tempo si misura meglio quando lo si rende visibile.',
      'Una buona stima lascia spazio al lavoro che conta.',
      'Conta il tempo, chiarisci il lavoro.',
      'Anche il tempo incerto merita una stima.',
      'Le ore passano. Le buone stime restano.',
      'Dare un nome al tempo è il primo passo per governarlo.',
      'Una clessidra non corre: rende il tempo leggibile.',
      'Stimare è trasformare il tempo in una decisione.',
      'Il tempo del progetto inizia da qui.',
      'Più chiarezza nelle ore, meno sorprese dopo.',
      'Ogni attività ha il suo tempo. Diamogli forma.',
      'Il futuro è incerto, ma il lavoro si può stimare.',
      'Misura le ore. Proteggi il margine.',
      'Il tempo ben contato diventa lavoro ben organizzato.',
      'Una stima alla volta, il progetto prende forma.',
      'Dalla clessidra alla consegna: rendiamo visibile il tempo.',
      'Quando il tempo è chiaro, anche il prossimo passo lo è.',
      'Stimare il tempo è prendersi cura del lavoro.',
      'Cominciamo dalle ore che abbiamo davanti.',
    ],
    quotes: [
      {
        author: 'Albert Einstein',
        year: 1955,
        text: 'Il tempo è una grande illusione.',
        book: 'Lettera di condoglianze a Michele Besso',
      },
      {
        author: 'Lucio Annio Seneca',
        year: 49,
        text: 'Non abbiamo poco tempo, ma ne perdiamo molto.',
        book: 'De brevitate vitae',
      },
      {
        author: 'Richard Feynman',
        year: 1964,
        text: 'Il tempo è ciò che accade quando non accade nient\'altro.',
        book: 'La fisica di Feynman',
      },
      {
        author: 'Delmore Schwartz',
        year: 1933,
        text: 'Il tempo è il fuoco in cui bruciamo.',
        book: 'Calm\'s Death',
      },
      {
        author: 'Charles Darwin',
        year: 1846,
        text: 'Un uomo che osa sprecare un\'ora di tempo non ha scoperto il valore della vita.',
        book: 'Diari e lettere personali',
      },
      {
        author: 'Benjamin Franklin',
        year: 1748,
        text: 'Il tempo è denaro.',
        book: 'Consigli per un giovane mercante',
      },
      {
        author: 'Annie Dillard',
        year: 1989,
        text: 'Il modo in cui spendiamo i nostri giorni è, naturalmente, il modo in cui spendiamo la nostra vita.',
        book: 'Il fulgore del Grembiule',
      },
      {
        author: 'William Gibson',
        year: 1993,
        text: 'Il futuro è già qui, è solo distribuito in modo non uniforme.',
        book: 'Intervista NPR',
      },
      {
        author: 'Albert Einstein',
        year: 1916,
        text: 'Il tempo e lo spazio non sono condizioni in cui viviamo, ma modi in cui pensiamo.',
        book: 'Sulla teoria della relatività',
      },
      {
        author: 'Albert Einstein',
        year: 1915,
        text: 'Il tempo scorre più lentamente dove c\'è più gravità o dove ci si muove più velocemente.',
        book: 'Teoria della Relatività Generale',
      },
      {
        author: 'Richard Feynman',
        year: 1963,
        text: 'Nello studio della fisica, il tempo è semplicemente la variabile t che rende le equazioni capaci di descrivere il cambiamento.',
        book: 'Lezioni di fisica di Feynman',
      },
      {
        author: 'Tennessee Williams',
        year: 1944,
        text: 'Il tempo è la distanza più lunga tra due luoghi.',
        book: 'Lo zoo di vetro',
      },
      {
        author: 'Samuel Richardson',
        year: 1748,
        text: 'Il tempo è un tessuto di cui la vita è fatta.',
        book: 'Clarissa',
      },
      {
        author: 'Gabriel García Márquez',
        year: 1967,
        text: 'Gli uomini non passano il tempo: è il tempo che passa gli uomini.',
        book: 'Cent\'anni di solitudine',
      },
      {
        author: 'Lucio Annio Seneca',
        year: 49,
        text: 'Ognuno di noi ha tutto il tempo del mondo, ma ci accorgiamo che è poco solo quando sta finendo.',
        book: 'Epistulae morales ad Lucilium',
      },
      {
        author: 'John Archibald Wheeler',
        year: 1970,
        text: 'Il tempo è ciò che impedisce a tutto di accadere nello stesso momento.',
        book: 'Seminari di fisica teorica',
      },
      {
        author: 'Harvey Mackay',
        year: 1988,
        text: 'Il tempo è gratuito, ma è inestimabile. Non puoi possederlo, ma puoi usarlo. Non puoi tenerlo, ma puoi spenderlo.',
        book: 'Dig Your Well Before You\'re Thirsty',
      },
      {
        author: 'Mark Twain',
        year: 1890,
        text: 'Non rimandare a domani quello che puoi fare dopodomani.',
        book: 'Aforismi e scritti umoristici',
      },
      {
        author: 'Marcel Proust',
        year: 1913,
        text: 'Il tempo scorre alla rovescia solo nei sogni e nei ricordi.',
        book: 'Alla ricerca del tempo perduto',
      },
      {
        author: 'Jorge Luis Borges',
        year: 1944,
        text: 'Il tempo è l\'invenzione più bizzarra che l\'umanità abbia cercato di misurare con gli ingranaggi.',
        book: 'Finzioni',
      },
      {
        author: 'Honoré de Balzac',
        year: 1830,
        text: 'Dà a tutte le cose il loro tempo; il tempo è il capitale di chi ha solo la sua intelligenza.',
        book: 'La pelle di zigrino',
      },
      {
        author: 'H. Jackson Brown Jr.',
        year: 1991,
        text: 'Non dire che hai poco tempo. Hai esattamente lo stesso numero di ore al giorno che è stato dato a Michelangelo, a Leonardo da Vinci, a Madre Teresa, a Thomas Edison e ad Albert Einstein.',
        book: 'Life\'s Little Instruction Book',
      },
      {
        author: 'William Shakespeare',
        year: 1599,
        text: 'Ci lamentiamo che i giorni siano pochi e lamentiamo che i giorni scorrano così in fretta; ma nessuno sa fare a meno di questo spreco.',
        book: 'Enrico IV, Parte II',
      },
      {
        author: 'Jean-Jacques Rousseau',
        year: 1762,
        text: 'Ognuno calcola il prezzo di ogni merce, ma nessuno calcola il prezzo del tempo, sebbene sia la cosa più preziosa da spendere.',
        book: 'Emilio o dell\'educazione',
      },
      {
        author: 'Henri Bergson',
        year: 1889,
        text: 'Misurare il tempo con gli orologi è come misurare lo spazio con un righello. Il vero valore del tempo si misura in ciò che proviamo e in ciò che creiamo.',
        book: 'Saggio sui dati immediati della coscienza',
      },
      {
        author: 'David Bowie',
        year: 1971,
        text: 'Il tempo può cambiarmi, ma non posso tracciare il tempo.',
        book: 'Changes',
      },
      {
        author: 'Oasis',
        year: 1994,
        text: 'Col tempo, il tempo dirà.',
        book: 'Talk Tonight',
      },
      {
        author: 'Lewis Carroll',
        year: 1865,
        text: 'Se tu conoscessi il tempo bene quanto me, non faresti spreco di parole parlando di perdite di tempo. Il tempo è un amico prezioso se sai come accompagnarlo.',
        book: 'Le avventure di Alice nel Paese delle Meraviglie',
      },
      {
        author: 'Marcel Proust',
        year: 1913,
        text: 'I giorni sono forse identici per un orologio, ma per un uomo ogni ticchettio può custodire la riscoperta di un mondo interiore.',
        book: 'Alla ricerca del tempo perduto',
      },
      {
        author: 'Albert Einstein',
        year: 1916,
        text: 'L\'orologio non misura il tempo assoluto dell\'universo; segna soltanto il ritmo armonioso del nostro viaggio nello spazio-tempo.',
        book: 'Relatività: Esposizione divulgativa',
      },
    ],
    description: 'Crea una nuova stima, apri una stima esistente o esplora la libreria.',
    newEstimate: 'Nuova stima',
    openEstimate: 'Apri file',
    openLibrary: 'Vai alla libreria',
    recentTitle: 'Aperti di recente',
    noRecent: 'Nessuna stima aperta di recente',
    recentUpdated: 'Aggiornata il: {date}',
  },
  compare: {
    backToLibrary: 'Torna a Libreria',
    title: 'Confronta stime',
    lede: 'Seleziona due o più stime per confrontarle',
    loading: 'Caricamento...',
    selectAtLeastTwo: 'Seleziona almeno due stime per confrontarle',
    availableEstimates: 'Stime disponibili',
    searchEstimates: 'Cerca stime...',
    searchEstimatesAria: 'Cerca tra le stime disponibili',
    selectAllVisible: 'Seleziona tutte',
    clearSelection: 'Deseleziona tutte',
    selectedCount: '{n} selezionate',
    estimatesSelected: 'stime selezionate',
    loadingComparison: 'Caricamento confronto...',
    noEstimatesAvailable: 'Nessuna stima disponibile',
    partialLoadWarning: 'Alcune stime non sono state caricate correttamente',
    compareAction: 'Confronta',
    compareHint: 'Confronta le stime selezionate',
    item: 'Voce',
    total: 'Totale',
    contingency: 'Contingency',
    contingencyPercent: 'CTG: {percent}%',
  },
  common: {
    save: 'Salva',
    open: 'Apri',
    reload: 'Aggiorna',
    noFileOpen: 'Nessun file salvato. Salva prima una stima per poterla aprire.',
    close: 'Chiudi',
    export: 'Esporta',
    import: 'Importa',
    delete: 'Elimina',
    add: 'Aggiungi',
    default: 'default',
    hours: 'Ore',
    days: 'Giorni',
    ore: 'ore',
    expand: 'Espandi',
    collapse: 'Comprimi',
    expandCol: 'Collassa/espandi colonna',
    dragRow: 'Trascina per riordinare la riga',
    dragColumn: 'Trascina per riordinare la colonna',
    columns: 'Colonne',
    columnsVisible: 'Colonne visibili',
    name: 'Nome',
    category: 'Categoria',
    notes: 'Note',
    client: 'Cliente',
    base: 'Base',
    ctg: 'CTG',
    withCtg: 'Con CTG',
    actions: 'Azioni',
    unsaved: 'Non salvato',
    unsavedF: 'Non salvata',
    cancel: 'Annulla',
    confirm: 'Conferma',
    duplicate: 'Duplica',
    start: 'Inizia',
  },
  columns: {
    name: 'Nome',
    category: 'Categoria',
    base: 'Ore',
    applyCtg: 'Applica CTG',
    ctg: 'CTG',
    withCtg: 'Con CTG',
    override: 'CTG custom %',
    notes: 'Note',
    tags: 'Etichetta',
    client: 'Cliente',
    actions: 'Azioni',
    hours: 'Ore default',
  },
  export: {
    ai: 'YAML',
    aiHint: 'File semplice per lettura. Non può essere importato di nuovo in HowLong.',
    excel: 'Excel',
    excelHint: 'Foglio Excel per condividere con altre persone.',
    backup: 'JSON (HowLong)',
    backupHint: 'Copia completa da riaprire in HowLong.',
  },
  settings: {
    title: 'Impostazioni',
    import: 'Importa',
    save: 'Salva',
    export: 'Esporta',
    language: 'Lingua',
    languageHelp: 'Lingua dell\'interfaccia',
    italian: 'Italiano',
    english: 'English',
    appearance: 'Aspetto',
    appearanceHelp: 'Tema chiaro o scuro',
    appearanceLight: 'Chiaro',
    appearanceDark: 'Scuro',
    username: 'Nome utente',
    usernameHelp: 'Il tuo nome utente in HowLong',
    usernamePh: 'username',
    usernameDesktopHint: 'Predefinito: nome utente del PC',
    info: 'Informazioni',
    infoBody:
      'Dove HowLong? salva i suoi file sul PC',
    dataFolder: 'Cartella dati',
    estimatesFolder: 'Cartella stime',
    estimatesFolderHelp:
      'Cartella dove HowLong salva le preferenze e da dove carica le stime `.howlong.json` presenti.',
    estimatesFolderActive: 'Stime',
    estimatesFolderCustom: 'Stai usando una cartella personalizzata.',
    workspaceFolderHelp:
      'Cartella dove HowLong salva le stime e i modelli',
    workspaceFolderActive: 'Workspace',
    workspaceFolderDefault: 'Default app data (locale)',
    workspaceFolderCustom: 'Stai usando un workspace personalizzato.',
    modelsFolderActive: 'Modelli',
    pickFolder: 'Scegli cartella…',
    resetFolder: 'Usa default',
    folderLoaded: 'Caricate {n} stime dalla cartella',
    folderEmpty: 'Cartella vuota — nessuna stima HowLong trovata',
    importExport: 'Import / Export',
    tipImport: '**Import:** Importa e sostituisce impostazioni e modelli nella cartella workspace attiva.',
    tipExport: '**Export:** Esporta impostazioni e modelli.',
    saved: 'Impostazioni salvate',
    importOk: 'Settings importati',
    importOkFull: 'Importati impostazioni e {count} modelli',
    importOkLegacy: 'Importate solo le impostazioni (file senza modelli)',
    importBad: 'Settings non validi',
    cancelled: 'Annullato',
    exported: 'Workspace esportato',
    sectionProfile: 'Profilo',
    sectionLocale: 'Lingua',
    sectionAppearance: 'Aspetto',
    sectionEstimate: 'Vista Stima',
    sectionPresentation: 'Presentazione',
    sectionExport: 'Nome file export',
    sectionFolder: 'Workspace',
    sectionWorkspace: 'Import / export workspace',
    estimateColumnsIntro: 'Colonne visibili quando apri una stima.',
    presentationIntro: 'Definisce la visibilità predefinita delle colonne nella vista Presentazione.',
    managerViewLegend: 'Vista manager',
    clientOutputLegend: 'Vista cliente',
    defaultManagerHideNotes: 'Nascondi note',
    defaultManagerHideTags: 'Nascondi etichette',
    defaultClientHideNotes: 'Nascondi note',
    defaultClientHideTags: 'Nascondi etichette',
    exportFilenameLegend: 'Segmenti aggiunti al nome del file',
    exportIncludeDate: 'Data',
    exportIncludeDateHint: 'Formato yyyy-mm-dd',
    exportIncludeTime: 'Ora',
    exportIncludeTimeHint: 'Formato hh_mm_ss (solo se la data è attiva)',
  },
  about: {
    close: 'Chiudi',
    version: 'Versione',
    aim: 'Esegui le stime dei progetti senza lottare con Excel',
  },
  library: {
    lede: 'Le stime salvate in HowLong',
    searchPh: 'Cerca per titolo o cliente…',
    searchAria: 'Cerca stime',
    refresh: 'Aggiorna',
    changeFolder: 'Cartella…',
    loading: 'Caricamento…',
    empty: 'Nessuna stima salvata.',
    noResults: 'Nessun risultato',
    desktopOnly: 'Disponibile solo nell\'app desktop.',
    opened: 'Aperta «{name}»',
    deleted: 'Eliminata «{name}»',
    deleteTitle: 'Eliminare dalla libreria?',
    deleteBody: 'Eliminare «{name}» dalla cartella stime? Il file verrà cancellato.',
    renameAria: 'Nome stima',
    renameHint: 'Modifica il nome e premi Invio o esci dal campo per salvare',
    selectAll: 'Seleziona tutte',
    selectNone: 'Deseleziona',
    selected: '{n} selezionate',
    import: 'Importa JSON',
    importHint: 'Importa uno o più file HowLong JSON nella libreria',
    importOk: 'Importate {n} stime in libreria',
    importPartial: 'Importate {ok} stime; {fail} errori',
    export: 'Esporta',
    exportHint: 'Esporta le stime selezionate',
    exportOk: 'Esportate {n} stime: {path}',
    exportZipHint: 'Più stime saranno esportate come un unico archivio ZIP con file separati',
    noneSelected: 'Seleziona almeno una stima',
    lastSavedBy: 'Salvata da {user} · {when}',
    showPath: 'Mostra percorso',
    pathTitle: 'Percorso libreria',
    copyPath: 'Copia percorso',
    pathCopied: 'Percorso copiato',
    pathCopyFailed: 'Impossibile copiare il percorso',
    noPath: 'Nessun percorso disponibile',
    duplicated: 'Duplicata «{name}»',
  },
  working: {
    titlePh: 'Titolo stima',
    notesPh: 'Aggiungi nota…',
    notesExpand: 'Doppio click: apri editor nota',
    notesModalTitle: 'Note',
    notesModalHint: 'Puoi andare a capo. Ctrl+Invio per salvare.',
    newFrom: 'Nuova stima da «{name}»',
    pickModel: 'Scegli modello',
    searchModel: 'Cerca modello...',
    newFromModel: 'Nuova stima da modello',
    noModels: 'Nessun modello. Creane uno in Modelli.',
    clientPh: 'Cliente',
    clientView: 'Vista cliente',
    clientViewTitle: 'Anteprima presentabile della stima corrente',
    presentationView: 'Anteprima cliente',
    unit: 'Unità',
    hoursPerDayTitle: 'Ore in un giorno lavorativo',
    base: 'Base',
    ctgSumTitle: 'Somma di ore × % su ogni voce operativa',
    total: 'Totale',
    addMacro: 'Aggiungi Macro',
    addFormula: '+ Voce derivata',
    addFormulaTitle: 'Ore = aggregazione delle voci scelte × %',
    addTask: '+ Task',
    editFormula: 'Modifica voce derivata',
    duplicateItem: 'Duplica',
    deleteItem: 'Elimina',
    deleteTitle: 'Eliminare la voce?',
    deleteBody: 'Eliminare «{name}»?',
    deleteBodyMacro:
      'Eliminare «{name}» e tutte le sue sotto-attività?',
    deleteConfirm: 'Elimina',
    formulaMark: 'Voce derivata',
    expandAll: 'Espandi tutte le macro',
    collapseAll: 'Comprimi tutte le macro',
    noModelAvail: 'Nessun modello disponibile. Creane uno in Modelli.',
    modelNotFound: 'Modello non trovato. Vai in Modelli.',
    newEstimateFrom: 'Nuova stima da «{name}»',
    opened: 'Stima aperta',
    reloaded: 'Stima ricaricata dal file',
    saved: 'Salvata: {path}',
    exported: 'Esportata ({format}): {path}',
    lastSavedBy: 'Ultimo salvataggio: {user} · {when}',
    auditHistoryTitle: 'Cronologia salvataggi',
    auditHistoryWhen: 'Data e ora',
    auditHistoryUser: 'Utente',
    auditHistoryEmpty: 'Nessun salvataggio registrato',
    auditHistoryOpen: 'Apri cronologia salvataggi',
    auditHistoryUnavailable: 'Cronologia salvataggi non disponibile',
    cycleError: 'Dipendenza circolare',
    oneDayEq: '1 gg =',
    statFmt: '{hours} h · {days} D',
    ctgRow: 'Contingency',
    ctgByCat: 'Contingency — {category}',
    unsavedTitle: 'Modifiche non salvate',
    unsavedBody:
      'La stima attuale ha modifiche non salvate. Se continui verranno perse.',
    unsavedDiscard: 'Scarta e continua',
    untitled: 'Senza titolo',
  },
  tabs: {
    closeConfirm: 'Chiudere questa scheda?',
    closeDirtyTitle: 'Modifiche non salvate',
    closeDirtyBody: 'La stima «{name}» ha modifiche non salvate. Se chiudi la scheda, le modifiche verranno perse.',
    closeDirtyDiscard: 'Scarta e chiudi',
  },
  models: {
    lede: 'Gestisci modelli per le tue stime',
    listAria: 'Elenco modelli',
    searchAria: 'Cerca modello',
    catsAria: 'Categorie del modello',
    ctgAria: 'Contingency del modello',
    defaultBadge: 'Default',
    newMacroName: 'Nuova macro-attività',
    newSubName: 'Nuovo sotto-task',
    hoursFromSubs: 'Somma delle ore dei sotto-task',
    newModel: 'Nuovo modello',
    newShort: 'Nuovo',
    import: 'Importa',
    importHint: 'Importa uno o più modelli JSON',
    importOk: 'Importati {n} modelli',
    importPartial: 'Importati {ok} modelli; {fail} errori',
    importBad: 'Modello non valido',
    desktopOnly: 'L\'import modelli è disponibile solo nell\'app desktop.',
    expandList: 'Espandi elenco',
    collapseList: 'Comprimi elenco',
    searchPh: 'Cerca modello…',
    noResults: 'Nessun risultato',
    resizeList: 'Doppio click per comprimere/espandere',
    namePh: 'Nome modello',
    saveModel: 'Salva questo modello',
    exportModel: 'Esporta questo modello',
    deleteModel: 'Elimina questo modello',
    setDefault: 'Imposta default',
    modelIdTitle: 'ID univoco del modello',
    iconLabel: 'Icona',
    icon_letter: 'Iniziale',
    icon_layers: 'Layers',
    icon_table: 'Tabella',
    icon_folder: 'Cartella',
    icon_gear: 'Ingranaggio',
    icon_star: 'Stella',
    icon_bolt: 'Fulmine',
    icon_check: 'Check',
    icon_code: 'Codice',
    icon_chart: 'Grafico',
    icon_clipboard: 'Appunti',
    icon_calendar: 'Calendario',
    icon_users: 'Persone',
    icon_flag: 'Bandiera',
    icon_target: 'Target',
    icon_box: 'Scatola',
    icon_book: 'Libro',
    icon_cloud: 'Cloud',
    icon_rocket: 'Razzo',
    icon_shield: 'Scudo',
    icon_grid: 'Griglia',
    icon_list: 'Elenco',
    icon_pen: 'Penna',
    icon_link: 'Link',
    icon_database: 'Database',
    icon_briefcase: 'Valigetta',
    hoursPerDayTitle: 'Ore in un giorno lavorativo',
    catsLabel: 'Categorie disponibili',
    newCatPh: 'Nuova categoria',
    addCat: 'Aggiungi',
    needOneCat: 'Serve almeno una categoria',
    removeCat: 'Rimuovi {name}',
    tagsLabel: 'Etichette disponibili',
    tagsAria: 'Etichette del modello',
    newTagPh: 'Nuova etichetta (es. Site, Edition)',
    addTag: 'Aggiungi',
    removeTag: 'Rimuovi etichetta {name}',
    ctgTitle: 'Contingency',
    ctgLede: '% di default sulle voci con flag CTG attivo.',
    ctgPercentTitle: '% contingency applicata alle voci con flag CTG',
    howCalc: 'Come si calcola',
    howHint: 'es. 10 h al 20% → 12 h',
    howP1: 'Questa % CTG si applica alle ore delle voci con flag CTG attivo nella tabella:',
    howFormula: 'CTG = ore × (% ÷ 100)  |  totale = ore + CTG',
    howP2: 'Esempio: 10 h al 20% → +2 h → totale 12 h. Se il flag CTG è spento, quella voce resta senza contingency.',
    hoursDefault: 'Ore default',
    ctgColTitle: 'Applica contingency a questa voce',
    addMacro: 'Aggiungi macro-attività',
    addFormula: '+ Voce derivata',
    addFormulaTitle: 'Ore = aggregazione delle voci scelte × %',
    empty: 'Nessun modello. Creane uno nuovo.',
    invalid: 'Modello non valido',
    saved: 'Modello salvato',
    exported: 'Modello esportato: {path}',
    defaultSet: 'Modello di default: «{name}»',
    needOneModel: 'Serve almeno un modello',
    deleteConfirm: 'Eliminare il modello «{name}»?',
    deleteFail: 'Eliminazione non riuscita',
    deleted: 'Modello eliminato: «{name}»',
    catExists: 'Categoria già presente',
    tagExists: 'Etichetta già presente',
    editFormula: 'Modifica voce derivata',
    ctgOn: 'CTG attiva',
    ctgOff: 'CTG esclusa',
  },
  client: {
    backToEstimate: 'Torna alla stima',
    titleLabel: 'Titolo stima presentata al cliente',
    titlePh: 'Lascia vuoto per usare il titolo della stima',
    rounding: 'Arrotondamento',
    roundNone: 'Nessuno',
    roundCeil05: 'Per eccesso 0,5',
    roundCeil1: 'Per eccesso 1',
    roundRound1: 'Al più vicino 1',
    hideNotes: 'Nascondi note',
    hideTags: 'Nascondi etichette',
    hideNotesManager: 'Nascondi note',
    hideTagsManager: 'Nascondi etichette',
    hideNotesClient: 'Nascondi note',
    hideTagsClient: 'Nascondi etichette',
    managerSectionTitle: 'Vista manager',
    managerSectionLede:
      'Modifica le voci e ritocca i totali da presentare al cliente senza alterare la stima originale.',
    managerViewLegend: 'Vista manager',
    clientOutputLegend: 'Vista cliente',
    clientSectionLede:
      'Anteprima di ciò verrà esposto al cliente',
    notesOpen: 'Click: apri e modifica la nota',
    notesEmpty: 'Aggiungi nota…',
    activity: 'Attività',
    presented: 'Totale presentato',
    statPresentedTotal: 'Totale presentato',
    statDelta: 'Delta',
    timeColumn: 'Tempo',
    presentedHours: 'Ore (h)',
    presentedDays: 'Giorni (D)',
    macroPresentation: 'Presentazione al cliente',
    macroSubsCol: 'Sub',
    hideSubsCol: 'Nascondi colonna Sub-task',
    macroRollup: 'Nasconde o rende visibili i sotto-task nell\'export',
    macroDetail: 'Mostra sotto-task nell\'export',
    exported: 'Vista cliente esportata ({format}): {path}',
    editHint:'',
    reset: 'Reset',
    resetHint: 'Ripristina i valori calcolati (arrotondamento incluso)',
    resetOk: 'Valori vista cliente ripristinati',
    resetConfirmTitle: 'Ripristinare i valori calcolati?',
    resetConfirmBody:
      'Le modifiche manuali alle ore presentate e alle ripartizioni andranno perse. La stima originale non viene modificata.',
    editedMark: 'Valore ritoccato',
    showCol: 'Incluso',
    showHint:
      'Rimuovi questa voce dalla stima cliente (ore e sottovoci incluse).',
    hiddenRow: 'Nascosta',
    redistribute: 'Ripartiziona',
    redistributeHint:
      'Nasconde questa voce e distribuisce le sue ore sulle altre voci ancora attive',
    redistributeOk: 'Ore ripartite sulle altre voci',
    redistributeFail: 'Nessuna altra voce su cui ripartire',
    compare: 'Confronto',
    compareHint: 'Sistema (calcolato) vs presentazione (modifiche utente)',
    compareTitle: 'Confronto presentazione',
    compareLede:
      'Prima = valori calcolati con l\'arrotondamento. Dopo = modifiche utente e ripartizioni',
    compareBefore: 'Prima',
    compareAfter: 'Dopo',
    compareDelta: 'Δ',
  },
  formula: {
    title: 'Voce derivata',
    lede: 'Ore = aggregazione delle voci scelte × %',
    howToggle: 'Come funziona',
    howHint: 'es. (8+12)×30% = 6 h',
    howLead: 'Il valore di questo campo si calcola dalle voci che selezioni sotto. Ad esempio:',
    howFormula_sum: 'ore = somma delle voci spuntate × %',
    howFormula_avg: 'ore = media delle voci spuntate × %',
    howFormula_min: 'ore = minimo delle voci spuntate × %',
    howFormula_max: 'ore = massimo delle voci spuntate × %',
    howExample: 'Analisi 8 h + Sviluppo 12 h, al 30% → 6 h (con somma).',
    howUse: '',
    howCtg: 'Il CTG si attiva dalla colonna CTG in tabella.',
    howDerived: '',
    name: 'Nome',
    namePh: 'es. Overhead (15%)',
    aggregate: 'Aggregazione',
    agg_sum: 'Somma',
    agg_avg: 'Media',
    agg_min: 'Minimo',
    agg_max: 'Massimo',
    pct: '%',
    optCtg: 'Aggiungi anche la % CTG della stima su queste ore',
    optCtgHelp:
      'Esempio: questa riga fa 6 h e la stima ha CTG 20%. Spento → restano 6 h. Acceso → diventano 6 + 20% = 7,2 h. Se stai creando proprio la Contingency, lascia spento.',
    optDerived: 'Permetti di includere anche le voci con etichetta “derivata”',
    optDerivedHelp:
      'Di default la % usa solo attività digitate a mano (Sviluppo, Analisi…). Se accendi questa opzione, puoi spuntare anche altre voci già calcolate (es. Project Mgmt) e la % le include.',
    sources: 'Voci sorgente',
    all: 'Tutte',
    none: 'Nessuna',
    derivedTag: 'derivata',
    subTag: 'sub',
    derivedHint: 'Le voci “derivata” sono disabilitate. Accendi l\'opzione sopra per usarle.',
    emptySources: 'Nessuna voce disponibile.',
    cancel: 'Annulla',
    apply: 'Applica',
  },
  tagPicker: {
    placeholder: 'Aggiungi etichette…',
    filterPh: 'Cerca o crea…',
    all: 'Tutte le etichette',
    none: 'Nessuna etichetta',
    create: 'Crea «{name}»',
    remove: 'Rimuovi {name}',
  },
  ctg: {
    label: 'CTG',
    title: 'CTG = ore × (% ÷ 100). Totale = ore + CTG.',
    compare: 'Confronta CTG',
    compareTitle: 'Confronto contingency',
    compareLede:
      'Tre scenari di % globale (mode e override della stima restano uguali). Solo sessione: non viene salvato.',
    scenario: 'Scenario {letter}',
    applyScenario: 'Usa questa % come contingency della stima',
    use: 'Usa',
  },
};

const en: MessageTree = {
  nav: {
    welcome: 'Welcome',
    working: 'Estimate',
    library: 'Library',
    models: 'Models',
    compare: 'Compare',
    settings: 'Settings',
    about: 'About',
    expandSidebar: 'Open sidebar',
    collapseSidebar: 'Close sidebar',
    resizeSidebar: 'Resize navigation',
    navigation: 'Navigation',
  },
  welcome: {
    title: 'Welcome to HowLong',
    headerPhrases: [
      'What shall we do today?',
      'Time is passing',
      'Where do we start?',
      'How long will it take?',
      'Every second counts',
      'Ready to start?',
      'What are we working on today?',
      'Where do we begin?',
      'Any new ideas to work on?',
      'What comes next?',
      'Let\'s get started',
      'What\'s on the agenda?',
      'One step at a time',
      'Time to get started',
      'What are we focusing on?',
      'A new day, a new task',
      'What\'s next on your list?',
      'Let\'s make some progress',
      'Ready when you are',
      'Let\'s get to work',
      'How will you spend your time?',
      'Let\'s start from the beginning',
      'Take the first step',
      'Let\'s see what we can do',
      'Today is a good day to start',
      'Roll up your sleeves',
      'What\'s the first task?',
      'Let\'s tackle the work ahead',
      'Let\'s make the most of our time',
      'What\'s the plan for today?',
      'Focus on what matters',
      'Let\'s make every moment count',
    ],
    phrases: [
      'Every estimate begins with a moment well spent.',
      'Time is easier to measure when you make it visible.',
      'A good estimate leaves room for the work that matters.',
      'Count the time, clarify the work.',
      'Even uncertain time deserves an estimate.',
      'Hours pass. Good estimates remain.',
      'Naming time is the first step toward guiding it.',
      'An hourglass does not rush: it makes time readable.',
      'Estimating turns time into a decision.',
      'The project\'s time starts here.',
      'More clarity in the hours, fewer surprises later.',
      'Every task has its time. Let\'s give it shape.',
      'The future is uncertain, but work can be estimated.',
      'Measure the hours. Protect the margin.',
      'Time well counted becomes work well organized.',
      'One estimate at a time, the project takes shape.',
      'From hourglass to delivery: make time visible.',
      'When time is clear, the next step is too.',
      'Estimating time is taking care of the work.',
      'Let\'s start with the hours ahead.',
    ],
    quotes: [
      {
        author: 'Albert Einstein',
        year: 1955,
        text: 'Time is a stubborn illusion.',
        book: 'Letter of condolence to Michele Besso',
      },
      {
        author: 'Lucius Annaeus Seneca',
        year: 49,
        text: 'It is not that we have a short time to live, but that we waste a lot of it.',
        book: 'On the Shortness of Life',
      },
      {
        author: 'Richard Feynman',
        year: 1964,
        text: 'Time is what happens when nothing else happens.',
        book: 'The Feynman Lectures on Physics',
      },
      {
        author: 'Delmore Schwartz',
        year: 1933,
        text: 'Time is the fire in which we burn.',
        book: "Calm's Death",
      },
      {
        author: 'Charles Darwin',
        year: 1846,
        text: 'A man who dares to waste one hour of time has not discovered the value of life.',
        book: 'Personal Diaries and Letters',
      },
      {
        author: 'Benjamin Franklin',
        year: 1748,
        text: 'Time is money.',
        book: 'Advice to a Young Tradesman',
      },
      {
        author: 'Annie Dillard',
        year: 1989,
        text: 'How we spend our days is, of course, how we spend our lives.',
        book: 'The Writing Life',
      },
      {
        author: 'William Gibson',
        year: 1993,
        text: "The future is already here - it's just not very evenly distributed.",
        book: 'NPR Interview',
      },
      {
        author: 'Albert Einstein',
        year: 1916,
        text: 'Time and space are not conditions in which we live, but modes in which we think.',
        book: 'Relativity: The Special and the General Theory',
      },
      {
        author: 'Albert Einstein',
        year: 1915,
        text: 'Time runs slower where gravity is stronger or where one moves faster.',
        book: 'General Theory of Relativity',
      },
      {
        author: 'Richard Feynman',
        year: 1963,
        text: 'In the study of physics, time is simply the variable t that allows equations to describe change.',
        book: 'The Feynman Lectures on Physics',
      },
      {
        author: 'Tennessee Williams',
        year: 1944,
        text: 'Time is the longest distance between two places.',
        book: 'The Glass Menagerie',
      },
      {
        author: 'Samuel Richardson',
        year: 1748,
        text: 'Time is a tissue of which life is made.',
        book: 'Clarissa',
      },
      {
        author: 'Gabriel García Márquez',
        year: 1967,
        text: 'Men do not pass time: it is time that passes men.',
        book: 'One Hundred Years of Solitude',
      },
      {
        author: 'Lucius Annaeus Seneca',
        year: 49,
        text: 'Each of us has all the time in the world, but we only realize it is short when it is running out.',
        book: 'Letters from a Stoic',
      },
      {
        author: 'John Archibald Wheeler',
        year: 1970,
        text: 'Time is what prevents everything from happening at once.',
        book: 'Theoretical Physics Seminars',
      },
      {
        author: 'Harvey Mackay',
        year: 1988,
        text: "Time is free, but it's priceless. You can't own it, but you can use it. You can't keep it, but you can spend it.",
        book: "Dig Your Well Before You're Thirsty",
      },
      {
        author: 'Mark Twain',
        year: 1890,
        text: 'Never put off till tomorrow what you can do the day after tomorrow.',
        book: 'Aphorisms and Humorous Writings',
      },
      {
        author: 'Marcel Proust',
        year: 1913,
        text: 'Time flows backward only in dreams and memories.',
        book: 'In Search of Lost Time',
      },
      {
        author: 'Jorge Luis Borges',
        year: 1944,
        text: 'Time is the bizzarest invention that humanity has tried to measure with gears.',
        book: 'Ficciones',
      },
      {
        author: 'Honoré de Balzac',
        year: 1830,
        text: 'Give all things their time; time is the capital of he who has only his intelligence.',
        book: 'The Magic Skin',
      },
      {
        author: 'H. Jackson Brown Jr.',
        year: 1991,
        text: "Don't say you don't have enough time. You have exactly the same number of hours per day that were given to Michelangelo, Leonardo da Vinci, Mother Teresa, Thomas Edison, and Albert Einstein.",
        book: "Life's Little Instruction Book",
      },
      {
        author: 'William Shakespeare',
        year: 1599,
        text: 'We cry that the days are few and lament that the days flit so fast; but none can do without this waste.',
        book: 'Henry IV, Part 2',
      },
      {
        author: 'Jean-Jacques Rousseau',
        year: 1762,
        text: 'Everyone calculates the price of every commodity, but no one calculates the price of time, although it is the most precious thing to spend.',
        book: 'Emile, or On Education',
      },
      {
        author: 'Henri Bergson',
        year: 1889,
        text: 'Measuring time with clocks is like measuring space with a ruler. The true value of time is measured in what we feel and what we create.',
        book: 'Time and Free Will',
      },
      {
        author: 'David Bowie',
        year: 1971,
        text: "Time may change me, but I can't trace time.",
        book: 'Changes',
      },
      {
        author: 'Oasis',
        year: 1994,
        text: 'In time, time will tell.',
        book: 'Talk Tonight',
      },
      {
        author: 'Lewis Carroll',
        year: 1865,
        text: "If you knew Time as well as I do, you wouldn't talk about wasting it. Time is a precious friend if you know how to accompany it.",
        book: "Alice's Adventures in Wonderland",
      },
      {
        author: 'Marcel Proust',
        year: 1913,
        text: 'Days may be identical to a clock, but for a man every tick can hold the rediscovery of an inner world.',
        book: 'In Search of Lost Time',
      },
      {
        author: 'Albert Einstein',
        year: 1916,
        text: 'The clock does not measure the absolute time of the universe; it merely marks the harmonious rhythm of our journey through space-time.',
        book: 'Relativity: The Special and the General Theory',
      },
    ],
    description: 'Create a new estimate, open an existing one, or browse the library.',
    newEstimate: 'New Estimate',
    openEstimate: 'Open File',
    openLibrary: 'Go to Library',
    recentTitle: 'Opened recently',
    noRecent: 'No recent estimates opened',
    recentUpdated: 'Updated: {date}',
  },
  compare: {
    backToLibrary: 'Back to Library',
    title: 'Compare Estimates',
    lede: 'Select two or more estimates to compare them',
    loading: 'Loading...',
    selectAtLeastTwo: 'Select at least two estimates to compare',
    availableEstimates: 'Available Estimates',
    searchEstimates: 'Search estimates...',
    searchEstimatesAria: 'Search available estimates',
    selectAllVisible: 'Select all',
    clearSelection: 'Clear selection',
    selectedCount: '{n} selected',
    estimatesSelected: 'estimates selected',
    loadingComparison: 'Loading comparison...',
    noEstimatesAvailable: 'No estimates available',
    partialLoadWarning: 'Some estimates failed to load',
    compareAction: 'Compare',
    compareHint: 'Compare selected estimates',
    item: 'Item',
    total: 'Total',
    contingency: 'Contingency',
    contingencyPercent: 'CTG: {percent}%',
  },
  common: {
    save: 'Save',
    open: 'Open',
    reload: 'Reload',
    noFileOpen: 'No file saved. Save a first estimate to open it.',
    close: 'Close',
    export: 'Export',
    import: 'Import',
    delete: 'Delete',
    add: 'Add',
    default: 'default',
    hours: 'Hours',
    days: 'Days',
    ore: 'hrs',
    expand: 'Expand',
    collapse: 'Collapse',
    expandCol: 'Collapse/expand column',
    dragRow: 'Drag to reorder row',
    dragColumn: 'Drag to reorder column',
    columns: 'Columns',
    columnsVisible: 'Visible columns',
    name: 'Name',
    category: 'Category',
    notes: 'Notes',
    client: 'Client',
    base: 'Base',
    ctg: 'CTG',
    withCtg: 'With CTG',
    actions: 'Actions',
    unsaved: 'Unsaved',
    unsavedF: 'Unsaved',
    cancel: 'Cancel',
    confirm: 'Confirm',
    duplicate: 'Duplicate',
    start: 'Get started',
  },
  columns: {
    name: 'Name',
    category: 'Category',
    base: 'Hours',
    applyCtg: 'Apply CTG',
    ctg: 'CTG',
    withCtg: 'With CTG',
    override: 'Custom CTG %',
    notes: 'Notes',
    tags: 'Label',
    client: 'Client',
    actions: 'Actions',
    hours: 'Default hours',
  },
  export: {
    ai: 'YAML',
    aiHint: 'Simple file for AI or reading. Not re-imported in HowLong.',
    excel: 'Excel',
    excelHint: 'Spreadsheet to share with other people.',
    backup: 'JSON (HowLong)',
    backupHint: 'Full copy to re-import in HowLong.',
  },
  settings: {
    title: 'Settings',
    import: 'Import',
    save: 'Save',
    export: 'Export',
    language: 'Language',
    languageHelp: 'UI language',
    italian: 'Italiano',
    english: 'English',
    appearance: 'Appearance',
    appearanceHelp: 'Light or dark theme',
    appearanceLight: 'Light',
    appearanceDark: 'Dark',
    username: 'Username',
    usernameHelp: 'Your username in HowLong',
    usernamePh: 'username',
    usernameDesktopHint: 'Default value: PC username',
    info: 'About',
    infoBody:
      'This shows where HowLong? stores its files on your PC. CTG and hours/day are set on the model or estimate. Settings export also includes your models.',
    dataFolder: 'Data folder',
    estimatesFolder: 'Estimates folder',
    estimatesFolderHelp:
      'Folder where HowLong saves preferences and loads estimates `.howlong.json` found there.',
    estimatesFolderActive: 'Estimates',
    estimatesFolderCustom: 'You are using a custom folder.',
    workspaceFolderHelp:
      'Folder where HowLong saves estimates and models',
    workspaceFolderActive: 'Workspace',
    workspaceFolderDefault: 'Default app data (local)',
    workspaceFolderCustom: 'You are using a custom workspace.',
    modelsFolderActive: 'Models',
    pickFolder: 'Choose folder…',
    resetFolder: 'Use default',
    folderLoaded: 'Loaded {n} estimates from the folder',
    folderEmpty: 'Empty folder — no HowLong estimates found',
    importExport: 'Import / Export',
    tipImport: '**Import:** Import and replace settings and models in the active workspace folder.',
    tipExport: '**Export:** Export settings and models.',
    saved: 'Settings saved',
    importOk: 'Settings imported',
    importOkFull: 'Imported settings and {count} models',
    importOkLegacy: 'Imported settings only (file had no models)',
    importBad: 'Invalid settings',
    cancelled: 'Cancelled',
    exported: 'Workspace exported',
    sectionProfile: 'Profile',
    sectionLocale: 'Language',
    sectionAppearance: 'Appearance',
    sectionEstimate: 'Estimate view',
    sectionPresentation: 'Presentation',
    sectionExport: 'Export filename',
    sectionFolder: 'Workspace',
    sectionWorkspace: 'Workspace import / export',
    estimateColumnsIntro: 'Columns shown when you open an estimate.',
    presentationIntro: 'Defines the default visibility of columns in the Presentation view.',
    managerViewLegend: 'Manager view',
    clientOutputLegend: 'Client view',
    defaultManagerHideNotes: 'Hide notes',
    defaultManagerHideTags: 'Hide labels',
    defaultClientHideNotes: 'Hide notes',
    defaultClientHideTags: 'Hide labels',
    exportFilenameLegend: 'Extra segments in the export filename',
    exportIncludeDate: 'Date',
    exportIncludeDateHint: 'Format yyyy-mm-dd',
    exportIncludeTime: 'Time',
    exportIncludeTimeHint: 'Format hh_mm_ss (only when date is on)',
  },
  about: {
    close: 'Close',
    version: 'Version',
    aim: 'Estimate project effort without wrestling Excel',
  },
  library: {
    lede: 'Your saved estimates in HowLong',
    searchPh: 'Search by title or client…',
    searchAria: 'Search estimates',
    refresh: 'Refresh',
    changeFolder: 'Folder…',
    loading: 'Loading…',
    empty: 'No saved estimates yet',
    noResults: 'No results',
    desktopOnly: 'Available only in the desktop app',
    opened: 'Opened «{name}»',
    deleted: 'Deleted «{name}»',
    deleteTitle: 'Delete from library?',
    deleteBody: 'Delete «{name}» from the estimates folder? The file will be removed.',
    renameAria: 'Estimate name',
    renameHint: 'Edit the name, then press Enter or leave the field to save',
    selectAll: 'Select all',
    selectNone: 'Clear selection',
    selected: '{n} selected',
    import: 'Import JSON',
    importHint: 'Import one or more HowLong JSON files into the library',
    importOk: 'Imported {n} estimates into the library',
    importPartial: 'Imported {ok} estimates; {fail} failed',
    export: 'Export',
    exportHint: 'Export selected estimates',
    exportOk: 'Exported {n} estimates: {path}',
    exportZipHint: 'Multiple estimates will be exported as a single ZIP file with separate files',
    noneSelected: 'Select at least one estimate',
    lastSavedBy: 'Saved by {user} · {when}',
    showPath: 'Show path',
    pathTitle: 'Library path',
    copyPath: 'Copy path',
    pathCopied: 'Path copied',
    pathCopyFailed: 'Failed to copy path',
    noPath: 'No path available',
    duplicated: 'Duplicated «{name}»',
  },
  working: {
    titlePh: 'Estimate title',
    notesPh: 'Add a note…',
    notesExpand: 'Double-click: open note editor',
    notesModalTitle: 'Notes',
    notesModalHint: 'Line breaks are kept. Ctrl+Enter to save.',
    newFrom: 'New estimate from «{name}»',
    pickModel: 'Choose model',
    searchModel: 'Search model...',
    newFromModel: 'New estimate from model',
    noModels: 'No models. Create one in Models',
    clientPh: 'Client',
    clientView: 'Client view',
    clientViewTitle: 'Presentable preview of the current estimate',
    presentationView: 'Client preview',
    unit: 'Unit',
    hoursPerDayTitle: 'Hours in a working day',
    base: 'Base',
    ctgSumTitle: 'Sum of hours × % on each operational line',
    total: 'Total',
    addMacro: 'Add Macro',
    addFormula: '+ Calculated item',
    addFormulaTitle: 'Hours = aggregation of selected lines × %',
    addTask: '+ Task',
    editFormula: 'Edit calculated item',
    duplicateItem: 'Duplicate',
    deleteItem: 'Delete',
    deleteTitle: 'Delete this line?',
    deleteBody: 'Delete «{name}»?',
    deleteBodyMacro: 'Delete «{name}» and all its sub-tasks?',
    deleteConfirm: 'Delete',
    formulaMark: 'Calculated item',
    expandAll: 'Expand all macros',
    collapseAll: 'Collapse all macros',
    noModelAvail: 'No model available. Create one in Models',
    modelNotFound: 'Model not found. Go to Models.',
    newEstimateFrom: 'New estimate from «{name}»',
    opened: 'Estimate opened',
    reloaded: 'Estimate reloaded from file',
    saved: 'Saved: {path}',
    exported: 'Exported ({format}): {path}',
    lastSavedBy: 'Last saved: {user} · {when}',
    auditHistoryTitle: 'Save history',
    auditHistoryWhen: 'Date and time',
    auditHistoryUser: 'User',
    auditHistoryEmpty: 'No saves recorded',
    auditHistoryOpen: 'Open save history',
    auditHistoryUnavailable: 'Save history not available',
    cycleError: 'Circular dependency',
    oneDayEq: '1 day =',
    statFmt: '{hours} h · {days} D',
    ctgRow: 'Contingency',
    ctgByCat: 'Contingency — {category}',
    unsavedTitle: 'Unsaved changes',
    unsavedBody:
      'The current estimate has unsaved changes. If you continue they will be lost.',
    unsavedDiscard: 'Discard and continue',
    untitled: 'Untitled',
  },
  tabs: {
    closeConfirm: 'Close this tab?',
    closeDirtyTitle: 'Unsaved changes',
    closeDirtyBody: 'The estimate «{name}» has unsaved changes. If you close the tab, changes will be lost.',
    closeDirtyDiscard: 'Discard and close',
  },
  models: {
    lede: 'Manage your models for estimates',
    listAria: 'Model list',
    searchAria: 'Search model',
    catsAria: 'Model categories',
    ctgAria: 'Model contingency',
    defaultBadge: 'Default',
    newMacroName: 'New macro activity',
    newSubName: 'New sub-task',
    hoursFromSubs: 'Sum of sub-task hours',
    newModel: 'New model',
    newShort: 'New',
    import: 'Import',
    importHint: 'Import one or more model JSON files',
    importOk: 'Imported {n} models',
    importPartial: 'Imported {ok} models; {fail} failed',
    importBad: 'Invalid model',
    desktopOnly: 'Model import is available only in the desktop app.',
    expandList: 'Expand list',
    collapseList: 'Collapse list',
    searchPh: 'Search model…',
    noResults: 'No results',
    resizeList: 'Double-click to collapse/expand',
    namePh: 'Model name',
    saveModel: 'Save this model',
    exportModel: 'Export this model',
    deleteModel: 'Delete this model',
    setDefault: 'Set as default',
    modelIdTitle: 'Unique model ID',
    iconLabel: 'Icon',
    icon_letter: 'Initial',
    icon_layers: 'Layers',
    icon_table: 'Table',
    icon_folder: 'Folder',
    icon_gear: 'Gear',
    icon_star: 'Star',
    icon_bolt: 'Bolt',
    icon_check: 'Check',
    icon_code: 'Code',
    icon_chart: 'Chart',
    icon_clipboard: 'Clipboard',
    icon_calendar: 'Calendar',
    icon_users: 'People',
    icon_flag: 'Flag',
    icon_target: 'Target',
    icon_box: 'Box',
    icon_book: 'Book',
    icon_cloud: 'Cloud',
    icon_rocket: 'Rocket',
    icon_shield: 'Shield',
    icon_grid: 'Grid',
    icon_list: 'List',
    icon_pen: 'Pen',
    icon_link: 'Link',
    icon_database: 'Database',
    icon_briefcase: 'Briefcase',
    hoursPerDayTitle: 'Hours in a working day',
    catsLabel: 'Available categories',
    newCatPh: 'New category',
    addCat: 'Add',
    needOneCat: 'At least one category is required',
    removeCat: 'Remove {name}',
    tagsLabel: 'Available labels',
    tagsAria: 'Model labels',
    newTagPh: 'New label (e.g. Site, Edition)',
    addTag: 'Add',
    removeTag: 'Remove label {name}',
    ctgTitle: 'Contingency',
    ctgLede: 'Default % on lines with the CTG flag on.',
    ctgPercentTitle: '% contingency applied to lines with CTG flag',
    howCalc: 'How it works',
    howHint: 'e.g. 10 h at 20% → 12 h',
    howP1: 'This CTG % applies to hours of lines with the CTG flag on in the table:',
    howFormula: 'CTG = hours × (% ÷ 100)  |  total = hours + CTG',
    howP2: 'Example: 10 h at 20% → +2 h → total 12 h. If CTG is off, that line has no contingency.',
    hoursDefault: 'Default hours',
    ctgColTitle: 'Apply contingency to this line',
    addMacro: 'Add macro activity',
    addFormula: '+ Calculated item',
    addFormulaTitle: 'Hours = aggregation of selected lines × %',
    empty: 'No model. Create a new one.',
    invalid: 'Invalid model',
    saved: 'Model saved',
    exported: 'Model exported: {path}',
    defaultSet: 'Default model: «{name}»',
    needOneModel: 'At least one model is required',
    deleteConfirm: 'Delete model «{name}»?',
    deleteFail: 'Delete failed',
    deleted: 'Model deleted: «{name}»',
    catExists: 'Category already exists',
    tagExists: 'Label already exists',
    editFormula: 'Edit calculated item',
    ctgOn: 'CTG on',
    ctgOff: 'CTG off',
  },
  client: {
    backToEstimate: 'Back to estimate',
    titleLabel: 'Estimate title presented to client',
    titlePh: 'Leave empty to use estimate title',
    rounding: 'Rounding',
    roundNone: 'None',
    roundCeil05: 'Ceil 0.5',
    roundCeil1: 'Ceil 1',
    roundRound1: 'Round 1',
    hideNotes: 'Hide notes',
    hideTags: 'Hide labels',
    hideNotesManager: 'Hide notes',
    hideTagsManager: 'Hide labels',
    hideNotesClient: 'Hide notes',
    hideTagsClient: 'Hide labels',
    managerSectionTitle: 'Manager view',
    managerSectionLede:
      'Modify lines and tweak totals to present to the client without changing the original estimate.',
    managerViewLegend: 'Manager view',
    clientOutputLegend: 'Client view',
    clientSectionLede:
      'Preview of what will be presented to the client',
    notesOpen: 'Click: open and edit the note',
    notesEmpty: 'Add a note…',
    activity: 'Activity',
    presented: 'Presented total',
    statPresentedTotal: 'Presented total',
    statDelta: 'Delta',
    timeColumn: 'Time',
    presentedHours: 'Hours (h)',
    presentedDays: 'Days (D)',
    macroPresentation: 'Client presentation',
    macroSubsCol: 'Subs',
    hideSubsCol: 'Hide sub-tasks column',
    macroRollup: 'Hide or show sub-tasks in export',
    macroDetail: 'Show sub-tasks in export',
    exported: 'Client view exported ({format}): {path}',
    editHint:'',
    reset: 'Reset',
    resetHint: 'Restore calculated values (including rounding)',
    resetOk: 'Client view values restored',
    resetConfirmTitle: 'Restore calculated values?',
    resetConfirmBody:
      'Manual edits to presented hours and redistributions will be lost. The original estimate is not modified.',
    editedMark: 'Edited value',
    showCol: 'Included',
    showHint: 'Remove this line from the client estimate (hours and subtasks included)',
    hiddenRow: 'Hidden',
    redistribute: 'Redistribute',
    redistributeHint:
      'Hide this line and spread its hours across the other active lines',
    redistributeOk: 'Hours redistributed to other lines',
    redistributeFail: 'No other line to redistribute onto',
    compare: 'Compare',
    compareHint: 'System (calculated) vs presentation (your edits)',
    compareTitle: 'Presentation compare',
    compareLede:
      'Before = calculated values with rounding. After = user edits and redistributions',
    compareBefore: 'Before',
    compareAfter: 'After',
    compareDelta: 'Δ',
  },
  formula: {
    title: 'Calculated item',
    lede: 'Hours = aggregation of selected lines × %',
    howToggle: 'How it works',
    howHint: 'e.g. (8+12)×30% = 6 h',
    howLead: 'This field is calculated from the lines you select below. For example:',
    howFormula_sum: 'hours = sum of checked lines × %',
    howFormula_avg: 'hours = average of checked lines × %',
    howFormula_min: 'hours = minimum of checked lines × %',
    howFormula_max: 'hours = maximum of checked lines × %',
    howExample: 'Analysis 8 h + Dev 12 h at 30% → 6 h (with sum).',
    howUse: '',
    howCtg: 'CTG is toggled from the CTG column in the table.',
    howDerived: '',
    name: 'Name',
    namePh: 'e.g. Overhead (15%)',
    aggregate: 'Aggregation',
    agg_sum: 'Sum',
    agg_avg: 'Average',
    agg_min: 'Minimum',
    agg_max: 'Maximum',
    pct: '%',
    optCtg: 'Also add the estimate CTG % on these hours',
    optCtgHelp:
      'Example: this line is 6 h and the estimate CTG is 20%. Off → stays 6 h. On → becomes 6 + 20% = 7.2 h. If you are creating Contingency itself, leave off.',
    optDerived: 'Allow including lines tagged “calculated”',
    optDerivedHelp:
      'By default the % uses only hand-entered activities (Dev, Analysis…). Turn this on to also check other calculated lines (e.g. Project Mgmt) and include them.',
    sources: 'Source lines',
    all: 'All',
    none: 'None',
    derivedTag: 'calculated',
    subTag: 'sub',
    derivedHint: '“Calculated” lines are disabled. Turn on the option above to use them.',
    emptySources: 'No lines available.',
    cancel: 'Cancel',
    apply: 'Apply',
  },
  tagPicker: {
    placeholder: 'Add labels…',
    filterPh: 'Search or create…',
    all: 'All labels',
    none: 'No labels',
    create: 'Create «{name}»',
    remove: 'Remove {name}',
  },
  ctg: {
    label: 'CTG',
    title: 'CTG = hours × (% ÷ 100). Total = hours + CTG.',
    compare: 'Compare CTG',
    compareTitle: 'Contingency comparison',
    compareLede:
      'Three global % scenarios (estimate mode and overrides stay the same). Session only — not saved.',
    scenario: 'Scenario {letter}',
    applyScenario: 'Use this % as the estimate contingency',
    use: 'Use',
  },
};

export const messages = { it, en } as const;

export function translate(locale: Locale, path: string, vars?: Record<string, string>): string {
  const parts = path.split('.');
  let cur: unknown = messages[locale] ?? messages.it;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  let out = typeof cur === 'string' ? cur : path;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.split(`{${k}}`).join(v);
    }
  }
  return out;
}

export function translateList(locale: Locale, path: string): string[] {
  const parts = path.split('.');
  let cur: unknown = messages[locale] ?? messages.it;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return [];
    cur = (cur as Record<string, unknown>)[p];
  }
  return Array.isArray(cur) && cur.every((item) => typeof item === 'string')
    ? cur
    : [];
}

export function translateQuotes(locale: Locale, path: string): Quote[] {
  const parts = path.split('.');
  let cur: unknown = messages[locale] ?? messages.it;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return [];
    cur = (cur as Record<string, unknown>)[p];
  }
  return Array.isArray(cur) ? cur as Quote[] : [];
}
