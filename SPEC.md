# Specifica — HowLong? (Tauri)

Documento di requisiti e piano di implementazione per un agente AI (es. Cursor) che deve realizzare l’applicazione desktop **HowLong?**.

| Campo | Valore |
|-------|--------|
| **Nome prodotto** | **HowLong?** |
| **Tagline** | **Effort, made obvious.** |
| **Autore / credit** | **Pietro Di Leo** |
| **Identifier Tauri** | `com.pietrodileo.howlong` |
| **Cartella repo** | `HowLong` |

---

## 1. Contesto e obiettivo

L'utente (sviluppatore backend / integration / AI, non frontend specialist) vuole abbandonare Excel come strumento principale per le **stime di progetto** e usare un’app desktop leggera, semplice da usare e da distribuire.

**Aim del prodotto (da riportare in About):** stimare in modo semplice e personalizzabile, confrontare subito totali con/senza contingency, riusare modelli JSON di macro-attività, preparare una vista “cliente”, esportare in JSON (backup), YAML o XLSX (condivisione). Slogan: **Effort, made obvious.**

L’app deve:

1. Creare e modificare stime tabulari in modo guidato e personalizzabile.
2. Aprire stime dalla **Libreria** o da file JSON HowLong esterni.
3. Salvare stime nella cartella libreria (configurabile in Impostazioni).
4. **Esportare** stime in **JSON** (backup), **YAML** (AI), **XLSX** (persone); modelli e settings solo JSON.
5. Gestire **contingency** a livello progetto, per categoria, o **custom per voce**, con confronto fianco a fianco e cambio % **al volo**.
6. Usare **modelli JSON** riusabili (macro-attività) per nuove stime.
7. Avere una **vista cliente** separata (arrotondamenti / presentazione).
8. Girare su **Windows 10/11** (priorità) e essere multi-OS (Linux; macOS opzionale).

Stack: **Tauri** (non Electron).

---

## 2. Stack tecnico obbligatorio

| Layer | Tecnologia | Note |
|-------|------------|------|
| Shell desktop | **Tauri 2** (ultima stabile) | Backend nativo in **Rust** |
| Frontend | **Vue 3 + TypeScript + Vite** | UI semplice, non over-engineered |
| Package manager | npm o pnpm | Dipendenze **poche e leggere** |
| Persistenza | File JSON locale (settings, models, estimates) | Nessun DB obbligatorio in MVP |
| Validazione | **Zod** | Settings, Model, Estimate |
| Excel | **`exceljs` o `xlsx`** | Preferenza `exceljs` |
| CSV / YAML | es. `papaparse` + `yaml` | — |
| Distribuzione | `.exe` / installer Windows | Release su **GitHub** o **GitLab** |

### 2.1 Divisione responsabilità Tauri

- **Frontend (Vue/TS):** UI, stato, calcoli contingency, validazione, serializzazione JSON/CSV/YAML/XLSX, API remote (fase 2).
- **Backend Rust:** open/save dialogs, read/write file, app data path.
- OS via `invoke` Tauri — niente server HTTP locale obbligatorio.

### 2.2 Vincoli

- WebView di sistema (non Chromium embedded).
- Command Rust minimali.
- Updater = fase 2.

---

## 3. Persona e UX

- Utenti: chi oggi stime in Excel (anche non sviluppatori).
- UI semplice: poche viste, zero clutter.
- Flusso: modello → stima → contingency live → confronto con/senza → vista cliente → export.
- Errori **espliciti** (config/modello/stima non validi).
- Lingua UI: **italiano**.

---

## 4. Dominio funzionale

### 4.1 Concetti

| Concetto | Descrizione |
|----------|-------------|
| **Estimate** | Stima di lavoro: metadati (titolo, `icon`, …) + voci + regole contingency della sessione |
| **LineItem** | Voce: id, nome, ore/giorni, categoria/macro, kind, note, `applyContingency`, override contingency opzionale |
| **Model** | Template JSON riusabile: macro-attività + icona (+ regole contingency di default) per creare stime uguali |
| **Settings** | Preferenze globali utente (categorie default, contingency default, path modelli, opzioni vista cliente) |
| **Contingency** | % applicabile a **intero progetto**, a **categorie scelte**, o **custom per voce** |
| **Library** | Elenco stime salvate; rinomina/icona; selezione multipla; export JSON/YAML/XLSX (ZIP se >1); import JSON HowLong |
| **Working view** | Vista interna: ore base **e** ore con contingency **fianco a fianco** |
| **Client view** | Vista separata “da mostrare al cliente”: arrotondamenti, eventuali nascoste note interne |

