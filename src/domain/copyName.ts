/** Prossimo nome per una duplica: "X (copia)", poi "X (copia 2)", "X (copia 3)", … */
export function nextCopyName(
  name: string,
  existingNames: readonly string[],
  locale: 'it' | 'en' = 'it',
): string {
  const label = locale === 'en' ? 'copy' : 'copia';
  const base = stripCopySuffixes(name, label);
  const escaped = escapeRegExp(base);

  const plain = new RegExp(`^${escaped}\\s*\\(${label}\\)$`, 'i');
  const numbered = new RegExp(`^${escaped}\\s*\\(${label}\\s+(\\d+)\\)$`, 'i');

  let max = 0;
  for (const n of existingNames) {
    if (plain.test(n)) max = Math.max(max, 1);
    const m = n.match(numbered);
    if (m) max = Math.max(max, Number(m[1]) || 0);
    // Nomi già “sporchi” tipo "(copia) (copia)" contano come occupati sul base
    if (stripCopySuffixes(n, label) === base && n !== base) {
      max = Math.max(max, 1);
    }
  }

  let next = max + 1;
  const taken = new Set(existingNames);
  for (;;) {
    const candidate = next <= 1 ? `${base} (${label})` : `${base} (${label} ${next})`;
    if (!taken.has(candidate)) return candidate;
    next += 1;
  }
}

function stripCopySuffixes(name: string, label: string): string {
  const stacked = new RegExp(`(?:\\s*\\(${label}(?:\\s+\\d+)?\\))+$`, 'i');
  return name.replace(stacked, '').trimEnd() || name.trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
