import type { DownloadEvent, Update } from '@tauri-apps/plugin-updater';
import { isTauri } from './tauri';

export type { DownloadEvent, Update };

/** Check the configured stable GitHub release for a newer app version. */
export async function checkForUpdate(): Promise<Update | null> {
  if (!isTauri()) throw new Error('Gli aggiornamenti sono disponibili solo nell’app desktop.');
  const { check } = await import('@tauri-apps/plugin-updater');
  return check({ timeout: 15_000 });
}

/** Download an already checked update while reporting byte progress. */
export async function downloadUpdate(
  update: Update,
  onEvent: (event: DownloadEvent) => void,
): Promise<void> {
  await update.download(onEvent, { timeout: 120_000 });
}

/** Install a downloaded update and request the platform installer to restart the app. */
export async function installUpdate(update: Update): Promise<void> {
  await update.install({ restartAfterInstall: true });
}

/** Relaunch after installation on platforms where the installer does not restart the app. */
export async function relaunchUpdatedApp(): Promise<void> {
  const { relaunch } = await import('@tauri-apps/plugin-process');
  await relaunch();
}
