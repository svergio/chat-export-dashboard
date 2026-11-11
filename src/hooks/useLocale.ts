import { useCallback, useEffect, useState } from 'react';
import type { LocaleCode } from './useTheme';
import type { LocaleStrings } from '../types/api';
import { FALLBACK_STRINGS } from '../i18n/fallback';

export function useLocale(locale: LocaleCode) {
  const [strings, setStrings] = useState<LocaleStrings>(FALLBACK_STRINGS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/dashboard/locales/${locale}.json`);
        if (res.ok) {
          const data = (await res.json()) as LocaleStrings;
          if (!cancelled) setStrings({ ...FALLBACK_STRINGS, ...data });
          return;
        }
      } catch {
        /* fallback */
      }
      if (!cancelled) setStrings(FALLBACK_STRINGS);
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const t = useCallback((key: string) => strings[key] ?? FALLBACK_STRINGS[key] ?? key, [strings]);

  return { t, strings };
}
