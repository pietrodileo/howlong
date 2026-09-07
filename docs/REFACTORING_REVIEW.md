# HowLong codebase refactoring review

Initial review: 2026-09-06. Refactoring completed and documentation updated: 2026-09-07.

The approved cleanup and folder migration are complete. The work preserved UI markup, scoped styles, public behavior, persistence formats, calculations, import/export behavior, and document history semantics. The working tree still includes the earlier uncommitted 0.5.2 synchronization changes.

## Completion status

- Repository conventions now live in the root `AGENTS.md`, linked from `README.md`.
- The verified unused TypeScript functions and store members listed below were removed.
- The reviewed duplication and pass-through helpers were simplified.
- Document-session creation and undo/redo restoration were consolidated behind private helpers.
- Source code now uses the approved hybrid layout: `app`, `features`, `domain`, `models`, `platform`, and `shared`.
- The old `src/lib`, `src/views`, `src/stores`, `src/components`, `src/composables`, `src/i18n`, and `src/directives` roots were removed.
- Verified but not yet deleted files are tracked separately in `docs/DEAD_CODE_CANDIDATES.md`.

## Agreed constraints

- Improve reliability, readability, and maintenance through small sequential changes.
- Preserve UI, rendered markup, styling, shortcuts, calculations, persistence formats, failure behavior, and existing function behavior.
- Use English identifiers and concise English purpose headings on named functions. Explain consequential side effects and constraints.
- Make selective folder improvements. Write guidance first; consider automated lint rules separately.
- Report existing bugs separately. Do not fix them inside a structural cleanup.

## Assessment

The main opportunity is removing unused entry points and clarifying ownership. There is no need for a new framework, service layer, class hierarchy, or generic repository abstraction.

This is primarily a Vue Composition API / Pinia application, not a class-based application. Several large Vue files contain substantial template and scoped CSS sections: ModelsView has 637 script lines out of 2,146 total; ClientView 573/1,939; WorkingView 583/1,970. File length alone is insufficient reason to split them.

The recent `useDocumentSync` extraction centralizes Working/Gantt coordination, but deliberately retains two recording cadences. It is not yet the owner of all application save/reload behavior: ClientView still applies save and reload results directly while mounted inside WorkingView. Keep that distinction documented. Do not instantiate a second watcher-owning coordinator inside ClientView.

## Adopted codebase practices

The authoritative rules are in the root `AGENTS.md`, linked from README for human contributors. This section retains the review rationale; avoid maintaining a second normative copy here.

### Names

- Use camelCase for TypeScript functions/variables, PascalCase for types and Vue filenames, UPPER_SNAKE_CASE for actual shared constants, and snake_case for Rust functions.
- Use the same domain word for the same concept: `estimate`, `session`, `model`, `lineItem`, `macro`, `subtask`, `planningRange`.
- Name store objects `estimateStore`, `documentsStore`, `settingsStore`, etc.; reserve `estimate` and `settings` for the data when both occur in a scope.
- Prefer `sessionId`, `filePath`, `hoursPerDay`, `contingency`, `placement`, and `categories` over ambiguous `id`, `path`, `hpd`, `ctg`, `p`, and `cats` in substantial functions. Short callback names remain reasonable when unambiguous.
- Use verbs for actions and boolean names such as `isDirty`, `hasChildren`, and `canUndo` for new local values. Preserve existing exported and persisted names unless a rename is explicitly scoped.
- Use `use...` for reactive composables and `on...` for UI event handlers. A `try...` name must clearly describe whether failure is returned or thrown; `tryJson` currently just calls `JSON.parse` and can throw.
- Apply naming changes per touched module, not through a repository-wide search-and-replace.

### Function and module descriptions

- Add a short `/** ... */` purpose heading to each named TypeScript function, including private helpers; use Rust `///` documentation headings for Rust functions.
- Describe returned meaning, mutation, persistence, validation, history effects, cancellation, or lifecycle requirements when these matter. Do not repeat each typed parameter in prose.
- Add a short description before each store/composable definition identifying what state it owns and how it interacts with other owners. For any actual class, describe its responsibility and lifetime; do not introduce classes just to apply this rule.
- Explain why an unusual branch exists. Keep comments accurate as code changes. Preserve user-facing translated strings.
- Avoid mechanically documenting trivial inline callbacks. Document a callback separately when it represents a consequential lifecycle or transaction step.

Example:

```ts
/** Restore validated tab content without clearing its collapsed rows. */
function restoreEstimate(next: Estimate, filePath: string | null, isDirty: boolean) {
  // implementation
}
```

### Ownership and simplicity

