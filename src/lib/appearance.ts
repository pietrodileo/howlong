import type { Theme } from '../models/settings';

/** Applica tema chiaro / scuro sull’intero documento. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('theme-dark', theme === 'dark');
  root.classList.remove('theme-bw');
  root.dataset.theme = theme;
}
