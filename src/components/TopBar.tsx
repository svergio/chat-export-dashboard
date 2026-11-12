import { StatusDot } from './StatusDot';
import { AppearanceControls } from './AppearanceControls';
import type { LocalePref, SchemePref, Skin } from '../hooks/useTheme';
import { REFRESH_INTERVALS, useDashboardRefresh } from '../hooks/useDashboardRefresh';

type Props = {
  t: (key: string) => string;
  username: string;
  serverOk: boolean;
  localePref: LocalePref;
  schemePref: SchemePref;
  skin: Skin;
  onLocale: (v: LocalePref) => void;
  onScheme: (v: SchemePref) => void;
  onSkin: (v: Skin) => void;
  onLogout: () => void;
};

function formatLastRefresh(ts: number | null, t: (key: string) => string): string {
  if (!ts) return t('dashEmDash');
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return t('dashEmDash');
  }
}

export function TopBar({
  t,
  username,
  serverOk,
  localePref,
  schemePref,
  skin,
  onLocale,
  onScheme,
  onSkin,
  onLogout
}: Props) {
  const { intervalMs, setIntervalMs, lastRefreshAt, refreshNow } = useDashboardRefresh();

  return (
    <header className="top-bar">
      <div className="top-bar__brand">{t('appTitle')}</div>
      <div className="top-bar__status">
        <StatusDot tone={serverOk ? 'ok' : 'danger'} label={t('serverOnline')} />
        <span>{t('serverOnline')}</span>
        <span className="mono">{username}</span>
      </div>
      <span className="top-bar__spacer" />
      <div className="top-bar__refresh" aria-label={t('autoRefresh')}>
        <span className="top-bar__refresh-label">{t('autoRefresh')}</span>
        <div className="logs-interval-group">
          {REFRESH_INTERVALS.map((opt) => (
            <button
              key={opt.ms}
              type="button"
              className={`btn btn--sm${intervalMs === opt.ms ? ' active' : ''}`}
              onClick={() => setIntervalMs(opt.ms)}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--sm" onClick={refreshNow}>
          {t('refreshNow')}
        </button>
        <span className="top-bar__last-refresh">
          {t('lastRefresh')}: {formatLastRefresh(lastRefreshAt, t)}
        </span>
      </div>
      <div className="top-bar__chrome" aria-label={t('ariaLocaleTheme')}>
        <AppearanceControls
          t={t}
          localePref={localePref}
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
