function migrateLegacyTag(record: Record<string, unknown>): Record<string, unknown> {
  const next = { ...record };
  if (!Array.isArray(next.tags)) {
    const legacy = typeof next.tag === 'string' ? next.tag.trim() : '';
    next.tags = legacy ? [legacy] : [];
  }
  delete next.tag;
  return next;
}

function normalizeActivities(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  return raw.map((a) => {
    if (!a || typeof a !== 'object') return a;
    return migrateLegacyTag(a as Record<string, unknown>);
  });
}

/** Migra `tag` string → `tags[]` e garantisce `tagOptions` su modello/stima. */
export function normalizeModelInput(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = { ...(data as Record<string, unknown>) };
  if (!Array.isArray(d.tagOptions)) d.tagOptions = [];
  d.macroActivities = normalizeActivities(d.macroActivities);
  return d;
}

export function normalizeEstimateInput(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = { ...(data as Record<string, unknown>) };
  if (!Array.isArray(d.tagOptions)) d.tagOptions = [];
  if (Array.isArray(d.items)) {
    d.items = d.items.map((a) => {
      if (!a || typeof a !== 'object') return a;
      return migrateLegacyTag(a as Record<string, unknown>);
    });
  }
  if (d.clientView && typeof d.clientView === 'object') {
    d.clientView = migrateClientView(d.clientView as Record<string, unknown>);
  }
  return d;
}

function migrateClientView(cv: Record<string, unknown>): Record<string, unknown> {
  const next = { ...cv };
  if (typeof next.hideInternalNotes === 'boolean') {
    if (next.hideManagerNotes === undefined) next.hideManagerNotes = next.hideInternalNotes;
    if (next.hideClientNotes === undefined) next.hideClientNotes = next.hideInternalNotes;
  }
  delete next.hideInternalNotes;
  if (next.hideManagerTags === undefined) next.hideManagerTags = false;
  if (next.hideClientTags === undefined) next.hideClientTags = false;
  if (next.hideManagerNotes === undefined) next.hideManagerNotes = false;
  if (next.hideClientNotes === undefined) next.hideClientNotes = true;
  if (!next.macroPresentation || typeof next.macroPresentation !== 'object') {
    next.macroPresentation = {};
  }
  return next;
}