### 4.2 Contingency — regole obbligatorie

1. **Progetto intero:** una % globale (`projectContingencyPercent`) applicabile a tutte le voci eleggibili.
2. **Scope di applicazione** (`contingencyMode`):
   - `project` — % unica su tutte le voci operative
   - `categories` — % (o % di default) solo su `contingencyTargetCategories`
   - `custom` — per voce: usa override locale se presente, altrimenti fallback a % progetto/categoria
3. **Custom per voce:** campo opzionale `contingencyPercentOverride` (number | null). Se valorizzato, quella voce usa quel valore indipendentemente dalla % globale (utile per “su questa cosa mettila custom”).
4. **Applica CTG per voce:** `applyContingency` (default `true` su operative; `false` su formule / `applyGlobalContingency`). Se `false`, la voce non riceve la % globale/categorie. Stesso principio in Modelli e Stima (checkbox in tabella; su macro in Stima propaga ai sotto-task).
5. **Dove metterla (placement):**
   - `inline` — contingency “assorbita” / mostrata per riga (colonna ore+CTG)
   - `separate_line` — riga sintetica “Contingency” in coda (o per categoria)
   - `both` — colonne inline + riga totale CTG
6. **Al volo:** slider/input % in header stima; al cambio, ricalcolo immediato di colonne e totali **senza** dover salvare settings. La % di sessione può differire dal default del modello finché non si “applica come default”.
7. **Fianco a fianco (obbligatorio in working view):** per ogni voce (e nei totali) mostrare almeno:
   - ore **senza** contingency (`hoursBase`)
   - ore **con** contingency (`hoursWithContingency`)
   - delta CTG (`hoursContingency`)
8. Voci `kind: summary` non entrano nei totali operativi (solo riepilogo UI se presenti).
9. **Voci derivate (`kind: formula`):** ore = `aggregate(sourceIds) × percent / 100`.
   - Campo `formula: { percent, sourceIds, aggregate, includeFormulaSources, applyGlobalContingency }`.
   - `aggregate`: `sum` (default) | `avg` | `min` | `max` — come si combinano le ore delle sorgenti prima del × %.
   - Di default **non** ricevono la % CTG globale; con `applyContingency` / `applyGlobalContingency: true` sì (checkbox in tabella).
   - Contribuiscono ai totali come le voci operative.
   - `includeFormulaSources: false` (default): altre voci formula nelle sorgenti sono escluse (es. Contingency non include Project Mgmt).
   - Dipendenze tra formule risolte in ordine topologico; cicli → ore 0 + avviso.
   - Usate per Contingency separata, Project Mgmt, o qualsiasi overhead a percentuale su sottoinsieme di voci.
   - Coesistono con la contingency globale: se usi una riga Contingency formula, tipicamente lascia CTG % globale a 0 oppure non spuntare `applyContingency`.

### 4.3 Modello JSON riusabile (`Model`)

File es. `models/default.howlong.json` (o `.json` validato):

```json
{
  "schemaVersion": 1,
  "id": "modello-standard",
  "name": "Modello standard",
  "macroActivities": [
    { "id": "1", "name": "Analisi e documentazione", "category": "Analisi", "defaultHours": 0, "kind": "operational" },
    { "id": "2", "name": "Sviluppo", "category": "Sviluppo", "defaultHours": 0, "kind": "operational" },
    { "id": "3", "name": "Test", "category": "Test", "defaultHours": 0, "kind": "operational" },
    { "id": "4", "name": "Collaudo", "category": "Collaudo", "defaultHours": 0, "kind": "operational" },
    { "id": "5", "name": "Rilascio e monitoraggio", "category": "Rilascio", "defaultHours": 0, "kind": "operational" }
  ],
  "categories": ["Analisi", "Sviluppo", "Test", "Collaudo", "Rilascio"],
  "contingency": {
    "defaultPercent": 20,
    "mode": "project",
    "targetCategories": [],
    "placement": "both"
  }
}
```

- **Nuova stima da modello:** clona macro-attività → items editabili.
- CRUD modelli in app: crea / salva / apri / esporta / importa JSON.
- Validazione Zod; JSON malformato → avviso, non crash.

### 4.4 Estimate (dati)

