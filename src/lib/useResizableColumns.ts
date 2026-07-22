import { reactive, onUnmounted, watch } from 'vue';
import { useSettingsStore } from '../stores/settings';
import {
  ESTIMATE_COLUMNS_STORAGE_KEY,
  type EstimateToggleableColumn,
} from './estimateColumns';

export type ColumnKey =
  | 'name'
  | 'category'
  | 'base'
  | 'applyCtg'
  | 'ctg'
  | 'withCtg'
  | 'override'
  | 'tags'
  | 'notes'
  | 'actions';

export type ModelColumnKey = 'name' | 'category' | 'hours' | 'ctg' | 'tags' | 'actions';

/** Colonne selezionabili (Nome resta sempre visibile). */
export const TOGGLEABLE_COLUMNS: ColumnKey[] = [
  'category',
  'base',
  'applyCtg',
  'ctg',
  'withCtg',
  'override',
  'tags',
  'notes',
  'actions',
];

export const MODEL_TOGGLEABLE_COLUMNS: ModelColumnKey[] = [
  'category',
  'hours',
  'ctg',
  'tags',
  'actions',
];

const DEFAULT_WIDTHS: Record<ColumnKey, number> = {
  name: 260,
  category: 130,
  base: 88,
  applyCtg: 72,
  ctg: 72,
  withCtg: 88,
  override: 96,
  tags: 160,
  notes: 160,
  actions: 132,
};

const DEFAULT_VISIBLE: Record<ColumnKey, boolean> = {
  name: true,
  category: true,
  base: true,
  applyCtg: true,
  ctg: true,
  withCtg: true,
  override: true,
  tags: true,
  notes: true,
  actions: true,
};

const MODEL_DEFAULT_WIDTHS: Record<ModelColumnKey, number> = {
  name: 240,
  category: 160,
  hours: 110,
  ctg: 64,
  tags: 160,
  actions: 88,
};

const MODEL_DEFAULT_VISIBLE: Record<ModelColumnKey, boolean> = {
  name: true,
  category: true,
  hours: true,
  ctg: true,
  tags: true,
  actions: true,
};

const STORAGE_KEY = ESTIMATE_COLUMNS_STORAGE_KEY;
const MODEL_STORAGE_KEY = 'howlong.modelVisibleColumns';
const COLLAPSED_WIDTH = 28;
const MIN_WIDTH = 48;

function settingsColumnBaseline(): Record<ColumnKey, boolean> {
  const base = { ...DEFAULT_VISIBLE };
  try {
    const settings = useSettingsStore();
    const from = settings.settings.estimateColumnVisibility;
    if (from) {
      for (const k of TOGGLEABLE_COLUMNS) {
        if (typeof from[k as EstimateToggleableColumn] === 'boolean') {
          base[k] = from[k as EstimateToggleableColumn];
        }
      }
    }
  } catch {
    /* pinia non pronta */
  }
  return base;
}

function loadVisibleMap<K extends string>(
  storageKey: string,
  defaults: Record<K, boolean>,
  locked: K,
  baseline?: Record<K, boolean>,
): Record<K, boolean> {
  const seed = baseline ? { ...baseline, ...defaults, [locked]: true } : { ...defaults };
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { ...seed, [locked]: true };
    const parsed = JSON.parse(raw) as Partial<Record<K, boolean>>;
    return { ...seed, ...parsed, [locked]: true };
  } catch {
    return { ...seed, [locked]: true };
  }
}

/** Scrive in localStorage le colonne Stima dai settings (effetto al prossimo caricamento vista). */
export function syncEstimateColumnsFromSettings(): void {
  const vis = settingsColumnBaseline();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vis));
  } catch {
    /* ignore */
  }
}

function useColumnLayout<K extends string>(options: {
  defaultWidths: Record<K, number>;
  defaultVisible: Record<K, boolean>;
  storageKey: string;
  lockedKey: K;
}) {
  const { defaultWidths, defaultVisible, storageKey, lockedKey } = options;
  const keys = Object.keys(defaultWidths) as K[];

  const widths = reactive({ ...defaultWidths }) as Record<K, number>;
  const collapsed = reactive(
    Object.fromEntries(keys.map((k) => [k, false])),
  ) as Record<K, boolean>;
  const savedWidths = reactive({ ...defaultWidths }) as Record<K, number>;
  const visible = reactive(
    loadVisibleMap(
      storageKey,
      defaultVisible,
      lockedKey,
      storageKey === STORAGE_KEY
        ? (settingsColumnBaseline() as Record<K, boolean>)
        : undefined,
    ),
  ) as Record<K, boolean>;

  let dragKey: K | null = null;
  let startX = 0;
  let startW = 0;

  watch(
    visible,
    () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ ...visible }));
      } catch {
        /* ignore */
      }
    },
    { deep: true },
  );

  function isVisible(key: K): boolean {
    return visible[key] !== false;
  }

  function setVisible(key: K, on: boolean) {
    if (key === lockedKey) return;
    visible[key] = on;
  }

  function toggleVisible(key: K) {
    if (key === lockedKey) return;
    visible[key] = !visible[key];
  }

  function displayWidth(key: K): number {
    return collapsed[key] ? COLLAPSED_WIDTH : widths[key];
  }

  function styleFor(key: K): Record<string, string> {
    const w = displayWidth(key);
    return {
      width: `${w}px`,
      minWidth: `${w}px`,
      maxWidth: `${w}px`,
    };
  }

  function toggleCollapse(key: K) {
    if (collapsed[key]) {
      collapsed[key] = false;
      widths[key] = savedWidths[key] || defaultWidths[key];
    } else {
      savedWidths[key] = widths[key];
      collapsed[key] = true;
    }
  }

  function onMove(e: MouseEvent) {
    if (!dragKey) return;
    const delta = e.clientX - startX;
    const next = Math.max(MIN_WIDTH, startW + delta);
    widths[dragKey] = next;
    collapsed[dragKey] = false;
  }

  function onUp() {
    dragKey = null;
    document.body.classList.remove('col-resizing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }

  function startResize(key: K, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (collapsed[key]) {
      collapsed[key] = false;
      widths[key] = savedWidths[key] || defaultWidths[key];
    }
    dragKey = key;
    startX = e.clientX;
    startW = widths[key];
    document.body.classList.add('col-resizing');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    document.body.classList.remove('col-resizing');
  });

  return {
    widths,
    collapsed,
    visible,
    displayWidth,
    styleFor,
    toggleCollapse,
    startResize,
    isVisible,
    setVisible,
    toggleVisible,
  };
}

export function useResizableColumns() {
  return useColumnLayout<ColumnKey>({
    defaultWidths: DEFAULT_WIDTHS,
    defaultVisible: DEFAULT_VISIBLE,
    storageKey: STORAGE_KEY,
    lockedKey: 'name',
  });
}

export function useModelResizableColumns() {
  return useColumnLayout<ModelColumnKey>({
    defaultWidths: MODEL_DEFAULT_WIDTHS,
    defaultVisible: MODEL_DEFAULT_VISIBLE,
    storageKey: MODEL_STORAGE_KEY,
    lockedKey: 'name',
  });
}
