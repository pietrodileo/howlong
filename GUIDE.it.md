# Guida all’uso — HowLong?

**Effort, made obvious.**

Guida pratica per stimare progetti con HowLong? (versione 0.1).  
Autore: **Pietro Di Leo**.

---

## 1. Cos’è HowLong?

HowLong? è un’app **desktop** (Windows) per costruire **stime di progetto** in forma tabellare:

- voci con ore (o giorni),
- **contingency** (CTG, margine di rischio) visibile subito,
- **modelli** riusabili,
- **libreria** di stime sul PC,
- **vista cliente** e **export** in più formati.

Non è Excel: è pensata per vedere in un colpo solo *base*, *CTG* e *totale con CTG*.

---

## 2. Primi passi

1. Avvia HowLong? (installer Windows o `npm run tauri:dev` in sviluppo).
2. Apri **Impostazioni** e scegli **lingua** (IT/EN) e **tema** (chiaro/scuro). Premi **Salva**.
3. (Opzionale) Imposta una **cartella stime** personalizzata; altrimenti HowLong usa la cartella dati dell’app.
4. Vai in **Modelli** e crea (o modifica) un modello di macro-attività.
5. Torna in **Stima** e crea una nuova stima dal modello.

---

## 3. Navigazione

Barra laterale:

| Voce | A cosa serve |
|------|----------------|
| **Stima** | Editor della stima corrente |
| **Libreria** | Stime salvate sul PC |
| **Modelli** | Template riusabili |
| **Impostazioni** | Lingua, tema, cartella, import/export workspace |
| **About** | Versione, aim, credit |

---

## 4. Modelli

Un **modello** è lo scheletro di una stima: macro-attività, categorie, default di contingency, icona.

### Cosa fare

1. **Nuovo modello** → dai un nome e scegli un’**icona**.
2. Aggiungi **macro-attività** (nome, categoria, ore default).
3. Per ogni voce: spunta **Applica CTG** se deve ricevere la contingency globale.
4. Aggiungi eventuali **voci derivate** (formule, es. Project Management = % su altre voci).
5. Imposta % CTG di default e modalità (progetto / categorie / custom).
6. **Salva** il modello.
7. Usa **“usa per nuova stima”** (o il bottone Nuova in Stima) per generare una stima.

Le nuove stime **ereditano l’icona** del modello.

---

## 5. Stima (Working)

È la vista di lavoro quotidiana.

### Intestazione

- **Icona** + **titolo** della stima (editabili).
- Azioni: **Nuova** (da modello), **Apri**, **Salva** (in libreria), **Esporta**, **Vista cliente**.

### Contingency al volo

In alto puoi cambiare:

- **% CTG** della sessione,
- **modalità** (intero progetto, solo categorie, custom),
- **placement** (colonne in linea, riga separata, entrambi).

I totali e le colonne si aggiornano subito.

### Tabella voci

Colonne tipiche:

| Colonna | Significato |
|---------|-------------|
| Nome | Macro o sotto-task |
| Categoria | Raggruppamento |
| Ore / Giorni | Effort base |
| **Applica CTG** | Se la voce entra nel calcolo CTG |
| CTG | Ore di contingency |
| Con CTG | Base + CTG |
| CTG custom % | Override % sulla singola voce |
| Note | Testo libero |
| Cliente | Visibile in vista cliente |
| Azioni | Aggiungi task, duplica, elimina, modifica formula |

Suggerimenti:

- **Aggiungi sotto-task** da una macro: le ore della macro diventano somma dei figli.
- **Duplica**: clona la riga (e i figli se è macro). Nome tipo `(copia)`, `(copia 2)`, …
- **Note**: modifica in cella; **doppio click** apre un editor ampio (Ctrl+Invio per salvare).
- **Colonne**: ridimensiona; doppio click sull’header per collassare.
- **Applica CTG** su una macro: lo stato si propaga ai sotto-task.

### Voci derivate (formule)

Una voce **formula** calcola:

`aggregazione(voci scelte) × percentuale`

Aggregazioni: somma, media, minimo, massimo.

Di default le formule **non** ricevono la CTG globale; spunta **Applica CTG** se serve.

Usi tipici: Contingency separata, Project Management, overhead.

### Confronta CTG

