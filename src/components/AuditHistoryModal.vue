<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '../i18n/useI18n';
import { formatAuditDateTime } from '../lib/formatAuditDate';
import type { AuditEntry } from '../models/estimate';

const props = defineProps<{
  open: boolean;
  entries: AuditEntry[];
}>();

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();

const rows = computed(() =>
  [...props.entries].reverse().map((e) => ({
    when: formatAuditDateTime(e.at),
    user: e.username,
  })),
);
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('close')">
    <div
      class="modal"
      role="dialog"
      aria-labelledby="audit-history-title"
      aria-modal="true"
    >
      <header>
        <h2 id="audit-history-title">{{ t('working.auditHistoryTitle') }}</h2>
        <button
          type="button"
          class="ghost"
          :aria-label="t('common.cancel')"
          @click="emit('close')"
        >
          {{ t('about.close') }}
        </button>
      </header>

      <p v-if="rows.length === 0" class="empty">{{ t('working.auditHistoryEmpty') }}</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">{{ t('working.auditHistoryWhen') }}</th>
              <th scope="col">{{ t('working.auditHistoryUser') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="`${row.when}-${row.user}-${i}`">
              <td>{{ row.when }}</td>
              <td>{{ row.user }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--ink) 40%, transparent);
  backdrop-filter: blur(4px);
}

.modal {
  width: min(440px, 100%);
  max-height: min(70vh, 520px);
  display: flex;
  flex-direction: column;
  padding: 1.35rem 1.45rem;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: calc(var(--radius) + 2px);
  box-shadow: var(--shadow-menu);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 650;
}

.empty {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.table-wrap {
  overflow: auto;
  min-height: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

th,
td {
  text-align: left;
  padding: 0.45rem 0.55rem;
  border-bottom: 1px solid var(--line);
}

th {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  position: sticky;
  top: 0;
  background: var(--surface);
}

td:first-child {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--ink-soft);
}

td:last-child {
  font-weight: 500;
}
</style>
