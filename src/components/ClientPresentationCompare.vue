<script setup lang="ts">
import { computed } from 'vue';
import { useEstimateStore } from '../stores/estimate';
import {
  formatEffort,
  formatHours,
  formatDays,
  type EffortUnit,
} from '../lib/rounding';
import { useI18n } from '../i18n/useI18n';

const open = defineModel<boolean>('open', { default: false });

const estimate = useEstimateStore();
const { t } = useI18n();

const effortUnit = computed(
  () => estimate.estimate.meta.unit as EffortUnit,
);

const hoursPerDay = computed(() => {
  const n = estimate.estimate.meta.hoursPerDay;
  return Number.isFinite(n) && n > 0 ? n : 8;
});

const effortUnitShort = computed(() =>
  effortUnit.value === 'days' ? 'D' : 'h',
);

type RowCompare = {
  id: string;
  name: string;
  depth: number;
  isMacro: boolean;
  visible: boolean;
  beforeBase: number;
  beforeCtg: number;
  beforeWith: number;
  afterBase: number;
  afterCtg: number;
  afterWith: number;
  deltaWith: number;
  changed: boolean;
};

const rows = computed((): RowCompare[] => {
  const beforeById = new Map(
    estimate.clientBaselineLines.map((l) => [l.item.id, l]),
  );
  return estimate.clientLines.map((after) => {
    const before = beforeById.get(after.item.id);
    const beforeBase = before?.hoursBase ?? 0;
    const beforeCtg = before?.hoursContingency ?? 0;
    const beforeWith = before?.hoursWithContingency ?? 0;
    const deltaWith = after.hoursWithContingency - beforeWith;
    const hoursChanged =
      Math.abs(after.hoursBase - beforeBase) > 1e-9 ||
      Math.abs(after.hoursContingency - beforeCtg) > 1e-9 ||
      Math.abs(after.hoursWithContingency - beforeWith) > 1e-9;
    return {
      id: after.item.id,
      name: after.item.name,
      depth: after.depth,
      isMacro: after.isMacro,
      visible: after.item.clientVisible,
      beforeBase,
      beforeCtg,
      beforeWith,
      afterBase: after.hoursBase,
      afterCtg: after.hoursContingency,
      afterWith: after.hoursPresented,
      deltaWith,
      changed: hoursChanged || !after.item.clientVisible,
    };
  });
});

const totals = computed(() => {
  const b = estimate.clientBaselineTotals;
  const a = estimate.clientTotals;
  return {
    beforeBase: b.totalBase,
    beforeCtg: b.totalContingency,
    beforeWith: b.totalWithContingency,
    afterBase: a.totalBase,
    afterCtg: a.totalContingency,
    afterWith: a.totalPresented,
    deltaWith: a.totalPresented - b.totalWithContingency,
  };
});

function effort(hours: number): string {
  return formatEffort(hours, effortUnit.value, hoursPerDay.value);
}

