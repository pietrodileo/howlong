# Repository guidance

## Naming and documentation

- Use English names: camelCase for TypeScript values/functions, PascalCase for types and Vue files, UPPER_SNAKE_CASE for shared constants, and snake_case for Rust functions.
- Use the domain terms `estimate`, `session`, `model`, `lineItem`, `macro`, `subtask`, and `planningRange` consistently.
- Name stores `estimateStore`, `documentsStore`, and `settingsStore` when the store and its data coexist in one scope.
- Prefer descriptive names such as `sessionId`, `filePath`, `hoursPerDay`, `contingency`, `placement`, and `categories` in substantial functions.
- Use `use...` for reactive composables, `on...` for UI handlers, and `is...`, `has...`, or `can...` for booleans.
- Add a concise `/** ... */` purpose heading to named TypeScript functions and `///` headings to Rust functions. Document consequential mutation, persistence, validation, history, cancellation, lifecycle requirements, side effects, and unusual constraints.
- Add a short description before each store or composable stating the state it owns and how it coordinates with other owners. Do not mechanically document trivial inline callbacks.

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
