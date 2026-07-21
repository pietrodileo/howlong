# HowLong?

**Effort, made obvious.**

Applicazione desktop per **stime di progetto**: leggera, personalizzabile, pensata per chi oggi usa Excel e vuole qualcosa di più chiaro e riusabile.

**Guide all’uso:** [italiano](GUIDE.it.md) · [English](GUIDE.en.md)

| | |
|---|---|
| **Versione** | 0.1.0 |
| **Autore** | Pietro Di Leo |
| **Identifier** | `com.pietrodileo.howlong` |
| **Piattaforma prioritaria** | Windows 10/11 |

---

## A cosa serve

HowLong? costruisce stime come tabelle di voci (ore, categorie, formule), applica una **contingency** (margine di rischio) e mostra subito i totali **con e senza** quel margine. Puoi partire da **modelli JSON** riusabili, salvare nella **libreria** sul PC, preparare una **vista cliente** e **esportare** in più formati.

### Flusso tipico

1. Scegli o crea un **modello** di macro-attività (con icona, categorie, default CTG).
2. Apri o crea una **stima** nella vista di lavoro.
3. Regola la contingency **al volo**, scegli **Applica CTG** per voce (come in Modelli) e confronta i totali fianco a fianco.
4. Usa voci **formula** (sum / avg / min / max × %) per overhead, project management, ecc. (anche qui: checkbox Applica CTG).
5. Annota le voci (note multilinea; doppio click → editor ampio).
6. Passa alla **vista cliente** (arrotondamenti, presentazione).
7. **Salva** in libreria oppure **esporta** (JSON / YAML / XLSX / CSV).
8. Da **Libreria**: importa JSON HowLong; seleziona stime ed esportale (ZIP se più di una).

### Concetti

| Concetto | Cosa è |
|----------|--------|
| **Stima (Estimate)** | Documento di lavoro: metadati (titolo, icona, …) + voci + regole contingency della sessione |
| **Modello (Model)** | Template riusabile da cui nasce una nuova stima (icona ereditata sulla nuova stima) |
| **Contingency** | % di margine su progetto, categorie o voci; flag **Applica CTG** per includere/escludere ogni voce |
| **Formula** | Voce derivata: aggrega altre voci e applica una percentuale |
| **Libreria** | Cartella sul PC con le stime; rinomina, icona, selezione multipla, import JSON, export (file / ZIP) |
| **Vista cliente** | Versione da mostrare: arrotondamenti, senza dettagli interni |

### Cosa trovi nell'app

| Area | Funzioni principali |
|------|---------------------|
| **Working** | Editor stima, icona + titolo, CTG live, Applica CTG per voce, formule, note, duplica, salva / apri / esporta |
| **Client** | Presentazione arrotondata, selettore ore/giorni, summary h+D, note anteprima + editor, export dedicato |
| **Libreria** | Elenco, ricerca, selezione multipla, import JSON, export (file / ZIP), rinomina, icona, apri, elimina |
| **Modelli** | CRUD modelli, icone, import/export JSON |
| **Impostazioni** | Lingua IT/EN, tema chiaro/scuro, username, cartella stime, import/export workspace |
| **About** | Aim, tagline, versione, credit autore |

### Working — dettagli utili

| Funzione | Come |
|----------|------|
| **Titolo + icona** | Header: picker icona (`meta.icon`, stesso set dei modelli) + titolo editabile. Nuova stima da modello eredita l’icona del modello |
| **Note** | Textarea in cella (a capo visibili). **Doppio click** apre un modal per testi lunghi (Salva / Annulla, Ctrl+Invio) |
| **Applica CTG** | Checkbox per voce (macro, sotto-task, derivate), come in Modelli. Su macro propaga ai sotto-task |
| **Duplica** | Icona nelle azioni riga: clona task; su macro clona anche i sotto-task; su formula clona la voce. Nome: `(copia)`, poi `(copia 2)`, `(copia 3)`, … |
| **Confronta CTG** | Bottone in summary → 3 scenari % in ordine crescente (−10, attuale, +10; es. 10/20/30; fallback 10/20/30); mini-tabella Base / A / B / C; **Usa** applica la % alla stima (solo sessione) |
| **Colonne** | Ridimensionabili / collassabili (doppio click sull’header) |

### Libreria — dettagli utili

| Funzione | Come |
|----------|------|
| **Nome** | Campo editabile in elenco; Invio / blur salva sul file `.howlong.json` |
| **Icona** | Stesso picker dei modelli (`meta.icon`); salvataggio immediato sul file |
| **Selezione** | Checkbox per una o più stime; Seleziona tutte / Deseleziona |
| **Esporta** | JSON / YAML / Excel sulle selezionate: 1 → file singolo; 2+ → ZIP con un file per stima |
| **Importa JSON** | Uno o più file HowLong JSON → copia in libreria (nuovo id se già presente) |
| **Apri** | Controlli sotto il nome (cliente / data / Apri) |

