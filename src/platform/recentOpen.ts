const RECENT_OPEN_KEY = 'howlong:recentOpen';

export function getRecentOpenPaths(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_OPEN_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((path): path is string => typeof path === 'string') : [];
  } catch {
    return [];
  }
}

export function addRecentOpenPath(path: string): void {
  const next = [path, ...getRecentOpenPaths().filter((recentPath) => recentPath !== path)].slice(0, 5);
  try {
    localStorage.setItem(RECENT_OPEN_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage errors.
  }
}