```yaml
schemaVersion: 1
meta:
  id: "..."
  title: "Titolo stima"
  clientLabel: ""          # etichetta libera (niente brand hardcoded)
  createdAt: "..."
  updatedAt: "..."
  unit: "hours"            # hours | days
  hoursPerDay: 8
  icon: "letter"           # stesso set icone dei modelli
modelId: "modello-standard" # opzionale
contingency:
  percent: 20              # % di sessione (modificabile al volo)
  mode: "project"          # project | categories | custom
  targetCategories: []
  placement: "both"        # inline | separate_line | both
items:
  - id: "1"
    name: "Analisi e documentazione"
    hours: 20
    category: "Analisi"
    kind: "operational"    # operational | summary | overhead | formula
    contingencyPercentOverride: null
    notes: ""
    clientVisible: true
    applyContingency: true   # false = esclude dalla CTG globale/categorie
    # formula: { percent: 30, sourceIds: ["1","2"], aggregate: "sum", includeFormulaSources: false, applyGlobalContingency: false }  # se kind=formula
clientView:
  roundingMode: "none"     # none | ceil_0_5 | ceil_1 | round_1
  hideInternalNotes: true
  titleOverride: ""
```

Totali **calcolati** (non necessariamente persistiti, ma sì in export):

- `totalBase`, `totalContingency`, `totalWithContingency`
- breakdown per categoria (base / +CTG)

### 4.5 Vista cliente

Vista presentabile della **stima corrente**, aperta dal bottone in Stima (non una voce di navigazione globale):

- Mostra solo voci `clientVisible: true`.
- Applica `roundingMode` alle ore.
- Nasconde note interne se `hideInternalNotes` (default `true`).
- Se le note sono visibili: anteprima tronca in tabella; **click** apre `NotesEditor` (modifica consentita).
- Titolo presentabile (`titleOverride` o meta.title).
- Export dedicato YAML / XLSX.

### 4.6 Formati file

| Uso | Formato | Artefatti | Note |
|-----|--------|-----------|------|
| Backup / ripristino app | **JSON** | Stima, modello, settings | Unico formato di **Apri / Importa** |
| AI / lettura | **YAML** semplice | Stima, vista cliente | Non ri-importabile in HowLong |
| Condivisione persone | **XLSX** | Stima, vista cliente | Foglio leggibile |

Modelli e settings: solo JSON (formato interno).

---

## 5. Settings utente (JSON)

### 5.1 Percorso

- `%APPDATA%/com.pietrodileo.howlong/settings.json` (Windows).
- Modelli in `%APPDATA%/.../models/*.howlong.json`.
- **Import/Export Impostazioni** = workspace JSON (`kind: howlong-workspace`): settings + **tutti i modelli**. File legacy solo-settings ancora accettati in import.

### 5.2 Schema — `src/models/settings.ts`

Estensione rispetto allo schema minimo originale:

```ts
import { z } from 'zod';

export const SettingsSchema = z.object({
  defaultCategories: z.array(z.string()).min(1),
  defaultContingencyPercentage: z.number().min(0).max(100),
  contingencyTargetCategories: z.array(z.string()),
  defaultContingencyMode: z.enum(['project', 'categories', 'custom']).default('project'),
  defaultContingencyPlacement: z.enum(['inline', 'separate_line', 'both']).default('both'),
  defaultClientRoundingMode: z.enum(['none', 'ceil_0_5', 'ceil_1', 'round_1']).default('ceil_1'),
  hoursPerDay: z.number().min(1).max(24).default(8),
  locale: z.enum(['it', 'en']).default('it'),
  username: z.string().default(''),
  estimatesDir: z.string().default(''),
  theme: z.enum(['light', 'dark']).default('light'),
  lastModelId: z.string().optional()
});

export type Settings = z.infer<typeof SettingsSchema>;
```

Defaults se file assente:

```json
{
  "defaultCategories": ["Analisi", "Sviluppo", "Test", "Collaudo", "Rilascio"],
  "defaultContingencyPercentage": 20,
  "contingencyTargetCategories": ["Sviluppo", "Test"],
  "defaultContingencyMode": "project",
  "defaultContingencyPlacement": "both",
  "defaultClientRoundingMode": "ceil_1"
}
```

### 5.3 Validazione

- `safeParse` prima di applicare.
- JSON malformato / Zod fail → **avviso Vue**; non sovrascrivere settings validi in memoria; reset defaults solo su conferma.

### 5.4 Condivisione

- Esporta / Importa settings (JSON o YAML).

---

## 6. Schermate MVP

### 6.1 Working view (stima interna)

