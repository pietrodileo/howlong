import { reactive, ref, computed, onUnmounted, watch } from 'vue';
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

export type ManagerColumnKey =
  | 'show'
  | 'name'
  | 'category'
  | 'tags'
  | 'base'
  | 'ctg'
  | 'withCtg'
  | 'presented'
  | 'delta'
  | 'notes'
  | 'actions';

export type ClientOutputColumnKey = 'subs' | 'name' | 'tags' | 'notes' | 'hours' | 'days';

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
];

export const MODEL_TOGGLEABLE_COLUMNS: ModelColumnKey[] = [
  'category',
  'hours',
  'ctg',
  'tags',
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

const DEFAULT_ORDER: ColumnKey[] = [
  'name',
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

const MODEL_DEFAULT_WIDTHS: Record<ModelColumnKey, number> = {
  name: 240,
  category: 160,
  hours: 110,
  ctg: 64,
  tags: 160,
  actions: 152,
};

const MODEL_DEFAULT_VISIBLE: Record<ModelColumnKey, boolean> = {
  name: true,
  category: true,
  hours: true,
  ctg: true,
  tags: true,
  actions: true,
};

const MODEL_DEFAULT_ORDER: ModelColumnKey[] = [
  'name',
  'category',
  'hours',
  'ctg',
  'tags',
  'actions',
];

const MANAGER_DEFAULT_WIDTHS: Record<ManagerColumnKey, number> = {
  show: 52,
  name: 220,
  category: 120,
  tags: 150,
  base: 80,
  ctg: 72,
  withCtg: 88,
  presented: 96,
  delta: 80,
  notes: 140,
  actions: 110,
};

const MANAGER_DEFAULT_VISIBLE: Record<ManagerColumnKey, boolean> = {
  show: true,
  name: true,
  category: true,
  tags: true,
  base: true,
  ctg: true,
  withCtg: true,
  presented: true,
  delta: true,
  notes: true,
  actions: true,
};

const MANAGER_DEFAULT_ORDER: ManagerColumnKey[] = [
  'show',
  'name',
  'category',
  'tags',
  'base',
  'ctg',
  'withCtg',
  'presented',
  'delta',
  'notes',
  'actions',
];

const CLIENT_OUTPUT_DEFAULT_WIDTHS: Record<ClientOutputColumnKey, number> = {
  subs: 52,
  name: 280,
  tags: 160,
  notes: 200,
  hours: 72,
  days: 72,
};

const CLIENT_OUTPUT_DEFAULT_VISIBLE: Record<ClientOutputColumnKey, boolean> = {
  subs: true,
  name: true,
  tags: true,
  notes: true,
  hours: true,
  days: true,
};

const CLIENT_OUTPUT_DEFAULT_ORDER: ClientOutputColumnKey[] = [
  'subs',
  'name',
  'tags',
  'notes',
  'hours',
  'days',
];

const STORAGE_KEY = ESTIMATE_COLUMNS_STORAGE_KEY;
const MODEL_STORAGE_KEY = 'howlong.modelVisibleColumns';
const MANAGER_STORAGE_KEY = 'howlong.managerVisibleColumns';
const ORDER_STORAGE_KEY = 'howlong.columnOrder';
const MODEL_ORDER_STORAGE_KEY = 'howlong.modelColumnOrder';
const MANAGER_ORDER_STORAGE_KEY = 'howlong.managerColumnOrder';
const CLIENT_OUTPUT_STORAGE_KEY = 'howlong.clientOutputVisibleColumns';
const CLIENT_OUTPUT_ORDER_STORAGE_KEY = 'howlong.clientOutputColumnOrder';
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

function loadOrder<K extends string>(storageKey: string, defaults: K[]): K[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [...defaults];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...defaults];
    const allowed = new Set(defaults);
    const next: K[] = [];
    for (const key of parsed) {
      if (typeof key === 'string' && allowed.has(key as K) && !next.includes(key as K)) {
        next.push(key as K);
      }
    }
    for (const key of defaults) {
      if (!next.includes(key)) next.push(key);
    }
    return next;
  } catch {
    return [...defaults];
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
  defaultOrder: K[];
  storageKey: string;
  orderStorageKey: string;
  lockedKey: K;
}) {
  const {
    defaultWidths,
    defaultVisible,
    defaultOrder,
    storageKey,
    orderStorageKey,
    lockedKey,
  } = options;
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
  const order = ref<K[]>(loadOrder(orderStorageKey, defaultOrder));

  // Pointer-based drag state
  const pointerColDragKey = ref<K | null>(null);
  const pointerColStartX = ref<number>(0);
  const pointerColStartY = ref<number>(0);
  const pointerColDragActive = ref<boolean>(false);
  const dragOverColKey = ref<K | null>(null);
  const nativeColDragKey = ref<K | null>(null);

  // Drag threshold in pixels to distinguish between click and drag
  const DRAG_THRESHOLD = 5;

  let resizeKey: K | null = null;
  let startX = 0;
  let startW = 0;
  let colDragKey: K | null = null;

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

  watch(
    order,
    (next) => {
      try {
        localStorage.setItem(orderStorageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    { deep: true },
  );

  const orderedKeys = computed(() => order.value);

  function getColumnKeyAtPoint(clientX: number, clientY: number): K | null {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;

    // Cerca l'elemento th più vicino con attributo data-column-key
    const thEl = (element as HTMLElement).closest?.('th[data-column-key]');
    if (thEl && thEl instanceof HTMLElement) {
      const key = thEl.dataset.columnKey as K | undefined;
      if (key && keys.includes(key)) {
        return key;
      }
    }
    return null;
  }

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
      const w = Math.max(displayWidth(key), MIN_WIDTH);
    return {
      width: `${w}px`,
      minWidth: `${w}px`,
      maxWidth: `${w}px`,
    };
  }

  function toggleCollapse(key: K) {
    if (key === lockedKey || key === 'actions') return;
    if (collapsed[key]) {
      collapsed[key] = false;
      widths[key] = savedWidths[key] || defaultWidths[key];
    } else {
      savedWidths[key] = widths[key];
      collapsed[key] = true;
    }
  }

  function cleanupColPointerDrag() {
    pointerColDragKey.value = null;
    pointerColDragActive.value = false;
    dragOverColKey.value = null;
    document.body.classList.remove('col-dragging');
  }

  function onColPointerDown(key: K, e: PointerEvent) {
    // Solo pulsante primario (left mouse o touch)
    if (e.button !== 0 && e.button !== -1) return;

    // Ignora se target è resizer o controlli interattivi
    const target = e.target as HTMLElement;
    if (target.closest?.('.col-resizer')) return;
    if (target.closest?.('button, input, select, textarea')) return;

    // Inizializza stato
    pointerColDragKey.value = key;
    pointerColStartX.value = e.clientX;
    pointerColStartY.value = e.clientY;
    pointerColDragActive.value = false;
    dragOverColKey.value = null;

    // Capture pointer per continuous tracking
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      // Solo processa se questo è il drag attivo
      if (pointerColDragKey.value !== key) {
        cleanupColPointerDrag();
        el.releasePointerCapture(moveEvent.pointerId);
        return;
      }

      // Calcola distanza dal punto iniziale
      const dx = Math.abs(moveEvent.clientX - pointerColStartX.value);
      const dy = Math.abs(moveEvent.clientY - pointerColStartY.value);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Attiva drag solo oltre soglia
      if (distance >= DRAG_THRESHOLD && !pointerColDragActive.value) {
        pointerColDragActive.value = true;
        dragOverColKey.value = null;
        document.body.classList.add('col-dragging');
      }

      // Aggiorna over state se dragging è attivo
      if (pointerColDragActive.value) {
        const targetKey = getColumnKeyAtPoint(moveEvent.clientX, moveEvent.clientY);
        if (targetKey && targetKey !== key && keys.includes(targetKey)) {
          dragOverColKey.value = targetKey;
        } else {
          dragOverColKey.value = null;
        }
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (pointerColDragKey.value !== key) {
        cleanupColPointerDrag();
        el.releasePointerCapture(upEvent.pointerId);
        return;
      }

      // Se drag era attivo, esegui reorder
      if (pointerColDragActive.value) {
        const targetKey = getColumnKeyAtPoint(upEvent.clientX, upEvent.clientY);
        if (targetKey && targetKey !== key && keys.includes(targetKey)) {
          reorderColumn(key, targetKey);
        }
      }

      cleanupColPointerDrag();
      el.releasePointerCapture(upEvent.pointerId);
    };

    const handlePointerCancel = (cancelEvent: PointerEvent) => {
      if (pointerColDragKey.value !== key) {
        cleanupColPointerDrag();
        el.releasePointerCapture(cancelEvent.pointerId);
        return;
      }
      cleanupColPointerDrag();
      el.releasePointerCapture(cancelEvent.pointerId);
    };

    // Aggiungi listeners
    el.addEventListener('pointermove', handlePointerMove, { passive: false });
    el.addEventListener('pointerup', handlePointerUp, { passive: false });
    el.addEventListener('pointercancel', handlePointerCancel, { passive: false });

    // Cleanup automatico come safety
    const cleanupListeners = () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerCancel);
      if (pointerColDragKey.value === key) {
        cleanupColPointerDrag();
      }
    };

    setTimeout(() => {
      cleanupListeners();
    }, 10000);
  }

  function reorderColumn(dragKey: K, targetKey: K) {
    if (dragKey === targetKey) return;
    const current = order.value as K[];
    const next = [...current];
    const from = next.indexOf(dragKey);
    const to = next.indexOf(targetKey);
    if (from < 0 || to < 0) return;
    next.splice(from, 1);
    const insertAt = next.indexOf(targetKey);
    if (insertAt < 0) return;
    next.splice(insertAt, 0, dragKey);
    order.value = next as typeof order.value;
  }

  function onColDragStart(key: K, e: DragEvent) {
    // Previeni se pointer drag è già attivo
    if (pointerColDragActive.value) {
      e.preventDefault();
      return;
    }
    colDragKey = key;
    nativeColDragKey.value = key;
    dragOverColKey.value = null;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', key);
    }
  }

  function onColDragOver(targetKey: K, e: DragEvent) {
    if (pointerColDragActive.value) {
      e.preventDefault();
      return;
    }
    if (!colDragKey || colDragKey === targetKey) return;
    e.preventDefault();
    dragOverColKey.value = targetKey;
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  }

  function onColDrop(targetKey: K, e: DragEvent) {
    if (pointerColDragActive.value) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const dragKey =
      colDragKey ?? ((e.dataTransfer?.getData('text/plain') as K | undefined) || null);
    colDragKey = null;
    nativeColDragKey.value = null;
    dragOverColKey.value = null;
    if (!dragKey || dragKey === targetKey) return;
    if (!keys.includes(dragKey)) return;
    reorderColumn(dragKey, targetKey);
  }

  function onColDragEnd() {
    nativeColDragKey.value = null;
    dragOverColKey.value = null;
    if (!pointerColDragActive.value) {
      colDragKey = null;
    }
  }

  function colDragClass(key: K): Record<string, boolean> {
    return {
      'col-dragging': pointerColDragKey.value === key || nativeColDragKey.value === key,
      'col-drag-over': dragOverColKey.value === key &&
        pointerColDragKey.value !== key && nativeColDragKey.value !== key,
    };
  }

  function onMove(e: MouseEvent) {
    if (!resizeKey) return;
    const delta = e.clientX - startX;
    const next = Math.max(MIN_WIDTH, startW + delta);
    widths[resizeKey] = next;
    collapsed[resizeKey] = false;
  }

  function onUp() {
    resizeKey = null;
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
    resizeKey = key;
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
    cleanupColPointerDrag();
  });

  return {
    widths,
    collapsed,
    visible,
    order,
    orderedKeys,
    displayWidth,
    styleFor,
    toggleCollapse,
    startResize,
    isVisible,
    setVisible,
    toggleVisible,
    reorderColumn,
    // Pointer-based drag handlers
    onColPointerDown,
    colDragClass,
    // HTML5 drag-and-drop handlers (fallback)
    onColDragStart,
    onColDragOver,
    onColDrop,
    onColDragEnd,
  };
}

