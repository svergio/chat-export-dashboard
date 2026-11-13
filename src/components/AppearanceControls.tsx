import { useState } from 'react';
import type { LocalePref, SchemePref, Skin } from '../hooks/useTheme';
import {
  FONT_OPTIONS,
  UI_SIZE_OPTIONS,
  type FontPref,
  type UiSizePref
} from '../hooks/useUiPrefs';
import {
  DASH_SKIN_OPTIONS,
  SCHEME_OPTIONS,
  IconSun,
  IconMoon,
  IconAuto
} from './SkinIcons';
import { SelectMenu } from './SelectMenu';

function localeLabel(pref: LocalePref, t: (key: string) => string): string {
  if (pref === 'ru') return t('localeRu');
  if (pref === 'en') return t('localeEn');
  return t('localeAuto');
}

type Props = {
  t: (key: string) => string;
  localePref: LocalePref;
  schemePref: SchemePref;
  skin: Skin;
  fontPref: FontPref;
  uiSizePref: UiSizePref;
  onLocale: (v: LocalePref) => void;
  onScheme: (v: SchemePref) => void;
  onSkin: (v: Skin) => void;
  onFont: (v: FontPref) => void;
  onUiSize: (v: UiSizePref) => void;
  compact?: boolean;
};

function skinLabel(skin: Skin, t: (key: string) => string): string {
  if (skin === 'default') return t('skinDefault');
  const map: Record<Exclude<Skin, 'default'>, string> = {
    chatgpt: 'skinChatgpt',
    grok: 'skinGrok',
    'grok-x': 'skinGrokX',
    copilot: 'skinCopilot',
    claude: 'skinClaude',
    qwen: 'skinQwen',
    deepseek: 'skinDeepseek',
    perplexity: 'skinPerplexity',
    kimi: 'skinKimi',
    zai: 'skinZai',
    minimax: 'skinMinimax',
    janitorai: 'skinJanitorai'
  };
  return t(map[skin]);
}

function schemeLabel(scheme: SchemePref, t: (key: string) => string): string {
  if (scheme === 'dark') return t('themeDark');
  if (scheme === 'light') return t('themeLight');
  return t('themeAuto');
}

function schemeIcon(scheme: SchemePref) {
  if (scheme === 'light') return <IconSun size={15} />;
  if (scheme === 'dark') return <IconMoon size={15} />;
  return <IconAuto size={15} />;
}

function fontLabel(font: FontPref, t: (key: string) => string): string {
  if (font === 'sans') return t('fontSans');
  if (font === 'serif') return t('fontSerif');
  if (font === 'mono') return t('fontMono');
  return t('fontSystem');
}

function uiSizeLabel(size: UiSizePref, t: (key: string) => string): string {
  if (size === 'compact') return t('uiSizeCompact');
  if (size === 'large') return t('uiSizeLarge');
  return t('uiSizeDefault');
}

const LOCALE_OPTIONS: LocalePref[] = ['auto', 'en', 'ru'];

type MenuId = 'locale' | 'scheme' | 'skin' | 'font' | 'uiSize';

