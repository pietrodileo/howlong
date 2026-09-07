# HowLong? user guide

This guide covers HowLong? `0.6.0` on Windows, macOS, and Linux.

[Project README](README.md) · [Guida italiana](GUIDE.it.md)

## Quick start

1. Open **Settings**, choose your language and theme, then select **Save**.
2. Open **Models** and create a model for the type of work you estimate.
3. Return to **Welcome** and create an estimate from that model.
4. Enter the project title, client, work items, and effort.
5. Review contingency and client visibility for each item.
6. Save the estimate to the Library.
7. Open **Client view** before exporting anything for a client.

## How HowLong? organizes your work

| Concept | Purpose |
| --- | --- |
| Model | Reusable starting point containing activities, defaults, tags, and contingency rules |
| Estimate | A project-specific working document created from a model or from scratch |
| Library | The local folder containing saved `.howlong.json` estimates |
| Contingency (CTG) | Risk allowance added to selected work items |
| Formula | A derived item calculated from other estimate items |
| Manager view | Detailed internal presentation and export view |
| Client view | Simplified, rounded presentation intended for clients |

Changes to an estimate remain in the active session until you save them. Exporting does not replace saving.

## Navigation

| Area | Use it to |
| --- | --- |
| Welcome | Create or open estimates and revisit recently opened files |
| Estimate | Edit the active estimate and its calculations |
| Library | Search, open, rename, compare, import, export, or delete saved estimates |
| Models | Create and maintain reusable estimate templates |
| Compare | Compare two or more saved estimates |
| Plan | Schedule the open estimate on a Gantt timeline |
| Analytics | Explore effort and contingency in the open estimate |
| Settings | Configure language, theme, storage, exports, and workspace backups |

## Create and maintain models

HowLong? includes Italian and English standard models as ready-to-use starting points.

1. Select **Models** and create a new model.
2. Give it a recognizable name and icon.
3. Add macro activities and optional subtasks.
4. Set default effort, categories, and tags.
5. Enable **Apply CTG** only for items that should receive contingency.
6. Add formulas for derived effort such as project management or overhead.
7. Set the model's default contingency and save it.

New estimates inherit the model structure, icon, tags, and defaults. Later model changes do not silently rewrite existing estimates.

## Build an estimate

### Estimate details

Set a clear title, client label, icon, effort unit, and hours per day. Hours per day controls conversion between hours and person-days.

### Work items

| Field | Meaning |
| --- | --- |
| Name | Activity or task description |
| Category | Group used for organization and category-based contingency |
| Hours / Days | Base effort before contingency |
| Apply CTG | Includes the item in contingency calculations |
| Custom CTG % | Overrides the default percentage for one item |
| Notes | Internal supporting detail |
| Tags | Searchable or presentational labels |
| Client | Controls whether the item appears in the client presentation |

Useful actions:

- Add subtasks below a macro; the macro total becomes the sum of its children.
- Duplicate a row to preserve its configuration. Duplicating a macro also duplicates its children.
- Double-click a note to use the larger editor; press `Ctrl+Enter` to save it.
- Use `Ctrl+←` / `Ctrl+→` on Windows and Linux, or `Cmd+←` / `Cmd+→` on macOS, to switch estimate tabs without saving.
- Use `Ctrl+Z` / `Ctrl+Y` to undo or redo changes in the current tab. macOS also supports `Cmd+Z` / `Cmd+Shift+Z`.
- Double-click a column header to collapse or restore that column.
- Applying CTG to a macro propagates the setting to its subtasks.

### Formulas

A formula calculates:

```text
aggregation(selected items) × percentage
```

Supported aggregations are sum, average, minimum, and maximum. Formula items do not receive global contingency unless **Apply CTG** is enabled for them.

### Contingency

Use contingency to make risk visible without changing base effort. Choose the percentage and mode, then check the base, CTG, and combined totals.

Select **Compare CTG** to test three percentages side by side. **Use** applies the chosen percentage to the current session; save the estimate to keep it.

## Plan with the Gantt

Open an estimate, then choose **Plan** in the sidebar.

1. Use **To schedule** to assign the first dates to a macro or sub-task.
2. Edit start and end through the date fields, or drag and resize the bar.
3. Switch between **Days** and **Months** and limit the view with the From/To date selectors. The monthly timeline expands to use the available board width.
4. Turn off **Show weekends** to hide the days configured as weekends in **Settings → Gantt**, without changing saved dates.
5. Collapse a macro to temporarily hide its sub-tasks.
6. Drag the divider between activity details and the timeline to resize the information column.
7. Use **Export XLSX** to create a formatted, grid-based worksheet matching the current scale, range, and weekend visibility. Headings, macros, and sub-tasks use distinct styling.

