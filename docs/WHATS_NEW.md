# What's new

This page lists the user-facing features introduced in each stable release published on GitHub. It follows the release tags, so pre-releases and internal-only changes are not listed.

For the complete generated changelog for a release, see the [GitHub Releases page](https://github.com/pietrodileo/howlong/releases).

## v0.8.0

[GitHub release](https://github.com/pietrodileo/howlong/releases/tag/v0.8.0)

- Activities can have multiple equal-responsibility owners when the workspace setting is enabled. Existing multiple assignments remain visible and removable when the setting is disabled.
- Owner assignments stay synchronized across Estimate, Manager, Client, and Plan views, imports, exports, history, and saved estimates.
- Analytics adds coordinated owner donut and bar charts, with drill-down into assigned macros, subtasks, and calculated items. Multi-owner effort is divided equally so owner totals reconcile with the estimate.
- Analytics can expand subtasks from several macros at once or focus on one macro across both charts.
- The shared Analytics metric selector controls the activity and owner charts. Bars rescale for Base or Contingency and show solid base plus striped CTG in the combined mode.
- **Base + contingency** is the first and default Analytics metric.
- Analytics percentages use coordinated rounding so every displayed distribution totals 100%.
- Analytics uses a compact hierarchy icon for subtasks and aligns subtask, macro, and calculated-item markers consistently.
- Owner task details separate the selected metric from its Effort percentage for easier comparison.

## v0.7.2

[GitHub release](https://github.com/pietrodileo/howlong/releases/tag/v0.7.2)

- Settings are organized into collapsible groups and can be searched by name.
- Settings save automatically after a short delay, and the page shows a brief saving or saved state.
- Settings groups show clearer summaries and use full-width controls where appropriate.
- Empty Plan and Analytics views now offer the same **New Estimate**, **Open File**, and **Go to Library** actions as Home.
- Manager and Client presentation sections can be collapsed to make long estimates easier to scan.
- The Compare estimate selector and the Gantt activity panel can be collapsed to give the result more space.
- Dark theme styling now applies consistently across estimate, presentation, and planning views.
- Compare keeps formula rows aligned and shows each estimate's formula summary, applied CTG percentage, and total with contingency.
- Plan has a **Save** action in its header, so scheduling changes can be saved without returning to Estimate.
- **Add Macro** is available below the Gantt timeline, where it does not compete with the timeline controls.
- Gantt XLSX exports include base days, base plus CTG days, planned days, status, notes, owner, and the timeline for each activity.
- Planned Gantt days follow the setting that determines whether weekend days count as working days.
- Deleting an owner from the Gantt requires confirmation and removes that owner from the activities in the current estimate.
- The estimate note editor uses larger text for easier reading and editing.
- First-install scripts detect existing installations and handle replacement more clearly. The Windows script also detects x64 correctly when it runs under 32-bit PowerShell on a 64-bit system.

## v0.7.0

[GitHub release](https://github.com/pietrodileo/howlong/releases/tag/v0.7.0)

- Plan gained a richer Gantt workflow for scheduling activities with dates, drag and resize controls, day or month scales, and configurable weekend display.
- Gantt activities can carry statuses, owners, and notes. Macro status is calculated from the statuses of its subtasks.
- Gantt exports include the visible date range, timeline scale, activity dates, status, notes, owner, and color information.
- The desktop app gained an **Updates** panel for manually checking the official GitHub feed for stable releases.
- The updater shows the installed version, available version, release notes, download progress, and installation state.
- Signed updates are downloaded for the current operating system and architecture, then installed and restarted when required.
- Updates go directly to the newest stable release, while browser previews remain separate from the native updater.

## 0.6.0

[GitHub release](https://github.com/pietrodileo/howlong/releases/tag/0.6.0)

- First public desktop release for macOS and Windows.
- Build estimates from reusable models with hierarchical work items, formulas, contingency, notes, labels, and audit history.
- Work on several estimates in tabs, with per-tab history and saved or unsaved state.
- Undo and redo estimate changes with keyboard shortcuts.
- Plan work on a day- or month-based Gantt timeline with configurable weekends.
- Review an estimate in Analytics with summary metrics, an activity donut, and stacked bars for base effort and contingency.
- Compare multiple saved estimates and contingency scenarios side by side.
- Use separate Manager and Client views for internal planning and client delivery.
- Browse and manage saved estimates from the redesigned Library.
- Start from the Home screen with quick actions and a list of recently opened estimates.
- Import and export JSON, YAML, and XLSX files, and export selected Library files as a ZIP archive.
- Use the interface in English or Italian, with light and dark themes.
