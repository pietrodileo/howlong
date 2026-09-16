<p align="center">
  <img src="src-tauri/icons/icon.png" alt="HowLong? app icon" width="120">
</p>

<p align="center">
  <strong>HowLong?</strong>
</p>

<p align="center">
  How often does someone ask, <strong><i>"How long will this take?"</i></strong>
</p>

<p align="center">
  <a href="https://github.com/pietrodileo/howlong/releases"><img src="https://img.shields.io/github/v/release/pietrodileo/howlong?style=flat&label=version" alt="version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2ea043?style=flat" alt="MIT License"></a>
  <a href="https://v2.tauri.app"><img src="https://img.shields.io/badge/Tauri-2-24c8db?style=flat" alt="Tauri 2"></a>
  <a href="https://github.com/pietrodileo/howlong/releases"><img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-555?style=flat" alt="macOS | Windows | Linux"></a>
</p>

*HowLong?* helps you build, plan, analyze, compare, and deliver project estimates in a dedicated desktop app. Replace spreadsheets with clear, structured estimates stored locally as readable JSON files. No account or cloud service is required, so your estimates stay private and under your control.

<p align="center">
  <a href="#what-it-does">What it does</a> ·
  <a href="#features">Features</a> ·
  <a href="#new-in-v071">New in v0.7.1</a> ·
  <a href="#export-outputs">Exports</a> ·
  <a href="#screens">Screens</a> ·
  <a href="#download">Download</a> ·
  <a href="#build-from-source">Build from source</a> ·
  <a href="docs/guides/GUIDE.en.md">🇬🇧 English guide</a> ·
  <a href="docs/guides/GUIDE.it.md">🇮🇹 Guida italiana</a>
</p>

---

# What it does

Spreadsheets make estimates difficult to reuse, audit, and hand off. *HowLong?* keeps effort, contingency, and structure in one editable document. It separates **internal planning** from **client delivery**.

All data stays local. Settings, models, and estimates are stored as readable JSON files on disk. No account or cloud service is required.

# Features

## Estimates

- Start with a bundled Italian or English model, or build your own reusable template.
- Organize work into macros, subtasks, categories, labels, and notes.
- Add formula rows (sum, average, min, max × %) for overhead and management effort.
- Apply contingency globally, by category, or to individual rows. Compare scenarios A/B/C before committing.
- Track project metadata and an audit history of saves.

## Planning and analysis

- **Plan:** Use a day- or month-based Gantt with configurable weekends. The plan changes dates only, so effort stays unchanged. XLSX exports include base, base + CTG, and planned days for each activity.
- **Analytics:** View summary cards, an activity donut, and stacked base-vs-contingency bars. Drill into one macro or expand several.
- **Compare:** Line up multiple saved estimates side by side.
- **Manager view:** Round and redistribute values, include or exclude rows, and override the presented totals.
- **Client view:** Preview the filtered version of what you deliver.

## Files and workflow

- Save estimates in a local **Library**, using the default app data folder or a custom path.
- Import and export JSON, YAML, and XLSX. Bulk-export selected library files as a ZIP.
- Open exported files from the completion dialog.
- Use keyboard shortcuts for saving, tabs, views, and undo/redo.
- Choose an English or Italian UI and a light or dark theme.

# Download

