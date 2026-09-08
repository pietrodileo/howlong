# HowLong? user manual

HowLong? `0.6.1` on Windows, macOS, and Linux.

[Project README](../../README.md) · [Manuale italiano](GUIDE.it.md)

**First session:** [Quick start](#1-quick-start) → [Settings](#3-settings) → create one estimate → **Save**.

---

## Contents

- [1. Quick start](#1-quick-start)
- [2. Workspace and navigation](#2-workspace-and-navigation)
  - [2.1. Sidebar](#21-sidebar)
  - [2.2. Home actions](#22-home-actions)
    - [2.2.1. Key terms](#221-key-terms)
- [3. Settings](#3-settings)
  - [3.1. Synced folders](#31-synced-folders)
- [4. Models](#4-models)
- [5. Estimate editor](#5-estimate-editor)
  - [5.1. Your first estimate](#51-your-first-estimate)
  - [5.2. Tabs and state](#52-tabs-and-state)
  - [5.3. Header and totals](#53-header-and-totals)
  - [5.4. Activity table](#54-activity-table)
  - [5.5. Calculated items](#55-calculated-items)
  - [5.6. Contingency comparison](#56-contingency-comparison)
- [6. Manager and client presentation](#6-manager-and-client-presentation)
  - [6.1. Accessing presentation modes](#61-accessing-presentation-modes)
  - [6.2. Manager view](#62-manager-view)
  - [6.3. Client view](#63-client-view)
- [7. Save, open, reload, and recent files](#7-save-open-reload-and-recent-files)
- [8. Library](#8-library)
- [9. Compare estimates](#9-compare-estimates)
- [10. Plan with the Gantt](#10-plan-with-the-gantt)
- [11. Analytics](#11-analytics)
  - [11.1. Overview](#111-overview)
  - [11.2. Show tasks (several macros)](#112-show-tasks-several-macros)
  - [11.3. Focus (one macro)](#113-focus-one-macro)
- [12. Import, export, and backup](#12-import-export-and-backup)
  - [12.1. Choose the source view](#121-choose-the-source-view)
- [13. Keyboard shortcuts](#13-keyboard-shortcuts)
- [14. What screens do not show or change](#14-what-screens-do-not-show-or-change)
- [15. Troubleshooting and safety](#15-troubleshooting-and-safety)

---

## 1. Quick start

1. **Settings** — Set your preferred language, theme, username, and workspace, then click **Save**.
2. **Estimate** — Click **New Estimate** (the default model is used unless you select a different one using the arrow menu).
3. Enter a name for your estimate and client, then fill in the estimated hours for each activity.
4. Click **Save** — your file will now appear in the **Library**.
5. Review the **Plan**, **Analytics**, and **Client preview** sections to check your work.

| Action           | Result                                                       |
| ---------------- | ------------------------------------------------------------ |
| **Save**   | Updates the working`.howlong.json` in Library              |
| **Export** | Creates a separate delivery file; does not save the estimate |

## 2. Workspace, Home, and Sidebar Navigation

When you start *HowLong?* or close all estimates, the **Home** view appears, showing key actions and a navigation overview.

![Home screen displaying navigation, main actions, and recently opened estimates](../images/homepage.png)

---

### 2.1. Sidebar Navigation

The **sidebar** is your central navigation panel—use it to switch instantly between major areas of the app. Each sidebar icon leads to a feature supporting your estimation workflow or workspace management.

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

Please note that:

- **Plan** and **Analytics** always follow the currently active tab. If no estimate is open, these views prompt you to create or load one.
- You can collapse the sidebar with the double-chevron next to the logo. In compact mode, hover over any icon to see its label.

---

### 2.2. Home View (Workspace Overview)

With no estimate open, the **Home** screen helps you get started, resume recent work, or explore your workspace. It centralizes your most-used tasks for quick access.

**Home actions:**

- **New Estimate** — uses the default model; use the arrow to pick a different model
- **Open File** — load any `.howlong.json` from your system
- **Go to Library** — open your workspace’s estimate folder
- **Opened recently** — up to five of your most recent saved estimates

---

#### Key Terms in Your Workspace

| Term                        | Meaning                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| **Model**             | Reusable structure: stores defaults, categories, labels, formulas, CTG |
| **Estimate**          | Project document based on a model or built from scratch                |
| **Macro**             | Top-level activity in an estimate; may contain subtasks                |
| **Subtask**           | Activity within a macro; its effort totals to the macro                |
| **Formula**           | Calculated row using selected activities                               |
| **Contingency / CTG** | Risk allowance applied to eligible work                                |
| **Session**           | In-memory copy opened in one tab until you save                        |
| **Library**           | Local folder containing all`.howlong.json` estimate files            |

## 3. Settings

The **Settings** section lets you tailor HowLong? to your personal workflow, team standards, and workspace organization. Configure user details, interface language, appearance, workspace location, estimate defaults, export formats, and more. Use Settings before you begin your first estimate to ensure your environment matches your needs, and revisit any time as requirements change.

Open **Settings** before your first estimate.

![Settings screen with collapsible configuration sections](../images/settings.png)

Each heading expands its controls. Closed sections still hold settings. **Save** after changes — a preview alone does not persist.

**Profile and display**

- **Profile** — username recorded on save (OS username by default)
- **Language** — English or Italian UI
- **Appearance** — light or dark theme
- **Keyboard shortcuts** — active bindings; full list in [Section 13](#13-keyboard-shortcuts)

**Estimate defaults**

- **Gantt** — weekend days; hiding weekends affects display only, not saved dates
- **Estimate view** — editor defaults, including compact columns
- **Presentation** — whether manager/client notes and labels start hidden
- **Export filename** — optional date/time in generated filenames

**Workspace**

- **Workspace** — estimate and model paths; **Choose folder…** or **Use default** (the default workspace is a `HowLong` folder inside your system's "Documents" directory).All your estimates, models, and related data are synced with your selected workspace folder. If you change the workspace location, the app will show the data in the current folder—switching back to a previous workspace will reveal your data as you left it. Changing workspaces does not cause data loss; each workspace keeps its own data.
- **Workspace import/export** — settings and models only (estimates stay in Library)

### 3.1. Synced folders

You can set your Workspace folder to a location that is kept in sync by a cloud service like OneDrive, Google Drive, Dropbox, or a similar tool. This enables you and your colleagues to share models and estimates automatically, just by working in a shared folder.

**How it works:**

- Everyone who needs access must have the appropriate sync software (e.g., OneDrive, Google Drive, Dropbox) installed and permission to access the shared folder.
- As you save or update `.howlong.json` files, your colleagues will see the changes once their sync client updates.

**Important usage tips:**

- *Wait for the sync to finish* before opening a file that someone else has just modified. For example, if someone saves an estimate, the others should let their sync client fully update before opening the same file.
- **Never open and edit the same estimate file at the same time on different computers.** There is no locking or auto-merge support — if two people save changes to the same file, they can accidentally overwrite each other's work, and you may lose data.

**Examples:**

- *Example 1:* Your team uses Google Drive to keep all `.howlong.json` estimate files in a shared folder. Before someone opens an `.howlong.json` file, he should check that Google Drive has finished syncing.
- *Example 2:* A colleague edits an estimate in a Dropbox-synced folder. She lets Dropbox finish syncing before telling someone else he can open it on his laptop. They avoid opening it at the same time to prevent any conflicts.

## 4. Models

The **Models** section allows you to define, edit, and manage reusable project structures for your estimates. Models save you time and ensure consistency by capturing your team's standard activities, categories, macros, subtasks, contingencies, and effort formulas, so you don't need to start from scratch for every new estimate. Use this section to build templates tailored to your typical projects, making it easy to create new, accurate estimates with predefined logic. Models are especially useful for teams with recurring project types, standard categories, or those who want to enforce best practices in their planning workflow.

Bundled Italian and English models are included. Open **Models** to edit or build reusable structures.

![Model editor with model list, categories, contingency, macros, subtasks, and a formula](../images/models_example.png)

The left panel displays the list of models (with the default one indicated); the right panel shows the editor.

1. Click **New** or import a compatible model.
2. Specify the model’s name, icon, stable ID, and hours per workday.
3. Add categories as needed.
4. Set the default CTG (expand **How it works** for more information).
5. Add macros, subtasks, default effort values, CTG flags, labels, and formulas.

Drag and drop items to reorder them. Use the chevron to expand and show children. Click **+ Task** to add a subtask. Each row has options to duplicate or delete (trash) the item. Use **Save**, **Delete**, or **Export** to manage the model.

The default model is used when you select **New Estimate** or press `Ctrl/Cmd+T`. Keep in mind that saved estimates are snapshots—they do not update if the source model changes.

## 5. Estimate editor

The **Estimate editor** is where you create, view, and modify detailed project estimates. Use this section to break down your work into activities, apply contingencies, organize tasks hierarchically, and calculate both base and adjusted effort. The editor is designed to help you plan project time and cost accurately while giving you full control over task structure and estimates. It features multi-tab support for working on several estimates or sessions at once, intuitive editing and reordering, and powerful tools for aggregating and comparing effort. Whether you’re building new estimates from scratch, revising saved ones, or collaborating with your team, the Estimate editor provides all the features you need for precise, flexible project planning.

### Your first estimate

To create your first estimate:

- **From Home:** Click **New Estimate** to start with the default model, or select a different model from the list.
- **From an open document:** Use the tab bar **+** button to open a new estimate (default model), or pick a model from the list.

![Searchable model picker opened from the new-tab control](../images/shortcut_new_estimate_from_model.png)

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

The toolbar gives you quick access to: unit selection · hours per day · global contingency (CTG) · contingency comparison · column visibility · export · reload · save · and client preview.

Adjusting **hours per day** only changes how person-days are displayed—underlying effort is always stored in hours.

### Activity table

| Column       | Description                                                    |
| ------------ | -------------------------------------------------------------- |
| Name         | Activity title—macro, subtask, or formula, shown in hierarchy |
| Category     | Category/group; may be targeted for contingency (CTG)          |
| Hours / Days | Estimated base effort, before contingency (CTG)                |
| Apply CTG    | Whether this row receives added contingency                    |
| CTG          | Calculated contingency amount                                  |
| With CTG     | Total effort with contingency included (base + CTG)            |
| Custom CTG % | Row-specific contingency percentage override                   |
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

Rows marked as "calculated items" use formulas to automatically compute values based on other activities in your estimate. Instead of manually entering effort, these rows aggregate or transform data from selected macros or subtasks—such as summing, averaging, or applying a custom calculation. Calculated items update in real time when the activities they reference change, ensuring totals and derived values always stay accurate and consistent throughout your estimate.

A formula is `aggregation(selected rows) × percentage`.

| Aggregation | Options                                                 |
| ----------- | ------------------------------------------------------- |
| Math        | Sum · average · min · max                            |
| CTG         | Applies only when**Apply CTG** is on for that row |

### Contingency Comparison

Contingency comparison lets you explore how different contingency percentages impact your estimate without changing your base effort. By modeling multiple "what-if" scenarios side by side, you can communicate risk, show the effect of buffer choices, and help stakeholders make informed decisions about which level of contingency best fits the project's needs.

![Three contingency scenarios above the estimate table](../images/compare_contingency.png)

Compare scenarios **A**, **B**, and **C** while **base effort stays fixed**.

1. Set percentages in the panel
2. **Use** — apply one scenario to the current session
3. **Save** — keep the choice; **Close** — hide the panel

## 6. Manager and Client Presentation

There are three main presentation modes: **Estimator**, **Manager**, and **Client**. Each mode is designed for a different audience and offers varying levels of detail and control over what information is displayed or editable.

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

These presentation modes let you adapt how your estimate is delivered for internal or external review without altering your core calculations or data.
Each view ensures the right level of detail is shown to the intended audience while protecting sensitive information as needed.

### Accessing Presentation Modes

To open these views, use the **Client preview** button in the estimate header. This brings up a side-by-side page showing both the manager and client layouts, so you can easily compare what each will see.

---

### Manager View

The Manager view is designed for internal use, letting you finalize and adjust the estimate before sharing with the client.

![Manager view with visibility, presented totals, deltas, notes, and redistribution](../images/manager_view.png)

You can:

- Fine-tune totals and tweak how numbers are shown.
- Add, hide, or annotate information that should—or shouldn’t—appear in the client export.
- Visually identify changes between calculated totals and what will be presented.

| Control                      | What it does                                                         |
| ---------------------------- | -------------------------------------------------------------------- |
| Client title, rounding, unit | Set how totals are labeled and formatted on export                   |
| Presented total              | Edit the value shown; see the difference from calculated base or CTG |
| Include / exclude            | Choose which rows appear in the client output                        |
| Labels and notes             | Adjust content that will be passed downstream                        |
| **Redistribute**       | Evenly allocate a changed macro total among its child tasks          |

All adjustments here are **for presentation only**—they don't alter your calculation logic. Export from this view to generate a manager-adjusted file for client delivery.

---

### Client View

The Client view displays a simplified version of the estimate, reflecting only the information and layout meant for the client. It automatically applies your filtering and any manager edits.

![Client view with chosen activities and simplified hours and days](../images/client_view.png)

Preview what the client receives.

| Control        | Effect                         |
| -------------- | ------------------------------ |
| **Subs** | Show or hide child activities  |
| Notes / labels | Visible only when enabled      |
| Hours / days   | Presented values with rounding |

**Export** creates the client delivery file — included activities, manager edits, and your visibility filters applied. Review this view before sending.

**Back to estimate** leaves the preview. **Save** stores presentation changes in the estimate.

## 7. Save, open, reload, and recent files

Managing your estimates efficiently means knowing how to save your work, open existing files, reload previous versions, and quickly access your most recent files. This section explains the different ways you can interact with your estimate files, whether you’re editing, reviewing, or organizing your work.

| Action                           | What it does                                                 |
| -------------------------------- | ------------------------------------------------------------ |
| **Save** / `Ctrl/Cmd+S`  | Write the active estimate to Library                         |
| **Open File**              | Load a`.howlong.json` from outside Library                 |
| **Reload**                 | Replace the tab with the last saved file (confirms if dirty) |
| **Opened recently** (Home) | Open one of the five latest Library estimates                |

Each save records username, time, and an audit entry. The status line shows the last save.

**Desktop vs browser:** use `npm run tauri:dev` for the full app. `npm run dev` shows the UI only — no native file dialogs or filesystem access.

## 8. Library

The Library is where you manage all your saved estimates in one place. This section explains how to search, organize, open, compare, and export your estimates, making it easy to keep track of your work and quickly find or share the files you need.

Easily manage your saved estimates: search, sort, open, compare, import, export, duplicate, and delete them as needed.

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

Align multiple estimates side by side. Read-only — nothing is merged.

> Compare uses the **last saved** version of each estimate. Unsaved changes in an open tab do not appear.

**Open:** sidebar **Compare**, or select ≥2 Library rows → **Compare**.

![Comparison screen with estimate selection and aligned values](../images/compare.png)

| Area        | What you can do                                  |
| ----------- | ------------------------------------------------ |
| Left panel  | Search, sort, and choose estimates to compare    |
| Right table | Each estimate is a column; rows align by task    |
| Above table | Switch units (hours/days) and set conversion     |
| Bottom rows | See totals for base effort and contingency (CTG) |

Rows are grouped by category, and you can expand subtasks using chevrons. When a cell is empty, it means that activity doesn’t exist in that estimate—it does *not* mean zero hours. Comparing never edits your files.

## 10. Plan with the Gantt

The Gantt planner lets you schedule your project visually by laying out activities on a timeline. Assign dates, sequence tasks, and spot dependencies or bottlenecks with intuitive tools like date pickers, drag-to-resize bars, and timeline zoom. You can see the full project at a glance or zoom in to fine-tune specific activities, helping you organize work clearly for your team and stakeholders.

Planning with Gantt is all about setting your schedule—it never changes total effort or contingency (CTG). Move and adjust dates with confidence, knowing your estimates remain unchanged.

To get started: Open your estimate, then click **Plan**.

![Expanded Gantt with activity controls and daily timeline](../images/gantt_1.png)

| Panel | Description                              |
| ----- | ---------------------------------------- |
| Left  | Activities with dates, colors, and tools |
| Right | Timeline — highlighted column = today   |

Gantt bars represent **date ranges** for each activity; length shows duration, not effort.

**How to schedule work:**

1. Select a date and click **To schedule**, or double-click an empty cell.
2. Adjust start/end dates directly in the row, or drag/rescale the bar on the timeline.
3. Use **From/To** to limit visible dates; **Today** jumps to today’s column.
4. Toggle between **Days** or **Months**; **Show weekends** follows your app Settings.
5. Use quick tools: **Expand all**, **Collapse all**, **Add Macro**, **Export XLSX**.

**Tips:**

- Click the color dot to change an activity’s color.
- Collapsing a macro hides its child tasks.
- A macro's bar stretches from its earliest child start to the latest child finish.

![Compact Gantt with the activity panel collapsed](../images/gantt_2_compact.png)

You can resize the activity panel using the divider. Collapse for a larger timeline view, then use the top-left arrow to reopen.

When exporting to XLSX, HowLong? uses the current view's scale, visible date range, and weekend settings.

## 11. Analytics

The Analytics feature in HowLong? equips you with powerful visual tools to analyze and understand how your project’s base effort and contingency (CTG) are distributed across activities and macros. Use Analytics to identify key cost drivers, uncover trends, and present breakdowns clearly to your team or stakeholders. Through interactive charts—including summary cards, macro/task donuts, and stacked bar graphs—you can both grasp the overall picture and dive deep into the details, all while keeping your estimates unmodified. Analytics is ideal for reviewing, reporting, and steering project discussions with clarity.

These charts are always read-only and focus on base effort and contingency allocation.
To access Analytics: Open your estimate and click **Analytics**.

![Analytics overview with summary cards, macro donut, and stacked bars](../images/analytics.png)

### Overview

| Element       | What it shows                                                       |
| ------------- | ------------------------------------------------------------------- |
| Summary cards | Totals: Base, Contingency, Base + contingency, and CTG rate         |
| Hours/Days    | All values converted based on your estimate’s hours per day        |
| Donut         | Share by activity/macro; center displays the selected metric’s sum |
| Bars          | Shows base (solid) and CTG (striped) side by side                   |

Switch donut metric anytime: Base · Contingency · Base + contingency (default). Macros with subtasks have a task icon and can be explored. Hover over segments or labels to see percentages.

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

This section explains how to import, export, and back up your estimates and project data in HowLong?. Use these features to safely share project information, create tailored exports for different audiences, and ensure data protection by keeping secure copies. The import and export tools help you distribute detailed or summary views (for technical, managerial, or client use), move estimates between devices or team members, and restore work if necessary. Formats and options are designed for collaboration, audit, and integration with other project tools.

Sample files are available in [`examples/`](../../examples/). The complete export reference, including the Excel screenshots and rapid macro compression workflow, is in the [Italian manual](GUIDE.it.md).

### Choosing the Source View for Export

When exporting your estimate, you can select a **source view** to determine exactly which values and fields are included in the export file. This allows you to customize exports for different purposes: whether it’s a technical handoff, management review, or client delivery, you can ensure every audience receives just the information they need—nothing more, nothing less. Each source view highlights your project’s data in a specific way—so by picking the right one, you can share detailed calculations, summarized data, or tailored presentations while keeping sensitive or irrelevant info private. Here’s an overview of your options:

| Source   | Contents Included                                                                  | Best For               |
| -------- | ---------------------------------------------------------------------------------- | ---------------------- |
| Estimate | Complete calculation, full hierarchy, formulas, CTG, notes, and labels             | Technical handover     |
| Manager  | Rounded numbers, redistributed/adjusted values as shown to managers                | Internal approval      |
| Client   | Only included activities, visible hierarchy, presented values, public notes/labels | Client delivery        |
| Gantt    | Dates, hierarchy, color coding, date range, scale, weekends                        | Timeline communication |

| Format       | Purpose                                                                |
| ------------ | ---------------------------------------------------------------------- |
| HowLong JSON | Native full estimate —**only format that supports re-import**   |
| YAML         | Structured for AI (e.g., for Jira draft generation); not re-importable |
| XLSX         | User-friendly snapshot view from any source above                      |
| ZIP          | Archive containing multiple Library exports                            |

Once you export, use **Open** in the completion dialog (on desktop, this links to the file location; in browsers, it starts the download).

![Export completion message with Open File action](../images/exported_element.png)

**Recommended backup strategy:** Always back up both your workspace (settings and models) and your Library (estimates).

| Action                   | What it does                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Save**           | Updates the active estimate in your Library                                  |
| **Export → JSON** | Exports a portable`.howlong.json` backup—even from Manager/Client screens |

YAML exports (Estimate/Manager) are detailed enough for AI agents to create Jira epics, tickets, or risk logs—always review before using automated tools. Client YAML is filtered for public sharing. Note: YAML exports never trigger actions by themselves.

## 13. Keyboard Shortcuts

This section lists available keyboard shortcuts in HowLong?, designed to make your workflow faster and more efficient. Use these shortcuts to navigate, edit, manage tabs, and perform frequent actions—so you can handle your estimates without switching between keyboard and mouse. Check here whenever you want to boost productivity or learn a new time-saver. All shortcuts are customizable; visit the Settings → Keyboard Shortcuts menu for the current list specific to your installation.

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

## 14. What Certain Screens Show — and Don’t

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
| Saved estimate missing       | Check Workspace/Estimates path → refresh Library → review open tabs                                              |
| CTG is zero                  | Ensure you applied CTG, set a global or custom %, or used category mode; formulas require “Apply CTG” separately |
| Client can’t see an item    | Manager inclusion may be off → for Client: check**Subs**, notes, labels                                     |
| Import rejected              | Only import native HowLong JSON; YAML or general JSON is not`.howlong.json`                                      |
| File actions fail in browser | Run`npm run tauri:dev`                                                                                           |

**Before any risky actions:**

1. Save before closing, reloading, or changing your workspace folder
2. Export a HowLong JSON for a portable backup
3. Back up both workspace and Library separately
4. Remember: delete, reload, or importing a workspace can destroy data

For installation, development, testing, release notes, and version info, see the [README](../../README.md).
