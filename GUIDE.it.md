# Guida utente di HowLong?

Questa guida descrive HowLong? `0.6.0` su Windows, macOS e Linux.

[README del progetto](README.md) · [English guide](GUIDE.en.md)

## Avvio rapido

1. Apri **Impostazioni**, scegli lingua e tema, quindi seleziona **Salva**.
2. Apri **Modelli** e crea un modello per il tipo di lavoro da stimare.
3. Torna in **Benvenuto** e crea una stima dal modello.
4. Inserisci titolo, cliente, attività ed effort.
5. Controlla contingency e visibilità cliente per ogni voce.
6. Salva la stima nella Libreria.
7. Apri **Vista cliente** prima di esportare materiale per il cliente.

## Come HowLong? organizza il lavoro

| Concetto | Scopo |
| --- | --- |
| Modello | Punto di partenza riusabile con attività, default, tag e regole di contingency |
| Stima | Documento specifico di progetto creato da un modello o da zero |
| Libreria | Cartella locale che contiene le stime `.howlong.json` salvate |
| Contingency (CTG) | Margine di rischio aggiunto alle attività selezionate |
| Formula | Voce derivata calcolata da altre voci della stima |
| Vista manager | Presentazione ed export interni con maggior dettaglio |
| Vista cliente | Presentazione semplificata e arrotondata per il cliente |

Le modifiche rimangono nella sessione attiva finché non salvi. Esportare non equivale a salvare.

## Navigazione

| Area | Usala per |
| --- | --- |
| Benvenuto | Creare o aprire stime e ritrovare i file aperti di recente |
| Stima | Modificare la stima attiva e i suoi calcoli |
| Libreria | Cercare, aprire, rinominare, confrontare, importare, esportare o eliminare stime |
| Modelli | Creare e mantenere template di stima riusabili |
| Confronta | Confrontare due o più stime salvate |
| Pianifica | Pianificare la stima aperta su una timeline Gantt |
| Analisi Dati | Esplorare effort e contingency della stima aperta |
| Impostazioni | Configurare lingua, tema, archiviazione, export e backup del workspace |

## Creare e gestire i modelli

HowLong? include modelli standard in italiano e inglese pronti per creare nuove stime.

1. Seleziona **Modelli** e crea un nuovo modello.
2. Assegna un nome riconoscibile e un'icona.
3. Aggiungi macro-attività ed eventuali sotto-task.
4. Imposta effort predefinito, categorie e tag.
5. Attiva **Applica CTG** solo sulle voci che devono ricevere contingency.
6. Aggiungi formule per effort derivato, come project management o overhead.
7. Imposta la contingency predefinita e salva il modello.

Le nuove stime ereditano struttura, icona, tag e default del modello. Le modifiche successive al modello non riscrivono automaticamente le stime esistenti.

## Costruire una stima

### Dati della stima

Imposta titolo, cliente, icona, unità di effort e ore per giorno. Le ore per giorno determinano la conversione tra ore e giorni-persona.

### Voci di lavoro

| Campo | Significato |
| --- | --- |
| Nome | Descrizione dell'attività o del task |
| Categoria | Gruppo organizzativo usato anche per la contingency per categoria |
| Ore / Giorni | Effort base prima della contingency |
| Applica CTG | Include la voce nel calcolo della contingency |
| CTG custom % | Sostituisce la percentuale predefinita per una singola voce |
| Note | Dettagli interni di supporto |
| Tag | Etichette utili per ricerca o presentazione |
| Cliente | Determina se la voce appare nella presentazione cliente |

Azioni utili:

- Aggiungi sotto-task sotto una macro; il totale della macro diventa la somma dei figli.
- Duplica una riga per conservarne la configurazione. Duplicando una macro duplichi anche i figli.
- Fai doppio clic su una nota per usare l'editor esteso; premi `Ctrl+Invio` per salvarla.
- Usa `Ctrl+←` / `Ctrl+→` su Windows e Linux, oppure `Cmd+←` / `Cmd+→` su macOS, per cambiare scheda senza salvare.
- Usa `Ctrl+Z` / `Ctrl+Y` per annullare o ripristinare le modifiche nella scheda corrente. macOS supporta anche `Cmd+Z` / `Cmd+Maiusc+Z`.
- Fai doppio clic sull'intestazione di una colonna per comprimerla o ripristinarla.
- Applicare la CTG a una macro propaga l'impostazione ai sotto-task.