When a macro contains sub-tasks, its range automatically spans from the earliest planned start to the latest planned end. The Gantt does not change effort, contingency, or totals.

`Ctrl/Cmd+S` saves and `Ctrl/Cmd+T` creates a new estimate tab from the default model while the Gantt is open. Tab navigation and Undo/Redo shortcuts work there too.

## Analyze the open estimate

Open an estimate, then choose **Analytics** below **Plan** in the sidebar. Analytics reads the active estimate without changing or saving it.

- Use the global **Hours / Days** selector to change every displayed effort value. Day conversion uses the estimate's hours-per-day setting.
- Review the Base, Contingency, Base + contingency, and Contingency rate summary cards.
- Use the donut's metric menu to display Base, Contingency, or Base + contingency. The combined value is selected by default.
- Hover a donut segment to see its percentage and use the legend for the value and percentage together.
- Click an expandable macro in the donut, legend, or horizontal bars to show only that macro's subtasks in both charts. Use **All macros** to return.
- Open **Show tasks** to select one or more macros whose subtasks should replace the macro in both overview charts. Only macros with subtasks are offered; **Clear selection** restores the macro overview.
- Read the horizontal stacked bars to compare base effort with its contingency component. Macro and subtask indicators show which rows can be explored and which rows are children.

The task-selection state is temporary and isolated to the current open document. It resets when you switch documents. Layout and labels adapt when the sidebar or window reduces the available width.

## Save, open, and reload

- **Save** writes the current estimate to the Library and records an audit entry.
- **Open** loads a `.howlong.json` file into a document tab.
- **Reload** discards the in-memory copy and reloads the last saved file after confirmation when needed.
- **Opened recently** lists Library estimates you opened or created and saved, newest first, up to five.

If a file is already open, opening it again activates its existing tab instead of creating a duplicate.

## Use the Library

Search by title or client. You can edit a saved estimate's name or icon directly from the list.

To compare estimates:

1. Select at least two estimates.
2. Choose **Compare**.
3. Review aligned activities and totals in the comparison view.

To export multiple estimates, select them and choose a format. One selection creates one file; multiple selections create a ZIP archive containing one file per estimate.

**Delete** removes the underlying estimate file. Use it only when the file is no longer needed.

## Prepare the client presentation

Open **Client view** from the active estimate.

1. Review the detailed manager section first.
2. Hide internal notes or tags where appropriate.
3. Choose hours or days and the desired rounding.
4. Check which activities are client-visible.
5. Compare calculated and presented values if overrides were applied.
6. Export the manager or client version you need.

Presentation overrides change how values are shown; they do not replace the estimate's base calculation.

## Import, export, and backup

| Format | Best use |
| --- | --- |
| HowLong JSON | Portable backup and re-import into HowLong? |
| YAML | Human-readable or AI-assisted review; not a native re-import format |
| XLSX | Sharing with spreadsheet users |
| CSV | Simple tabular interchange |
| ZIP | Exporting several Library estimates together |

After a file export completes, use **Open** in the confirmation message to open the generated file. In browser development mode this opens the downloaded copy; the desktop app opens the saved filesystem path.

Use **Settings → Export workspace** to back up settings and models. Estimate files live separately in the Library folder and should be backed up as well.

## Settings

- **Language and appearance:** choose English or Italian and light or dark mode.
- **Username:** identifies save actions in audit history.
- **Estimates folder:** changes the folder scanned by the Library.
- **Manager defaults:** controls whether notes and tags start hidden.
- **Gantt weekends:** choose whether Saturday, Sunday, or both are treated as weekends when hidden from the timeline.
- **Export filenames:** optionally include date and time segments.
- **Workspace import/export:** transfers settings and models.

Save settings after editing them. A theme or language preview does not guarantee the choice has been persisted.

## Troubleshooting

**A saved estimate is missing from the Library**

Confirm the active estimates folder in Settings, then refresh the Library.

**Contingency is zero for an item**

Check **Apply CTG**, the selected contingency mode, category filters, and any item-level override.

**A client cannot see an item**

Enable the item's **Client** setting and check the client-view visibility controls.

**Notes or tags are absent from an export**

Check the manager/client visibility toggles before exporting.

**Native file actions do not work in the browser**

Run the desktop app with `npm run tauri:dev`; browser development mode does not provide Tauri filesystem dialogs.

**An imported JSON file is rejected**

Use a HowLong JSON export. YAML, CSV, and generic JSON files are not interchangeable with the native estimate format.

## Data safety

- Save before closing a document tab.
- Export HowLong JSON when you need a portable estimate backup.
- Back up both the workspace and the configured Library folder.
- Treat delete and reload confirmations as destructive actions.

For installation, development, release builds, and versioning, see the [README](README.md).
