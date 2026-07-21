<script setup lang="ts">
import { computed } from 'vue';
import { useEstimateStore } from '../stores/estimate';
import { useI18n } from '../i18n/useI18n';

const estimate = useEstimateStore();
const { t } = useI18n();

const percent = computed({
  get: () => estimate.estimate.contingency.percent,
  set: (v: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    estimate.updateContingency({ percent: Math.min(100, Math.max(0, n)) });
  },
});
</script>

<template>
  <div
    class="ctg"
    :aria-label="t('ctg.label')"
    :title="t('ctg.title')"
  >
    <label class="pct-field" for="ctg-percent">
      <span class="pct-label">{{ t('ctg.label') }}</span>
      <span class="pct-input-wrap">
        <input
          id="ctg-percent"
          class="pct-input"
          type="number"
          min="0"
          max="100"
          step="1"
          v-model.number="percent"
        />
        <span class="pct-suffix" aria-hidden="true">%</span>
      </span>
    </label>
  </div>
</template>

<style scoped>
.ctg {
  display: inline-flex;
  align-items: center;
}

.pct-field {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.pct-label {
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 500;
}

.pct-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 0.15rem 0.4rem 0.15rem 0.25rem;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.pct-input-wrap:focus-within {
  border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.pct-input {
  width: 2.6rem;
  border: none;
  background: transparent;
  padding: 0.15rem 0.1rem;
  font-size: 0.95rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
  text-align: right;
}

.pct-input:focus {
  outline: none;
}

.pct-suffix {
  color: var(--muted);
  font-weight: 500;
  font-size: 0.85rem;
}
</style>