### Formule

Una formula calcola:

```text
aggregazione(voci selezionate) × percentuale
```

Le aggregazioni disponibili sono somma, media, minimo e massimo. Le formule non ricevono la contingency globale finché non attivi **Applica CTG**.

### Contingency

Usa la contingency per rendere visibile il rischio senza modificare l'effort base. Scegli percentuale e modalità, quindi controlla i totali base, CTG e complessivo.

Seleziona **Confronta CTG** per provare tre percentuali affiancate. **Usa** applica quella scelta alla sessione corrente; salva la stima per conservarla.

## Pianificare con il Gantt

Apri una stima, quindi scegli **Pianifica** nella barra laterale.

1. Usa **Da pianificare** per assegnare le prime date a una macro o sotto-attività.
2. Modifica inizio e fine con i campi data oppure trascina e ridimensiona la barra.
3. Passa tra **Giorni** e **Mesi** e limita la vista con i selettori data Da/A. La timeline mensile si espande per usare lo spazio disponibile.
4. Disattiva **Mostra weekend** per nascondere i giorni configurati come weekend in **Impostazioni → Gantt**, senza cambiare le date salvate.
5. Comprimi una macro per nascondere temporaneamente le sue sotto-attività.
6. Trascina il divisore tra i dettagli delle attività e la timeline per ridimensionare la colonna informativa.
7. Usa **Esporta XLSX** per creare un foglio formattato e provvisto di griglia che rispetta scala, intervallo e visibilità dei weekend correnti. Intestazioni, macro e sotto-attività hanno stili distinti.

Quando una macro contiene sotto-attività, il suo intervallo va automaticamente dal primo inizio all'ultima fine pianificata. Il Gantt non modifica ore, contingency o totali.

Con il Gantt aperto, `Ctrl/Cmd+S` salva e `Ctrl/Cmd+T` crea una nuova scheda dal modello predefinito. Funzionano anche le scorciatoie per cambiare scheda e Annulla/Ripristina.

## Analizzare la stima aperta

Apri una stima, quindi scegli **Analisi Dati** sotto **Pianifica** nella barra laterale. La vista legge la stima attiva senza modificarla o salvarla.

- Usa il selettore globale **Ore / Giorni** per cambiare tutti i valori di effort mostrati. La conversione in giorni usa le ore per giorno della stima.
- Controlla le schede Base, Contingency, Base + contingency e Incidenza contingency.
- Usa il menu del grafico ad anello per mostrare Base, Contingency oppure Base + contingency. Il valore complessivo è selezionato per default.
- Passa il puntatore su un settore per visualizzarne la percentuale; la legenda mostra insieme valore e percentuale.
- Seleziona una macro espandibile nel grafico, nella legenda o nelle barre orizzontali per mostrare i suoi sotto-task in entrambi i grafici. Usa **Tutte le macro** per tornare indietro.
- Apri **Mostra task** per scegliere una o più macro da sostituire con i relativi sotto-task in entrambi i grafici panoramici. Il menu propone solo macro con sotto-task; **Cancella selezione** ripristina la vista per macro.
- Usa le barre orizzontali sovrapposte per confrontare effort base e relativa contingency. Gli indicatori distinguono le macro esplorabili dai sotto-task.

La selezione dei task è temporanea e isolata al documento aperto. Viene azzerata quando cambi documento. Layout ed etichette si adattano quando la barra laterale o la finestra riducono lo spazio disponibile.

## Salvare, aprire e ricaricare

- **Salva** scrive la stima corrente nella Libreria e registra una voce nella cronologia.
- **Apri** carica un file `.howlong.json` in una scheda documento.
- **Aggiorna** scarta la copia in memoria e ricarica l'ultimo file salvato, chiedendo conferma quando necessario.
- **Aperti di recente** mostra le stime della Libreria aperte oppure create e salvate, dalla più recente, fino a cinque.

