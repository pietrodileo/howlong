# Repository guidance

## Naming and documentation

- Use English names: camelCase for TypeScript values/functions, PascalCase for types and Vue files, UPPER_SNAKE_CASE for shared constants, and snake_case for Rust functions.
- Use the domain terms `estimate`, `session`, `model`, `lineItem`, `macro`, `subtask`, and `planningRange` consistently.
- Name stores `estimateStore`, `documentsStore`, and `settingsStore` when the store and its data coexist in one scope.
- Prefer descriptive names such as `sessionId`, `filePath`, `hoursPerDay`, `contingency`, `placement`, and `categories` in substantial functions.
- Use `use...` for reactive composables, `on...` for UI handlers, and `is...`, `has...`, or `can...` for booleans.
- Add a concise `/** ... */` purpose heading to named TypeScript functions and `///` headings to Rust functions. Document consequential mutation, persistence, validation, history, cancellation, lifecycle requirements, side effects, and unusual constraints.
- Add a short description before each store or composable stating the state it owns and how it coordinates with other owners. Do not mechanically document trivial inline callbacks.

## Domain vocabulary

Use these terms consistently in code, UI copy, tests, and documentation. The user guides are the source of truth for the visible labels.

- **Estimate / Estimate view / Estimator view:** the canonical editing experience (`WorkingView` / `working`). It edits the estimate's hierarchy, effort, contingency, formulas, notes, labels, and metadata. “Estimator” means the internal person or audience; it is not a separate persisted document.
- **Manager view:** an internal presentation layer used to prepare an estimate for sharing. It can control visibility, notes, labels, rounding, redistributed values, and presented totals without changing the estimate's underlying calculation logic.
- **Client view:** the filtered, client-facing presentation derived from the same estimate and manager settings. It is read-only for the recipient and may omit internal rows, subtasks, notes, labels, or other details. Do not treat it as a second estimate.
- **Client preview:** the UI entry point that shows the Manager and Client presentation modes. It is not the same thing as the Client view or the canonical Estimate view.
- **Plan / Gantt view:** the scheduling surface for dates, statuses, owners, colors, notes, and timeline ranges. It may edit planning data and save it to the estimate, but it must not recalculate effort or contingency.
- **Analytics view:** a read-only projection of the active estimate's effort and contingency distribution. Analytics interaction changes only local view state, not the estimate.
- **Compare view:** a read-only side-by-side comparison of the last saved versions of multiple estimates. It aligns rows by stable line-item identity; unsaved tab changes are intentionally excluded.
- **Library:** the local index and persistence surface for saved `.howlong.json` estimate files. It is not the in-memory editor state and is not the same as the workspace folder.
- **Workspace:** the selected storage context used by the app for its settings, models, and estimate/library files. Switching workspace changes the active storage context; it does not merge documents.
- **Model:** a reusable template used to create an estimate. A saved estimate is a snapshot and does not update when its source model changes.
- **Session:** one in-memory open estimate tab, with its own snapshot, dirty state, undo/redo history, and file association. Do not use “session” for the persisted estimate document.
- **Line item:** the generic term for one row in an estimate. Use **macro** for a top-level work item, **subtask** for a child of a macro, and **formula** or **calculated item** for a derived row whose effort comes from other rows.
- **Base effort, contingency (CTG), and total:** base effort is the calculated work before contingency; CTG is the risk allowance applied to eligible work; total is base plus CTG. Keep “effort” for the quantity and “contingency” for the adjustment.
- **Planning range:** the scheduled start/end date interval for an item in Plan. A planning range represents calendar duration, not estimated effort or work hours.

When a term could be ambiguous, prefer the qualified form: **Estimate view**, **Manager view**, **Client view**, **Plan/Gantt view**, **Analytics view**, or **Compare view**. Keep internal component names such as `WorkingView` when referring to implementation details, but use the user-facing term in product copy.

## Ownership and structure

- The documents store owns per-tab snapshots and history; the estimate store owns editor state and calculated projections; the library store owns the disk index and persistence; views own interaction state.
- Keep calculations independent of Vue and disk access. Keep file dialogs and filesystem calls in I/O modules.
- Keep application shell code in `src/app`, feature-owned UI/state in `src/features`, cross-feature calculations in `src/domain`, schemas in `src/models`, external runtime and file integration in `src/platform`, and genuinely reused UI/helpers in `src/shared`.
- Keep feature folders flat until their contents justify another level. Do not move shared schemas into a feature or create compatibility forwarding modules for old paths.
- Reuse existing domain helpers. Do not add speculative factories, single-implementation interfaces, event buses, blanket barrel exports, or dependencies for simple cleanup.
- Preserve exported and persisted names unless a rename is explicitly scoped. Preserve schema normalization, error behavior, history isolation, lazy imports, export formatting, cancellation behavior, filenames, and MIME types.
- Before deleting an export, check imports, Vue templates, store return members, dynamic/native registrations, scripts, and tests.

## Refactoring and verification

- Keep refactors behavior-preserving and separate from bug fixes. Move one ownership boundary at a time and keep intermediate states buildable.
- Run `npm run build` and the affected checks: `npm run smoke`, `npm run smoke:gantt`, `npm run smoke:history`, and `npm run smoke:documents`.
- Run `cargo check --manifest-path src-tauri/Cargo.toml --offline` when native code or command contracts change.
- For document changes, preserve tab isolation, undo/redo, saved/dirty state, watcher disposal, title differences, path deduplication, activation timing, clone isolation, and saved revisions.
- Desktop interaction testing is required for changes affecting views, native dialogs, or scoped styles.
