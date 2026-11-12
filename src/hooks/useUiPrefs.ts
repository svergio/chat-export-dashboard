import { useCallback, useEffect, useState } from 'react';

export type FontPref = 'system' | 'sans' | 'serif' | 'mono';
export type UiSizePref = 'compact' | 'default' | 'large';

export const FONT_OPTIONS: FontPref[] = ['system', 'sans', 'serif', 'mono'];
export const UI_SIZE_OPTIONS: UiSizePref[] = ['compact', 'default', 'large'];

const FONT_STORAGE_KEY = 'ce_dash_font';
const UI_SIZE_STORAGE_KEY = 'ce_dash_ui_size';

function parseFontPref(stored: string | null): FontPref {
  if (stored === 'system' || stored === 'sans' || stored === 'serif' || stored === 'mono') {
    return stored;
  }
  return 'system';
}

function parseUiSizePref(stored: string | null): UiSizePref {
  if (stored === 'compact' || stored === 'default' || stored === 'large') return stored;
  return 'default';
}

function applyDom(font: FontPref, uiSize: UiSizePref) {
  const html = document.documentElement;
  html.dataset.font = font;
  html.dataset.uiSize = uiSize;
}

export function useUiPrefs() {
  const [fontPref, setFontPrefState] = useState<FontPref>(() =>
    parseFontPref(localStorage.getItem(FONT_STORAGE_KEY))
  );
  const [uiSizePref, setUiSizePrefState] = useState<UiSizePref>(() =>
    parseUiSizePref(localStorage.getItem(UI_SIZE_STORAGE_KEY))
  );

  const apply = useCallback((font: FontPref, size: UiSizePref) => {
    applyDom(font, size);
  }, []);

  useEffect(() => {
    apply(fontPref, uiSizePref);
  }, [fontPref, uiSizePref, apply]);

  const setFontPref = (v: FontPref) => {
    localStorage.setItem(FONT_STORAGE_KEY, v);
    setFontPrefState(v);
  };

  const setUiSizePref = (v: UiSizePref) => {
    localStorage.setItem(UI_SIZE_STORAGE_KEY, v);
    setUiSizePrefState(v);
  };

  return {
    fontPref,
    uiSizePref,
    setFontPref,
    setUiSizePref
  };
}
