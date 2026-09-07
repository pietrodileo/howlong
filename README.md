<div align="center">

<img src="src-tauri/icons/icon.png" width="128" alt="HowLong? app icon" />

# HowLong?

**Clear project estimates, without the spreadsheet.**

HowLong? is a local-first desktop app for creating, analyzing, comparing, and sharing project estimates. It includes reusable models, contingency, analytics, separate manager and client views, and exports in several formats.

<p>
  <img src="https://img.shields.io/badge/version-0.6.0-2ea043?style=flat-square" alt="version 0.6.0" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2ea043?style=flat-square" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Tauri-2-24c8db?style=flat-square" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-555?style=flat-square" alt="macOS, Windows, Linux" />
</p>

<a href="#why-howlong">Why HowLong?</a> ·
<a href="#features">Features</a> ·
<a href="#product-tour">Product tour</a> ·
<a href="#development">Development</a> ·
<a href="docs/guides/GUIDE.en.md">English guide</a> ·
<a href="docs/guides/GUIDE.it.md">Guida italiana</a> ·
<a href="docs/guides/EXPORT_GUIDE.md">Export guide</a>

</div>

---

## Why HowLong?

Project estimates often begin in spreadsheets, where they can become difficult to reuse, audit, and present. HowLong? keeps the calculations structured and provides separate views for internal planning and client communication.

All project data remains in local JSON files. No account, hosted service, or database is required.

## Features

- Build estimates from reusable models and hierarchical work items, starting from the bundled Italian or English standard model.
- Plan estimate activities on an adaptive day- or month-based Gantt timeline with configurable weekend days.
- Analyze the open estimate with summary metrics, an interactive activity donut, and stacked bars that compare base effort with contingency in hours or days.
- Drill into one macro's subtasks or selectively expand subtasks from several macros across both Analytics charts.
- Apply contingency globally, by category, or by individual item.
- Add derived formula rows for overhead, management, and related effort.
- Maintain notes, tags, project metadata, and an audit history.
- Compare multiple estimates and contingency scenarios.
- Present separate manager and client views.
- Store estimates in a configurable local library.
- Import and export JSON, YAML, and XLSX; export library selections as ZIP archives and open generated files from the completion message.
- Use keyboard shortcuts to save, create and close tabs, change views, and move between open estimate tabs.
- Use the interface in English or Italian with light and dark themes.

## Export outputs

| Source | Purpose |
| --- | --- |
| Estimate view | Complete estimator-authored calculation for technical review and handover |
| Manager view | Internally adjusted presentation with rounding, redistributed work, and presented totals |
| Client view | Filtered delivery with only the chosen activities and optional notes or labels |
| Plan | Standalone XLSX Gantt based on the visible range, scale, weekends, dates, and colors |

Use `.howlong.json` for an editable backup or transfer back into HowLong?. Use YAML as structured input for reviewed AI-agent workflows such as drafting Jira tickets or project plans. Use XLSX for human review and presentation. Derived YAML and XLSX files do not update the native estimate.

See the [export guide](docs/guides/EXPORT_GUIDE.md) for format behavior, safety notes, and downloadable files from [`examples/`](examples/).

## Product tour

The home screen is the starting point for creating an estimate, opening a file, visiting the Library, or reopening one of the five most recent estimates. The sidebar provides the main views; Plan and Analytics become useful when an estimate is open.

![HowLong home screen with navigation, creation actions, and recently opened estimates](docs/images/homepage.png)

The estimate editor keeps multiple documents in tabs. It shows base effort, contingency, combined totals, editable macros and subtasks, formulas, labels, notes, and row actions in one workspace.

![Estimate editor with multiple open tabs and hierarchical work items](docs/images/new_estimate_with_tabs.png)

Planning places the same activities on a daily or monthly Gantt without changing their estimated effort. Analytics shows how base effort and contingency are distributed.


| Planning                                                   | Analytics                                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| ![Day-based Gantt planning board](docs/images/gantt_1.png) | ![Analytics overview with donut and stacked bars](docs/images/analytics.png) |


