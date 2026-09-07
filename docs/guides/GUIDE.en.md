# HowLong? user manual

This manual covers HowLong? `0.6.0` on Windows, macOS, and Linux.

[Project README](../../README.md) · [Manuale italiano](GUIDE.it.md)

## Contents

- [1. Quick start](#1-quick-start)
- [2. Workspace and navigation](#2-workspace-and-navigation)
- [3. Settings](#3-settings)
- [4. Models](#4-models)
- [5. Estimate editor](#5-estimate-editor)
  - [Tabs and state](#tabs-and-state)
  - [Header and totals](#header-and-totals)
  - [Activity table](#activity-table)
  - [Calculated items](#calculated-items)
  - [Contingency comparison](#contingency-comparison)
- [6. Save, open, reload, and recent files](#6-save-open-reload-and-recent-files)
- [7. Library](#7-library)
- [8. Compare estimates](#8-compare-estimates)
- [9. Plan with the Gantt](#9-plan-with-the-gantt)
- [10. Analytics](#10-analytics)
  - [Read the overview](#read-the-overview)
  - [Expand selected macros within the overview](#expand-selected-macros-within-the-overview)
  - [Focus on one macro](#focus-on-one-macro)
- [11. Manager and client presentation](#11-manager-and-client-presentation)
  - [Manager view](#manager-view)
  - [Client view](#client-view)
- [12. Import, export, and backup](#12-import-export-and-backup)
  - [Choose the source view](#choose-the-source-view)
- [13. Keyboard shortcuts](#13-keyboard-shortcuts)
- [14. What screens do not show or change](#14-what-screens-do-not-show-or-change)
- [15. Troubleshooting and safety](#15-troubleshooting-and-safety)

## 1. Quick start

1. Open **Settings**, choose language, theme, username, and workspace, then save.
2. Open **Estimate** and select **New Estimate**. Use its arrow to choose a model.
3. Enter the estimate and client names, then add effort to the activities.
4. Review **Plan**, **Analytics**, and **Client preview**.
5. Select **Save**. The estimate is now available in the **Library**.

Exporting creates a delivery file. It does not save the working estimate.

## 2. Workspace and navigation

![Home screen with navigation, creation actions, and recently opened estimates](../images/homepage.png)

The home screen appears when no estimate is active.

- The sidebar opens Estimate, Library, Models, Compare, Plan, Analytics, Settings, and About.
- **New Estimate** uses the default model; its arrow opens the model picker.
- **Open File** loads a `.howlong.json` estimate from another accessible location.
- **Go to Library** opens the configured local estimate folder in HowLong?.
- **Opened recently** shows up to five saved estimates, newest first. Hover over a row to see that you can open it.
- The double-chevron beside the HowLong? heading collapses the sidebar. In compact mode, hover an icon to see its label.

Plan and Analytics always use the active document tab. Without an open estimate, they ask you to create or open one.

| Term | Meaning |
| --- | --- |
| Model | Reusable structure, defaults, categories, labels, formulas, and contingency |
| Estimate | Project document created from a model or from scratch |
| Macro | Top-level activity that may contain subtasks |
| Subtask | Child activity whose effort contributes to its macro |
| Formula | Calculated row based on selected estimate items |
| Contingency / CTG | Risk allowance added to eligible work |
| Session | In-memory copy in one tab; changes remain here until saved |
| Library | Local folder containing saved `.howlong.json` estimates |

## 3. Settings

Open **Settings** before creating the first estimate.

![Settings screen with collapsible configuration sections](../images/settings.png)

Each heading expands its controls. Closed sections still contain settings.

- **Profile:** sets the username recorded with saves. The operating-system username is the default.
- **Language:** changes interface labels between English and Italian. It does not translate stored names.
- **Appearance:** chooses light or dark theme.
- **Keyboard shortcuts:** shows the active bindings; see [Section 13](#13-keyboard-shortcuts).
- **Gantt:** defines weekend days. Hiding weekends changes only the timeline display, not saved dates.
- **Estimate view:** sets editor display defaults, including initially compact columns.
- **Presentation:** sets whether manager/client notes and labels start hidden.
- **Export filename:** controls optional date and time segments in generated filenames.
- **Workspace:** shows estimate/model locations. **Choose folder…** selects a custom location; **Use default** restores application data.
- **Workspace import/export:** transfers settings and models. Estimates remain in the separate Library folder.

You can select a local folder synchronized by OneDrive, Google Drive, Dropbox, or a similar service. Colleagues can share models and estimates through the corresponding synchronized folder. Everyone needs access to the folder and must install the service's desktop client. Wait for synchronization to finish before opening a colleague's changes, and do not edit the same estimate at the same time. HowLong? does not provide real-time co-authoring, file locking, or automatic conflict merging.

Select **Save** after editing. A visible language or theme preview does not by itself confirm persistence.

## 4. Models

HowLong? includes standard Italian and English models. Open **Models** to adapt them or create reusable structures.

![Model editor with model list, categories, contingency, macros, subtasks, and a formula](../images/models_example.png)

The left panel lists models and marks the default. The right panel edits the selected model.

1. Select **New** or import a compatible model.
2. Set its name, icon, stable ID, and hours in one workday.
3. Add available categories.
4. Set default CTG; expand **How it works** for an explanation.
5. Add macros, optional subtasks, default effort, CTG eligibility, labels, and any required calculated items.

Drag handles reorder rows. The chevron shows children, **+ Task** adds a subtask, duplicate copies a row, and trash deletes it. **Save** persists the model; **Delete** removes it; **Export** creates a portable copy.

The default model controls plain **New Estimate** and the new-tab shortcut. Existing estimates are independent snapshots and do not change when their source model changes.

## 5. Estimate editor

From Home, select **New Estimate** or its arrow. From an open document, use the plus in the tab bar or its arrow.

![Searchable model picker opened from the new-tab control](../images/shortcut_new_estimate_from_model.png)

The picker marks the default model and keeps long names within the menu.

![Estimate editor with multiple tabs, totals, macros, subtasks, notes, and a formula](../images/new_estimate_with_tabs.png)

### Tabs and state

- Each tab is an independent session with its own undo/redo history.
- The active tab has a dark underline. A dirty indicator means it differs from its saved revision.
- Closing unsaved work requires confirmation.
- Opening an already open file activates its existing tab instead of duplicating it.

### Header and totals

Edit the title, client, and icon at the top. Base, CTG, and Total appear in hours and days. The toolbar controls unit, hours per day, global CTG, contingency comparison, column display, export, reload, save, and client preview.

Hours per day is a conversion rule: changing it changes displayed person-days, not stored hours.

### Activity table

| Column | Meaning |
| --- | --- |
| Name | Macro, subtask, or formula name and hierarchy |
| Category | Organizational group and possible CTG target |
| Hours / Days | Base effort before contingency |
| Apply CTG | Whether the row receives contingency |
| CTG | Calculated risk allowance |
| With CTG | Base plus contingency |
| Custom CTG % | Per-row override of the global percentage |
| Label | Reusable tags |
| Notes | Internal detail; not automatically client-visible |
| Actions | Add child, edit formula, duplicate, or delete |

Click a cell to edit it. Add a macro or calculated item below the table. Add subtasks from a macro row; when children exist, their total determines the macro total. Applying CTG to a macro propagates to its subtasks. Drag handles reorder supported rows.

Double-click a note for the larger editor and press `Ctrl+Enter` to save it. Double-click a column header to collapse or restore that column.

### Calculated items

A formula computes `aggregation(selected items) × percentage`. Aggregations are sum, average, minimum, and maximum. A formula receives global contingency only when **Apply CTG** is enabled for it.

### Contingency comparison

![Three contingency scenarios above the estimate table](../images/compare_contingency.png)

The panel keeps base effort fixed and compares CTG and totals for scenarios A, B, and C in hours and days. **Use** applies one percentage to the current session; **Close** hides the panel. Save afterward to persist the choice.

## 6. Save, open, reload, and recent files

1. Select **Save** or `Ctrl/Cmd+S` to write the active estimate into the Library.
2. Use **Open File** for a `.howlong.json` outside the visible Library list.
3. Use reload to replace the in-memory copy with the last saved file; confirm if unsaved work would be lost.
4. Use **Opened recently** on Home for the five latest saved/opened Library estimates.

The last-saved line records username and time, and saving adds an audit entry. Browser development mode shows the interface, but native dialogs and filesystem behavior require the Tauri desktop app.

## 7. Library

![Library with search, sorting, selection, import, export, comparison, and row actions](../images/library.png)

1. Search by title or client.
2. Sort by name, client, or date.
3. Select rows for comparison or bulk export.
4. Select **Open** to create or activate a document tab.
5. Use row actions to duplicate or delete.

**Import JSON** copies a compatible estimate into the Library. The folder, settings, and refresh icons open the folder, configuration, and rescan action. One exported selection creates one file; several selections create a ZIP. Delete removes the underlying estimate file.

## 8. Compare estimates

Open **Compare**, or select at least two Library rows and choose **Compare**.

![Comparison screen with estimate selection and aligned values](../images/compare.png)

Use the left panel to search, sort, and select estimates. The table on the right aligns activities, with one column for each estimate. Category rows group the work, and chevrons expand subtasks. Above the table, choose hours or days and set the hours-per-day conversion. The bottom rows compare total base effort and contingency.

A blank cell means the aligned item is absent; it is not zero unless zero is displayed. Comparison is read-only and does not merge files.

## 9. Plan with the Gantt

Open an estimate and select **Plan**.

![Expanded Gantt with activity controls and daily timeline](../images/gantt_1.png)

The left panel contains activities, dates, colors, and actions. The right panel is the timeline. The dark date is today and its shaded band continues through the cells. Bars represent planned date ranges, not effort size.

1. Select a date and choose **To schedule**, or double-click an empty cell.
2. Edit start/end fields, or drag and resize the bar.
3. Limit the range with From/To and use **Today** to return to the current date.
4. Switch between **Days** and **Months**; **Show weekends** follows Settings.
5. Use **Expand all**, **Collapse all**, **Add Macro**, or **Export XLSX**.

Click a row's color dot to change its Gantt color. Collapse a macro to hide its children. A macro range automatically spans its earliest child start through latest child end. Planning never changes effort or CTG.

Drag the divider to resize the activity panel, or collapse it to maximize the timeline:

![Compact Gantt with the activity panel collapsed](../images/gantt_2_compact.png)

In compact mode, a narrow first column keeps the useful indicators visible. Reopen the panel with the upper-left arrow. The XLSX export uses the visible scale, range, and weekend setting.

## 10. Analytics

Open an estimate and select **Analytics** below Plan. The Italian sidebar calls it **Analisi Dati**. Analytics is read-only.

![Analytics overview with summary cards, macro donut, and stacked bars](../images/analytics.png)

### Read the overview

- Cards show Base, Contingency, Base + contingency, and effective contingency rate.
- The global Hours/Days selector changes all values using the estimate's hours-per-day setting.
- The donut shows relative distribution; its center shows the selected total.
- Horizontal bars show the same activities: solid is base and striped is contingency.
- Values and percentages appear beside donut labels; hover a segment for its percentage.

The donut metric menu offers Base, Contingency, and Base + contingency; combined is the default. A task icon appears only for macros with subtasks and its tooltip identifies them as explorable.

### Expand selected macros within the overview

Open **Show tasks** and select macros whose children should replace them in both charts.

![Analytics with tasks from two selected macros shown in both charts](../images/analytics_with_sub.png)

Only macros containing subtasks appear in the menu, always by macro name. Select several to compare children alongside untouched macros. **Clear selection** restores the macro view. Subtasks use an arrow and their tooltip identifies the parent macro.

### Focus on one macro

Click an expandable macro in the donut, legend, or bars to show only its subtasks in both charts.

![Analytics focused on the subtasks of one macro](../images/analytics_macro_details.png)

The headings identify the macro and switch to Subtasks. **All macros** returns to the overview. Focus isolates one macro; Show tasks expands chosen macros inside the overall distribution.

Analytics state is temporary, belongs to the active document, and resets on document change. On narrower screens, cards and charts stack and long labels wrap or truncate; hover interactive labels for their full meaning.

## 11. Manager and client presentation

Select **Client preview** in the estimate header. The page contains two sections.

### Manager view

![Manager view with visibility, presented totals, deltas, notes, and redistribution](../images/manager_view.png)

Set the client-facing title, rounding, and unit. Each row shows calculated base and CTG, an editable presented total, and its delta. Include or exclude rows, adjust labels and notes, and use **Redistribute** to allocate a changed macro total among children.

These overrides change presentation only, not the original estimate calculation. Hide notes or labels as required and use the section's Export menu.

### Client view

![Client view with chosen activities and simplified hours and days](../images/client_view.png)

The simplified preview shows the included activities and chosen hierarchy. **Subs** controls whether children appear. Hours and days use the presentation values and rounding settings. Notes and labels appear only when their visibility controls allow them. Review this section before delivery.

Use **Back to estimate** to leave. Presentation changes remain in the active session until saved.

## 12. Import, export, and backup

The [complete export guide](EXPORT_GUIDE.md) includes downloadable examples and explains the difference between Estimate, Manager, Client, and Gantt outputs.

### Choose the source view

| Source | What the export represents | Best use |
| --- | --- | --- |
| Estimate | The estimator's complete calculation, hierarchy, formulas, contingency, notes, and labels | Technical handover and detailed review |
| Manager | The manager's selected, rounded, redistributed, or manually presented values | Internal approval and proposal preparation |
| Client | Only client-selected activities, hierarchy, presented values, and visible notes or labels | Client delivery |
| Gantt | Planned dates, hierarchy, colors, visible range, scale, and weekend choice | Timeline communication |

| Format | Use |
| --- | --- |
| HowLong JSON | Complete native editable estimate; the only estimate format supported for reopening/import |
| YAML | Structured AI-agent input for reviewed actions such as drafting Jira tickets; not native re-import |
| XLSX | Human-readable snapshot from Estimate, Manager, Client, or Gantt |
| ZIP | Container created for several Library exports |

After exporting, select **Open** in the completion message. The desktop app opens the saved file, while browser mode opens the downloaded copy.

![Export completion message with Open File action](../images/exported_element.png)

Back up two locations: export the workspace for settings and models, and separately copy/export the Library for estimates.

**Save** updates the active Library document. **Export → JSON** creates a separate complete `.howlong.json` copy containing calculation inputs, hierarchy, contingency, presentation settings, and planning data. A JSON export from a presentation screen remains a full backup, not a filtered client file.

Estimate/Manager YAML contains detailed structured data suitable for an AI agent to propose epics, tickets, subtasks, plans, risks, or documentation. Client YAML is deliberately filtered. YAML does not execute external actions and should be reviewed before an agent writes to Jira or another system.

## 13. Keyboard shortcuts

On macOS, use `Cmd` where shown as `Ctrl/Cmd`.

| Shortcut | Action | Note |
| --- | --- | --- |
| `Ctrl/Cmd+S` | Save active estimate | Also works from views such as Plan |
| `Ctrl/Cmd+T` | New tab from default model | Does not open the picker |
| `Ctrl/Cmd+W` | Close active tab | Unsaved work requires confirmation |
| `Ctrl/Cmd+E` | Switch estimate/client view | Estimate editor only |
| `Ctrl/Cmd+Left` | Previous estimate tab | Does not save first |
| `Ctrl/Cmd+Right` | Next estimate tab | Does not save first |
| `Ctrl/Cmd+Z` | Undo | Active tab only |
| `Ctrl+Y` | Redo | Windows and Linux |
| `Cmd+Shift+Z` | Redo | macOS |
| `Ctrl+Enter` | Save extended note | While its editor is open |

If a binding changes, check the Keyboard shortcuts section in Settings for the current value.

## 14. What screens do not show or change

- Screenshots contain example names, values, dates, paths, and usernames.
- Home's recent list is not the complete Library.
- Gantt bars represent dates, not effort magnitude; Plan does not recalculate hours.
- Analytics visualizes but does not edit the active estimate.
- Manager overrides do not replace source calculations.
- Client view omits content according to inclusion, subtask, note, and label controls.
- Workspace backup does not include the separate estimate Library.
- Browser development mode does not provide all native dialogs or filesystem behavior.

## 15. Troubleshooting and safety

**A saved estimate is missing:** confirm the Workspace/Estimates path in Settings, then refresh Library. Check whether the file is already open in another tab.

**Contingency is zero:** check Apply CTG, global percentage, mode/category filters, and custom percentage. A formula needs its own Apply CTG flag.

**A client cannot see an item:** check Manager inclusion, then Client view's Subs, notes, and labels controls.

**An import is rejected:** use a native HowLong JSON export. YAML and arbitrary JSON are not interchangeable with `.howlong.json`.

**Native file actions fail in browser mode:** run `npm run tauri:dev`.

1. Save before closing a tab, reloading, or changing workspace folders.
2. Export HowLong JSON for a portable estimate copy.
3. Back up workspace and Library separately.
4. Treat delete, reload, and workspace import as potentially destructive.

For installation, development, tests, release builds, and versioning, use the [README](../../README.md).
