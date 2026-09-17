# HowLong? user manual

HowLong? `0.8.0` on Windows, macOS, and Linux.

[Project README](../../README.md) · [What's new](../WHATS_NEW.md) · [Italian manual](GUIDE.it.md) · [Build and release guide](../BUILD.md)

**First session:** [Quick start](#1-quick-start) → [Settings](#3-settings) → create one estimate → **Save**.

---

## Contents

- [What's new](../WHATS_NEW.md)
- [1. Quick start](#1-quick-start)
- [2. Workspace, home, and sidebar navigation](#2-workspace-home-and-sidebar-navigation)
  - [2.1. Sidebar navigation](#21-sidebar-navigation)
  - [2.2. Home view](#22-home-view-workspace-overview)
    - [2.2.1. Key terms](#key-terms-in-your-workspace)
- [3. Settings](#3-settings)
  - [3.1. Updates](#31-updates)
  - [3.2. Synced folders](#32-synced-folders)
- [4. Models](#4-models)
- [5. Estimate editor](#5-estimate-editor)
  - [5.1. Your first estimate](#your-first-estimate)
  - [5.2. Tabs and state](#tabs-and-state)
  - [5.3. Header and totals](#header-and-totals)
  - [5.4. Activity table](#activity-table)
  - [5.5. Calculated items](#calculated-items)
  - [5.6. Contingency comparison](#contingency-comparison)
- [6. Manager and client presentation](#6-manager-and-client-presentation)
  - [6.1. Accessing presentation modes](#accessing-presentation-modes)
  - [6.2. Manager view](#manager-view)
  - [6.3. Client view](#client-view)
- [7. Save, open, reload, and recent files](#7-save-open-reload-and-recent-files)
- [8. Library](#8-library)
- [9. Compare estimates](#9-compare-estimates)
- [10. Plan with the Gantt](#10-plan-with-the-gantt)
- [11. Analytics](#11-analytics)
  - [11.1. Overview](#overview)
  - [11.2. Show tasks (several macros)](#show-tasks-in-several-macros)
  - [11.3. Focus (one macro)](#focus-single-macro)
- [12. Import, export, and backup](#12-import-export-and-backup)
  - [12.1. Choose the source view](#choosing-the-source-view-for-export)
  - [12.2. Formats and limits](#formats-and-limits)
  - [12.3. Estimate XLSX export](#estimate-xlsx-export)
  - [12.4. Gantt XLSX export](#gantt-xlsx-export)
  - [12.5. Export and backup checklist](#export-and-backup-checklist)
- [13. Keyboard shortcuts](#13-keyboard-shortcuts)
- [14. What certain screens show and don't](#14-what-certain-screens-show-and-dont)
- [15. Troubleshooting and safety](#15-troubleshooting-and-safe-practices)

---

## 1. Quick start

1. **Settings:** Set your preferred language, theme, username, and workspace. Settings save automatically.
2. **Estimate:** Click **New Estimate**. HowLong? uses the default model unless you choose another from the arrow menu.
3. Enter a name for your estimate and client, then fill in the estimated hours for each activity.
4. Click **Save**. Your file now appears in the **Library**.
5. Review the **Plan**, **Analytics**, and **Client preview** sections to check your work.

| Action           | Result                                                       |
| ---------------- | ------------------------------------------------------------ |
| **Save**   | Updates the working `.howlong.json` in Library              |
| **Export** | Creates a separate delivery file; does not save the estimate |

## 2. Workspace, Home, and Sidebar Navigation

When no estimate is open, **Home** gives you the main actions and a quick view of your workspace.

![Home screen displaying navigation, main actions, and recently opened estimates](../images/homepage.png)

---

### 2.1. Sidebar Navigation

Use the **sidebar** to move between the main areas of the app. Each icon opens one part of the estimation workflow or workspace management.

| Sidebar View        | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| **Estimate**  | Create and edit project estimates, entering effort and details           |
| **Library**   | Access and manage saved estimate files                                   |
| **Models**    | Define and edit reusable templates with categories, labels, and settings |
| **Compare**   | Visually compare estimates side by side                                  |
| **Plan**      | View project timeline (Gantt chart) using estimate data                  |
| **Analytics** | Analyze breakdowns, overviews, and details of the active estimate        |
| **Settings**  | Customize language, appearance, defaults, workspace, and user info       |
| **About**     | Read details about the app, version, and credits                         |

- **Plan** and **Analytics** always follow the currently active tab. If no estimate is open, these views prompt you to create or load one.
- You can collapse the sidebar with the double-chevron next to the logo. In compact mode, hover over any icon to see its label.

---

### 2.2. Home View (Workspace Overview)

With no estimate open, **Home** helps you start work, reopen a recent estimate, or browse the workspace.

**Home actions:**

- **New Estimate** — uses the default model; use the arrow to pick a different model
- **Open File** — load any `.howlong.json` from your system
- **Go to Library** — open your workspace’s estimate folder
- **Opened recently** — up to five of your most recent saved estimates

---

#### Key Terms in Your Workspace

| Term                        | Meaning                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| **Model**             | Reusable structure with defaults, categories, labels, formulas, and CTG |
| **Estimate**          | Project document based on a model or built from scratch                 |
| **Macro**             | Top-level activity that may contain subtasks                            |
| **Subtask**           | Activity inside a macro; its effort contributes to the macro total      |
| **Formula**           | Calculated row based on selected activities                             |
| **Contingency / CTG** | Risk allowance applied to eligible work                                |
| **Session**           | In-memory copy opened in one tab until you save                         |
| **Library**           | Local folder containing `.howlong.json` estimate files                  |

## 3. Settings

Use **Settings** to choose your language and theme, set defaults, select a workspace, and manage updates. Open it before your first estimate, then return whenever your workflow changes.

![Settings screen with collapsible configuration sections](../images/settings.png)

Open a group to see its panels. Use the search field to open the matching group and panel automatically.

![Expanded settings panels with appearance, updates, and keyboard shortcut sections](../images/settings_expanded.png)

### 3.1. Updates

Open **Settings → Updates** to check for a newer stable release manually. HowLong? does not check at startup or in the background.

![Updates panel filtered from Settings with the installed version and manual check action](../images/updates.png)

- **Check for updates** contacts the official GitHub Releases feed and only considers stable releases.
- **Download update** downloads the artifact for the current operating system and architecture but does not install it.
- **Install and restart** applies the signed update. On macOS, the first installation uses a `.dmg`; in-app updates use the signed `.app.tar.gz` updater bundle. Windows and Linux use their corresponding signed installer/AppImage artifacts.
- The updater goes directly to the newest stable release. Intermediate versions are not installed or executed, so each release must preserve or migrate existing workspace data.
- Review release notes and save/export important work before a major-version update. Browser previews cannot install updates; use the desktop app.

The steps are separate: checking does not download, and downloading does not install. Installation becomes available only after the signed download completes. If a check or download fails, the current installation stays unchanged.

The updater verifies the release signature before installation. This signature identifies the official HowLong? publisher; it does not restrict the open-source code. A fork that publishes its own builds should use its own application identifier, release endpoint, public key, and signing secret.

Each heading expands its controls, and closed sections keep their settings. Changes save automatically; the page briefly shows the save status.

**Profile and display**

- **Profile** — username recorded on save (OS username by default)
- **Language** — English or Italian UI
- **Appearance** — light or dark theme
- **Keyboard shortcuts** — active bindings; full list in [Section 13](#13-keyboard-shortcuts)

The dark theme applies to the estimate, presentation, and planning screens as well as Settings. It changes presentation only; the stored estimate values and dates are unchanged.

| Dark theme in a presentation view | Dark theme in Plan |
| -------------------------------- | ----------------- |
| ![Dark theme in Manager view](../images/dark_mode1.png) | ![Dark theme in the Gantt planning view](../images/dark_mode2.png) |

**Estimate defaults**

- **Gantt** — weekend days; hiding weekends affects display only, not saved dates
- **Estimate view** — editor defaults, including compact columns
- **Owners** — enable multiple owners per activity. Owners share responsibility equally; turning the option off keeps existing multiple assignments visible and lets you remove them, but prevents adding more.
- **Presentation** — whether manager/client notes and labels start hidden
- **Export filename** — optional date/time in generated filenames

**Workspace**

- **Workspace** — estimate and model paths; **Choose folder…** or **Use default**. The default workspace is a `HowLong` folder inside your system's "Documents" directory. Each workspace keeps its own estimates, models, and related data. Switching folders changes which data the app shows; switching back restores the previous workspace.
- **Workspace import/export** — settings and models only (estimates stay in Library)

### 3.2. Synced folders

You can place the Workspace folder inside a OneDrive, Google Drive, Dropbox, or similar synced folder. This lets a team share models and estimates through that folder.

**How it works:**

- Everyone who needs access must have the sync software installed and permission to use the shared folder.
- Colleagues see changes after their sync client downloads the updated `.howlong.json` files.

**Important usage tips:**

- *Wait for synchronization to finish* before opening a file someone else has modified.
- **Never open and edit the same estimate file at the same time on different computers.** HowLong? does not lock or merge files. Two people saving the same file can overwrite each other's changes.

**Examples:**

- *Example 1:* Your team stores `.howlong.json` files in a shared Google Drive folder. Check that Drive has finished syncing before opening a file.
- *Example 2:* A colleague edits an estimate in a Dropbox folder. Wait for Dropbox to finish syncing before opening that file on another computer.

## 4. Models

Use **Models** to create reusable starting points for estimates. A model can include standard activities, categories, macros, subtasks, contingencies, and formulas. This is useful when your projects follow a similar structure.

Bundled Italian and English models are included. Open **Models** to edit or build reusable structures.

![Model editor with model list, categories, contingency, macros, subtasks, and a formula](../images/models_example.png)

The left panel lists the models and marks the default one. The right panel contains the editor.

1. Click **New** or import a compatible model.
2. Specify the model’s name, icon, stable ID, and hours per workday.
3. Add categories as needed.
4. Set the default CTG (expand **How it works** for more information).
5. Add macros, subtasks, default effort values, CTG flags, labels, and formulas.

Drag items to reorder them. Use the chevron to show children, and click **+ Task** to add a subtask. Each row can be duplicated or deleted. Use **Save**, **Delete**, or **Export** to manage the model.

The default model is used when you select **New Estimate** or press `Ctrl/Cmd+T`. Saved estimates are snapshots: they do not update if the source model changes.

## 5. Estimate editor

The **Estimate editor** is where you build the work breakdown and calculate effort. Add macros and subtasks, enter hours, apply contingency, and review the totals. Each estimate opens in its own tab with separate unsaved state and history.

### Your first estimate

To create your first estimate:

- **From Home:** Click **New Estimate** to start with the default model, or select a different model from the list.
- **From an open document:** Use the tab bar **+** button to open a new estimate (default model), or pick a model from the list.

![Searchable model picker opened from the new-tab control](../images/shortcut_new_estimate_from_model.png)

![Estimate editor with totals, contingency controls, and the full activity table](../images/estimate_view.png)

Each tab has its own unsaved state and history.

![Estimate editor with multiple tabs, totals, macros, subtasks, notes, and a formula](../images/new_estimate_with_tabs.png)

### Tabs and state

| Signal               | Meaning                                     |
| -------------------- | ------------------------------------------- |
| Dark underline       | Active tab                                  |
| Dirty dot            | Unsaved changes                             |
| Close tab            | Asks for confirmation if dirty              |
| Open same file again | Switches to the existing tab (no duplicate) |

Each tab has its own undo/redo: `Ctrl/Cmd+Z`; redo is `Ctrl+Y` (Windows/Linux) or `Cmd+Shift+Z` (macOS).

### Header and Totals

At the top, you can edit the **title**, **client**, and **icon** for your estimate. The **Base**, **CTG** (contingency), and **Total** effort values are displayed in both hours and days.

The toolbar gives you quick access to units, hours per day, global contingency (CTG), contingency comparison, column visibility, export, reload, save, and client preview.

Changing **hours per day** changes only the display of person-days. HowLong? always stores effort in hours.

### Activity table

| Column       | Description                                                    |
| ------------ | -------------------------------------------------------------- |
| Name         | Activity title: macro, subtask, or formula shown in the hierarchy |
| Category     | Category/group; may be targeted for contingency (CTG)          |
| Hours / Days | Estimated base effort, before contingency (CTG)                |
| Apply CTG    | Whether this row receives added contingency                    |
| CTG          | Calculated contingency amount                                  |
| With CTG     | Total effort with contingency included (base + CTG)            |
| Custom CTG % | Row-specific contingency percentage override                   |
| Owners       | One owner, or multiple equal-responsibility owners when enabled in Settings |
| Label        | Custom tags for filtering or grouping                          |
| Notes        | Internal notes; not shown to client by default                 |
| Actions      | Add subtask, edit formula, duplicate, or delete this row       |

**Editing**

- Click a cell to edit it
- Add macros or formulas with the buttons below the table
- Subtasks sum into the macro; CTG on a macro applies to its children
- Drag the handle to reorder rows

**Notes and columns**

- Double-click a note → extended editor (`Ctrl+Enter` to save)
- Double-click a column header → collapse or expand that column

### Calculated items

**Calculated items** get their values from other activities through a formula. Use them when a number should update automatically, for example when it is the sum or average of selected rows. They update whenever the referenced activities change.

A formula is `aggregation(selected rows) × percentage`.

| Aggregation | Options                                                 |
| ----------- | ------------------------------------------------------- |
| Math        | Sum · average · min · max                            |
| CTG         | Applies only when **Apply CTG** is on for that row |

### Contingency Comparison

Use contingency comparison to test different CTG percentages without changing the base effort. It shows three what-if scenarios side by side so you can choose the margin that fits the project.

![Three contingency scenarios above the estimate table](../images/compare_contingency.png)

Compare scenarios **A**, **B**, and **C** while **base effort stays fixed**.

1. Set the percentages in the panel.
2. Click **Use** under a scenario to apply it to the current session.
3. Click **Save** to keep the choice or **Close** to hide the panel.

## 6. Manager and Client Presentation

HowLong? has three presentation modes. **Estimator** is the working view, **Manager** prepares the estimate for sharing, and **Client** shows the selected public information.

| Feature / View               | Estimator View                                 | Manager View                                       | Client View                                   |
| ---------------------------- | ---------------------------------------------- | -------------------------------------------------- | --------------------------------------------- |
| **Audience**           | Internal estimator (you)                       | Managers preparing to share with clients           | End clients                                   |
| **Access**             | Main editing screen                            | Via Client Preview > Manager tab                   | Via Client Preview > Client tab               |
| **Editable**           | Full—add/edit activities, formulas, structure | Can adjust displayed totals, visibility, notes     | No editing—read-only, simplified for clarity |
| **Columns**            | All columns visible and editable               | Can customize column visibility in export          | Only selected columns/fields for clarity      |
| **Notes & Labels**     | Fully editable                                 | Can show/hide for export                           | Only display if allowed by manager            |
| **Contingency & CTG**  | Editable and visible in calculation            | Shown, can present as rounded/renamed totals       | Shown as rounded, client-friendly numbers     |
| **Presentation Logic** | Core calculations unaffected by changes here   | Presentation changes don't affect base logic       | Follows manager settings, can’t override     |
| **Export**             | Typically for internal review                  | Creates client-ready file with manager adjustments | Final client-facing output                    |
| **Compare Deltas**     | Not shown                                      | Can preview/edit differences in totals             | Presented only as defined by manager          |

Use these modes to prepare different levels of detail without changing the underlying estimate calculations.

### Accessing Presentation Modes

Click **Client preview** in the estimate header. The preview opens the Manager and Client layouts side by side.

---

### Manager View

Use the Manager view to prepare what will be shown to the client. It is for presentation changes, not for changing the estimate's calculation rules.

![Manager view with visibility, presented totals, deltas, notes, and redistribution](../images/manager_view.png)

You can adjust displayed totals, choose which rows are included, and control notes and labels. The view also shows the difference between calculated and presented totals.

| Control                      | What it does                                                         |
| ---------------------------- | -------------------------------------------------------------------- |
| Client title, rounding, unit | Set how totals are labeled and formatted on export                   |
| Presented total              | Edit the value shown; see the difference from calculated base or CTG |
| Include / exclude            | Choose which rows appear in the client output                        |
| Labels and notes             | Adjust content that will be passed downstream                        |
| **Redistribute**       | Evenly allocate a changed macro total among its child tasks          |

All adjustments here are **for presentation only**. They do not alter the calculation logic. Export from this view to create the manager-adjusted client file.

---

### Client View

The Client view is the read-only version prepared for the client. It applies the manager's filters and presentation changes.

![Client view with chosen activities and simplified hours and days](../images/client_view.png)

Use this view to check exactly what the client will receive.

| Control        | Effect                         |
| -------------- | ------------------------------ |
| **Subs** | Show or hide child activities  |
| Notes / labels | Visible only when enabled      |
| Hours / days   | Presented values with rounding |

**Export** creates the client delivery file with the included activities, manager edits, and visibility filters. Review this view before sending.

**Back to estimate** leaves the preview. **Save** stores presentation changes in the estimate.

## 7. Save, open, reload, and recent files

This section covers the basic file actions: save the active estimate, open another file, reload the last saved version, and reopen recent work.

| Action                           | What it does                                                 |
| -------------------------------- | ------------------------------------------------------------ |
| **Save** / `Ctrl/Cmd+S`  | Write the active estimate to Library                         |
| **Open File**              | Load a `.howlong.json` from outside Library                 |
| **Reload**                 | Replace the tab with the last saved file (confirms if dirty) |
| **Opened recently** (Home) | Open one of the five latest Library estimates                |

Each save records username, time, and an audit entry. The status line shows the last save.

**Desktop vs browser:** use `npm run tauri:dev` for the full app. `npm run dev` shows the UI only, without native file dialogs or filesystem access.

## 8. Library

The **Library** is the list of saved estimates in the current workspace. Search, sort, open, compare, import, export, duplicate, or delete files from here.

![Library with search, sorting, selection, import, export, comparison, and row actions](../images/library.png)

| Step | Action                                     |
| ---- | ------------------------------------------ |
| 1    | Search by title or client                  |
| 2    | Sort by name, client, or date              |
| 3    | Select rows → compare or bulk export      |
| 4    | **Open** → create or activate a tab |
| 5    | Row menu → duplicate or delete            |

**Import JSON** copies a compatible estimate into Library. Toolbar: open folder · settings · refresh scan. One selected row → one file; several → ZIP. Delete removes the file from disk.

## 9. Compare estimates

Compare multiple estimates side by side. This view is read-only; it never merges files.

> Compare uses the **last saved** version of each estimate. Unsaved changes in an open tab do not appear.

**Open:** sidebar **Compare**, or select ≥2 Library rows → **Compare**.

![Comparison screen with the collapsed selector and aligned estimate values](../images/compare.png)

| Area        | What you can do                                  |
| ----------- | ------------------------------------------------ |
| Left panel  | Search, sort, and choose estimates to compare    |
| Right table | Each estimate is a column; rows align by task    |
| Above table | Switch units (hours/days) and set conversion     |
| Bottom rows | See base effort, contingency (CTG), and total with CTG |

Rows are grouped by category, and you can expand or collapse macros using chevrons. Collapse the selector with the arrow at its top to give the comparison table more space; selected estimates remain available as icons. Formula rows show their formula summary and the CTG percentage applied in each estimate column. An empty cell means that the activity does not exist in that estimate, not that it has zero hours. Comparing never edits your files.

## 10. Plan with the Gantt

> Activity statuses and shared-note controls were added in version 0.6.1.

Use the Gantt planner to put activities on a calendar. Set dates, resize bars, update statuses, and inspect the project timeline.

Plan changes dates and planning details only. It never changes effort or contingency (CTG).

To get started: Open your estimate, then click **Plan**.

![Expanded Gantt with activity controls and daily timeline](../images/gantt_1.png)

| Panel | Description                              |
| ----- | ---------------------------------------- |
| Left  | Activities with dates, category colors, statuses, notes, and tools |
| Right | Timeline — highlighted column = today   |

Gantt bars represent **date ranges** for each activity; length shows duration, not effort.

**How to schedule work:**

1. Select a date and click **To schedule**, or double-click an empty cell.
2. Adjust start/end dates directly in the row, or drag/rescale the bar on the timeline.
3. Use **From/To** to limit visible dates; **Today** jumps to today’s column.
4. Toggle between **Days** or **Months**; **Show weekends** follows your app Settings.
5. Use quick tools: **Expand all**, **Collapse all**, and **Export XLSX**. **Add Macro** is available below the timeline.

**Tips:**

- The category color fills the dot; the outer ring shows activity status.
- Click a leaf activity's status to update it, or use the note icon to edit the same note shown in estimate views.
- Macro statuses are calculated from their sub-tasks.
- Collapsing a macro hides its child tasks.
- A macro's bar stretches from its earliest child start to the latest child finish.
- Deleting an owner from the owner picker asks for confirmation; confirming removes that owner from every activity in the current estimate.

![Compact Gantt with the activity panel collapsed](../images/gantt_2_collapsed.png)

You can resize the activity panel using the divider. Collapse for a larger timeline view, then use the top-left arrow to reopen.

Use **Save** in the Plan header to persist date, status, note, owner, and color changes. A dirty dot on the button indicates unsaved scheduling changes.

When exporting to XLSX, HowLong? uses the current view's scale, visible date range, and weekend settings. The export keeps the timeline columns after these fixed activity columns: `Activity`, `Macro`, `Start`, `End`, `Base (days)`, `Base + CTG (days)`, `Planned (days)`, `Status`, `Notes`, and `Owners`. `Planned (days)` counts the scheduled range using the working-day weekend setting.

## 11. Analytics

Analytics shows how base effort and contingency (CTG) are distributed across macros and activities. The charts are read-only, so you can inspect the estimate without changing it. Open an estimate and click **Analytics**.

![Analytics overview with summary cards, macro donut, and stacked bars](../images/analytics.png)

### Overview

| Element       | What it shows                                                       |
| ------------- | ------------------------------------------------------------------- |
| Summary cards | Totals: Base, Contingency, Base + contingency, and CTG rate         |
| Hours/Days    | All values converted based on your estimate’s hours per day        |
| Donut         | Share by activity/macro; center displays the selected metric’s sum |
| Bars          | Follows the selected metric; combined mode shows base (solid) and CTG (striped) side by side |

The shared selector controls the donut, bars, and owner distribution. **Base + contingency** is the default and first option, followed by Base and Contingency. In single-metric modes the bars rescale to that metric; combined mode keeps base and CTG visually distinct. Macros with subtasks have a task icon and can be explored. Hover over segments or labels to see percentages.

Owner distribution includes unassigned work and divides a multi-owner activity equally among its owners. A donut shows each owner's share, while bars compare workloads on one common scale and separate base effort from contingency in combined mode. Both charts follow the shared metric selector, omit zero-value owners, and keep deterministic owner colors. Select a donut segment or bar to keep the charts visible and open the assigned macros, subtasks, and calculated items below; their type markers share one aligned column, and a separate Effort column shows each row's share of the selected metric. Lists longer than eight owners scroll within the chart.

The **Planning analytics** section shows how much active operational effort has a planning range, the status mix within each category, and how many scheduled activities overlap each week or month. Status shares can be weighted by the selected effort metric or by activity count. Cancelled activities remain available in status details but do not contribute to operational percentages or the timeline; formulas and aggregate macros are excluded to avoid double counting. Select a coverage card, status segment, or timeline period to inspect the contributing activities. Planning analytics describes calendar placement and does not infer progress, capacity, lateness, or schedule health.

### Show tasks (in several macros)

Use **Show tasks** to select macros and expand their subtasks in both charts simultaneously.

![Analytics with tasks from two selected macros shown in both charts](../images/analytics_with_sub.png)

Only macros with subtasks are available and listed by name. Select any combination to mix expanded subtasks with unchanged macros in the charts. Click **Clear selection** to return to the macro-only view. Subtasks appear with an arrow and a tooltip naming their parent macro.

### Focus (single macro)

Zoom in on the details for a specific macro by clicking it in the donut, legend, or bar chart.

![Analytics focused on the subtasks of one macro](../images/analytics_macro_details.png)

Both charts will display only that macro’s subtasks. Click **All macros** to return to the full overview.

| Mode                 | When to use                                               |
| -------------------- | --------------------------------------------------------- |
| **Focus**      | Investigate one macro’s subtasks in detail               |
| **Show tasks** | Expand and compare several macros inside the distribution |

Analytics mode is temporary and local to each tab; switching to another document resets your view.

## 12. Import, export, and backup

Use this section to choose what to export, share a suitable view, and keep a recoverable backup. The native JSON format is the one to use when you need to reopen or import an estimate.

Sample files are available in [`examples/`](../../examples/).

### Choosing the Source View for Export

The **source view** decides which values and fields appear in the export. Choose the view that matches the person who will read the file:

| Source   | Contents Included                                                                  | Best For               |
| -------- | ---------------------------------------------------------------------------------- | ---------------------- |
| Estimate | Complete calculation, full hierarchy, formulas, CTG, notes, and labels             | Technical handover     |
| Manager  | Rounded numbers, redistributed/adjusted values as shown to managers                | Internal approval      |
| Client   | Only included activities, visible hierarchy, presented values, public notes/labels | Client delivery        |
| Gantt    | Dates, hierarchy, status, owner, notes, colors, base/CTG/planned days, and timeline | Timeline communication |

| Format       | Purpose                                                                |
| ------------ | ---------------------------------------------------------------------- |
| HowLong JSON | Native full estimate; **the only format that supports re-import**   |
| YAML         | Structured for AI (e.g., for Jira draft generation); not re-importable |
| XLSX         | User-friendly snapshot view from any source above                      |
| ZIP          | Archive containing multiple Library exports                            |

Once you export, use **Open** in the completion dialog (on desktop, this links to the file location; in browsers, it starts the download).

![Export completion message with Open File action](../images/exported_element.png)

**Backup:** Save both the workspace (settings and models) and the Library (estimates).

| Action                   | What it does                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Save**           | Updates the active estimate in your Library                                  |
| **Export → JSON** | Exports a portable `.howlong.json` backup, including from Manager/Client screens |

YAML exports from Estimate and Manager contain enough detail for AI tools to draft Jira epics, tickets, or risk logs. Review them before using them in an automated workflow. Client YAML is filtered for public sharing. YAML exports never trigger actions by themselves.

### Formats and limits

| Format | Purpose and limits |
| ------ | ------------------ |
| **`.howlong.json`** | Complete, validated native format; the only format that can be reopened or imported into HowLong. Preserves metadata, hierarchy, calculations, CTG rules, presentation, and planning. |
| **YAML** | Structured format for reading, sharing, and assisted AI workflows; it cannot be imported into HowLong. |
| **XLSX** | Human-readable snapshot generated from the selected view; editing it does not update the estimate and it cannot be re-imported as a native document. |
| **ZIP** | Container for multiple exports selected from the Library; each file keeps its original format and purpose. |

The exported JSON is a separate, portable copy of the session. Use it to move an editable estimate between installations or to create a backup before risky changes. A Client export is not a complete backup because it may omit hidden activities and internal details.

### Estimate XLSX export

An XLSX export from the Estimate or Client view includes the title, client, unit, hours per day, CTG percentage, hierarchy, hours, days, contingency, presented totals, and notes. The detailed layout keeps each subtask below its parent macro:

![Client estimate Excel export with expanded macros and subtasks](../images/client_estimate_excel_1.png)

For a compact macro summary, use Excel's outline controls on the left. Click **2** to keep macros and subtasks visible, or **1** to collapse the detail and show only macros. You can also click a macro's **−** control to collapse one group; it becomes **+** when the group can be reopened.

Collapsing hides child rows in Excel; it does not remove data from the estimate or change totals.

![Excel export compressed to macro rows with the outline controls](../images/client_estimate_excel_2_rapid_compression.png)

### Gantt XLSX export

Use **Export XLSX** from **Plan**. The workbook contains the estimate title, client, visible date range, timeline scale, weekend display setting, a color legend, and one row per macro or subtask. Each activity row includes:

| Column | Meaning |
| ------ | ------- |
| `Activity` / `Macro` | Activity name and parent macro |
| `Start` / `End` | Scheduled dates; macro dates aggregate its children |
| `Base (days)` | Base effort converted using the estimate's hours per day |
| `Base + CTG (days)` | Effort including contingency, converted to days |
| `Planned (days)` | Number of days in the scheduled range; weekend days follow the working-day setting |
| `Status` / `Notes` / `Owners` | Operational status and activity metadata |
| Timeline columns | Daily or monthly cells for the exported range |

The former Planning column is not included. The export is a snapshot of the current Gantt range and does not replace the native estimate export or alter the estimate.

![Gantt Excel export with dates, statuses, legend, and calendar bars](../images/gantt_excel.png)

### Export and backup checklist

1. Confirm the active estimate and choose **Estimate**, **Manager**, **Client**, or **Plan** for the audience.
2. For Manager and Client, check inclusions, rounding, redistributed totals, subtasks, notes, and labels in the view.
3. Choose JSON for recovery, YAML for data/AI workflows, and XLSX for human review or delivery.
4. Open the generated file from the completion message and verify its title, totals, and visible activities.
5. Keep a `.howlong.json` copy whenever the work must remain editable.

For a complete backup, save both the workspace (settings and models) and the Library (estimates). A synced folder mirrors files but does not provide simultaneous collaboration: wait for synchronization and do not edit the same `.howlong.json` on multiple computers at once.

## 13. Keyboard Shortcuts

Keyboard shortcuts cover navigation, editing, tabs, and common actions. They are customizable, so the list in **Settings → Keyboard Shortcuts** is the source of truth for your installation.

macOS: substitute `Cmd` for `Ctrl/Cmd` in the tables below.

| Shortcut           | Action                              | Notes                    |
| ------------------ | ----------------------------------- | ------------------------ |
| `Ctrl/Cmd+S`     | Save active estimate                | Works from Plan, etc.    |
| `Ctrl/Cmd+T`     | Open new tab (default model)        | Skips model picker       |
| `Ctrl/Cmd+W`     | Close active tab                    | Prompts if unsaved       |
| `Ctrl/Cmd+E`     | Toggle between estimate/client view | Editor only              |
| `Ctrl/Cmd+Left`  | Previous tab                        | Does not save            |
| `Ctrl/Cmd+Right` | Next tab                            | Does not save            |
| `Ctrl/Cmd+Z`     | Undo                                | Active tab only          |
| `Ctrl+Y`         | Redo                                | Windows, Linux           |
| `Cmd+Shift+Z`    | Redo                                | macOS                    |
| `Ctrl+Enter`     | Save extended note                  | When note editor is open |

If a shortcut changes, the authoritative source is always Settings → Keyboard shortcuts.

## 14. What certain screens show and don't

**Limits:**

- Example screenshots may use placeholder names, values, dates, paths, or usernames
- “Home recents” is a quick view; your full Library may include more files
- Browser development mode may lack native dialogs or full filesystem access

**What these screens *don’t* do:**

- Gantt bars display timeline dates, not effort; the Plan screen does not recalculate hours
- Analytics charts are *read-only*—they visualize, but do not edit, estimates
- Manager-level overrides do not alter the underlying math
- Client view omits some inclusions, subtasks, notes, and label settings based on visibility
- Workspace backup covers settings and models, but *not* your entire estimate Library

## 15. Troubleshooting and Safe Practices

| Problem                      | Solution                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Saved estimate missing       | Check the Workspace/Estimates path, refresh the Library, and review open tabs                                  |
| CTG is zero                  | Apply CTG and set a global or custom percentage; formulas also need **Apply CTG**                              |
| Client can’t see an item     | Check Manager inclusion and the Client **Subs**, notes, and labels settings                                   |
| Import rejected              | Import only native HowLong JSON; YAML or generic JSON is not a `.howlong.json` file                           |
| File actions fail in browser | Run `npm run tauri:dev`                                                                                         |

**Before any risky actions:**

1. Save before closing, reloading, or changing the workspace folder.
2. Export a HowLong JSON for a portable backup.
3. Back up the workspace and Library separately.
4. Treat delete, reload, and workspace import as destructive actions.

For installation, development, testing, versioning, and the stable-release feature history, see the [Build and release guide](../BUILD.md), [What's new](../WHATS_NEW.md), and the [README](../../README.md).
