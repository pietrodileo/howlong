<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormulaAggregate, FormulaSpec } from '../models/model';
import { resolveAppliesContingency } from '../lib/applyContingency';
import { formulaLabel } from '../lib/formulas';
import { useI18n } from '../i18n/useI18n';

export type FormulaEditableItem = {
  id: string;
  name: string;
  kind: string;
  parentId?: string | null;
  applyContingency?: boolean;
  formula?: FormulaSpec;
};

const AGGREGATES: FormulaAggregate[] = ['sum', 'avg', 'min', 'max'];

const props = defineProps<{
  item: FormulaEditableItem;
  candidates: FormulaEditableItem[];
}>();

const emit = defineEmits<{
  save: [
    patch: {
      name: string;
      percent: number;
      sourceIds: string[];
      includeFormulaSources: boolean;
      aggregate: FormulaAggregate;
    },
  ];
  close: [];
}>();

const { t } = useI18n();
const name = ref(props.item.name);
const percent = ref(props.item.formula?.percent ?? 30);
const aggregate = ref<FormulaAggregate>(props.item.formula?.aggregate ?? 'sum');
const selected = ref<Set<string>>(new Set(props.item.formula?.sourceIds ?? []));
const helpOpen = ref(false);

watch(
  () => props.item.id,
  () => {
    name.value = props.item.name;
    percent.value = props.item.formula?.percent ?? 30;
    aggregate.value = props.item.formula?.aggregate ?? 'sum';
    selected.value = new Set(props.item.formula?.sourceIds ?? []);
    helpOpen.value = false;
  },
);

const candidates = computed(() =>
  props.candidates.filter((c) => c.id !== props.item.id),
);

const selectedCount = computed(() => selected.value.size);

function includesDerivedSources(): boolean {
  return [...selected.value].some((id) => {
    const c = candidates.value.find((x) => x.id === id);
    return c?.kind === 'formula';
  });
}

const previewLabel = computed(() =>
  formulaLabel({
    percent: percent.value,
    sourceIds: [...selected.value],
    aggregate: aggregate.value,
    includeFormulaSources: includesDerivedSources(),
    applyGlobalContingency: resolveAppliesContingency(props.item),
  }),
);

const howFormulaText = computed(() => t(`formula.howFormula_${aggregate.value}`));

function toggle(id: string) {
  const next = new Set(selected.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selected.value = next;
}

function selectAllOperational() {
  selected.value = new Set(
    candidates.value
      .filter((c) => c.kind !== 'formula' && c.kind !== 'summary')
      .map((c) => c.id),
  );
}

function clearAll() {
  selected.value = new Set();
}

function onSave() {
  const p = Math.min(100, Math.max(0, Number(percent.value) || 0));
  emit('save', {
    name: name.value.trim() || 'Overhead',
    percent: p,
    sourceIds: [...selected.value],
    includeFormulaSources: includesDerivedSources(),
    aggregate: aggregate.value,
  });
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="panel" role="dialog" :aria-label="t('working.editFormula')">
      <header class="panel-head">
        <div class="titles">
          <h3>{{ t('formula.title') }}</h3>
          <p class="lede">
            {{ t('formula.lede') }}
            <span class="badge">{{ previewLabel }}</span>
          </p>
        </div>
        <button type="button" class="ghost close" :aria-label="t('about.close')" @click="emit('close')">✕</button>
      </header>

      <div class="panel-body">
        <button
          type="button"
          class="help-toggle"
          :aria-expanded="helpOpen"
          @click="helpOpen = !helpOpen"
        >
          <span>{{ helpOpen ? '▾' : '▸' }} {{ t('formula.howToggle') }}</span>
          <span class="help-hint">{{ t('formula.howHint') }}</span>
        </button>
        <div v-if="helpOpen" class="how">
          <p class="how-lead">{{ t('formula.howLead') }}</p>
          <p class="formula">{{ howFormulaText }}</p>
          <p>{{ t('formula.howExample') }}</p>
        </div>

        <div class="form-grid">
          <label class="field">
            {{ t('formula.name') }}
            <input v-model="name" type="text" :placeholder="t('formula.namePh')" />
          </label>
          <label class="field">
            {{ t('formula.aggregate') }}
            <select v-model="aggregate">
              <option v-for="a in AGGREGATES" :key="a" :value="a">
                {{ t(`formula.agg_${a}`) }}
              </option>
            </select>
          </label>
          <label class="field pct-field">
            {{ t('formula.pct') }}
            <div class="pct-row">
              <input v-model.number="percent" type="number" min="0" max="100" step="1" />
              <span class="pct-suffix">%</span>
            </div>
          </label>
        </div>

        <div class="sources">
          <div class="sources-head">
            <span>{{ t('formula.sources') }} <em>({{ selectedCount }})</em></span>
            <div class="src-actions">
              <button type="button" class="ghost" @click="selectAllOperational">{{ t('formula.all') }}</button>
              <button type="button" class="ghost" @click="clearAll">{{ t('formula.none') }}</button>
            </div>
          </div>
          <ul>
            <li v-for="c in candidates" :key="c.id">
              <label>
                <input
                  type="checkbox"
                  :checked="selected.has(c.id)"
                  @change="toggle(c.id)"
                />
                <span class="src-name">{{ c.name }}</span>
                <span v-if="c.kind === 'formula'" class="tag">{{ t('formula.derivedTag') }}</span>
                <span v-else-if="c.parentId" class="tag muted">{{ t('formula.subTag') }}</span>
              </label>
            </li>
          </ul>
          <p v-if="candidates.length === 0" class="empty">{{ t('formula.emptySources') }}</p>
        </div>
      </div>

      <footer class="panel-foot">
        <button type="button" class="ghost" @click="emit('close')">{{ t('formula.cancel') }}</button>
        <button type="button" class="primary" @click="onSave">{{ t('formula.apply') }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--ink) 40%, transparent);
}