### Client — dettagli utili

| Funzione | Come |
|----------|------|
| **Note** | Nascoste di default (`Nascondi note`). Se visibili: anteprima tronca; **click** apre il modal editabile (come Working) |
| **Nascondi note** | Toggle `hideInternalNotes` (default on): nasconde colonna in UI e note in export |
| **Unità** | Ore o giorni (come in Working); summary mostra sempre h e D |

### Formati file

| Formato | Uso tipico |
|---------|------------|
| **JSON** | Backup / ripristino HowLong (stime, modelli, settings); import libreria da JSON HowLong |
| **YAML** | Lettura umana / AI (non re-import nativo della stima) |
| **XLSX** | Condivisione con chi usa Excel (export completo; import best-effort) |
| **CSV** | Scambio tabellare dove serve |
| **ZIP** | Solo da Libreria: archivio di più stime esportate insieme (un file interno per stima) |

---

## Impostazioni (cosa si salva)

Persistite in `%APPDATA%\com.pietrodileo.howlong\settings.json` (e modelli nella stessa area dati).

| Opzione | Note |
|---------|------|
| **Lingua** | `it` / `en` — anteprima immediata; **Salva** per renderla permanente |
| **Aspetto** | **Chiaro** o **Scuro** (`theme: "light" \| "dark"`) — anteprima immediata; **Salva** per persistere |
| **Username** | Etichetta opzionale per riconoscere il profilo settings |
| **Cartella stime** | Vuota = default `{appData}/estimates`; oppure percorso personalizzato |
| **Import / Export** | Workspace JSON: impostazioni + tutti i modelli |

Il tema scuro applica la classe `html.theme-dark` e ridefinisce i design token (sfondi, testo, accent, tabelle, sidebar, toast).

---

## Stack

| Layer | Tecnologia | Ruolo |
|-------|------------|--------|
| Shell desktop | **Tauri 2** (Rust) | Finestra nativa, dialog, filesystem — **non** Electron |
| UI | **Vue 3 + TypeScript + Vite + Pinia** | Interfaccia e stato |
| Validazione | **Zod** | Schema settings / modelli / stime |
| Excel | **ExcelJS** (lazy) | Caricato solo su export/import XLSX |
| ZIP | **fflate** | Export multiplo dalla Libreria |
| CSV / YAML | Papa Parse + `yaml` | Serializzazione testuale |
| Font | Plus Jakarta Sans + Literata | UI + brand |
| Persistenza | File JSON locali | Nessun database in MVP |

**Divisione responsabilità**

- **Frontend:** UI, Pinia, contingency, formule, import/export, i18n, tema.
- **Rust (Tauri):** AppData, open/save dialog, lettura/scrittura file.

I calcoli restano nel frontend (facili da testare con lo smoke test); Rust resta sottile.

---

## Struttura del repository

```
HowLong/
├── src/
│   ├── views/           # Working, Client, Library, Models, Settings
│   ├── stores/          # Pinia: estimate, models, settings, library, ui
│   ├── lib/             # contingency, formule, export/import, libraryIo (ZIP), I/O, appearance
│   ├── models/          # tipi Zod (Estimate, Model, Settings)
│   ├── components/      # sidebar, NotesEditor, FormulaEditor, MetaIconPicker, CTG, icone
│   ├── i18n/            # messaggi IT/EN
│   └── styles.css       # design tokens + tema chiaro/scuro
├── src-tauri/           # shell Tauri + Rust
├── scripts/
│   ├── build-windows.bat
│   ├── dev.cmd
│   └── smoke-contingency.ts
├── SPEC.md              # requisiti e accettazione MVP
├── README.md
└── package.json
```

---

## Prerequisiti

