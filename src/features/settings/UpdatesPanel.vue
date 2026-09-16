<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef } from 'vue';
import { toErrorMessage } from '../../shared/errors';
import { APP_VERSION } from '../../shared/version';
import { isTauri } from '../../platform/tauri';
import {
  checkForUpdate,
  downloadUpdate,
  installUpdate,
  relaunchUpdatedApp,
  type DownloadEvent,
  type Update,
} from '../../platform/updater';
import { useI18n } from '../../app/i18n/useI18n';
import SettingsPanel from './SettingsPanel.vue';

const props = defineProps<{
  summary?: string;
  open?: boolean;
  forceOpen?: boolean;
}>();

const emit = defineEmits<{
  toggle: [open: boolean];
}>();

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'installing' | 'upToDate' | 'error';

const { t } = useI18n();
const availableUpdate = shallowRef<Update | null>(null);
const updateStatus = ref<UpdateStatus>('idle');
const updateError = ref('');
const downloadedBytes = ref(0);
const updateContentLength = ref(0);

const isUpdateBusy = computed(() =>
  updateStatus.value === 'checking'
  || updateStatus.value === 'downloading'
  || updateStatus.value === 'installing',
);

const downloadProgress = computed(() => {
  if (!updateContentLength.value) return 0;
  return Math.min(100, Math.round((downloadedBytes.value / updateContentLength.value) * 100));
});

const isMajorUpdate = computed(() => {
  const currentMajor = Number.parseInt(APP_VERSION.split('.')[0] ?? '', 10);
  const availableMajor = Number.parseInt(availableUpdate.value?.version.split('.')[0] ?? '', 10);
  return Number.isFinite(currentMajor) && Number.isFinite(availableMajor) && availableMajor > currentMajor;
});

const updateStatusMessage = computed(() => {
  switch (updateStatus.value) {
    case 'checking': return t('settings.updateChecking');
    case 'available': return t('settings.updateAvailable', { version: availableUpdate.value?.version ?? '' });
    case 'downloading': return t('settings.updateDownloading');
    case 'ready': return t('settings.updateDownloadReady');
    case 'installing': return t('settings.updateInstalling');
    case 'upToDate': return t('settings.updateUpToDate');
    case 'error': return t('settings.updateError');
    default: return t('settings.updateNotChecked');
  }
});

const panelSummary = computed(() => {
  switch (updateStatus.value) {
    case 'checking':
    case 'downloading':
    case 'installing':
      return updateStatusMessage.value;
    case 'upToDate':
      return t('settings.updateUpToDate');
    case 'available':
      return t('settings.updateAvailable', { version: availableUpdate.value?.version ?? '' });
    case 'ready':
      return t('settings.updateDownloadReady');
    case 'error':
      return t('settings.updateError');
    default:
      return props.summary ?? t('settings.summaryUpdates', { version: APP_VERSION });
  }
});

/** Release the native updater resource when replacing or leaving the panel. */
async function closeAvailableUpdate() {
  const update = availableUpdate.value;
  availableUpdate.value = null;
  if (update) await update.close().catch(() => undefined);
}

/** Check GitHub Releases only when the user explicitly requests it. */
async function onCheckForUpdates() {
  if (isUpdateBusy.value || !isTauri()) return;
  await closeAvailableUpdate();
  updateStatus.value = 'checking';
  updateError.value = '';
  downloadedBytes.value = 0;
  updateContentLength.value = 0;

  try {
    availableUpdate.value = await checkForUpdate();
    updateStatus.value = availableUpdate.value ? 'available' : 'upToDate';
  } catch (error) {
    updateStatus.value = 'error';
    updateError.value = toErrorMessage(error);
  }
}

/** Update the panel progress from Tauri's streamed download events. */
function onDownloadEvent(event: DownloadEvent) {
  switch (event.event) {
    case 'Started':
      updateContentLength.value = event.data.contentLength ?? 0;
      downloadedBytes.value = 0;
      break;
    case 'Progress':
      downloadedBytes.value += event.data.chunkLength;
      break;
    case 'Finished':
      if (updateContentLength.value) downloadedBytes.value = updateContentLength.value;
      break;
  }
}

/** Download the checked update without installing it yet. */
async function onDownloadUpdate() {
  const update = availableUpdate.value;
  if (!update || isUpdateBusy.value || updateStatus.value !== 'available') return;
  updateStatus.value = 'downloading';
  updateError.value = '';
  downloadedBytes.value = 0;
  updateContentLength.value = 0;

  try {
    await downloadUpdate(update, onDownloadEvent);
    updateStatus.value = 'ready';
  } catch (error) {
    updateStatus.value = 'available';
    updateError.value = toErrorMessage(error);
  }
}

/** Install the downloaded update and relaunch where the installer requires it. */
async function onInstallUpdate() {
  const update = availableUpdate.value;
  if (!update || isUpdateBusy.value || updateStatus.value !== 'ready') return;
  updateStatus.value = 'installing';
  updateError.value = '';

  try {
    await installUpdate(update);
    await relaunchUpdatedApp();
  } catch (error) {
    updateStatus.value = 'ready';
    updateError.value = toErrorMessage(error);
  }
}

onUnmounted(() => {
  void closeAvailableUpdate();
});
</script>

