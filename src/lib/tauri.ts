import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

export async function getAppDataDir(): Promise<string> {
  return invoke<string>('get_app_data_dir');
}

export async function readTextFile(path: string): Promise<string> {
  return invoke<string>('read_text_file', { path });
}

export async function writeTextFile(path: string, contents: string): Promise<void> {
  await invoke('write_text_file', { path, contents });
}

export async function writeBinaryFile(path: string, contents: number[]): Promise<void> {
  await invoke('write_binary_file', { path, contents });
}

export async function deleteFile(path: string): Promise<void> {
  await invoke('delete_file', { path });
}

export async function ensureAppDefaults(): Promise<string> {
  return invoke<string>('ensure_app_defaults');
}

export async function ensureDir(path: string): Promise<void> {
  await invoke('ensure_dir', { path });
}

export async function listModelFiles(): Promise<string[]> {
  return invoke<string[]>('list_model_files');
}

export async function listJsonFiles(dir: string): Promise<string[]> {
  return invoke<string[]>('list_json_files', { dir });
}

export async function joinPath(...parts: string[]): Promise<string> {
  return invoke<string>('join_path', { parts });
}

export type DialogFilter = { name: string; extensions: string[] };

export async function openFileDialog(filters: DialogFilter[]): Promise<string | null> {
  const selected = await open({
    multiple: false,
    directory: false,
    filters,
  });
  if (selected == null || Array.isArray(selected)) return null;
  return selected;
}

/** Apre uno o più file (dialog multiplo). */
export async function openFilesDialog(filters: DialogFilter[]): Promise<string[]> {
  const selected = await open({
    multiple: true,
    directory: false,
    filters,
  });
  if (selected == null) return [];
  return Array.isArray(selected) ? selected : [selected];
}

export async function openDirectoryDialog(defaultPath?: string): Promise<string | null> {
  const selected = await open({
    multiple: false,
    directory: true,
    defaultPath,
  });
  if (selected == null || Array.isArray(selected)) return null;
  return selected;
}

export async function saveFileDialog(
  filters: DialogFilter[],
  defaultPath?: string,
): Promise<string | null> {
  return save({
    filters,
    defaultPath,
  });
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
