# Dead-code candidates

Date: 2026-09-07

This file records deletion candidates for a subsequent cleanup. No listed file was deleted during the folder-structure refactor.

## Verified candidates

### `AnimatedIcon.vue`

- Current location after migration: `src/shared/components/AnimatedIcon.vue`
- Evidence: no static TypeScript/Vue import, component tag, dynamic-component registration, or reference in application source, scripts, or tests was found on 2026-09-07.
- Estimated saving: 408 lines.
- Before deletion: repeat a repository-wide reference search and perform the application navigation smoke check.

### `ClientPresentationCompare.vue`

- Current location after migration: `src/shared/components/ClientPresentationCompare.vue`
- Evidence: no static TypeScript/Vue import, component tag, dynamic-component registration, or reference in application source, scripts, or tests was found on 2026-09-07.
- Estimated saving: 362 lines.
- Before deletion: repeat a repository-wide reference search and verify estimate/client presentation and comparison screens.

Estimated total: **net: -770 lines possible.**
