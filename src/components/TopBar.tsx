import type { LocaleCode, SchemePref, Skin } from '../hooks/useTheme';

type Props = {
  t: (key: string) => string;
  username: string;
  serverOk: boolean;
  locale: LocaleCode;
  schemePref: SchemePref;
  skin: Skin;
  onLocale: (v: LocaleCode) => void;
  onScheme: (v: SchemePref) => void;
  onSkin: (v: Skin) => void;
  onLogout: () => void;
};

export function TopBar({
  t,
  username,
  serverOk,
  locale,
  schemePref,
  skin,
  onLocale,
  onScheme,
  onSkin,
  onLogout
}: Props) {
  return (
    <header className="top-bar">
      <div className="top-bar__brand">{t('appTitle')}</div>
      <div className="top-bar__status">
        <span className={`status-dot${serverOk ? ' status-dot--ok' : ''}`} />
        <span>{t('serverOnline')}</span>
        <span className="mono">{username}</span>
      </div>
      <span className="top-bar__spacer" />
      <div className="top-bar__chrome" aria-label="Locale and theme">
        <select title="Locale" value={locale} onChange={(e) => onLocale(e.target.value as LocaleCode)}>
          <option value="en">{t('localeEn')}</option>
          <option value="ru">{t('localeRu')}</option>
        </select>
        <select title="Theme" value={schemePref} onChange={(e) => onScheme(e.target.value as SchemePref)}>
          <option value="dark">{t('themeDark')}</option>
          <option value="light">{t('themeLight')}</option>
          <option value="auto">{t('themeAuto')}</option>
        </select>
        <select title="Skin" value={skin} onChange={(e) => onSkin(e.target.value as Skin)}>
          <option value="default">{t('skinDefault')}</option>
          <option value="chatgpt">{t('skinChatgpt')}</option>
          <option value="grok">{t('skinGrok')}</option>
          <option value="grok-x">{t('skinGrokX')}</option>
          <option value="copilot">{t('skinCopilot')}</option>
          <option value="claude">{t('skinClaude')}</option>
        </select>
        <button type="button" className="btn btn--sm" onClick={onLogout}>
          {t('signOut')}
        </button>
      </div>
    </header>
  );
}