export function useResizableColumns() {
  return useColumnLayout<ColumnKey>({
    defaultWidths: DEFAULT_WIDTHS,
    defaultVisible: DEFAULT_VISIBLE,
    defaultOrder: DEFAULT_ORDER,
    storageKey: STORAGE_KEY,
    orderStorageKey: ORDER_STORAGE_KEY,
    lockedKey: 'name',
  });
}

export function useModelResizableColumns() {
  return useColumnLayout<ModelColumnKey>({
    defaultWidths: MODEL_DEFAULT_WIDTHS,
    defaultVisible: MODEL_DEFAULT_VISIBLE,
    defaultOrder: MODEL_DEFAULT_ORDER,
    storageKey: MODEL_STORAGE_KEY,
    orderStorageKey: MODEL_ORDER_STORAGE_KEY,
    lockedKey: 'name',
  });
}

export function useManagerResizableColumns() {
  return useColumnLayout<ManagerColumnKey>({
    defaultWidths: MANAGER_DEFAULT_WIDTHS,
    defaultVisible: MANAGER_DEFAULT_VISIBLE,
    defaultOrder: MANAGER_DEFAULT_ORDER,
    storageKey: MANAGER_STORAGE_KEY,
    orderStorageKey: MANAGER_ORDER_STORAGE_KEY,
    lockedKey: 'name',
  });
}

export function useClientOutputResizableColumns() {
  return useColumnLayout<ClientOutputColumnKey>({
    defaultWidths: CLIENT_OUTPUT_DEFAULT_WIDTHS,
    defaultVisible: CLIENT_OUTPUT_DEFAULT_VISIBLE,
    defaultOrder: CLIENT_OUTPUT_DEFAULT_ORDER,
    storageKey: CLIENT_OUTPUT_STORAGE_KEY,
    orderStorageKey: CLIENT_OUTPUT_ORDER_STORAGE_KEY,
    lockedKey: 'name',
  });
}