Se un file è già aperto, una nuova apertura attiva la scheda esistente invece di crearne un duplicato.

## Usare la Libreria

Cerca per titolo o cliente. Puoi modificare nome e icona di una stima salvata direttamente dall'elenco.

Per confrontare le stime:

1. Seleziona almeno due stime.
2. Scegli **Confronta**.
3. Controlla attività e totali allineati nella vista di confronto.

Per esportare più stime, selezionale e scegli il formato. Una selezione genera un file; più selezioni generano un archivio ZIP con un file per stima.

**Elimina** rimuove il file della stima. Usalo solo quando il file non serve più.

## Preparare la presentazione cliente

Apri **Vista cliente** dalla stima attiva.

1. Controlla prima la sezione manager dettagliata.
2. Nascondi note o tag interni quando necessario.
3. Scegli ore o giorni e l'arrotondamento desiderato.
4. Controlla quali attività sono visibili al cliente.
5. Confronta valori calcolati e presentati se hai applicato override.
6. Esporta la versione manager o cliente necessaria.

Gli override di presentazione cambiano come vengono mostrati i valori; non sostituiscono il calcolo base della stima.

## Import, export e backup

| Formato | Uso consigliato |
| --- | --- |
| JSON HowLong | Backup portabile e reimportazione in HowLong? |
| YAML | Revisione leggibile da persone o AI; non è un formato nativo di reimportazione |
| XLSX | Condivisione con utenti di fogli di calcolo |
| CSV | Scambio tabellare semplice |
| ZIP | Export congiunto di più stime dalla Libreria |

Al termine di un export, usa **Apri** nel messaggio di conferma per aprire il file generato. Nella modalità browser viene aperta la copia scaricata; l'app desktop apre il percorso salvato sul filesystem.

Usa **Impostazioni → Esporta workspace** per salvare impostazioni e modelli. I file delle stime risiedono separatamente nella cartella Libreria e devono essere inclusi nel backup.

## Impostazioni

- **Lingua e aspetto:** scegli italiano o inglese e tema chiaro o scuro.
- **Username:** identifica i salvataggi nella cronologia.
- **Cartella stime:** cambia la cartella letta dalla Libreria.
- **Default manager:** determina se note e tag partono nascosti.
- **Weekend Gantt:** scegli se sabato, domenica o entrambi sono considerati weekend quando vengono nascosti dalla timeline.
- **Nomi file export:** può aggiungere data e ora al nome.
- **Import/export workspace:** trasferisce impostazioni e modelli.

Salva le impostazioni dopo averle modificate. L'anteprima di tema o lingua non garantisce che la scelta sia stata memorizzata.

## Risoluzione dei problemi

**Una stima salvata non appare in Libreria**

Controlla la cartella stime attiva nelle Impostazioni, quindi aggiorna la Libreria.

**La contingency di una voce è zero**

Controlla **Applica CTG**, la modalità selezionata, i filtri categoria e gli override della voce.

**Il cliente non vede una voce**

Attiva l'impostazione **Cliente** della voce e controlla i filtri della vista cliente.

**Note o tag non appaiono nell'export**

Controlla i toggle di visibilità manager/cliente prima di esportare.

**Le azioni native sui file non funzionano nel browser**

Avvia l'app desktop con `npm run tauri:dev`; la modalità browser non offre i dialog filesystem di Tauri.

**Un file JSON importato viene rifiutato**

Usa un export JSON HowLong. YAML, CSV e file JSON generici non sono equivalenti al formato nativo della stima.

## Sicurezza dei dati

- Salva prima di chiudere una scheda documento.
- Esporta JSON HowLong quando serve un backup portabile della stima.
- Esegui il backup sia del workspace sia della cartella Libreria configurata.
- Considera le conferme di eliminazione e ricaricamento come azioni distruttive.

Per installazione, sviluppo, build di release e versioning, consulta il [README](README.md).