- Document the current owners: documents owns per-tab snapshots/history; estimate owns editor state and calculated projections; library owns the disk index and persistence; views own interaction state.
- Keep calculations independent of Vue and disk access. Keep file dialogs and filesystem calls in the I/O modules.
- Reuse existing domain helpers. Extract only when a function hides meaningful behavior or eliminates actual duplication.
- Do not add generic factories, interfaces with one implementation, event buses, blanket barrel exports, or new dependencies for simple cleanup.
- Before deleting an exported function, check imports, Vue template usage, store return members, dynamic registrations, Rust command registrations, scripts, and tests.
- Preserve legacy normalization, schema validation, error paths, history snapshot isolation, lazy imports, and export formatting. These are not redundant merely because their purpose is unobvious.

## Completed complexity findings

Locations refer to the reviewed working tree. Savings are estimates before implementation and include some removed export members/imports; they are not measured diffs.

- `src/shared/documents.ts`: removed unused `hasUnsaved`, `sessionsCount`, `hasUnsavedChanges`, `markActive`, `updateSessionMeta`, `closeAll`, `toggleSessionMacro`, and `isMacroCollapsed` members.
- `src/features/estimate/estimate.ts`: removed unused `newFromModel` and `newEmpty` members and dead imports.
- `src/features/comparison/compare.ts`: removed unused selection, reload, filtering, aggregation, and clearing helpers.
- `src/domain/rounding.ts`: removed unused unit-label helpers.
- `src/platform/files/io.ts`: removed unused `saveEstimateJson` and singular `openModelFile` functions.
- `src/platform/files/libraryIo.ts`: removed unused `readHowLongEstimateFromPath` and dead imports.
- `src/models/model.ts`: derives icon options from `ModelIconSchema.options` while preserving order and array independence.
- `src/platform/files/download.ts`: uses one Blob construction path.
- `src/platform/files/import.ts`: calls `JSON.parse` directly inside the existing error boundaries.
- `src/domain/contingency.ts`: derives `hasChildren` directly from the child count.

Estimated for this bounded list: **net: -215 lines possible.** Do not treat line reduction as a target that overrides clarity or compatibility.

Additional candidates needing their own review: the unused `listModelFiles` TypeScript wrapper and its registered Rust command; unused visual assets/components; and `saveBytes`' format option, whose only caller supplies ZIP. Leave native command contracts and visual assets out of the first cleanup.

## Completed sequence

1. Added the agreed repository guidance and verification commands.
2. Deleted the verified unused TypeScript helpers and store members.
3. Removed the reviewed local duplication.
4. Moved intact application and feature-owned files one boundary at a time.
5. Consolidated document-session initialization and history restoration.
6. Classified cross-feature code under `domain`, `platform`, `shared`, and the unchanged `models` root.
7. Updated direct imports without aliases, barrels, or compatibility forwarding files.

Implemented structure:

```text
src/
  app/          # Shell, navigation, localization, and global UI
  domain/       # Cross-feature calculations and transformations
  features/     # Estimate, planning, comparison, models, library, settings
  models/       # Shared schemas and domain types
  platform/     # Tauri and file integration
  shared/       # Reusable components, composables, state, and utilities
```

Keep active Vue files in place during the first folder changes. Moving or splitting single-file components can affect scoped style compilation even when the CSS text appears identical. Avoid extracting templates or CSS merely to make files shorter.

## Verification and limits

Completed after the folder migration:

- `npm run build`: Vue/TypeScript check and Vite build passed.
- `node --import tsx scripts/smoke-contingency.ts`: passed.
- `node --import tsx scripts/smoke-gantt.ts`: passed.
- `node --import tsx scripts/smoke-history.ts`: passed.
- `npm run smoke:documents`: passed.
- Browser navigation smoke check: Estimate, Library, Models, Comparison, Planning, and Settings mounted without console errors or failed lazy imports.
- `cargo check --manifest-path src-tauri/Cargo.toml --offline`: passed before this TypeScript-only migration; native code and command contracts were unchanged.

Existing compiler options include strict TypeScript checks and unused local/parameter checks. Exported functions still need caller analysis; the compiler does not prove they are used. Smoke scripts are executed through tsx and are outside the application's tsconfig include list, so passing them is runtime evidence, not full test-source type checking.

For each future patch, run the relevant baseline before and after. Use the existing build and affected smoke checks; run Rust checking if native code changes. For document changes, retain tab isolation, undo/redo, saved/dirty state, and watcher-disposal checks. For import/export changes, add focused format/cancellation cases. Use desktop interaction checks for affected behavior; a compiler pass does not prove visual or native-dialog equivalence.

## Remaining follow-up candidates

- Review `src/features/library/library.ts` mutating active estimate state; change ownership only with explicit behavioral tests.
- Review `src/features/settings/workspacePaths.ts`, which combines settings-store access with platform filesystem coordination.
- Consider splitting the broad file import/export facade only when tests can preserve lazy imports, cancellation distinctions, formats, filenames, and MIME types.
- Recheck and act on `docs/DEAD_CODE_CANDIDATES.md` in a separate deletion-focused cleanup.

This review is architectural and maintainability-focused, supported by reference searches and compilation. It is not an exhaustive correctness proof or cross-platform desktop test. No confirmed bug fix is included in this proposal.
