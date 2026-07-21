<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useEstimateStore } from '../stores/estimate';
import { formatHours, formatDays } from '../lib/rounding';
import { computeTotalsAtPercent, defaultComparePercents } from '../lib/ctgCompare';
import { useI18n } from '../i18n/useI18n';

const open = defineModel<boolean>('open', { default: false });

const estimate = useEstimateStore();
const { t } = useI18n();

const percents = ref<[number, number, number]>([10, 20, 30]);

const hoursPerDay = computed(() => {
  const n = estimate.estimate.meta.hoursPerDay;
  return Number.isFinite(n) && n > 0 ? n : 8;
});

watch(open, (isOpen) => {
  if (isOpen) {
    percents.value = defaultComparePercents(estimate.estimate.contingency.percent);
  }
});

const scenarios = computed(() =>
  percents.value.map((pct, i) => {
    const totals = computeTotalsAtPercent(estimate.estimate, pct);
    return {
      key: `s${i}` as const,
      label: String.fromCharCode(65 + i),
      percent: pct,
      totals,
    };
  }),
);

const baseHours = computed(() => scenarios.value[0]?.totals.totalBase ?? 0);

function clampPct(raw: string | number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function setPercent(index: 0 | 1 | 2, raw: string | number) {
  const next = [...percents.value] as [number, number, number];
  next[index] = clampPct(raw);
  percents.value = next;
}

function applyScenario(index: 0 | 1 | 2) {
  estimate.updateContingency({ percent: percents.value[index] });
}
</script>

<template>
  <div v-if="open" class="compare-panel" role="region" :aria-label="t('ctg.compareTitle')">
    <header class="compare-head">
      <div>
        <h3>{{ t('ctg.compareTitle') }}</h3>
        <p class="lede">{{ t('ctg.compareLede') }}</p>
      </div>
      <button type="button" class="ghost" :aria-label="t('about.close')" @click="open = false">
        {{ t('about.close') }}
      </button>
    </header>

    <div class="pct-row">
      <label v-for="(s, i) in scenarios" :key="s.key" class="pct-edit">
        <span>{{ t('ctg.scenario', { letter: s.label }) }}</span>
        <span class="pct-input-wrap">
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            :value="percents[i]"
            @input="setPercent(i as 0 | 1 | 2, ($event.target as HTMLInputElement).value)"
          />
          <span aria-hidden="true">%</span>
        </span>
      </label>
    </div>

    <div class="table-shell">
      <table class="compare-table">
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">{{ t('working.base') }}</th>
            <th v-for="s in scenarios" :key="s.key" scope="col">
              {{ s.label }}
              <span class="pct-tag">{{ s.percent }}%</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{{ t('working.base') }}</th>
            <td>
              <span>{{ formatHours(baseHours) }} h</span>
              <span class="d">{{ formatDays(baseHours, hoursPerDay) }} D</span>
            </td>
            <td v-for="s in scenarios" :key="s.key + '-base'" class="dim">—</td>
          </tr>
          <tr>
            <th scope="row">{{ t('common.ctg') }}</th>
            <td class="dim">—</td>
            <td v-for="s in scenarios" :key="s.key + '-ctg'">
              <span>{{ formatHours(s.totals.totalContingency) }} h</span>
              <span class="d">{{ formatDays(s.totals.totalContingency, hoursPerDay) }} D</span>
            </td>
          </tr>
          <tr class="total-row">
            <th scope="row">{{ t('working.total') }}</th>
            <td>
              <span>{{ formatHours(baseHours) }} h</span>
              <span class="d">{{ formatDays(baseHours, hoursPerDay) }} D</span>
            </td>
            <td v-for="(s, i) in scenarios" :key="s.key + '-tot'">
              <span class="tot">{{ formatHours(s.totals.totalWithContingency) }} h</span>
              <span class="d">{{ formatDays(s.totals.totalWithContingency, hoursPerDay) }} D</span>
              <button
                type="button"
                class="ghost apply"
                :title="t('ctg.applyScenario')"
                @click="applyScenario(i as 0 | 1 | 2)"
              >
                {{ t('ctg.use') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.compare-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
}

.compare-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.compare-head h3 {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 0.95rem;
  font-weight: 650;
}

.lede {
  margin: 0.25rem 0 0;
  font-size: 0.82rem;
  color: var(--muted);
  line-height: 1.4;
}

.pct-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
}

.pct-edit {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 550;
  color: var(--ink-soft);
}

.pct-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  padding: 0.2rem 0.4rem 0.2rem 0.3rem;
}

.pct-input-wrap:focus-within {
  border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.pct-input-wrap input {
  width: 2.75rem;
  border: none;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-variant-numeric: tabular-nums;
}

.pct-input-wrap input:focus {
  outline: none;
}

.table-shell {
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.compare-table th,
.compare-table td {
  padding: 0.5rem 0.65rem;
  text-align: left;
  border-bottom: 1px solid color-mix(in srgb, var(--line) 80%, transparent);
  vertical-align: top;
  white-space: nowrap;
}

.compare-table thead th {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  background: var(--table-head);
}

.compare-table tbody th {
  font-weight: 550;
  color: var(--ink-soft);
}

.compare-table tr:last-child th,
.compare-table tr:last-child td {
  border-bottom: none;
}

.pct-tag {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  color: var(--accent);
}

.d {
  display: block;
  margin-top: 0.1rem;
  font-size: 0.78rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.tot {
  font-weight: 650;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.dim {
  color: var(--muted-soft);
}

.total-row td {
  background: color-mix(in srgb, var(--accent-soft) 55%, var(--surface));
}

.apply {
  display: block;
  margin-top: 0.35rem;
  padding: 0.2rem 0.45rem;
  font-size: 0.75rem;
}
</style>
