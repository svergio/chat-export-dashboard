export type LocalePref = 'auto' | 'en' | 'ru';
export type LocaleCode = 'en' | 'ru';

function detectBrowserLocale(): LocaleCode {
  const langs: string[] =
    typeof navigator !== 'undefined'
      ? [...(navigator.languages ?? []), navigator.language].filter(Boolean)
      : [];
  for (const raw of langs) {
    const low = String(raw).toLowerCase();
    if (low.startsWith('ru')) return 'ru';
  }
  return 'en';
}

export function resolveLocale(localePref: LocalePref): LocaleCode {
  if (localePref === 'en' || localePref === 'ru') return localePref;
  return detectBrowserLocale();
}

export function parseLocalePref(stored: string | null): LocalePref {
  if (stored === 'en' || stored === 'ru' || stored === 'auto') return stored;
  return 'auto';
}
