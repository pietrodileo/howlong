import { getOsUsername, isTauri } from './tauri';

export const AUDIT_ANONYMOUS = 'anonymous';

let cachedOsUsername: string | null | undefined;

/** Desktop login name (cached). Empty string if unavailable. */
export async function fetchOsUsername(): Promise<string> {
  if (cachedOsUsername !== undefined) return cachedOsUsername ?? '';
  if (!isTauri()) {
    cachedOsUsername = '';
    return '';
  }
  try {
    const name = (await getOsUsername()).trim();
    cachedOsUsername = name || '';
    return cachedOsUsername;
  } catch {
    cachedOsUsername = '';
    return '';
  }
}

/**
 * Profile name → OS username → anonymous.
 */
export async function resolveAuditUsername(profileUsername: string): Promise<string> {
  const profile = profileUsername.trim();
  if (profile) return profile;
  const os = await fetchOsUsername();
  if (os) return os;
  return AUDIT_ANONYMOUS;
}

export function appendAuditEntry<T extends { auditHistory: { at: string; username: string }[] }>(
  estimate: T,
  at: string,
  username: string,
): T {
  return {
    ...estimate,
    auditHistory: [...(estimate.auditHistory ?? []), { at, username }],
  };
}
