import type { Locale } from '../models/settings';

export type MessageTree = {
  nav: {
    working: string;
    library: string;
    models: string;
    settings: string;
    about: string;
    expandSidebar: string;
    collapseSidebar: string;
    resizeSidebar: string;
    navigation: string;
  };
  common: {
    save: string;
    open: string;
    export: string;
    import: string;
    delete: string;
    add: string;
    default: string;
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
    info: string;
    infoBody: string;
    dataFolder: string;
    estimatesFolder: string;
    estimatesFolderHelp: string;
    estimatesFolderActive: string;
    estimatesFolderCustom: string;
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
  };
  working: {
    titlePh: string;
    notesPh: string;
    notesExpand: string;
    notesModalTitle: string;
    notesModalHint: string;
    newFrom: string;
    pickModel: string;
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
    saved: string;
    exported: string;
    cycleError: string;
    oneDayEq: string;
    statFmt: string;
    ctgRow: string;
    ctgByCat: string;
    unsavedTitle: string;
    unsavedBody: string;
    unsavedDiscard: string;
  };
  models: {
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
    setDefault: string;
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
    managerViewLegend: string;
    clientOutputLegend: string;
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
    showChangeConfirmTitle: string;
    showChangeConfirmBody: string;
    showChangeConfirmAction: string;
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
    working: 'Stima',
    library: 'Libreria',
    models: 'Modelli',
    settings: 'Impostazioni',
    about: 'About',
    expandSidebar: 'Espandi sidebar',
    collapseSidebar: 'Comprimi sidebar',
    resizeSidebar: 'Ridimensiona navigazione',
    navigation: 'Navigazione',
  },
  common: {
    save: 'Salva',
    open: 'Apri',
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
    expandCol: 'Doppio click: collassa/espandi colonna',
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
    aiHint: 'File semplice per lettura. Non si re-importa in HowLong.',
    excel: 'Excel',
    excelHint: 'Foglio per condividere con altre persone.',
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
    usernameHelp: 'Etichetta per riconoscere queste impostazioni (es. dopo un import)',
    usernamePh: 'username',
    info: 'Informazioni',
    infoBody:
      'Dove HowLong? salva i suoi file sul PC',
    dataFolder: 'Cartella dati',
    estimatesFolder: 'Cartella stime',
    estimatesFolderHelp:
      'Scegliendo una cartella (o tornandoci al default) HowLong salva la preferenza e carica subito le stime `.howlong.json` presenti.',
    estimatesFolderActive: 'Cartella attiva',
    estimatesFolderCustom: 'Stai usando una cartella personalizzata.',
    pickFolder: 'Scegli cartella…',
    resetFolder: 'Usa default',
    folderLoaded: 'Caricate {n} stime dalla cartella',
    folderEmpty: 'Cartella pronta — nessuna stima HowLong trovata',
    importExport: 'Import / Export',
    tipImport:
      '**Import** — file `.json` con **impostazioni + modelli**. Poi **Salva**.',
    tipExport:
      '**Export** — copia `.json` di **impostazioni** e **tutti i modelli**.',
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
    sectionFolder: 'Cartella stime',
    sectionWorkspace: 'Import / export workspace',
    estimateColumnsIntro: 'Colonne visibili quando apri la Stima (dopo Salva). Il nome resta sempre visibile.',
    presentationIntro: 'Default per le nuove stime. Nella vista Presentazione puoi cambiarli per singola stima.',
    managerViewLegend: 'Vista manager (modifica)',
    clientOutputLegend: 'Output cliente (anteprima / export)',
    defaultManagerHideNotes: 'Nascondi note',
    defaultManagerHideTags: 'Nascondi etichette',
    defaultClientHideNotes: 'Nascondi note',
    defaultClientHideTags: 'Nascondi etichette',
    exportFilenameLegend: 'Segmenti aggiunti al nome file (dopo titolo e tipo).',
    exportIncludeDate: 'Data',
    exportIncludeDateHint: 'Formato yyyy-mm-dd',
    exportIncludeTime: 'Ora',
    exportIncludeTimeHint: 'Formato hh_mm_ss (solo se la data è attiva)',
  },
  about: {
    close: 'Chiudi',
    version: 'Versione',
    aim: 'Estimate project effort without wrestling Excel — totals with contingency, reusable templates, client view, export.',
  },
  library: {
    lede: 'Apri e cerca le stime salvate in formato HowLong',
    searchPh: 'Cerca per titolo o cliente…',
    searchAria: 'Cerca stime',
    refresh: 'Aggiorna',
    changeFolder: 'Cartella…',
    loading: 'Caricamento…',
    empty: 'Nessuna stima salvata. Usa Salva nella vista Stima.',
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
    exportHint: 'Esporta le stime selezionate (1 file, oppure ZIP se più di una)',
    exportOk: 'Esportate {n} stime: {path}',
    exportZipHint: 'Più stime → un archivio ZIP con file separati',
    noneSelected: 'Seleziona almeno una stima',
  },
  working: {
    titlePh: 'Titolo stima',
    notesPh: 'Aggiungi nota…',
    notesExpand: 'Doppio click: apri editor nota',
    notesModalTitle: 'Note',
    notesModalHint: 'Puoi andare a capo. Ctrl+Invio per salvare.',
    newFrom: 'Nuova stima da «{name}»',
    pickModel: 'Scegli modello',
    newFromModel: 'Nuova stima da modello',
    noModels: 'Nessun modello. Creane uno in Modelli.',
    clientPh: 'Cliente',
    clientView: 'Vista cliente',
    clientViewTitle: 'Anteprima presentabile della stima corrente',
    presentationView: 'Anteprima cliente',
    unit: 'Unità',
    hoursPerDayTitle: 'Ore in un giorno-uomo per questa stima',
    base: 'Base',
    ctgSumTitle: 'Somma di ore × % su ogni voce operativa',
    total: 'Totale',
    addMacro: 'Aggiungi Macro',
    addFormula: '+ Voce derivata',
    addFormulaTitle: 'Ore = aggregazione delle voci scelte × %. Dettagli nel dialog.',
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
    saved: 'Salvata: {path}',
    exported: 'Esportata ({format}): {path}',
    cycleError: 'Dipendenza circolare',
    oneDayEq: '1 gg =',
    statFmt: '{hours} h · {days} D',
    ctgRow: 'Contingency',
    ctgByCat: 'Contingency — {category}',
    unsavedTitle: 'Modifiche non salvate',
    unsavedBody:
      'La stima attuale ha modifiche non salvate. Se continui verranno perse.',
    unsavedDiscard: 'Scarta e continua',
  },
  models: {
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
    importHint: 'Importa uno o più modelli JSON (app desktop)',
    importOk: 'Importati {n} modelli',
    importPartial: 'Importati {ok} modelli; {fail} errori',
    importBad: 'Modello non valido',
    desktopOnly: 'L\'import modelli è disponibile solo nell\'app desktop (non nel browser).',
    expandList: 'Espandi elenco',
    collapseList: 'Comprimi elenco',
    searchPh: 'Cerca modello…',
    noResults: 'Nessun risultato',
    resizeList: 'Trascina per ridimensionare · doppio click per comprimere/espandere',
    namePh: 'Nome modello',
    deleteModel: 'Elimina questo modello',
    setDefault: 'Imposta default',
    iconLabel: 'Icona',
    icon_letter: 'Prima lettera del nome',
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
    hoursPerDayTitle: 'Ore in un giorno-uomo per le stime create da questo modello',
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
    howFormula: 'CTG = ore × (% ÷ 100)  ·  totale = ore + CTG',
    howP2: 'Esempio: 10 h al 20% → +2 h → totale 12 h. Se il flag CTG è spento, quella voce resta senza contingency.',
    hoursDefault: 'Ore default',
    ctgColTitle: 'Applica contingency a questa voce. Doppio click: collassa/espandi',
    addMacro: 'Aggiungi macro-attività',
    addFormula: '+ Voce derivata',
    addFormulaTitle: 'Ore = aggregazione delle voci scelte × %. Dettagli nel dialog.',
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
    titleLabel: 'Titolo presentabile',
    titlePh: 'Lascia vuoto per usare il titolo stima',
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
    managerViewLegend: 'Vista manager (modifica)',
    clientOutputLegend: 'Output cliente (anteprima / export)',
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
    macroRollup: 'Solo macro (somma)',
    macroDetail: 'Sotto-task',
    exported: 'Vista cliente esportata ({format}): {path}',
    editHint:
      'I valori modificati dall\'utente saranno visibili nell\'export Excel/YAML. La stima di lavoro originale non verrà modificata.',
    reset: 'Reset',
    resetHint: 'Ripristina i valori calcolati (arrotondamento incluso)',
    resetOk: 'Valori vista cliente ripristinati',
    resetConfirmTitle: 'Ripristinare i valori calcolati?',
    resetConfirmBody:
      'Le modifiche manuali alle ore presentate e alle ripartizioni andranno perse. La stima originale non viene modificata.',
    editedMark: 'Valore ritoccato',
    showCol: 'Mostra',
    showHint: 'Includi questa voce nella presentazione e nell\'export cliente',
    showChangeConfirmTitle: 'Aggiornare le righe mostrate?',
    showChangeConfirmBody:
      'L\'anteprima cliente torna ai valori calcolati dalla Stima (ore presentate e ripartizioni). Le modifiche manuali in questa vista andranno perse.',
    showChangeConfirmAction: 'Applica',
    hiddenRow: 'Nascosta',
    redistribute: 'Ripartiziona',
    redistributeHint:
      'Nasconde questa voce e spalmma le sue ore sulle altre voci ancora mostrate (in proporzione)',
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
    working: 'Estimate',
    library: 'Library',
    models: 'Models',
    settings: 'Settings',
    about: 'About',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    resizeSidebar: 'Resize navigation',
    navigation: 'Navigation',
  },
  common: {
    save: 'Save',
    open: 'Open',
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
    expandCol: 'Double-click: collapse/expand column',
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
    aiHint: 'Simple file for AI or reading. Not re-imported into HowLong.',
    excel: 'Excel',
    excelHint: 'Spreadsheet to share with other people.',
    backup: 'JSON (HowLong)',
    backupHint: 'Full copy to reopen in HowLong.',
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
    usernameHelp: 'Label to recognize these settings (e.g. after an import)',
    usernamePh: 'username',
    info: 'About',
    infoBody:
      'This shows where HowLong? stores its files on your PC. CTG and hours/day are set on the model or estimate. Settings export also includes your models.',
    dataFolder: 'Data folder',
    estimatesFolder: 'Estimates folder',
    estimatesFolderHelp:
      'When you pick a folder (or reset to default), HowLong saves the preference and immediately loads any `.howlong.json` estimates found there.',
    estimatesFolderActive: 'Active folder',
    estimatesFolderCustom: 'You are using a custom folder.',
    pickFolder: 'Choose folder…',
    resetFolder: 'Use default',
    folderLoaded: 'Loaded {n} estimates from the folder',
    folderEmpty: 'Folder ready — no HowLong estimates found',
    importExport: 'Import / Export',
    tipImport:
      '**Import** — `.json` file with **settings + models**. Then **Save**.',
    tipExport:
      '**Export** — `.json` copy of **settings** and **all models**.',
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
    sectionFolder: 'Estimates folder',
    sectionWorkspace: 'Workspace import / export',
    estimateColumnsIntro: 'Columns shown when you open Estimate (after Save). Name stays visible.',
    presentationIntro: 'Defaults for new estimates. You can override per estimate in Presentation view.',
    managerViewLegend: 'Manager view (edit)',
    clientOutputLegend: 'Client output (preview / export)',
    defaultManagerHideNotes: 'Hide notes',
    defaultManagerHideTags: 'Hide labels',
    defaultClientHideNotes: 'Hide notes',
    defaultClientHideTags: 'Hide labels',
    exportFilenameLegend: 'Extra segments in the export filename (after title and type).',
    exportIncludeDate: 'Date',
    exportIncludeDateHint: 'Format yyyy-mm-dd',
    exportIncludeTime: 'Time',
    exportIncludeTimeHint: 'Format hh_mm_ss (only when date is on)',
  },
  about: {
    close: 'Close',
    version: 'Version',
    aim: 'Estimate project effort without wrestling Excel — totals with contingency, reusable templates, client view, export.',
  },
  library: {
    lede: 'Open and search estimates saved in HowLong format',
    searchPh: 'Search by title or client…',
    searchAria: 'Search estimates',
    refresh: 'Refresh',
    changeFolder: 'Folder…',
    loading: 'Loading…',
    empty: 'No saved estimates yet. Use Save in the Estimate view',
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
    exportHint: 'Export selected estimates (one file, or a ZIP if more than one)',
    exportOk: 'Exported {n} estimates: {path}',
    exportZipHint: 'Multiple estimates → one ZIP with separate files',
    noneSelected: 'Select at least one estimate',
  },
  working: {
    titlePh: 'Estimate title',
    notesPh: 'Add a note…',
    notesExpand: 'Double-click: open note editor',
    notesModalTitle: 'Notes',
    notesModalHint: 'Line breaks are kept. Ctrl+Enter to save.',
    newFrom: 'New estimate from «{name}»',
    pickModel: 'Choose model',
    newFromModel: 'New estimate from model',
    noModels: 'No models. Create one in Models',
    clientPh: 'Client',
    clientView: 'Client view',
    clientViewTitle: 'Presentable preview of the current estimate',
    presentationView: 'Client preview',
    unit: 'Unit',
    hoursPerDayTitle: 'Hours in a person-day for this estimate',
    base: 'Base',
    ctgSumTitle: 'Sum of hours × % on each operational line',
    total: 'Total',
    addMacro: 'Add Macro',
    addFormula: '+ Calculated item',
    addFormulaTitle: 'Hours = aggregation of selected lines × %. Details in the dialog.',
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
    saved: 'Saved: {path}',
    exported: 'Exported ({format}): {path}',
    cycleError: 'Circular dependency',
    oneDayEq: '1 day =',
    statFmt: '{hours} h · {days} D',
    ctgRow: 'Contingency',
    ctgByCat: 'Contingency — {category}',
    unsavedTitle: 'Unsaved changes',
    unsavedBody:
      'The current estimate has unsaved changes. If you continue they will be lost.',
    unsavedDiscard: 'Discard and continue',
  },
  models: {
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
    importHint: 'Import one or more model JSON files (desktop app)',
    importOk: 'Imported {n} models',
    importPartial: 'Imported {ok} models; {fail} failed',
    importBad: 'Invalid model',
    desktopOnly: 'Model import is available only in the desktop app (not in the browser).',
    expandList: 'Expand list',
    collapseList: 'Collapse list',
    searchPh: 'Search model…',
    noResults: 'No results',
    resizeList: 'Drag to resize · double-click to collapse/expand',
    namePh: 'Model name',
    deleteModel: 'Delete this model',
    setDefault: 'Set as default',
    iconLabel: 'Icon',
    icon_letter: 'First letter of the name',
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
    hoursPerDayTitle: 'Hours in a person-day for estimates from this model',
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
    howFormula: 'CTG = hours × (% ÷ 100)  ·  total = hours + CTG',
    howP2: 'Example: 10 h at 20% → +2 h → total 12 h. If CTG is off, that line has no contingency.',
    hoursDefault: 'Default hours',
    ctgColTitle: 'Apply contingency to this line. Double-click: collapse/expand',
    addMacro: 'Add macro activity',
    addFormula: '+ Calculated item',
    addFormulaTitle: 'Hours = aggregation of selected lines × %. Details in the dialog.',
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
    titleLabel: 'Presentation title',
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
    managerViewLegend: 'Manager view (edit)',
    clientOutputLegend: 'Client output (preview / export)',
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
    macroRollup: 'Macro only (sum)',
    macroDetail: 'Sub-tasks',
    exported: 'Client view exported ({format}): {path}',
    editHint:
      'User edits will be visible in the Excel/YAML export. The working estimate stays unchanged.',
    reset: 'Reset',
    resetHint: 'Restore calculated values (including rounding)',
    resetOk: 'Client view values restored',
    resetConfirmTitle: 'Restore calculated values?',
    resetConfirmBody:
      'Manual edits to presented hours and redistributions will be lost. The original estimate is not modified.',
    editedMark: 'Edited value',
    showCol: 'Show',
    showHint: 'Include this line in the client presentation and export',
    showChangeConfirmTitle: 'Update shown lines?',
    showChangeConfirmBody:
      'The client preview goes back to values calculated from the Estimate (presented hours and redistributions). Manual edits in this view will be lost.',
    showChangeConfirmAction: 'Apply',
    hiddenRow: 'Hidden',
    redistribute: 'Redistribute',
    redistributeHint:
      'Hide this line and spread its hours across the other still-shown lines (proportionally)',
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
