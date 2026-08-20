<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatEffort, type EffortUnit } from '../lib/rounding';
import { computeTotals } from '../lib/contingency';
import type { Estimate, LineItem } from '../models/estimate';
import { useI18n } from '../i18n/useI18n';

const props = defineProps<{
  estimates: Estimate[];
  hideSubtasks?: boolean;
}>();

const { t } = useI18n();

// Unit display settings - default to days to match existing behavior
const effortUnit = ref<EffortUnit>('days');
const hoursPerDaySetting = ref<number>(8);

// Track which macro items are collapsed
const collapsedItems = ref<Set<string>>(new Set());

function toggleCollapse(itemId: string) {
  const newCollapsed = new Set(collapsedItems.value);
  if (newCollapsed.has(itemId)) {
    newCollapsed.delete(itemId);
  } else {
    newCollapsed.add(itemId);
  }
  collapsedItems.value = newCollapsed;
}

function isCollapsed(itemId: string): boolean {
  return collapsedItems.value.has(itemId);
}

// Get all items from an estimate, organized by parent-child relationships
function getItemsByParent(estimate: Estimate): { macros: LineItem[]; children: Map<string, LineItem[]> } {
  const macros: LineItem[] = [];
  const children = new Map<string, LineItem[]>();
  
  for (const item of estimate.items) {
    if (item.parentId == null) {
      macros.push(item);
    } else {
      if (!children.has(item.parentId)) {
        children.set(item.parentId, []);
      }
      children.get(item.parentId)!.push(item);
    }
  }
  
  return { macros, children };
}

// Get all categories from all estimates
function getAllCategories(): string[] {
  const categories = new Set<string>();
  for (const est of props.estimates) {
    const { macros } = getItemsByParent(est);
    for (const item of macros) {
      if (item.category) categories.add(item.category);
    }
  }
  return [...categories].sort();
}

// Get items in a category, including children if parent is expanded
function getCategoryItems(category: string): { item: LineItem; children: LineItem[]; depth: number; isMacro: boolean }[] {
  const result: { item: LineItem; children: LineItem[]; depth: number; isMacro: boolean }[] = [];
  const seenIds = new Set<string>();
  
  for (const est of props.estimates) {
    const { macros, children: childrenMap } = getItemsByParent(est);
    for (const item of macros) {
      if (item.category === category && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        const itemChildren = childrenMap.get(item.id) || [];
        result.push({ item, children: itemChildren, depth: 0, isMacro: true });
        
        // If not collapsed, add children
        if (!isCollapsed(item.id)) {
          for (const child of itemChildren) {
            if (!seenIds.has(child.id)) {
              seenIds.add(child.id);
              result.push({ item: child, children: [], depth: 1, isMacro: false });
            }
          }
        }
      }
    }
  }
  
  return result;
}

// Get the display value for an item
function getDisplayValue(item: LineItem): string {
  return formatEffort(item.hours, effortUnit.value, hoursPerDaySetting.value);
}

// Get children of an item from a specific estimate
function getChildrenForEstimate(itemId: string, estimate: Estimate): LineItem[] {
  const { children } = getItemsByParent(estimate);
  return children.get(itemId) || [];
}

// Get total hours for a macro item (including children)
function getMacroTotalHours(item: LineItem, estimate: Estimate): number {
  const children = getChildrenForEstimate(item.id, estimate);
  if (children.length === 0) {
    return item.hours;
  }
  return children.reduce((sum, child) => sum + child.hours, item.hours);
}

// Get total display value for a macro item
function getMacroTotalDisplayValue(item: LineItem, estimate: Estimate): string {
  return formatEffort(getMacroTotalHours(item, estimate), effortUnit.value, hoursPerDaySetting.value);
}

// Check if an item has children in any estimate
function hasChildrenInAnyEstimate(itemId: string): boolean {
  for (const est of props.estimates) {
    const { children } = getItemsByParent(est);
    if ((children.get(itemId) || []).length > 0) {
      return true;
    }
  }
  return false;
}

// Get all items for total calculation
function getAllItemsForTotal(estimate: Estimate): LineItem[] {
  if (props.hideSubtasks) {
    const { macros } = getItemsByParent(estimate);
    return macros;
  }
  return estimate.items;
}

// Get total for an estimate
function getEstimateTotal(estimate: Estimate): number {
  const items = getAllItemsForTotal(estimate);
  return items.reduce((sum, i) => sum + i.hours, 0);
}

// Format total display value
function formatTotal(estimate: Estimate): string {
  return formatEffort(getEstimateTotal(estimate), effortUnit.value, hoursPerDaySetting.value);
}

function formatContingency(estimate: Estimate): string {
  return formatEffort(computeTotals(estimate).totalContingency, effortUnit.value, hoursPerDaySetting.value);
}

