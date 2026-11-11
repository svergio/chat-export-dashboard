import { StatusDot } from './StatusDot';
import { AppearanceControls } from './AppearanceControls';
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
        <StatusDot tone={serverOk ? 'ok' : 'danger'} label={t('serverOnline')} />
        <span>{t('serverOnline')}</span>
        <span className="mono">{username}</span>
      </div>
      <span className="top-bar__spacer" />
      <div className="top-bar__chrome" aria-label="Locale and theme">
        <AppearanceControls
          t={t}
          locale={locale}
          schemePref={schemePref}
          skin={skin}
          onLocale={onLocale}
          onScheme={onScheme}
          onSkin={onSkin}
          compact
        />
        <button type="button" className="btn btn--sm" onClick={onLogout}>
          {t('signOut')}
        </button>
      </div>
    </header>
  );
}
