import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../stores/settings';
import type { Locale } from '../models/settings';
import { translate } from './messages';

export function useI18n() {
  const settings = useSettingsStore();
  const { settings: s } = storeToRefs(settings);

  const locale = computed<Locale>(() => s.value.locale ?? 'it');

  function t(path: string, vars?: Record<string, string>): string {
    return translate(locale.value, path, vars);
  }

  function setLocale(next: Locale) {
    s.value.locale = next;
  }

  return { locale, t, setLocale };
}