.panel {
  width: min(520px, 100%);
  max-height: min(88vh, 640px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.15rem 0.85rem;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}

.titles {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.titles h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.lede {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
  line-height: 1.35;
}

.close {
  flex-shrink: 0;
  margin-top: -0.15rem;
}

.badge {
  font-size: 0.75rem;
  font-weight: 650;
  color: var(--accent);
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: var(--accent-glow);
  border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--line));
}

.panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.9rem 1.15rem;
}

.help-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  margin: 0;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  color: var(--ink-soft);
  font-size: 0.88rem;
  font-weight: 550;
  cursor: pointer;
  text-align: left;
}

.help-toggle:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.help-hint {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.how {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin: -0.25rem 0 0;
  padding: 0.7rem 0.8rem;
  border-radius: var(--radius-sm);
  background: var(--page-soft);
  border: 1px solid var(--line);
}

.how-lead,
.how p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--ink-soft);
  line-height: 1.5;
}

.how .formula {
  margin: 0;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--ink);
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px dashed var(--line);
}

.how ul {
  margin: 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.45rem;
  font-size: 0.86rem;
  color: var(--ink-soft);
  line-height: 1.45;
}

.how strong {
  color: var(--ink);
  font-weight: 650;
}

.how em {
  font-style: normal;
  font-weight: 600;
  color: var(--ink);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr minmax(7.5rem, 0.85fr) 5.5rem;
  gap: 0.75rem;
  align-items: end;
}

.pct-field {
  min-width: 0;
}

@media (max-width: 420px) {
  .form-grid {
    grid-template-columns: 1fr 5.5rem;
  }

  .form-grid .field:nth-child(2) {
    grid-column: 1 / -1;
  }
}

.pct-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.pct-row input {
  width: 100%;
  min-width: 0;
}

.pct-suffix {
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.check {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin: 0;
  font-size: 0.9rem;
  color: var(--ink-soft);
  line-height: 1.35;
  cursor: pointer;
}

.checks {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.check input {
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.check span {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.check small {
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 400;
  line-height: 1.35;
}

.sources {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-height: 0;
  flex: 1 1 auto;
}

.sources-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--muted);
}

.sources-head em {
  font-style: normal;
  font-weight: 600;
  color: var(--ink-soft);
  text-transform: none;
  letter-spacing: 0;
}

.src-actions {
  display: flex;
  gap: 0.2rem;
}

.src-actions .ghost {
  font-size: 0.78rem !important;
  padding: 0.2rem 0.45rem !important;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0.3rem;
  flex: 1 1 auto;
  min-height: 140px;
  max-height: 240px;
  overflow: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--page-soft);
}

li label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.45rem;
  font-size: 0.92rem;
  color: var(--ink);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

li label:hover {
  background: var(--surface);
}

li.blocked label {
  opacity: 0.45;
  cursor: not-allowed;
}

li.blocked label:hover {
  background: transparent;
}

.src-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  font-size: 0.65rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent);
}

.tag.muted {
  color: var(--muted);
}

.hint,
.empty {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.35;
}

.panel-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
  flex-shrink: 0;
  padding: 0.85rem 1.15rem;
  border-top: 1px solid var(--line);
  background: var(--surface);
}
</style>