- Header brand: **HowLong?**
- Titolo stima + **icona** (`meta.icon`, stesso set dei modelli) editabili; metadati minimi.
- Controllo **contingency al volo** (%, mode, placement) sempre visibile.
- Tabella voci con colonne **fianco a fianco**: base | CTG | con CTG.
- Override % per riga (mode `custom` o sempre editabile come override).
- **Applica CTG** per voce (`applyContingency`), come in Modelli: checkbox su macro, sotto-task e formule; su macro propaga ai figli.
- **Note** multilinea in cella; doppio click apre editor modal per testi lunghi.
- **Duplica** riga (task / macro+figli / formula) dalle azioni.
- Totali live: base / contingency / con contingency.
- Azioni file: Nuova (da modello), Apri (file esterno), **Salva in libreria** (`{appData}/estimates` o cartella configurata in Settings), Esporta (YAML AI / Excel / JSON HowLong).
- Toast avvisi/errori dismissibili (X) oltre al timeout automatico.
- Nav: Impostazioni | Modelli | Libreria | About. Vista cliente accessibile da Stima.

### 6.1b Libreria

- Elenco / cerca / apri / elimina stime `{id}.howlong.json`.
- Rinomina e **icona** (`meta.icon`) in elenco.
- **Selezione multipla** (checkbox): export JSON / YAML / XLSX — un file se una sola stima; **ZIP** con file separati se più di una (`fflate`).
- **Import** di uno o più JSON HowLong nella cartella libreria (nuovo id se già presente).

### 6.2 Modelli

- Lista modelli JSON locali.
- Crea / modifica macro-attività (icone modello); checkbox **Applica CTG** per voce (`applyContingency`).
- “Usa per nuova stima”.
- Import / export modello (JSON obbligatorio; anche YAML/CSV/XLSX come da §4.6).

### 6.3 Impostazioni

- Lingua UI (`it` / `en`).
- Tema **chiaro / scuro** (`theme`).
- Username etichetta, cartella libreria stime (`estimatesDir`).
- Import/export workspace (settings + modelli).
- (Defaults dominio: categorie, contingency, rounding — anche su modello/stima.)

### 6.4 Vista cliente

- Tabella presentabile (solo `clientVisible`).
- Toggle/select arrotondamento; selettore unità ore/giorni; summary con h e D.
- Anteprima totali “da cliente”.
- Note (se non nascoste): anteprima tronca in cella; click → modal editor editabile (`NotesEditor`). Nascoste di default.
- Export vista cliente: YAML e XLSX.

### 6.5 About (obbligatorio)

1. Titolo: **HowLong?**
2. Tagline: **Effort, made obvious.**
3. Aim (tono leggero, IT/EN via i18n).
4. Stack: Tauri · Vue · leggero, non Electron.
5. Versione app.
6. Autore: **Pietro Di Leo**.

### 6.6 Dialoghi nativi

Plugin Tauri dialog + fs.

### 6.7 Fuori scope MVP (fase 2+)

- Integrazione Jira / API ticketing.
- Sync cloud multi-utente.
- Auto-update.
- Auth.

---

## 7. Struttura repository

```text
Stime_TrakCare_Maker/
  SPEC.md
  README.md                 # HowLong? — autore Pietro Di Leo
  package.json              # name: howlong
  src/
    models/
      settings.ts
      estimate.ts
      model.ts              # schema Model (macro-attività)
    components/
      AboutModal.vue
      NotesEditor.vue
      FormulaEditor.vue
      MetaIconPicker.vue
      ContingencyControls.vue
    views/
      WorkingView.vue
      ClientView.vue
      LibraryView.vue
      ModelsView.vue
      SettingsView.vue
    stores/
    lib/                    # calc contingency, rounding, import/export, libraryIo (ZIP)
    App.vue
    main.ts
  src-tauri/
    tauri.conf.json         # productName HowLong?, identifier com.pietrodileo.howlong
```

---

## 8. Comandi Tauri minimi

1. `get_app_data_dir() -> string`
2. `read_text_file(path) -> string`
3. `write_text_file(path, contents) -> void`
4. Opzionale: ensure defaults (`settings.json`, cartella `models/`)

Permessi fs minimi + dialog.

---

## 9. Piano di implementazione

### Step 0 — Prerequisiti

Node.js LTS, Rust + MSVC, WebView2. Link ufficiali Tauri nel README.

### Step 1 — Scaffold + dipendenze

