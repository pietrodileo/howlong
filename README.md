![HowLong? app icon](src-tauri/icons/icon.png)

# HowLong?

**Clear project estimates, without the spreadsheet.**

Local-first desktop app for building, planning, analyzing, comparing, and delivering project estimates. Data stays on your machine in JSON files — no account or cloud service.

![version 0.6.0](https://img.shields.io/badge/version-0.6.0-2ea043?style=flat-square)![MIT License](https://img.shields.io/badge/license-MIT-2ea043?style=flat-square)![Tauri 2](https://img.shields.io/badge/Tauri-2-24c8db?style=flat-square)![macOS, Windows, Linux](<https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-555?style=flat-square>)

[What it does](#what-it-does) ·
[Features](#features) ·
[Exports](#export-outputs) ·
[Screens](#screens) ·
[Get started](#get-started) ·
🇬🇧 [English guide](docs/guides/GUIDE.en.md) ·
🇮🇹 [Guida italiana](docs/guides/GUIDE.it.md)

---

## What it does

Spreadsheets make estimates hard to reuse, audit, and hand off. *HowLong?* keeps effort, contingency, and structure in one editable document, then splits **internal planning** from **client delivery**.

Everything is stored locally. Settings, models, and estimates live as JSON on disk — readable, portable, yours.

## Features

### Estimates

- Start from bundled Italian or English models, or build your own reusable templates.
- Organize work as macros, subtasks, categories, labels, and notes.
- Add formula rows (sum, average, min, max × %) for overhead and management effort.
- Apply contingency globally, by category, or per row; compare scenarios A/B/C before committing.
- Track project metadata and an audit history of saves.

### Planning and analysis

- **Plan:** day-based or month-based Gantt with configurable weekends; dates only — effort stays unchanged.
- **Analytics:** summary cards, activity donut, and stacked base-vs-contingency bars; drill into one macro or expand several.
- **Compare:** align multiple saved estimates side by side.
- **Manager view:** round, redistribute, include/exclude rows, and override presented totals.
- **Client view:** filtered preview of what you actually deliver.

### Files and workflow

- Save estimates to a local **Library** (default app data folder or a custom path).
- Import and export JSON, YAML, and XLSX; bulk-export library selections as ZIP.
- Open exported files from the completion dialog.
- Keyboard shortcuts for save, tabs, views, and undo/redo.
- English or Italian UI; light or dark theme.

## Export outputs

| Source   | What you get                                              | Use when               |
| -------- | --------------------------------------------------------- | ---------------------- |
| Estimate | Full calculation: hierarchy, formulas, contingency, notes | Technical handover     |
| Manager  | Rounded/redistributed presented values                    | Internal approval      |
| Client   | Only included activities and visible notes/labels         | Client delivery        |
| Plan     | XLSX Gantt from the visible range, scale, and colors      | Timeline communication |

| Format            | Role                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| `.howlong.json` | Native editable estimate — the only format you can re-import           |
| YAML              | Structured input for reviewed AI workflows (e.g. drafting Jira tickets) |
| XLSX              | Human-readable snapshot from any source view above                      |
| ZIP               | Multiple library exports in one archive                                 |

Export creates a **delivery copy**. It does not replace **Save**, which updates the working file in the Library. YAML and XLSX do not round-trip back into the app.

Details, safety notes, screenshots, and sample files: [Italian manual](docs/guides/GUIDE.it.md) · `[examples/](examples/)`

## Screens

Home → create or open an estimate, browse the Library, or jump to a recent file. Plan and Analytics need an open estimate tab.

![HowLong home screen with navigation, creation actions, and recently opened estimates](docs/images/homepage.png)

The editor runs multiple estimates in tabs with live base, contingency, and total figures.

![Estimate editor with multiple open tabs and hierarchical work items](docs/images/new_estimate_with_tabs.png)

| Planning                                                   | Analytics                                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| ![Day-based Gantt planning board](docs/images/gantt_1.png) | ![Analytics overview with donut and stacked bars](docs/images/analytics.png) |

Full walkthrough (settings, shortcuts, formats, troubleshooting): [English manual](docs/guides/GUIDE.en.md) · [manuale italiano](docs/guides/GUIDE.it.md)

## Stack

| Layer              | Technology              |
| ------------------ | ----------------------- |
| Desktop shell      | Tauri 2, Rust           |
| Interface          | Vue 3, TypeScript, Vite |
| State / validation | Pinia, Zod              |
| Spreadsheet export | ExcelJS                 |
| Storage            | Local JSON files        |

Uses the OS webview — no bundled Chromium.

## Get started

**Time:** ~2 min if Node 20+ and Rust are already installed; ~20–30 min if you still need [Rust](https://www.rust-lang.org/tools/install) and [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

**All platforms:** Node.js 20+, Rust stable, plus platform tools ([Windows](https://v2.tauri.app/start/prerequisites/): VS Build Tools 2022, Windows SDK, WebView2 · **macOS:** Xcode CLT · **Linux:** WebKitGTK + Tauri deps).

1. `npm install`
2. `npm run tauri:dev` — full desktop app (filesystem, dialogs, native export)
3. `npm run dev` — browser UI only; no native file features

### Verify changes

```bash
npm run build
npm run smoke
npm run smoke:gantt
npm run smoke:analytics
```

`build` type-checks and bundles the frontend. Smoke scripts cover contingency, Gantt dates, and Analytics projections.

### Release builds

Outputs land in `src-tauri/target/release/bundle/`. Build on the target OS (Windows installers on Windows, etc.).

| Platform | Command                                             |
| -------- | --------------------------------------------------- |
| Windows  | `scripts\build-windows.bat`                       |
| macOS    | `./scripts/build-macos.sh` → `.app` / `.dmg` |
| Linux    | `./scripts/build-linux.sh`                        |
| Any      | `npm run tauri build`                             |

## Versioning

HowLong? follows semantic versioning in the form `x.y.z`:

| Part  | Name  | Increment when                                                     |
| ----- | ----- | ------------------------------------------------------------------ |
| `x` | Major | A release introduces incompatible or fundamental product changes   |
| `y` | Minor | A release adds backward-compatible functionality                   |
| `z` | Patch | A release contains backward-compatible fixes or small improvements |

Examples:

- `0.5.1` → `0.5.2` for a bug fix
- `0.5.1` → `0.6.0` for a new feature
- `0.5.1` → `1.0.0` for the first stable major release

Keep the version synchronized in:

- `package.json` and `package-lock.json`
- `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock`
- `src-tauri/tauri.conf.json`
- `src/app/App.vue`, which displays the version in the About dialog

## Repository layout

Contributor rules: [AGENTS.md](AGENTS.md).

```text
.
├── src/
│   ├── app/            Shell, navigation, i18n, global UI
│   ├── domain/         Shared calculations
│   ├── features/       Estimate, plan, analytics, compare, models, library, settings
│   ├── models/         Schemas and domain types
│   ├── platform/       Tauri and file I/O
│   └── shared/         Reusable UI and helpers
├── src-tauri/          Rust app and Tauri config
├── scripts/            Build and smoke tests
├── docs/guides/        User guides
├── docs/images/        Guide screenshots
└── package.json
```

## Data and privacy

Default data directory: Tauri app data for `com.pietrodileo.howlong`. Point the Library to any folder from Settings.

You can use a synced folder (OneDrive, Google Drive, Dropbox) so colleagues share models and estimates through that service. Everyone needs the sync client and the same shared folder. **Do not edit the same** `.howlong.json` **at the same time** — there is no locking or conflict merge.

Estimate files use the `.howlong.json` suffix.

## License

MIT — see [LICENSE](LICENSE).
