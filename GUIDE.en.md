# HowLong? user guide

This guide covers HowLong? `0.4.1` on Windows, macOS, and Linux.

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
| Settings | Configure language, theme, storage, exports, and workspace backups |

## Create and maintain models

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

## Save, open, and reload

- **Save** writes the current estimate to the Library and records an audit entry.
- **Open** loads a `.howlong.json` file into a document tab.
- **Reload** discards the in-memory copy and reloads the last saved file after confirmation when needed.
- **Opened recently** lists only Library estimates you actually opened, newest first, up to five.

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

Use **Settings → Export workspace** to back up settings and models. Estimate files live separately in the Library folder and should be backed up as well.

## Settings

- **Language and appearance:** choose English or Italian and light or dark mode.
- **Username:** identifies save actions in audit history.
- **Estimates folder:** changes the folder scanned by the Library.
- **Manager defaults:** controls whether notes and tags start hidden.
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