Tauri 2 + Vue 3 + TS + Vite; `zod`, `exceljs`|`xlsx`, CSV/YAML parsers, plugin fs/dialog. `npm run tauri dev`.

### Step 2 — Schema Zod (settings, model, estimate)

Implementare schemas + `computeLineHours` / `computeTotals` (base, CTG, with CTG) + rounding cliente. Persistenza settings.

### Step 3 — UI settings + modelli JSON

Impostazioni; CRUD modelli macro-attività; import/export; avvisi validazione.

### Step 4 — Working view + contingency al volo

Editor voci; colonne fianco a fianco; % al volo; mode/placement/override; import/export stima **JSON, CSV, YAML, XLSX**.

### Step 5 — Vista cliente + About + test

Vista cliente con arrotondamenti; export dedicato; About con **Effort, made obvious.** e credit **Pietro Di Leo**; test JSON malformato; smoke export; build Windows.

---

## 10. Criteri di accettazione MVP

Su Windows 10/11 l’utente può:

1. Avviare l’app.
2. Creare un **modello JSON** di macro-attività e generare una nuova stima da quel modello.
3. Impostare contingency di **progetto**, cambiarla **al volo**, e vedere colonne **con / senza** contingency fianco a fianco.
4. Mettere contingency **custom** su una o più voci e/o limitarla a categorie; scegliere placement; usare **Applica CTG** per includere/escludere voci (anche derivate).
5. Aprire la **vista cliente** con arrotondamento e totali diversi dalla vista interna.
6. Esportare stima (e vista cliente) in **JSON, CSV, YAML, XLSX**; riesportare/importare modello e settings in JSON.
7. Vedere avviso chiaro su JSON invalido.
8. In About: aim, **Effort, made obvious.**, autore **Pietro Di Leo**.
9. Tema chiaro/scuro e lingua IT/EN dalle Impostazioni.
10. Note lunghe modificabili (modal) in Working (doppio click) e in Client (visibili solo se non nascoste; click → editor); duplicazione voci in Working.
11. Impostare **icona** e **titolo** della stima in Working e in Libreria (stesso set icone dei modelli; nuova stima da modello eredita l’icona).
12. Da Libreria: selezionare una o più stime ed **esportarle** (file singolo o ZIP); **importare** JSON HowLong nella cartella libreria.

---

## 11. Anti-pattern

- Non usare Electron.
- Non business logic senza schema Zod.
- Non fallire in silenzio su file corrotti.
- Non aggiungere dipendenze inutili.

---

## 12. Backlog fase 2

1. Mapping export → creazione ticket (Jira o altro) da YAML/JSON.
2. Template XLSX “presentazione cliente” più ricco.
3. Multi-modello con libreria condivisa via file sync.
4. Auto-updater Tauri.
5. CI build multi-OS.

---

## 13. Istruzioni per l’agente

1. Leggi tutto questo SPEC prima di codificare.
2. Stack fisso: Tauri 2 + Vue 3 + TS.
3. Brand: **HowLong?** / tagline **Effort, made obvious.** / autore **Pietro Di Leo** ovunque serva un credit.
4. **Mai** riferimenti a aziende o brand terzi.
5. UI bilingue IT/EN (settings `locale`).
6. Ambiguo → soluzione più semplice + nota in README “Decisioni”.
7. Jira non in MVP.

---

## 14. Decisioni prodotto

| Domanda | Decisione |
|---------|----------|
| Nome | **HowLong?** |
| Tagline | **Effort, made obvious.** |
| Autore | **Pietro Di Leo** |
| Contingency | Progetto + categorie + custom % + flag Applica CTG per voce; al volo; fianco a fianco |
| Placement CTG | inline / separate_line / both |
| Modelli | JSON riusabile di macro-attività |
| Vista cliente | Separata, con arrotondamenti |
| Export | Stima: JSON backup, YAML AI, XLSX; Libreria multipla → ZIP; modelli/settings: solo JSON |
| Tema | chiaro / scuro (`theme`) |
| Lingua | IT / EN (`locale`) |
| Note | Working: multilinea + modal (doppio click); Client: nascoste di default, se visibili anteprima + click → modal editabile |
| Icona stima | `meta.icon` (stesso set dei modelli); Working + Libreria; eredità da modello |
| Libreria | Import JSON HowLong; export selezionate (file o ZIP) |
| Desktop | Tauri 2 |
| Frontend | Vue 3 + TS |
| Settings | JSON + Zod + avviso errore |

---

*Fine specifica MVP — HowLong? — Pietro Di Leo*
