export function newId(prefix = 'id'): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