<template>
  <SettingsPanel
    class="update-panel"
    :title="t('settings.sectionUpdates')"
    :summary="panelSummary"
    :open="props.open"
    :force-open="props.forceOpen"
    @toggle="emit('toggle', $event)"
  >
    <p class="field-hint">{{ t('settings.updateIntro') }}</p>
    <div class="version-box" :class="{ 'version-box--available': availableUpdate }">
      <div class="version-cell">
        <span class="version-label">{{ t('settings.updateCurrentVersion') }}</span>
        <strong>{{ APP_VERSION }}</strong>
      </div>
      <span v-if="availableUpdate" class="version-arrow" aria-hidden="true">→</span>
      <div v-if="availableUpdate" class="version-cell version-cell--new">
        <span class="version-label">{{ t('settings.updateAvailableVersion') }}</span>
        <strong>{{ availableUpdate.version }}</strong>
      </div>
    </div>

    <details v-if="availableUpdate?.body" class="update-notes">
      <summary>{{ t('settings.updateReleaseNotes') }}</summary>
      <p>{{ availableUpdate.body }}</p>
    </details>

    <div v-if="availableUpdate" class="update-notice" :class="{ 'update-notice--warning': isMajorUpdate }" role="note">
      <span class="update-notice-icon" aria-hidden="true">{{ isMajorUpdate ? '!' : 'i' }}</span>
      <p>{{ isMajorUpdate ? t('settings.updateMajorWarning') : t('settings.updateDirectNotice') }}</p>
    </div>

    <p v-if="!isTauri()" class="update-unavailable" role="note">
      <span aria-hidden="true">ⓘ</span>
      {{ t('settings.updatesDesktopOnly') }}
    </p>
    <p v-else class="update-status" role="status" aria-live="polite">{{ updateStatusMessage }}</p>

    <div v-if="updateStatus === 'downloading'" class="update-progress" aria-live="polite">
      <progress v-if="updateContentLength > 0" max="100" :value="downloadProgress" />
      <span v-if="updateContentLength > 0">{{ t('settings.updateProgress', { percent: String(downloadProgress) }) }}</span>
      <span v-else>{{ t('settings.updateDownloading') }}</span>
    </div>

    <p v-if="updateError" class="err">{{ updateError }}</p>

    <div class="chrome">
      <button
        type="button"
        class="settings-action primary-action"
        :disabled="isUpdateBusy || !isTauri()"
        @click="onCheckForUpdates"
      >
        {{ updateStatus === 'checking' ? t('settings.updateChecking') : t('settings.checkForUpdates') }}
      </button>
      <button
        v-if="availableUpdate && updateStatus === 'available'"
        type="button"
        class="settings-action"
        :disabled="isUpdateBusy"
        @click="onDownloadUpdate"
      >
        {{ t('settings.downloadUpdate') }}
      </button>
      <button
        v-if="availableUpdate && updateStatus === 'ready'"
        type="button"
        class="settings-action primary-action"
        :disabled="isUpdateBusy"
        @click="onInstallUpdate"
      >
        {{ t('settings.installAndRestart') }}
      </button>
    </div>
  </SettingsPanel>
</template>

<style scoped>
.field-hint,
.update-status,
.update-unavailable {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.85rem;
  line-height: 1.4;
}

.version-box {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 3.15rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
}

.version-cell {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
}

.version-cell--new {
  color: var(--accent);
}

.version-label {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.version-cell strong {
  color: var(--ink);
  font-size: 1rem;
  font-weight: 650;
}

.version-cell--new strong {
  color: var(--accent);
}

.version-arrow {
  color: var(--muted);
  font-size: 1.1rem;
}

.version-box--available {
  border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
  background: color-mix(in srgb, var(--accent-soft) 42%, var(--page-soft));
}

.update-notes {
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.4;
}

.update-notes summary {
  padding: 0.5rem 0.7rem;
  cursor: pointer;
  color: var(--ink);
  font-size: 0.82rem;
  font-weight: 600;
}

.update-notes p {
  margin: 0;
  padding: 0 0.7rem 0.6rem;
  white-space: pre-wrap;
}

.update-notice,
.update-unavailable {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--line));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent-soft) 42%, var(--page-soft));
}

.update-notice--warning {
  border-color: color-mix(in srgb, var(--warn) 45%, var(--line));
  background: color-mix(in srgb, var(--warn) 10%, var(--page-soft));
}

.update-notice p,
.update-unavailable {
  margin: 0;
}

.update-notice-icon {
  display: grid;
  flex: 0 0 1.1rem;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--surface);
  font-size: 0.72rem;
  font-weight: 700;
}

.update-notice--warning .update-notice-icon {
  background: var(--warn);
}

.update-unavailable span {
  color: var(--muted);
}

.update-progress {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--ink-soft);
  font-size: 0.85rem;
}

.update-progress progress {
  width: min(18rem, 100%);
  accent-color: var(--accent);
}

.chrome {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.05rem;
}

.settings-action {
  padding: 0.4rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink-soft);
  font-size: 0.85rem;
  font-weight: 550;
}

.settings-action:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
  background: var(--page-soft);
  color: var(--ink);
}

.settings-action:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.primary-action {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  background: var(--accent-soft);
  color: var(--accent);
}

.err {
  margin: 0;
  color: var(--danger);
  font-size: 0.85rem;
}
</style>
