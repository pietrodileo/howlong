<script setup lang="ts">
import { computed } from 'vue';
import { formatDays } from '../lib/rounding';
import type { Estimate, LineItem } from '../models/estimate';
import { useI18n } from '../i18n/useI18n';

const props = defineProps<{
  estimates: Estimate[];
  hideSubtasks?: boolean;
}>();

const { t } = useI18n();

const hideSubtasks = computed(() => props.hideSubtasks ?? true);

function getMacroItems(estimate: Estimate): LineItem[] {
  if (!hideSubtasks.value) return estimate.items;
  return estimate.items.filter((item) => item.parentId == null);
}

function getAllCategories(): string[] {
  const categories = new Set<string>();
  for (const est of props.estimates) {
    for (const item of getMacroItems(est)) {
      if (item.category) categories.add(item.category);
    }
  }
  return [...categories].sort();
}

function getItemsInCategory(category: string): LineItem[] {
  const items = new Map<string, LineItem>();
  for (const est of props.estimates) {
    for (const item of getMacroItems(est)) {
      if (item.category === category) {
        items.set(item.id, item);
      }
    }
  }
  return [...items.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function formatItemDays(item: LineItem, estimate: Estimate): string {
  const hoursPerDay = estimate.meta.hoursPerDay || 8;
  return formatDays(item.hours, hoursPerDay);
}

function getValueForItem(itemId: string, estimate: Estimate): { value: string; hours: number } {
  const items = getMacroItems(estimate);
  const item = items.find((i) => i.id === itemId);
  if (item) {
    return {
      value: formatItemDays(item, estimate),
      hours: item.hours,
    };
  }
  return { value: '—', hours: 0 };
}

function formatTotalDays(estimate: Estimate): string {
  const items = getMacroItems(estimate);
  const totalHours = items.reduce((sum, i) => sum + i.hours, 0);
  const hoursPerDay = estimate.meta.hoursPerDay || 8;
  return formatDays(totalHours, hoursPerDay);
}

const categories = computed(() => getAllCategories());

</script>

<template>
  <div class="compare-table-container">
    <div class="table-shell">
      <table class="compare-table">
        <thead>
          <tr>
            <th scope="col">{{ t('compare.item') }}</th>
            <th v-for="est in estimates" :key="est.meta.id" scope="col">
              <span class="est-name">{{ est.meta.title }}</span>
              <span class="est-client">{{ est.meta.clientLabel || '—' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="category in categories" :key="category">
            <tr class="category-row">
              <th scope="colgroup" :colspan="estimates.length + 1" class="category-header">
                {{ category }}
              </th>
            </tr>
            <tr v-for="item in getItemsInCategory(category)" :key="item.id" class="item-row">
              <td class="item-name">
                {{ item.name }}
                <span v-if="!item.clientVisible" class="hidden-tag">({{ t('client.hiddenRow') }})</span>
              </td>
              <td v-for="est in estimates" :key="est.meta.id" class="item-value">
                {{ getValueForItem(item.id, est).value }}
              </td>
            </tr>
          </template>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <th scope="row">{{ t('compare.total') }}</th>
            <td v-for="est in estimates" :key="est.meta.id" class="total-value">
              <strong>{{ formatTotalDays(est) }}</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped>
.compare-table-container {
  margin-top: 1rem;
}

.table-shell {
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}

.compare-table {
  width: 100%;
  min-width: 600px;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.compare-table th,
.compare-table td {
  padding: 0.55rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--line);
}

.compare-table thead th {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  background: var(--table-head);
  position: sticky;
  top: 0;
}

.category-header {
  padding: 0.45rem 0.75rem !important;
  background: var(--page-soft) !important;
  font-weight: 600;
  color: var(--ink-soft);
  text-transform: none;
  letter-spacing: normal;
  border-bottom: 1px solid var(--line-strong) !important;
}

.category-row td,
.category-row th {
  border-bottom: none !important;
}

.item-name {
  font-weight: 550;
  color: var(--ink-soft);
  white-space: nowrap;
}

.item-value {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.total-row th,
.total-row td {
  border-bottom: none;
  background: var(--page-soft);
  font-weight: 600;
}

.total-value {
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.est-name {
  display: block;
  font-weight: 600;
  color: var(--ink);
}

.est-client {
  display: block;
  font-size: 0.78rem;
  color: var(--muted);
}

.hidden-tag {
  margin-left: 0.4rem;
  font-size: 0.75rem;
  color: var(--muted-soft);
  font-style: italic;
}

tr.item-row:hover td {
  background: color-mix(in srgb, var(--page-soft) 50%, transparent);
}
</style>