Download the latest stable installer from the [GitHub Releases page](https://github.com/pietrodileo/howlong/releases). If you already have the desktop app, use **Settings → Updates** to download and install the signed artifact for your system.

## Install

### macOS

Download the `.dmg` installer from the [GitHub Releases page](https://github.com/pietrodileo/howlong/releases), or use the bootstrapper to install the latest stable release:

```bash
curl -fsSL https://raw.githubusercontent.com/pietrodileo/howlong/main/scripts/install/unix.sh | sh
```

The bootstrapper installs the matching macOS `.dmg` for the current user. Review the remote script before piping it to a shell, or replace `main` with a reviewed commit or tag for a reproducible install.

### Windows

Download the `.exe` or `.msi` installer from the [GitHub Releases page](https://github.com/pietrodileo/howlong/releases), or use PowerShell to install the Windows x64 `.exe`:

```powershell
irm https://raw.githubusercontent.com/pietrodileo/howlong/main/scripts/install/windows.ps1 | iex
```

Review the remote script before piping it to PowerShell, or replace `main` with a reviewed commit or tag for a reproducible install.

### Linux

Download the `.AppImage` or another published package from the [GitHub Releases page](https://github.com/pietrodileo/howlong/releases), or use the bootstrapper to install the Linux x64 AppImage:

```bash
curl -fsSL https://raw.githubusercontent.com/pietrodileo/howlong/main/scripts/install/unix.sh | sh
```

Review the remote script before piping it to a shell, or replace `main` with a reviewed commit or tag for a reproducible install.

All bootstrapper commands install stable releases only. Use **Settings → Updates** for an existing installation.

## Uninstall

Remove HowLong? without deleting your estimates:

- **Windows:** Open **Settings → Apps → Installed apps**, select **HowLong**, and choose **Uninstall**. To open the settings page from PowerShell:

  ```powershell
  Start-Process "ms-settings:appsfeatures"
  ```

- **macOS:** The bootstrapper installs the app for the current user at `~/Applications/HowLong.app`:

  ```bash
  rm -rf "$HOME/Applications/HowLong.app"
  ```

  If you installed the app manually in `/Applications`, remove `/Applications/HowLong.app` instead.

- **Linux:** The bootstrapper installs the AppImage at `~/.local/bin/howlong`:

  ```bash
  rm -f "$HOME/.local/bin/howlong"
  ```

These commands remove only the application. Your workspace, estimates, and settings remain on disk. Delete them separately only if you want to reset all application data.

# New in v0.7.1

Version 0.7.1 adds redesigned settings and a safe, user-controlled update path for the desktop app:

- Settings use focused, collapsible groups with a search filter.
- Workspace, estimate, planning, and application options use clearer summaries and full-width controls.
- Planning and Analytics empty states offer the same **New Estimate**, **Open File**, and **Go to Library** actions as the home screen.
- Manager and Client presentation sections can be collapsed to make dense estimates easier to scan.
- Gantt XLSX exports include `Base (days)`, `Base + CTG (days)`, and `Planned (days)` for each activity. The obsolete Planning column is no longer exported.
- Planned Gantt days follow the setting that determines whether weekend days count as working days.
- Deleting an owner from the Gantt asks for confirmation, then removes that owner from all activities in the current estimate.
- **Settings → Updates** checks the official GitHub feed only when you click **Check for updates**.
- Only stable releases are considered. Prereleases are excluded.
- The panel shows the installed version, available version, release notes, download progress, and install state.
- The updater downloads the signed artifact for the current operating system and architecture, installs it, and restarts the app when required.
- Updates go directly to the newest stable release. Intermediate versions are skipped, so each release must preserve or migrate existing workspace data.
- Browser previews do not update. Use the desktop app to check for and install updates.

GitHub Actions produces the official platform builds and updater feed from stable tags. See the [Build and release guide](docs/BUILD.md) for signing, release assets, tagging, forks, and troubleshooting.

# Export outputs

| Source   | What you get                                                           | Use when               |
| -------- | ---------------------------------------------------------------------- | ---------------------- |
| Estimate | Full calculation: hierarchy, formulas, contingency, notes              | Technical handover     |
| Manager  | Rounded/redistributed presented values                                 | Internal approval      |
| Client   | Only included activities and visible notes/labels                      | Client delivery        |
| Plan     | XLSX Gantt with dates, status, owner, base/CTG/planned days, and timeline | Timeline communication |

| Format         | Role                                                                    |
| -------------- | ----------------------------------------------------------------------- |
| `.howlong.json` | Native editable estimate (the only format you can re-import)          |
| YAML           | Structured input for reviewed AI workflows (e.g. drafting Jira tickets) |
| XLSX           | Human-readable snapshot from any source view above                     |
| ZIP            | Multiple library exports in one archive                                |

Exports create a **delivery copy**. They do not replace **Save**, which updates the working file in the Library. YAML and XLSX cannot be imported back into the app.

# Screens

From Home, create or open an estimate, browse the Library, or open a recent file. Plan and Analytics require an open estimate tab.

![HowLong home screen with navigation, creation actions, and recently opened estimates](docs/images/homepage.png)

The editor keeps multiple estimates open in tabs and shows live base, contingency, and total figures.

![Estimate editor with multiple open tabs and hierarchical work items](docs/images/new_estimate_with_tabs.png)

| Planning                                                   | Analytics                                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| ![Day-based Gantt planning board](docs/images/gantt_1.png) | ![Analytics overview with donut and stacked bars](docs/images/analytics.png) |

For a full walkthrough of settings, shortcuts, formats, and troubleshooting, see the [English manual](docs/guides/GUIDE.en.md) or [manuale italiano](docs/guides/GUIDE.it.md).

# Stack

| Layer              | Technology              |
| ------------------ | ----------------------- |
| Desktop shell      | Tauri 2, Rust           |
| Interface          | Vue 3, TypeScript, Vite |
| State / validation | Pinia, Zod              |
| Spreadsheet export | ExcelJS                 |
| Storage            | Local JSON files        |

HowLong? uses the OS webview and does not bundle Chromium.

# Build from source

**Time:** About 2 minutes with Node 20+ and Rust already installed, or 20 to 30 minutes if you still need [Rust](https://www.rust-lang.org/tools/install) and [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

**All platforms:** Node.js 20+, Rust stable, and the required platform tools ([Windows](https://v2.tauri.app/start/prerequisites/): VS Build Tools 2022, Windows SDK, WebView2; **macOS:** Xcode CLT; **Linux:** WebKitGTK and Tauri dependencies).

1. `npm install`
2. `npm run tauri:dev` for the full desktop app with filesystem access, dialogs, and native export.
3. `npm run dev` for the browser UI only. Native file features are unavailable there.

## Verify changes

```bash
npm run build
npm run smoke
npm run smoke:gantt
npm run smoke:analytics
```

`build` type-checks and bundles the frontend. The smoke scripts cover contingency, Gantt dates, and Analytics projections.

## Release builds

Build outputs go to `src-tauri/target/release/bundle/`. Build on the target OS, such as Windows for Windows installers.

| Platform | Pre-release script                      | Official release script             |
| -------- | --------------------------------------- | ------------------------------------ |
| Windows  | `scripts\windows\build-prerelease.bat` | `scripts\windows\build-release.bat` |
| macOS    | `scripts/osx/build-prerelease.sh`      | `scripts/osx/build-release.sh`      |
| Linux    | `scripts/linux/build-prerelease.sh`    | `scripts/linux/build-release.sh`    |
| Any      | `npm run tauri build` (default config) | Use the platform release script     |

The prerelease scripts keep the application name **HowLong**, use a separate application identifier, do not require a signing key, and do not create official updater artifacts. The release scripts use `~/.tauri/howlong.key` (or `%USERPROFILE%\.tauri\howlong.key` on Windows) and require a non-empty `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. To use another key locally, set `TAURI_SIGNING_PRIVATE_KEY` to its path or contents before running the release script. The scripts fail early when signing setup is incomplete.

For the complete development, prerelease, stable release, signing, tagging, and fork workflow, see the [Build and release guide](docs/BUILD.md).

`.github/workflows/release.yml` publishes stable updater releases when you push a stable `v*` tag. Tags containing a hyphen are ignored. The workflow builds Windows x64, Linux x64, macOS Intel, and macOS Apple Silicon artifacts, generates release notes from the tag and previous release, then uploads the signed installers, updater bundles, signatures, and `latest.json` to the GitHub Release.

Before pushing the first release tag, add these GitHub Actions secrets:

- `TAURI_SIGNING_PRIVATE_KEY`: the full contents of the private key generated with `npm run tauri -- signer generate -w ~/.tauri/howlong.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: the non-empty passphrase used to generate the protected release key

Never commit the private key. Keep the same key for all future releases. Losing or replacing it prevents existing installations from accepting new updates.

### Updater signing, passwords, and forks

The updater public key is safe to commit because it only verifies releases. The private key can sign releases accepted by installed copies, so keep it in a protected local file and in GitHub Actions Secrets. Official release builds require a non-empty passphrase-protected key. This provides extra protection if the private key file or a backup is exposed. Set both `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` in the release build environment. Use an unprotected key only in a separate local or test setup, never for the official updater channel. After a public release, do not replace the key without a planned key-rotation path.

HowLong? is open source and can be forked. The default build trusts the official GitHub Releases endpoint and public key. A fork that publishes its own binaries should change the Tauri `identifier`, updater `endpoints`, and public key, then configure its own `TAURI_SIGNING_PRIVATE_KEY` secret. Otherwise, it may check for upstream updates and reject releases signed with the fork's key.

# Repository layout

See [AGENTS.md](AGENTS.md) for contributor rules.

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
├── scripts/            Build, install, and smoke tests
├── docs/guides/        User guides
├── docs/images/        Guide screenshots
└── package.json
```

# Data and privacy

By default, HowLong? stores data in the Tauri app-data directory for `com.pietrodileo.howlong`. You can point the Library to any folder from Settings.

You can use a synced folder with OneDrive, Google Drive, or Dropbox to share models and estimates with colleagues. Everyone needs the sync client and access to the same shared folder. **Do not edit the same** `.howlong.json` **at the same time** because the app does not provide file locking or conflict merging.

Estimate files use the `.howlong.json` suffix.

# License

MIT. See [LICENSE](LICENSE).