Dal summary, **Confronta CTG** apre tre scenari A/B/C (di default in ordine crescente, es. 10 / 20 / 30).  
Puoi modificarli e premere **Usa** per applicare una % alla stima (solo sessione, finché non salvi).

### Unità

Ore o giorni-uomo. Puoi impostare quante **ore = 1 giorno** per questa stima. I totali mostrano spesso sia **h** sia **D**.

---

## 6. Vista cliente

Dalla Stima, apri **Vista cliente**.

Serve a presentare la stima in modo più “pulito”:

- solo voci marcate come visibili al cliente,
- **arrotondamento** selezionabile,
- unità ore/giorni,
- totali presentati (h e D).

### Note in vista cliente

- Di default le note sono **nascoste** (`Nascondi note` attivo).
- Se togli lo spunta: vedi un’anteprima; **click** apre l’editor e puoi modificare le note (utile in sessione con il cliente).
- Lo stesso flag influenza anche l’export della vista cliente.

Export dedicato: **YAML** e **Excel**.

---

## 7. Libreria

Contiene i file `.howlong.json` salvati sul PC.

### Gestione elenco

- **Cerca** per titolo o cliente.
- **Rinomina** direttamente nel campo nome (Invio / esci dal campo → salva).
- Cambia **icona** con il picker.
- **Apri** per caricare la stima in Working.
- **Elimina** rimuove il file dalla cartella.

### Selezione, export, import

1. Seleziona una o più stime (checkbox; oppure Seleziona tutte).
2. **Esporta** → JSON (HowLong), YAML o Excel:
   - **1 stima** → un file,
   - **2+ stime** → un **ZIP** con un file per stima.
3. **Importa JSON** → scegli uno o più file HowLong; vengono copiati in libreria. Se l’id esiste già, ne viene creato uno nuovo.

---

## 8. Impostazioni

| Impostazione | Effetto |
|--------------|---------|
| Lingua | Interfaccia IT o EN |
| Aspetto | Tema chiaro / scuro |
| Username | Etichetta del profilo settings |
| Cartella stime | Dove vive la Libreria |
| Import / Export | Workspace: settings + tutti i modelli |

Ricorda di **Salvare** dopo le modifiche che vuoi rendere permanenti (lingua e tema hanno anteprima immediata).

---

## 9. Formati file (quando usarli)

| Formato | Quando |
|--------|--------|
| **JSON HowLong** | Backup / ripristino nell’app; import in Libreria |
| **YAML** | Lettura umana o AI — **non** si re-importa come stima HowLong |
| **Excel (XLSX)** | Condivisione con chi usa fogli di calcolo |
| **CSV** | Scambio tabellare dove serve |
| **ZIP** | Solo da Libreria, export di più stime insieme |

---

## 10. Flusso consigliato (checklist)

1. Prepara un **modello** con le macro tipiche del tuo lavoro.
2. Crea una **stima** dal modello; metti titolo e icona.
3. Compila ore / sotto-task / note.
4. Regola la **CTG** e, se serve, **Confronta CTG**.
5. Controlla flag **Applica CTG** e **Cliente** sulle voci.
6. Apri la **vista cliente**, arrotonda, nascondi o mostra le note.
7. **Salva** in Libreria.
8. **Esporta** JSON (backup), YAML/Excel (condivisione), o da Libreria in ZIP se sono tante.

---

## 11. Domande frequenti

**Dov’è salvata la stima?**  
In Libreria (cartella configurata o cartella dati app), file `{id}.howlong.json`.

**Perché non vedo le note in vista cliente?**  
Sono nascoste di default: togli **Nascondi note**.

**La CTG non si applica a una voce?**  
Controlla **Applica CTG** e la modalità (progetto / categorie / override).

**Posso tornare indietro dopo Confronta CTG → Usa?**  
“Usa” cambia la % di sessione; se non hai salvato, puoi ripristinare la % a mano o riaprire l’ultima versione salvata.

**L’app funziona senza installazione desktop?**  
Il frontend può aprirsi in browser in sviluppo, ma Salva / dialog / Libreria richiedono l’app Tauri.

---

## 12. Aiuto e riferimenti

- **README.md** — installazione, build, decisioni tecniche  
- **SPEC.md** — requisiti e comportamento dettagliato  
- **About** in app — versione e credit  

---

*HowLong? — Pietro Di Leo*
