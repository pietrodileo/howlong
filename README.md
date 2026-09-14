<p align="center">
  <img src="src-tauri/icons/icon.png" alt="HowLong? app icon" width="120">
</p>

<p align="center">
  <strong>HowLong?</strong>
</p>

<p align="center">
  How many times has someone asked you, <strong>"How long will this take?"</strong>
</p>

<p align="center">
  <a href="https://github.com/pietrodileo/howlong/releases"><img src="https://img.shields.io/badge/version-0.7.0-2ea043?style=flat" alt="version 0.7.0"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2ea043?style=flat" alt="MIT License"></a>
  <a href="https://v2.tauri.app"><img src="https://img.shields.io/badge/Tauri-2-24c8db?style=flat" alt="Tauri 2"></a>
  <a href="#"><img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-555?style=flat" alt="macOS | Windows | Linux"></a>
</p>

*HowLong?* is your solution for building, planning, analyzing, comparing, and delivering project estimates—all in a dedicated desktop app. Leave spreadsheets behind: create clear, structured estimates with your data stored locally in readable JSON files. No account, no cloud, no dependencies. Your estimates stay private and in your control.

<p align="center">
  <a href="#what-it-does">What it does</a> ·
  <a href="#features">Features</a> ·
  <a href="#export-outputs">Exports</a> ·
  <a href="#screens">Screens</a> ·
  <a href="#get-started">Get started</a> ·
  <a href="docs/guides/GUIDE.en.md">🇬🇧 English guide</a> ·
  <a href="docs/guides/GUIDE.it.md">🇮🇹 Guida italiana</a>
</p>

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

| Platform | Pre-release script                         | Official release script                 |
| -------- | ------------------------------------------ | --------------------------------------- |
| Windows  | `scripts\windows\build-prerelease.bat` | `scripts\windows\build-release.bat`  |
| macOS    | `scripts/osx/build-prerelease.sh`         | `scripts/osx/build-release.sh`          |
| Linux    | `scripts/linux/build-prerelease.sh`       | `scripts/linux/build-release.sh`        |
| Any      | `npm run tauri build` (default config)    | Use the platform release script         |

The prerelease scripts do not require a signing key. The release scripts use `~/.tauri/howlong.key` (or `%USERPROFILE%\.tauri\howlong.key` on Windows) and require a non-empty `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. To use another key, set `TAURI_SIGNING_PRIVATE_KEY` to its path or contents before running the release script. The scripts fail early when signing setup is incomplete.

For the complete development, pre-release, stable release, signing, tagging, and fork workflow, see the [Build and release guide](docs/BUILD.md).

Stable updater releases are published by `.github/workflows/release.yml` when a stable `v*` tag is pushed. Tags containing a hyphen are ignored. The workflow builds Windows x64, Linux x64, macOS Intel, and macOS Apple Silicon artifacts, then uploads the signed updater bundles and `latest.json` to the GitHub Release.

Before pushing the first release tag, add these GitHub Actions secrets:

- `TAURI_SIGNING_PRIVATE_KEY`: the full contents of the private key generated with `npm run tauri signer generate -- -w ~/.tauri/howlong.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: the non-empty passphrase used to generate the protected release key

Never commit the private key. Keep the same key for all future releases; losing or replacing it prevents existing installations from accepting new updates.

### Updater signing, passwords, and forks

The updater public key is safe to commit because it only verifies releases. The private key can sign releases accepted by installed copies, so keep it only in a protected local file and in GitHub Actions Secrets. Official release builds require a non-empty passphrase-protected key, which adds defense in depth if the private key file or a backup is exposed. Set both `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` in the release build environment. An unprotected key should be limited to a deliberately separate local/test setup and must not be used for the official updater channel. After a public release, do not replace the key without a planned key-rotation path.

HowLong? is open source and remains forkable. The default build trusts the official GitHub Releases endpoint and the official public key. An independent fork that publishes its own binaries should change the Tauri `identifier`, updater `endpoints`, and public key, then configure its own `TAURI_SIGNING_PRIVATE_KEY` secret. Otherwise, the fork may check for upstream updates and will not accept releases signed by the fork's own key.

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
- `0.6.1` → `0.7.0` for a new feature
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
