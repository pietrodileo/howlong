import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { useDocumentsStore } from '../src/shared/documents';
import { useSettingsStore } from '../src/features/settings/settings';
import { useLibraryStore } from '../src/features/library/library';
import { useModelsStore } from '../src/features/models/models';
import { useWorkspaceSwitch } from '../src/features/settings/useWorkspaceSwitch';
import { SettingsSchema, DEFAULT_SETTINGS } from '../src/models/settings';
import { settingsForWorkspaceExport, mergeImportedSettings } from '../src/features/settings/workspace';

// Isolate native persistence in memory; no real workspace files are touched.
Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
let persisted = '';
let failNextWrite = false;
mockIPC((command, args) => {
  if (command === 'join_path') return Object.values(args ?? {}).join('/');
  if (command === 'write_text_file') { if (failNextWrite) { failNextWrite = false; throw new Error('Settings write failed'); } persisted = (args as { contents: string }).contents; return; }
  if (command === 'read_text_file') return persisted;
  if (command === 'ensure_app_defaults') return '/app';
  if (command === 'get_os_username') return '';
  if (command === 'ensure_dir') return;
  throw new Error('Unexpected IPC: ' + command);
});

setActivePinia(createPinia());
const settingsStore = useSettingsStore();
settingsStore.appDataDir = '/app';
settingsStore.settings.workspaceDir = '/old';
const documentsStore = useDocumentsStore();
const libraryStore = useLibraryStore();
const modelsStore = useModelsStore();
const switcher = useWorkspaceSwitch();
const first = documentsStore.createEmpty();
documentsStore.markDirty(first);
documentsStore.createEmpty();
const calls: string[] = [];
libraryStore.saveEstimate = async estimate => {
  calls.push(settingsStore.settings.workspaceDir);
  return { path: '/old/saved.json', data: estimate };
};
libraryStore.loadAll = async () => { libraryStore.lastError = null; return 0; };
modelsStore.loadAll = async () => { modelsStore.lastError = null; };
await switcher.switchWorkspace('/new', true);
assert.deepEqual(calls, ['/old']);
assert.equal(documentsStore.sessions.length, 0);
assert.equal(documentsStore.activeId, null);
assert.deepEqual(settingsStore.settings.recentWorkspaceDirs, ['/new', '/old']);
// Restart/reload uses persisted settings, including recent paths.
await settingsStore.load();
assert.deepEqual(settingsStore.settings.recentWorkspaceDirs, ['/new', '/old']);

const dirty = documentsStore.createEmpty();
documentsStore.markDirty(dirty);
libraryStore.saveEstimate = async () => { throw new Error('Save failed'); };
await assert.rejects(switcher.switchWorkspace('/unreachable', true), /Save failed/);
assert.equal(settingsStore.settings.workspaceDir, '/new');
assert.equal(documentsStore.activeId, dirty);
assert.equal(documentsStore.activeSession!.dirty, true);

libraryStore.loadAll = async () => {
  libraryStore.lastError = settingsStore.settings.workspaceDir === '/unreachable' ? 'Load failed' : null;
  return 0;
};
await assert.rejects(switcher.switchWorkspace('/unreachable', false), /Load failed/);
assert.equal(settingsStore.settings.workspaceDir, '/new');
assert.equal(documentsStore.activeId, dirty);
assert.deepEqual(settingsStore.settings.recentWorkspaceDirs, ['/new', '/old']);
failNextWrite = true;
await assert.rejects(switcher.switchWorkspace('/other', false), /Settings write failed/);
assert.equal(settingsStore.settings.workspaceDir, '/new');
assert.equal(documentsStore.activeId, dirty);
assert.equal(JSON.parse(persisted).workspaceDir, '/new');
// Discard never invokes saving, and Default closes tabs as well.
await switcher.switchWorkspace('', false);
assert.equal(documentsStore.sessions.length, 0);
assert.equal(settingsStore.settings.workspaceDir, '');
assert.deepEqual(settingsStore.settings.recentWorkspaceDirs, ['/new', '/old']);

const history = SettingsSchema.shape.recentWorkspaceDirs.parse([' C:/Work ', 'c:\\Work', '', '/b', '/c', '/d', '/e', '/f']);
assert.equal(history.length, 5);
assert.equal(history.filter(path => path.toLowerCase().includes('work')).length, 1);
assert.equal(settingsForWorkspaceExport(settingsStore.settings).recentWorkspaceDirs.length, 0);
assert.deepEqual(mergeImportedSettings(settingsStore.settings, DEFAULT_SETTINGS).recentWorkspaceDirs, ['/new', '/old']);
clearMocks();
Reflect.deleteProperty(globalThis, 'window');
console.log('Workspace switch smoke passed');