function deltaLabel(delta: number): string {
  if (Math.abs(delta) < 1e-9) return '—';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${effort(delta)}`;
}
</script>

<template>
  <div v-if="open" class="compare-panel" role="region" :aria-label="t('client.compareTitle')">
    <header class="compare-head">
      <div>
        <h3>{{ t('client.compareTitle') }}</h3>
        <p class="lede">{{ t('client.compareLede') }}</p>
      </div>
      <button type="button" class="ghost" :aria-label="t('about.close')" @click="open = false">
        {{ t('about.close') }}
      </button>
    </header>

    <div class="summary">
      <div class="sum-card">
        <span class="sum-label">{{ t('client.compareBefore') }}</span>
        <strong>{{ formatHours(totals.beforeWith) }} h</strong>
        <span class="sum-days">{{ formatDays(totals.beforeWith, hoursPerDay) }} D</span>
      </div>
      <div class="sum-card accent">
        <span class="sum-label">{{ t('client.compareAfter') }}</span>
        <strong>{{ formatHours(totals.afterWith) }} h</strong>
        <span class="sum-days">{{ formatDays(totals.afterWith, hoursPerDay) }} D</span>
      </div>
      <div class="sum-card" :class="{ up: totals.deltaWith > 1e-9, down: totals.deltaWith < -1e-9 }">
        <span class="sum-label">{{ t('client.compareDelta') }}</span>
        <strong>{{ deltaLabel(totals.deltaWith) }} {{ effortUnitShort }}</strong>
      </div>
    </div>

    <div class="table-shell">
      <table class="compare-table">
        <thead>
          <tr>
            <th scope="col">{{ t('client.activity') }}</th>
            <th scope="col" colspan="3">{{ t('client.compareBefore') }} ({{ effortUnitShort }})</th>
            <th scope="col" colspan="3">{{ t('client.compareAfter') }} ({{ effortUnitShort }})</th>
            <th scope="col">{{ t('client.compareDelta') }}</th>
          </tr>
          <tr class="subhead">
            <th scope="col" />
            <th scope="col">{{ t('common.base') }}</th>
            <th scope="col">{{ t('common.ctg') }}</th>
            <th scope="col">{{ t('common.withCtg') }}</th>
            <th scope="col">{{ t('common.base') }}</th>
            <th scope="col">{{ t('common.ctg') }}</th>
            <th scope="col">{{ t('client.presented') }}</th>
            <th scope="col">{{ t('common.withCtg') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            :class="{ macro: row.isMacro, changed: row.changed, hidden: !row.visible }"
          >
            <td class="name" :style="{ paddingLeft: row.depth ? '1.5rem' : '0.65rem' }">
              {{ row.name }}
              <span v-if="!row.visible" class="tag">{{ t('client.hiddenRow') }}</span>
            </td>
            <td class="num muted">{{ effort(row.beforeBase) }}</td>
            <td class="num muted">{{ effort(row.beforeCtg) }}</td>
            <td class="num muted">{{ effort(row.beforeWith) }}</td>
            <td class="num">{{ effort(row.afterBase) }}</td>
            <td class="num">{{ effort(row.afterCtg) }}</td>
            <td class="num emph">{{ effort(row.afterWith) }}</td>
            <td
              class="num delta"
              :class="{ up: row.deltaWith > 1e-9, down: row.deltaWith < -1e-9 }"
            >
              {{ deltaLabel(row.deltaWith) }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{{ t('client.presented') }}</th>
            <td class="num muted">{{ effort(totals.beforeBase) }}</td>
            <td class="num muted">{{ effort(totals.beforeCtg) }}</td>
            <td class="num muted">{{ effort(totals.beforeWith) }}</td>
            <td class="num">{{ effort(totals.afterBase) }}</td>
            <td class="num">{{ effort(totals.afterCtg) }}</td>
            <td class="num emph">{{ effort(totals.afterWith) }}</td>
            <td
              class="num delta"
              :class="{ up: totals.deltaWith > 1e-9, down: totals.deltaWith < -1e-9 }"
            >
              {{ deltaLabel(totals.deltaWith) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped>
.compare-panel {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 1rem 1.1rem 1.15rem;
  display: grid;
  gap: 0.9rem;
}

.compare-head {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
}

.compare-head h3 {
  margin: 0;
  font-size: 1.05rem;
}

.lede {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.4;
  max-width: 42rem;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
}

.sum-card {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 7.5rem;
}

.sum-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted-soft);
}

.sum-card strong {
  font-size: 1.15rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.sum-days {
  font-size: 0.78rem;
  color: var(--muted);
}

.sum-card.accent strong {
  color: var(--accent);
}

.sum-card.up strong {
  color: var(--warn, #8a5a00);
}

.sum-card.down strong {
  color: var(--accent);
}

.table-shell {
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.compare-table th,
.compare-table td {
  padding: 0.45rem 0.55rem;
  border-bottom: 1px solid var(--line);
  text-align: right;
  white-space: nowrap;
}

.compare-table thead th {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  background: var(--page-soft);
}

.compare-table thead .subhead th {
  font-size: 0.65rem;
  letter-spacing: 0.03em;
  font-weight: 500;
}

.compare-table .name,
.compare-table tbody th,
.compare-table tfoot th {
  text-align: left;
  font-weight: 500;
}

.compare-table .num {
  font-variant-numeric: tabular-nums;
}

.compare-table .muted {
  color: var(--muted);
}

.compare-table .emph {
  font-weight: 600;
}

.compare-table .delta.up {
  color: var(--warn, #8a5a00);
  font-weight: 600;
}

.compare-table .delta.down {
  color: var(--accent);
  font-weight: 600;
}

.compare-table tr.macro td {
  background: var(--page-soft);
  font-weight: 600;
}

.compare-table tr.changed td {
  background: color-mix(in srgb, var(--accent-soft, #e8eef0) 45%, transparent);
}

.compare-table tr.hidden td {
  opacity: 0.62;
}

.tag {
  margin-left: 0.4rem;
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--muted);
}

.compare-table tfoot th,
.compare-table tfoot td {
  border-bottom: none;
  background: var(--page-soft);
  font-weight: 600;
}
</style>
