import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { effectScope } from 'vue';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { useLibraryStore } from '../src/features/library/library';
import { useSettingsStore } from '../src/features/settings/settings';
import { useDocumentsStore } from '../src/shared/documents';
import { useEstimateStore } from '../src/features/estimate/estimate';
import { useDocumentSync } from '../src/shared/composables/useDocumentSync';
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
const macroId = estimateStore.estimate.items[0].id;
sync.mutate(() => estimateStore.addSubtask(macroId));
const subtask = estimateStore.estimate.items.find((item) => item.parentId === macroId)!;
sync.mutate(() => estimateStore.updateItem(subtask.id, { owner: 'Alice Smith' }));
assert.equal(estimateStore.estimate.items[0].owner, undefined);
assert.equal(documentsStore.activeSession!.dirty, true);
const restored = parseEstimate(JSON.parse(estimateToJson(estimateStore.estimate)));
assert.equal(restored.ok && restored.data.items.find((item) => item.id === subtask.id)!.owner, 'Alice Smith');
sync.mutate(() => estimateStore.updateItem(subtask.id, { owner: '' }));
await libraryStore.loadOwners();
assert.equal(libraryStore.ownerOptions.includes('Alice Smith'), true);
sync.restoreHistory('undo');
assert.equal(estimateStore.estimate.items.find((item) => item.id === subtask.id)!.owner, 'Alice Smith');
sync.restoreHistory('redo');
assert.equal(estimateStore.estimate.items.find((item) => item.id === subtask.id)!.owner, '');
documentsStore.createEmpty();
assert.equal(documentsStore.activeSession!.estimate.items.some((item) => item.owner), false);
assert.equal(documentsStore.sessions.find((session) => session.sessionId === firstSession)!.estimate.items.find((item) => item.id === subtask.id)!.owner, '');
scope.stop();
clearMocks();
Reflect.deleteProperty(globalThis, 'window');
console.log('Owner persistence, assignment, export roundtrip, and history smoke checks passed');
