import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { effectScope, nextTick } from 'vue';
import { useDocumentsStore } from '../src/shared/documents';
import { useEstimateStore } from '../src/features/estimate/estimate';
import { useDocumentSync } from '../src/shared/composables/useDocumentSync';
import { cloneEstimateSnapshot } from '../src/domain/estimateHistory';

/** Exercise real stores and view-scoped watchers across edits, saves, tabs, and history. */
async function checkView(view: 'working' | 'gantt') {
  setActivePinia(createPinia());
  const docs = useDocumentsStore();
  const estimate = useEstimateStore();
  const first = docs.createEmpty();
  const scope = effectScope();
  const sync = scope.run(() => useDocumentSync(view))!;

  /** Exercise the view's existing edit cadence before allowing Vue to flush. */
  async function edit(title: string) {
    const previous = docs.activeSession!.estimate.meta.title;
    if (view === 'gantt') sync.mutate(() => estimate.updateMeta({ title }));
    else estimate.updateMeta({ title });
    assert.equal(docs.activeSession!.estimate.meta.title, view === 'gantt' ? title : previous);
    await nextTick();
    assert.equal(docs.activeSession!.estimate.meta.title, title);
  }

  await edit('First saved');
  const saved = cloneEstimateSnapshot(estimate.estimate);
  saved.auditHistory = [{ at: '2026-09-06T12:00:00.000Z', username: 'Smoke' }];
  sync.applySaved('/first.json', saved);
  await nextTick();
  assert.equal(docs.activeSession!.dirty, false);
  assert.equal(estimate.dirty, false);
  assert.deepEqual(docs.activeSession!.estimate.auditHistory, saved.auditHistory);
  await edit('First changed');
  const second = docs.createEmpty();
  await nextTick();
  const initialTitle = estimate.estimate.meta.title;
  await edit('Second changed');
  sync.restoreHistory('undo');
  await nextTick();
  assert.equal(estimate.estimate.meta.title, initialTitle);
  assert.equal(docs.sessions.find(s => s.sessionId === first)!.estimate.meta.title, 'First changed');
  sync.restoreHistory('redo');
  await nextTick();
  assert.equal(estimate.estimate.meta.title, 'Second changed');
  docs.activate(first);
  await nextTick();
  assert.equal(estimate.estimate.meta.title, 'First changed');
  assert.equal(estimate.filePath, '/first.json');
  assert.equal(estimate.dirty, true);
  sync.restoreHistory('undo');
  await nextTick();
  assert.equal(estimate.estimate.meta.title, 'First saved');
  assert.equal(estimate.dirty, false);
  assert.equal(docs.activeSession!.dirty, false);
  sync.restoreHistory('redo');
  await nextTick();
  assert.equal(estimate.dirty, true);
  assert.equal(docs.activeSession!.dirty, true);
  sync.restoreHistory('undo');
  await nextTick();
  await edit('Replacement');
  sync.restoreHistory('redo');
  await nextTick();
  assert.equal(estimate.estimate.meta.title, 'Replacement');

  const reloaded = cloneEstimateSnapshot(estimate.estimate);
  reloaded.meta.title = 'Reloaded';
  sync.replaceFromFile(reloaded, '/first.json');
  await nextTick();
  assert.equal(docs.activeSession!.history.past.length, 0);
  assert.equal(docs.activeSession!.dirty, false);

  // Simulate leaving the view: its watchers must no longer affect either store.
  scope.stop();
  docs.activate(second);
  await nextTick();
  assert.equal(estimate.estimate.meta.title, 'Reloaded');
  estimate.updateMeta({ title: 'Detached' });
  await nextTick();
  assert.equal(docs.activeSession!.estimate.meta.title, 'Second changed');

  // Mount the other view and verify that it restores the selected tab.
  const otherScope = effectScope();
  otherScope.run(() => useDocumentSync(view === 'working' ? 'gantt' : 'working'));
  await nextTick();
  assert.equal(estimate.estimate.meta.title, 'Second changed');
  otherScope.stop();
}

await checkView('working');
await checkView('gantt');
console.log('document synchronization smoke checks passed');
