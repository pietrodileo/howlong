/** Normalize user-entered owner names without changing their spelling or case. */
export function normalizeOwner(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Merge owner suggestions case-insensitively, retaining the first spelling. */
export function mergeOwners(names: string[]): string[] {
  const owners = new Map<string, string>();
  for (const name of names) {
    const normalized = normalizeOwner(name);
    if (normalized && !owners.has(normalized.toLowerCase())) owners.set(normalized.toLowerCase(), normalized);
  }
  return [...owners.values()];
}
