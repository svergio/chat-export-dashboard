import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type LocaleCode,
  type LocalePref,
  parseLocalePref,
  resolveLocale
} from '../i18n/resolveLocale';

export type { LocaleCode, LocalePref };
export type Skin = 'default' | 'chatgpt' | 'grok' | 'grok-x' | 'copilot' | 'claude';
export type SchemePref = 'dark' | 'light' | 'auto';

function resolveScheme(schemePref: SchemePref): 'dark' | 'light' {
  if (schemePref === 'auto') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return schemePref;
}

function parseSchemePref(stored: string | null): SchemePref {
  if (stored === 'dark' || stored === 'light' || stored === 'auto') return stored;
  return 'auto';
}

function skinToDataset(skin: Skin): string {
  return skin === 'default' ? 'chatgpt' : skin;
}

export function useTheme() {
  const [skin, setSkinState] = useState<Skin>(
    () => (localStorage.getItem('ce_dash_skin') as Skin) || 'default'
  );
  const [schemePref, setSchemePrefState] = useState<SchemePref>(() =>
    parseSchemePref(localStorage.getItem('ce_dash_scheme'))
  );
  const [localePref, setLocalePrefState] = useState<LocalePref>(() =>
    parseLocalePref(localStorage.getItem('ce_dash_locale'))
  );

  const locale = useMemo(() => resolveLocale(localePref), [localePref]);

  const applyDom = useCallback(
    (s: Skin, scheme: SchemePref, loc: LocaleCode) => {
      const html = document.documentElement;
      html.dataset.skin = skinToDataset(s);
      html.dataset.scheme = resolveScheme(scheme);
      html.dataset.locale = loc;
      html.lang = loc === 'ru' ? 'ru' : 'en';
    },
    []
  );

  useEffect(() => {
    applyDom(skin, schemePref, locale);
  }, [skin, schemePref, locale, applyDom]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (localStorage.getItem('ce_dash_scheme') === 'auto') {
        document.documentElement.dataset.scheme = resolveScheme('auto');
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setSkin = (v: Skin) => {
    localStorage.setItem('ce_dash_skin', v);
    setSkinState(v);
  };

  const setSchemePref = (v: SchemePref) => {
    localStorage.setItem('ce_dash_scheme', v);
    setSchemePrefState(v);
  };

  const setLocalePref = (v: LocalePref) => {
    localStorage.setItem('ce_dash_locale', v);
    setLocalePrefState(v);
  };

  return {
    skin,
    schemePref,
    localePref,
    locale,
    setSkin,
    setSchemePref,
    setLocalePref
  };
}
