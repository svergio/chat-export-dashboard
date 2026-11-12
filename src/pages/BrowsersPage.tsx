import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import type { BrowserRow, McpTokenInfo, ServerSettingsSummary } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, mcpSnippet } from '../utils/format';
import { useDashboardRefresh } from '../hooks/useDashboardRefresh';

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
  onServerOk: (ok: boolean) => void;
};

function formatTabCount(n: number, t: (key: string) => string): string {
  if (n === 1) return `1 ${t('tabsOne')}`;
  if (n >= 2 && n <= 4) return `${n} ${t('tabsFew')}`;
  return `${n} ${t('tabsMany')}`;
}

export function BrowsersPage({ t, onUnauthorized, onServerOk }: Props) {
  const { tick, markRefreshed } = useDashboardRefresh();
  const [mcp, setMcp] = useState<McpTokenInfo | null>(null);
  const [browsers, setBrowsers] = useState<BrowserRow[]>([]);
  const [serverSettings, setServerSettings] = useState<ServerSettingsSummary | null>(null);
  const [enrollMsg, setEnrollMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [rotateToken, setRotateToken] = useState<string | null>(null);

  const loadMcp = useCallback(async () => {
    const data = await api<{ ok: boolean } & McpTokenInfo>('GET', '/mcp-token');
    setMcp(data);
  }, []);

  const loadBrowsers = useCallback(async () => {
    try {
      const data = await api<{ browsers: BrowserRow[]; serverSettings?: ServerSettingsSummary }>(
        'GET',
        '/browsers'
      );
      setBrowsers(data.browsers || []);
      setServerSettings(data.serverSettings || null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) onUnauthorized();
      throw err;
    }
  }, [onUnauthorized]);

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([loadMcp(), loadBrowsers()]);
      onServerOk(true);
      markRefreshed();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        onUnauthorized();
        return;
      }
      onServerOk(false);
    }
  }, [loadMcp, loadBrowsers, onUnauthorized, onServerOk, markRefreshed]);

  useEffect(() => {
    void loadAll();
  }, [loadAll, tick]);

  const onRotate = async () => {
    if (!confirm(t('rotateMcpConfirm'))) return;
    try {
      const data = await api<{ token: string }>('POST', '/mcp-token/rotate', { confirm: true });
      setRotateToken(data.token);
      await loadMcp();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const onEnroll = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const body = {
      browserId: (form.elements.namedItem('browserId') as HTMLInputElement).value.trim(),
      key: (form.elements.namedItem('key') as HTMLInputElement).value.trim(),
      browserLabel: (form.elements.namedItem('browserLabel') as HTMLInputElement).value.trim() || undefined,
      allowCreate: (form.elements.namedItem('allowCreate') as HTMLInputElement).checked,
      allowDestructive: (form.elements.namedItem('allowDestructive') as HTMLInputElement).checked,
      allowProjects: (form.elements.namedItem('allowProjects') as HTMLInputElement).checked
    };
    try {
      await api('POST', '/browsers/enroll', body);
      setEnrollMsg({ kind: 'ok', text: `${t('enrolledOk')} ${body.browserId}` });
      (form.elements.namedItem('key') as HTMLInputElement).value = '';
      await loadBrowsers();
    } catch (err) {
      setEnrollMsg({
        kind: 'error',
        text: err instanceof Error ? err.message : String(err)
      });
    }
  };

  const onBind = async (browserId: string) => {
    try {
      await api('POST', '/browsers/bind', { browserId });
      await loadBrowsers();
      markRefreshed();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const onUnbind = async () => {
    try {
      await api('POST', '/browsers/unbind', {});
      await loadBrowsers();
      markRefreshed();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const onRecheck = async (browserId: string) => {
    try {
      const data = await api<{ browsers?: BrowserRow[] }>('POST', '/browsers/recheck', { browserId });
      if (Array.isArray(data.browsers)) setBrowsers(data.browsers);
      else await loadBrowsers();
      markRefreshed();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const active = mcp?.active;
  const online = browsers.filter((b) => b.status === 'online' && b.tabs?.length);
  const destructiveMismatch = Boolean(
    serverSettings &&
      !serverSettings.allowDestructive &&
      browsers.some((b) => b.allowDestructive)
  );

  return (
    <section className="panel panel--active">
      <div className="toolbar">
        <h2>{t('navBrowsers')}</h2>
      </div>
      {destructiveMismatch ? (
        <div className="msg msg--warn">{t('destructiveServerOffWarn')}</div>
      ) : null}
      <div className="grid-2">
        <div className="card">
          <h3>{t('mcpServerToken')}</h3>
          {active ? (
            <dl>
              <div className="stat-row">
                <dt>{t('thId')}</dt>
                <dd className="mono">{active.id}</dd>
              </div>
              <div className="stat-row">
                <dt>{t('thFingerprint')}</dt>
                <dd className="mono">{active.fingerprint}</dd>
              </div>
              <div className="stat-row">
                <dt>{t('thCreated')}</dt>
                <dd>{formatDate(active.createdAt, t('dashEmDash'))}</dd>
              </div>
              <div className="stat-row">
                <dt>{t('thLastUsed')}</dt>
                <dd>{formatDate(active.lastUsedAt, t('dashEmDash'))}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-hint">{t('noActiveMcpKey')}</p>
          )}
          <p className="empty-hint">{t('tokenShownOnce')}</p>
          <p className="empty-hint">
            {t('revokedKeys')}: {mcp?.revokedCount ?? 0}
          </p>
          <textarea className="token-snippet" readOnly value={mcpSnippet(rotateToken ?? undefined)} />
          <div className="actions-inline">
            <button type="button" className="btn btn--primary" onClick={() => void onRotate()}>
              {t('rotateMcp')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void navigator.clipboard.writeText(mcpSnippet(rotateToken ?? undefined))}
            >
              {t('copySnippet')}
            </button>
          </div>
          {rotateToken ? (
            <div className="msg msg--warn">
              <strong>{t('newTokenCopyNow')}</strong>
              <br />
              <span className="mono">{rotateToken}</span>
            </div>
          ) : null}
        </div>
        <div className="card">
          <h3>{t('enrollBrowser')}</h3>
          {enrollMsg ? (
            <div className={`msg msg--${enrollMsg.kind === 'ok' ? 'ok' : 'error'}`}>{enrollMsg.text}</div>
          ) : null}
          <form onSubmit={(e) => void onEnroll(e)}>
            <div className="form-row">
              <label htmlFor="enroll-id">{t('labelBrowserId')}</label>
              <input
                id="enroll-id"
                name="browserId"
                type="text"
                required
                placeholder={t('placeholderBrowserId')}
              />
            </div>
            <div className="form-row">
              <label htmlFor="enroll-key">{t('labelCebToken')}</label>
              <input
                id="enroll-key"
                name="key"
                type="password"
                required
                autoComplete="off"
                placeholder={t('placeholderCeb')}
              />
            </div>
            <div className="form-row">
              <label htmlFor="enroll-label">{t('labelOptional')}</label>
              <input
                id="enroll-label"
                name="browserLabel"
                type="text"
                placeholder={t('placeholderOptional')}
              />
            </div>
            <div className="form-row">
              <label>{t('labelPermissions')}</label>
              <label>
                <input name="allowCreate" type="checkbox" defaultChecked /> {t('allowCreate')}
              </label>
              <label>
                <input name="allowProjects" type="checkbox" defaultChecked /> {t('allowProjects')}
              </label>
              <label>
                <input name="allowDestructive" type="checkbox" /> {t('allowDestructive')}
              </label>
            </div>
            <button type="submit" className="btn btn--primary">
              {t('btnEnroll')}
            </button>
          </form>
        </div>
      </div>
      <h3>{t('browserSlotsTitle')}</h3>
      <p className="empty-hint browser-slots-hint">{t('browserSlotsHint')}</p>
      <div className="browser-slots">
        {[0, 1].map((slot) => {
          const row = browsers[slot];
          const slotOnline = row?.status === 'online';
          const tone = slotOnline ? 'ok' : row ? 'warn' : 'muted';
          const liveTabs = slotOnline && row.tabs?.length ? row.tabs.length : 0;
          return (
            <div key={slot} className={`browser-slot card browser-slot--${tone}`}>
              <div className="browser-slot__head">
                <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />
                <strong>
                  {t('browserSlot')} {slot + 1}
                </strong>
              </div>
              {row ? (
                <>
                  <p className="browser-slot__id mono">{row.browserId}</p>
                  <p className="browser-slot__meta">
                    {row.browserLabel || t('dashEmDash')} · {row.status}
                    {liveTabs ? ` · ${formatTabCount(liveTabs, t)}` : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="browser-slot__empty">{t('browserSlotEmpty')}</p>
                  <p className="browser-slot__meta">{t('browserSlotOfflineHelp')}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
      <h3>{t('sectionBrowsers')}</h3>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t('thBrowserId')}</th>
              <th>{t('thLabel')}</th>
              <th>{t('thStatus')}</th>
              <th>{t('thFlags')}</th>
              <th>{t('thPlatforms')}</th>
              <th>{t('thTabs')}</th>
              <th>{t('thBound')}</th>
              <th>{t('thFingerprint')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {browsers.length ? (
              browsers.map((b) => {
                const flags = [
                  b.allowCreate ? t('flagCreate') : '',
                  b.allowProjects ? t('flagProjects') : '',
                  b.allowDestructive ? t('flagDelete') : ''
                ]
                  .filter(Boolean)
                  .join(', ') || t('dashEmDash');
                const onlineBrowser = b.status === 'online';
                const tabs = onlineBrowser && Array.isArray(b.tabs) ? b.tabs.length : 0;
                const platforms =
                  onlineBrowser && Array.isArray(b.platformsEnabled) && b.platformsEnabled.length
                    ? b.platformsEnabled.join(', ')
                    : onlineBrowser
                      ? t('platformsNoneReported')
                      : t('platformsOffline');
                return (
                  <tr key={b.browserId}>
                    <td className="mono">{b.browserId}</td>
                    <td>{b.browserLabel}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>{flags}</td>
                    <td>{platforms}</td>
                    <td>{onlineBrowser ? tabs : t('dashEmDash')}</td>
                    <td>{b.bound ? t('yes') : t('dashEmDash')}</td>
                    <td className="mono">{b.fingerprint || t('dashEmDash')}</td>
                    <td className="actions-inline">
                      {b.bound ? (
                        <button type="button" className="btn btn--sm" onClick={() => void onUnbind()}>
                          {t('btnUnbind')}
                        </button>
                      ) : (
                        <button type="button" className="btn btn--sm" onClick={() => void onBind(b.browserId)}>
                          {t('btnBind')}
                        </button>
                      )}
                      <button type="button" className="btn btn--sm" onClick={() => void onRecheck(b.browserId)}>
                        {t('btnRecheck')}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="empty-hint">
                  {t('noBrowsersEnrolled')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div>
        {online.length ? (
          online.map((b) => (
            <div key={b.browserId}>
              <h4 style={{ margin: '1rem 0 0.5rem' }}>
                {b.browserLabel} ({b.browserId})
              </h4>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t('thPlatform')}</th>
                      <th>{t('thUrlTitle')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(b.tabs || []).map((tab, i) => (
                      <tr key={i}>
                        <td>{tab.platform || t('dashEmDash')}</td>
                        <td className="mono">{tab.url || tab.title || t('dashEmDash')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-hint">{t('noLiveTabs')}</p>
        )}
      </div>
    </section>
  );
}