1. **[Node.js LTS](https://nodejs.org/)** — `npm`, Vite, dipendenze JS.
2. **[Rust](https://www.rust-lang.org/learn/get-started)** — `cargo` nel PATH (`%USERPROFILE%\.cargo\bin`).
3. **MSVC + Windows SDK** — Visual Studio Build Tools 2022 (workload C++).
4. **[WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)** — di solito già presente su Windows 10/11.

Guida ufficiale: [Tauri 2 — Prerequisites](https://v2.tauri.app/start/prerequisites/).

---

## Setup (prima volta)

```bash
npm install
```

Al primo `tauri:dev` / `tauri build`, Cargo scarica i crate Rust (può richiedere alcuni minuti).

### Problemi frequenti (Windows / PowerShell)

**`npm` bloccato** (`npm.ps1` / execution policy):

```powershell
npm.cmd install
# oppure: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**`cargo` non trovato**:

```powershell
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
cargo --version
```

Per renderlo permanente: aggiungi `%USERPROFILE%\.cargo\bin` alle variabili d'ambiente utente.

---

## Sviluppo

### App completa (consigliato)

Finestra desktop + dialog e filesystem reali:

```bash
npm run tauri:dev
```

Oppure, su Windows: `scripts\dev.cmd` (evita i problemi di `npm.ps1` e mette `cargo` nel PATH).

- Hot reload sul frontend Vue.
- Modifiche in `src-tauri/` → ricompilazione nativa (più lenta).

### Solo frontend nel browser

```bash
npm run dev
```

Utile per UI/CSS. **Senza Tauri** Salva / Esporta / scelta cartella non funzionano come in produzione.

### Smoke test (senza UI)

```bash
npm run smoke
```

Verifica i calcoli di contingency (e casi correlati) dopo aver toccato `src/lib/contingency.ts` o le formule.

---

## Build e distribuzione (Windows)

Obiettivo: installer / exe per un PC senza toolchain di sviluppo.

### Consigliato

```bat
scripts\build-windows.bat
```

Lo script:

1. Carica *VsDevCmd* (linker / SDK).
2. Antepone `%USERPROFILE%\.cargo\bin` al `PATH`.
3. Esegue `npm.cmd run tauri build` dalla root.

### Manuale

Con MSVC e `cargo` già disponibili:

```bash
npm run tauri build
```

Pipeline:

1. `npm run build` — `vue-tsc` + bundle Vite → `dist/`
2. Compilazione Rust release + packaging NSIS / MSI

### Output tipici

| Artefatto | Percorso |
|-----------|----------|
| Installer NSIS | `src-tauri\target\release\bundle\nsis\HowLong_*_x64-setup.exe` |
| Installer MSI | `src-tauri\target\release\bundle\msi\HowLong_*_x64_*.msi` |
| Binario | `src-tauri\target\release\howlong.exe` |

### Solo frontend

```bash
npm run build
```

Produce `dist/` (WebView); **non** genera l'exe. ExcelJS resta in un chunk separato (~940 kB) caricato solo quando serve XLSX.

---

## Script npm

| Comando | Cosa fa |
|---------|---------|
| `npm install` | Dipendenze JS |
| `npm run dev` | Solo Vite in browser |
| `npm run tauri:dev` | App desktop in sviluppo |
| `npm run build` | Typecheck + bundle frontend |
| `npm run tauri build` | Release + installer |
| `npm run smoke` | Test contingency da CLI |

---

## Decisioni di prodotto / tecniche

- **Niente DB** in MVP: settings, modelli e stime sono file JSON.
- **Contingency e serializzazione** nel frontend; Rust solo OS e I/O.
- **i18n** IT/EN via `src/i18n` + campo `locale` nei settings.
- **Tema chiaro/scuro** via campo `theme` e classe CSS `theme-dark`.
- **Note lunghe** in modal (`NotesEditor`): in Working textarea + doppio click; in Client nascoste di default, se visibili anteprima + click → stesso editor.
- **Icona stima** (`meta.icon`): stesso set dei modelli; editabile in Working e in Libreria (`MetaIconPicker`); nuova stima da modello eredita l’icona.
- **Libreria export multiplo:** 1 stima → file; 2+ → ZIP (`fflate`) con un file per stima nel formato scelto.
- **Bundle:** ExcelJS / YAML / PapaParse / fflate in chunk lazy (caricati solo su export/import/ZIP); `index` resta ~250 KB.
- **Applica CTG** (`applyContingency`): stesso principio in Modelli e Stima (checkbox colonna); su macro in Stima propaga ai sotto-task; sulle formule allinea anche `applyGlobalContingency`.
- **Duplica riga** nello store stima (`duplicateItem`); suffisso nome `(copia)` / `(copy)`.
- **Import XLSX** stima: secondario / best-effort; export XLSX completo.
- **Brand vs filesystem:** UI e titolo = **HowLong?**; `productName` Tauri = `HowLong` (Windows non ammette `?` nei path).
- **Tagline UI:** **Effort, made obvious.**
- **Editor:** workspace VS Code/Cursor con Volar ufficiale (`Vue.volar`); Vetur disabilitato.

---

## Specifica completa

Per requisiti dettagliati, regole contingency/formule, criteri di accettazione MVP e piano funzionale: **`SPEC.md`**.

Per l’uso quotidiano dell’app: **`GUIDE.it.md`** / **`GUIDE.en.md`**.

Questo README spiega *come* realizzare, configurare e distribuire il progetto; la SPEC spiega *cosa* deve fare il prodotto; le GUIDE spiegano *come usarlo*.
