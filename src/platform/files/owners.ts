import { z } from 'zod';
import { ensureDir, isTauri, joinPath, listJsonFiles, readTextFile, writeTextFile } from '../tauri';
import { mergeOwners } from '../../domain/owners';

/** Read workspace suggestions from a separate metadata folder, leaving estimate discovery unchanged. */
export async function readOwners(workspaceDir: string): Promise<string[]> {
  let text: string | null;
  if (!isTauri()) {
    text = localStorage.getItem(`howlong:owners:${workspaceDir}`);
  } else {
    const dir = await joinPath(workspaceDir, '.howlong');
    await ensureDir(dir);
    const files = await listJsonFiles(dir);
    const path = files.find((file) => /(?:^|[\\/])owners\.json$/i.test(file));
    text = path ? await readTextFile(path) : null;
  }
  return text ? mergeOwners(z.array(z.string()).parse(JSON.parse(text))) : [];
}

/** Persist reusable names separately from task assignments and their undo history. */
export async function writeOwners(workspaceDir: string, owners: string[]): Promise<void> {
  const text = JSON.stringify(mergeOwners(owners), null, 2);
  if (!isTauri()) {
    localStorage.setItem(`howlong:owners:${workspaceDir}`, text);
    return;
  }
  const dir = await joinPath(workspaceDir, '.howlong');
  await ensureDir(dir);
  await writeTextFile(await joinPath(dir, 'owners.json'), text);
}
