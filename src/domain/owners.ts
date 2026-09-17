/** Normalize user-entered owner names without changing their spelling or case. */
export function normalizeOwner(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Normalize an owner list, removing blank and case-insensitive duplicates. */
export function normalizeOwners(names: readonly unknown[] = []): string[] {
  return mergeOwners(names.filter((name): name is string => typeof name === 'string'));
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
