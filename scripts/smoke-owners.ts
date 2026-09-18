import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { effectScope } from 'vue';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { useLibraryStore } from '../src/features/library/library';
import { useSettingsStore } from '../src/features/settings/settings';
import { useDocumentsStore } from '../src/shared/documents';
import { useEstimateStore } from '../src/features/estimate/estimate';
import { useDocumentSync } from '../src/shared/composables/useDocumentSync';
import { useOwnerAssignment } from '../src/shared/composables/useOwnerAssignment';
import { parseEstimate } from '../src/models/estimate';
import { estimateToJson } from '../src/platform/files/export';

// Exercise native file contracts in memory without touching user workspace files.
Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
const files = new Map<string, string>();
let failWrite = false;
mockIPC((command, args) => {
  const values = args as { parts: string[]; path: string; dir: string; contents: string };
  if (command === 'join_path') return values.parts.join('/');
  if (command === 'ensure_dir') return;
  if (command === 'list_json_files') return [...files.keys()].filter((path) => path.startsWith(values.dir + '/'));
  if (command === 'read_text_file') return files.get(values.path);
  if (command === 'write_text_file') {
    if (failWrite) throw new Error('Owner write failed');
    files.set(values.path, values.contents);
    return;
  }
  throw new Error('Unexpected IPC: ' + command);
});

setActivePinia(createPinia());
const settingsStore = useSettingsStore();
settingsStore.settings.workspaceDir = '/one';
const libraryStore = useLibraryStore();
await libraryStore.loadOwners();
assert.deepEqual(libraryStore.ownerOptions, []);
assert.equal(await libraryStore.rememberOwner('  Alice   Smith  '), 'Alice Smith');
assert.equal(await libraryStore.rememberOwner('alice smith'), 'Alice Smith');
await Promise.all([libraryStore.rememberOwner('Bob'), libraryStore.rememberOwner('Carol')]);
assert.deepEqual(libraryStore.ownerOptions, ['Alice Smith', 'Bob', 'Carol']);
assert.ok(files.has('/one/.howlong/owners.json'));
await libraryStore.forgetOwner('bob');
assert.deepEqual(libraryStore.ownerOptions, ['Alice Smith', 'Carol']);

settingsStore.settings.workspaceDir = '/two';
await libraryStore.loadOwners();
assert.deepEqual(libraryStore.ownerOptions, []);
await libraryStore.rememberOwner('Dave');
settingsStore.settings.workspaceDir = '/one';
await libraryStore.loadOwners();
assert.deepEqual(libraryStore.ownerOptions, ['Alice Smith', 'Carol']);
failWrite = true;
await assert.rejects(libraryStore.rememberOwner('Eve'), /Owner write failed/);
assert.equal(libraryStore.ownerOptions.includes('Eve'), false);
failWrite = false;

// A pending write remains scoped to its original workspace after switching.
const pendingOwner = libraryStore.rememberOwner('Frank');
settingsStore.settings.workspaceDir = '/two';
await libraryStore.loadOwners();
await pendingOwner;
assert.deepEqual(libraryStore.ownerOptions, ['Dave']);
settingsStore.settings.workspaceDir = '/one';
await libraryStore.loadOwners();
assert.equal(libraryStore.ownerOptions.includes('Frank'), true);

const documentsStore = useDocumentsStore();
const estimateStore = useEstimateStore();
const firstSession = documentsStore.createEmpty();
const scope = effectScope();
const sync = scope.run(() => useDocumentSync('gantt'))!;
const ownerAssignment = scope.run(() => useOwnerAssignment(sync.mutate))!;
const macroId = estimateStore.estimate.items[0].id;
sync.mutate(() => estimateStore.addSubtask(macroId));
const subtask = estimateStore.estimate.items.find((item) => item.parentId === macroId)!;
sync.mutate(() => estimateStore.updateItem(subtask.id, { owners: ['Alice Smith'] }));
assert.deepEqual(estimateStore.estimate.items[0].owners, []);
assert.equal(documentsStore.activeSession!.dirty, true);
const restored = parseEstimate(JSON.parse(estimateToJson(estimateStore.estimate)));
assert.deepEqual(restored.ok && restored.data.items.find((item) => item.id === subtask.id)!.owners, ['Alice Smith']);
const legacyDocument = JSON.parse(estimateToJson(estimateStore.estimate)) as {
  schemaVersion: number;
  items: Array<Record<string, unknown>>;
};
legacyDocument.schemaVersion = 3;
const legacySubtask = legacyDocument.items.find((item) => item.id === subtask.id)!;
delete legacySubtask.owners;
legacySubtask.owner = 'Legacy Alice';
const migratedLegacy = parseEstimate(legacyDocument);
assert.equal(migratedLegacy.ok, true);
if (migratedLegacy.ok) {
  const migratedItem = migratedLegacy.data.items.find((item) => item.id === subtask.id)!;
  assert.deepEqual(migratedItem.owners, ['Legacy Alice']);
  assert.equal('owner' in migratedItem, false);
}
sync.mutate(() => estimateStore.updateItem(subtask.id, { owners: [] }));
await libraryStore.loadOwners();
assert.equal(libraryStore.ownerOptions.includes('Alice Smith'), true);
sync.restoreHistory('undo');
assert.deepEqual(estimateStore.estimate.items.find((item) => item.id === subtask.id)!.owners, ['Alice Smith']);
sync.restoreHistory('redo');
assert.deepEqual(estimateStore.estimate.items.find((item) => item.id === subtask.id)!.owners, []);
settingsStore.settings.allowMultipleOwners = true;
await ownerAssignment.onOwnerChange(estimateStore.estimate.items.find((item) => item.id === subtask.id)!, ['Alice Smith', 'Bob', 'Carol']);
settingsStore.settings.allowMultipleOwners = false;
await ownerAssignment.onOwnerChange(estimateStore.estimate.items.find((item) => item.id === subtask.id)!, ['Bob', 'Carol']);
assert.deepEqual(estimateStore.estimate.items.find((item) => item.id === subtask.id)!.owners, ['Bob', 'Carol']);
await ownerAssignment.onOwnerChange(estimateStore.estimate.items.find((item) => item.id === subtask.id)!, ['Bob', 'Carol', 'Dave']);
assert.deepEqual(estimateStore.estimate.items.find((item) => item.id === subtask.id)!.owners, ['Bob', 'Carol']);
await ownerAssignment.onOwnerChange(estimateStore.estimate.items.find((item) => item.id === subtask.id)!, []);
documentsStore.createEmpty();
assert.equal(documentsStore.activeSession!.estimate.items.some((item) => item.owners.length > 0), false);
assert.deepEqual(documentsStore.sessions.find((session) => session.sessionId === firstSession)!.estimate.items.find((item) => item.id === subtask.id)!.owners, []);
scope.stop();
clearMocks();
Reflect.deleteProperty(globalThis, 'window');
console.log('Owner persistence, assignment, export roundtrip, and history smoke checks passed');