export function AppearanceControls({
  t,
  localePref,
  schemePref,
  skin,
  fontPref,
  uiSizePref,
  onLocale,
  onScheme,
  onSkin,
  onFont,
  onUiSize,
  compact = true
}: Props) {
  const [localeOpen, setLocaleOpen] = useState(false);
  const [schemeOpen, setSchemeOpen] = useState(false);
  const [skinOpen, setSkinOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [uiSizeOpen, setUiSizeOpen] = useState(false);

  const closeExcept = (which: MenuId) => {
    setLocaleOpen(which === 'locale');
    setSchemeOpen(which === 'scheme');
    setSkinOpen(which === 'skin');
    setFontOpen(which === 'font');
    setUiSizeOpen(which === 'uiSize');
  };

  const skinOpt = DASH_SKIN_OPTIONS.find((o) => o.id === skin) ?? DASH_SKIN_OPTIONS[0];
  const SkinIcon = skinOpt.Icon;

  return (
    <div className={`appearance-controls${compact ? ' appearance-controls--compact' : ''}`}>
      <SelectMenu
        compact={compact}
        ariaLabel={localeLabel(localePref, t)}
        open={localeOpen}
        setOpen={(v) => (v ? closeExcept('locale') : setLocaleOpen(false))}
        valueLabel={localeLabel(localePref, t)}
      >
        {LOCALE_OPTIONS.map((id) => {
          const active = localePref === id;
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={active ? 'true' : 'false'}
              className={`ce-select-item${active ? ' is-active' : ''}`}
              onClick={() => {
                onLocale(id);
                setLocaleOpen(false);
              }}
            >
              <span>{localeLabel(id, t)}</span>
            </button>
          );
        })}
      </SelectMenu>

      <SelectMenu
        compact={compact}
        ariaLabel={t('themeDark')}
        open={schemeOpen}
        setOpen={(v) => (v ? closeExcept('scheme') : setSchemeOpen(false))}
        leading={schemeIcon(schemePref)}
        valueLabel={schemeLabel(schemePref, t)}
      >
        {SCHEME_OPTIONS.map((opt) => {
          const active = schemePref === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="option"
              aria-selected={active ? 'true' : 'false'}
              className={`ce-select-item${active ? ' is-active' : ''}`}
              onClick={() => {
                onScheme(opt.id);
                setSchemeOpen(false);
              }}
            >
              <opt.Icon size={15} />
              <span>{schemeLabel(opt.id, t)}</span>
            </button>
          );
        })}
      </SelectMenu>

      <SelectMenu
        compact={compact}
        ariaLabel={skinLabel(skin, t)}
        open={skinOpen}
        setOpen={(v) => (v ? closeExcept('skin') : setSkinOpen(false))}
        leading={<SkinIcon size={15} />}
        valueLabel={skinLabel(skin, t)}
      >
        {DASH_SKIN_OPTIONS.map((opt) => {
          const active = skin === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="option"
              aria-selected={active ? 'true' : 'false'}
              className={`ce-select-item${active ? ' is-active' : ''}`}
              onClick={() => {
                onSkin(opt.id);
                setSkinOpen(false);
              }}
            >
              <opt.Icon size={15} />
              <span>{skinLabel(opt.id, t)}</span>
            </button>
          );
        })}
      </SelectMenu>

      <SelectMenu
        compact={compact}
        ariaLabel={t('fontFamily')}
        open={fontOpen}
        setOpen={(v) => (v ? closeExcept('font') : setFontOpen(false))}
        valueLabel={fontLabel(fontPref, t)}
      >
        {FONT_OPTIONS.map((id) => {
          const active = fontPref === id;
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={active ? 'true' : 'false'}
              className={`ce-select-item${active ? ' is-active' : ''}`}
              onClick={() => {
                onFont(id);
                setFontOpen(false);
              }}
            >
              <span>{fontLabel(id, t)}</span>
            </button>
          );
        })}
      </SelectMenu>

      <SelectMenu
        compact={compact}
        ariaLabel={t('uiSize')}
        open={uiSizeOpen}
        setOpen={(v) => (v ? closeExcept('uiSize') : setUiSizeOpen(false))}
        valueLabel={uiSizeLabel(uiSizePref, t)}
      >
        {UI_SIZE_OPTIONS.map((id) => {
          const active = uiSizePref === id;
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={active ? 'true' : 'false'}
              className={`ce-select-item${active ? ' is-active' : ''}`}
              onClick={() => {
                onUiSize(id);
                setUiSizeOpen(false);
              }}
            >
              <span>{uiSizeLabel(id, t)}</span>
            </button>
          );
        })}
      </SelectMenu>
    </div>
  );
}