For a complete screen-by-screen walkthrough, settings reference, shortcuts, file formats, and safety notes, read the [English manual](docs/guides/GUIDE.en.md) or [manuale italiano](docs/guides/GUIDE.it.md).

## Technology


| Layer              | Technology                  |
| ------------------ | --------------------------- |
| Desktop shell      | Tauri 2 and Rust            |
| Interface          | Vue 3, TypeScript, and Vite |
| State              | Pinia                       |
| Validation         | Zod                         |
| Spreadsheet export | ExcelJS                     |
| Storage            | Local JSON files            |


HowLong? uses the operating system's native webview through Tauri rather than bundling a browser runtime.

## Requirements

All platforms require:

- [Node.js](https://nodejs.org/) 20 or later
- [Rust](https://www.rust-lang.org/tools/install) stable
- Platform-specific [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/)

Additional platform requirements:


| Platform | Requirements                                                             |
| -------- | ------------------------------------------------------------------------ |
| Windows  | Visual Studio Build Tools 2022 with C++ tools, Windows SDK, and WebView2 |
| macOS    | Xcode Command Line Tools                                                 |
| Linux    | WebKitGTK and the distribution packages required by Tauri                |




## Development

Install dependencies:

```bash
npm install
```

Run the complete desktop application:

```bash
npm run tauri:dev
```

Run only the browser-based frontend:

```bash
npm run dev
```

Browser mode is useful for interface work. Native filesystem features and dialogs require Tauri.

## Testing

```bash
npm run build
npm run smoke
npm run smoke:gantt
npm run smoke:analytics
```

`npm run build` type-checks and bundles the frontend. The smoke commands check contingency, Gantt date calculations, and Analytics graph projections.

## Release builds

Build scripts run from any working directory and place native artifacts under `src-tauri/target/release/bundle/`.

### Windows

```bat
scripts\build-windows.bat
```



### macOS

```bash
./scripts/build-macos.sh
```

Typical outputs are `.app` and `.dmg` bundles.

### Linux

```bash
./scripts/build-linux.sh
```

Available bundle formats depend on the installed Linux packaging tools and Tauri configuration.

To build manually on any supported platform:

```bash
npm run tauri build
```

Tauri builds are platform-native: build Windows installers on Windows, macOS bundles on macOS, and Linux packages on Linux.

## Versioning

HowLong? follows semantic versioning in the form `x.y.z`:


| Part | Name  | Increment when                                                     |
| ---- | ----- | ------------------------------------------------------------------ |
| `x`  | Major | A release introduces incompatible or fundamental product changes   |
| `y`  | Minor | A release adds backward-compatible functionality                   |
| `z`  | Patch | A release contains backward-compatible fixes or small improvements |


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

Contributor conventions and refactoring safeguards are documented in [AGENTS.md](AGENTS.md).

```text
.
├── src/
│   ├── app/            Application shell, navigation, localization, and global UI
│   ├── domain/         Cross-feature calculations and data transformations
│   ├── features/       Estimate, planning, analytics, comparison, models, library, and settings
│   ├── models/         Shared schemas and domain types
│   ├── platform/       Tauri integration and file import/export
│   └── shared/         Reusable components, composables, state, and small utilities
├── src-tauri/          Rust application and Tauri configuration
├── scripts/            Development, build, and smoke-test scripts
├── docs/
│   ├── guides/         English, Italian, and export guides
│   └── images/         Guide screenshots
└── package.json
```



## Data and privacy

Settings, models, and estimates are stored locally. The default location is the Tauri application data directory for `com.pietrodileo.howlong`; the estimate library can be moved to a custom folder from Settings.

You can place the custom workspace in a folder synchronized by OneDrive, Google Drive, Dropbox, or a similar service. Colleagues can share models and estimate files through the same service. Each person must install its synchronization client and select the corresponding local folder in HowLong?. Do not edit the same estimate at the same time. HowLong? uses files and has no collaborative locking or real-time conflict resolution.

Estimate files use the `.howlong.json` suffix and remain human-readable and portable.

## License

HowLong? is distributed under the terms in [LICENSE](LICENSE).