// Categories
const categories = computed(() => getAllCategories());

// Available hours per day options
const hoursPerDayOptions = [8, 7, 6, 10, 12];

function setHoursPerDay(value: number) {
  hoursPerDaySetting.value = value;
}

function setUnit(unit: EffortUnit) {
  effortUnit.value = unit;
}

</script>

<template>
  <div class="compare-table-container">
    <div class="table-controls">
      <div class="unit-selector">
        <span class="unit-label">{{ t('working.unit') }}:</span>
        <select
          v-model="effortUnit"
          class="unit-select"
          @change="setUnit(effortUnit)"
        >
          <option value="hours">{{ t('common.hours') }}</option>
          <option value="days">{{ t('common.days') }}</option>
        </select>
        <span class="hours-per-day">
          {{ t('working.hoursPerDayTitle') }}:
          <select
            v-model="hoursPerDaySetting"
            class="hours-select"
            @change="setHoursPerDay(Number(hoursPerDaySetting))"
          >
            <option v-for="opt in hoursPerDayOptions" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
        </span>
      </div>
    </div>
    <div class="table-shell">
      <table class="compare-table">
        <thead>
          <tr>
            <th scope="col">{{ t('compare.item') }}</th>
            <th v-for="(est, index) in estimates" :key="`${est.meta.id}-${index}`" scope="col">
              <span class="est-name">{{ est.meta.title }}</span>
              <span class="est-client">{{ est.meta.clientLabel || '—' }}</span>
              <span class="est-ctg-percent">
                {{ t('compare.contingencyPercent', { percent: String(est.contingency.percent) }) }}
              </span>
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
            <template v-for="entry in getCategoryItems(category)" :key="entry.item.id">
              <tr :class="['item-row', { 'macro-row': entry.isMacro, 'child-row': !entry.isMacro }]">
                <td class="item-name" :style="{ paddingLeft: `${entry.depth * 1.5}rem` }">
                  <button
                    v-if="entry.isMacro && hasChildrenInAnyEstimate(entry.item.id)"
                    type="button"
                    class="collapse-toggle"
                    :aria-expanded="!isCollapsed(entry.item.id)"
                    :aria-label="isCollapsed(entry.item.id) ? t('common.expand') : t('common.collapse')"
                    @click.stop="toggleCollapse(entry.item.id)"
                  >
                    {{ isCollapsed(entry.item.id) ? '▸' : '▾' }}
                  </button>
                  <span v-else class="row-spacer"></span>
                  <span class="item-name-text">{{ entry.item.name }}</span>
                  <span v-if="!entry.item.clientVisible" class="hidden-tag">({{ t('client.hiddenRow') }})</span>
                </td>
                <td v-for="(est, estIndex) in estimates" :key="`${est.meta.id}-${estIndex}`" class="item-value">
                  <template v-if="entry.isMacro">
                    {{ getMacroTotalDisplayValue(entry.item, est) }}
                  </template>
                  <template v-else>
                    {{ getDisplayValue(entry.item) }}
                  </template>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <th scope="row">{{ t('compare.total') }}</th>
            <td v-for="(est, index) in estimates" :key="`${est.meta.id}-${index}`" class="total-value">
              <strong>{{ formatTotal(est) }}</strong>
            </td>
          </tr>
          <tr class="contingency-row">
            <th scope="row">{{ t('compare.contingency') }}</th>
            <td v-for="(est, index) in estimates" :key="`${est.meta.id}-${index}`" class="contingency-value">
              {{ formatContingency(est) }}
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

.table-controls {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.88rem;
}

.unit-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.unit-label {
  font-weight: 550;
  color: var(--muted);
}

.unit-select,
.hours-select {
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.88rem;
  cursor: pointer;
}

.hours-per-day {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--muted);
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

.est-name,
.est-client,
.est-ctg-percent {
  display: block;
}

.est-ctg-percent {
  margin-top: 0.2rem;
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
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

.contingency-row th,
.contingency-row td {
  color: var(--muted);
  font-size: 0.82rem;
}

.contingency-value {
  font-variant-numeric: tabular-nums;
}

.item-name {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 550;
  color: var(--ink-soft);
  white-space: nowrap;
}

.collapse-toggle {
  width: 1.4rem;
  height: 1.4rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.collapse-toggle:hover {
  background: var(--page-soft);
  color: var(--ink);
}

.row-spacer {
  display: inline-block;
  width: 1.4rem;
}

.item-name-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-value {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.macro-row .item-name {
  color: var(--ink);
  font-weight: 600;
}

.child-row .item-name {
  color: var(--ink-soft);
  font-weight: 400;
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

tr.child-row:hover td {
  background: color-mix(in srgb, var(--page-soft) 30%, transparent);
}
</style>
