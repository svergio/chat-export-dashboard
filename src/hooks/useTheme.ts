import { useCallback, useEffect, useState } from 'react';

export type Skin = 'default' | 'chatgpt' | 'grok' | 'grok-x' | 'copilot' | 'claude';
export type SchemePref = 'dark' | 'light' | 'auto';
export type LocaleCode = 'en' | 'ru';

function resolveScheme(schemePref: SchemePref): 'dark' | 'light' {
  if (schemePref === 'auto') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return schemePref;
}

function skinToDataset(skin: Skin): string {
  return skin === 'default' ? 'chatgpt' : skin;
}

export function useTheme() {
  const [skin, setSkinState] = useState<Skin>(
    () => (localStorage.getItem('ce_dash_skin') as Skin) || 'default'
  );
  const [schemePref, setSchemePrefState] = useState<SchemePref>(
    () => (localStorage.getItem('ce_dash_scheme') as SchemePref) || 'dark'
  );
  const [locale, setLocaleState] = useState<LocaleCode>(
    () => (localStorage.getItem('ce_dash_locale') as LocaleCode) || 'en'
  );

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

  const setLocale = (v: LocaleCode) => {
    localStorage.setItem('ce_dash_locale', v);
    setLocaleState(v);
  };

  return { skin, schemePref, locale, setSkin, setSchemePref, setLocale };
}
