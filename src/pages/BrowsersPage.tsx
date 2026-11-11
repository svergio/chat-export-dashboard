import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import type { BrowserRow, McpTokenInfo } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, mcpSnippet } from '../utils/format';

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
};

export function BrowsersPage({ t, onUnauthorized }: Props) {
  const [mcp, setMcp] = useState<McpTokenInfo | null>(null);
  const [browsers, setBrowsers] = useState<BrowserRow[]>([]);
  const [enrollMsg, setEnrollMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [rotateToken, setRotateToken] = useState<string | null>(null);

  const loadMcp = useCallback(async () => {
    const data = await api<{ ok: boolean } & McpTokenInfo>('GET', '/mcp-token');
    setMcp(data);
  }, []);

  const loadBrowsers = useCallback(async () => {
    try {
      const data = await api<{ browsers: BrowserRow[] }>('GET', '/browsers');
      setBrowsers(data.browsers || []);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) onUnauthorized();
    }
  }, [onUnauthorized]);

  const loadAll = useCallback(async () => {
    try {
      await Promise.all([loadMcp(), loadBrowsers()]);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) onUnauthorized();
    }
  }, [loadMcp, loadBrowsers, onUnauthorized]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onRotate = async () => {
    if (!confirm(t('rotateMcpConfirm'))) return;
    try {
      const data = await api<{ token: string }>('POST', '/mcp-token/rotate');
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
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const active = mcp?.active;
  const online = browsers.filter((b) => b.status === 'online' && b.tabs?.length);

  return (
    <section className="panel panel--active">
      <h2>{t('navBrowsers')}</h2>
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
      <h3>{t('sectionBrowsers')}</h3>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t('thBrowserId')}</th>
              <th>{t('thLabel')}</th>
              <th>{t('thStatus')}</th>
              <th>{t('thFlags')}</th>
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
                const tabs = Array.isArray(b.tabs) ? b.tabs.length : 0;
                return (
                  <tr key={b.browserId}>
                    <td className="mono">{b.browserId}</td>
                    <td>{b.browserLabel}</td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>{flags}</td>
                    <td>{tabs}</td>
                    <td>{b.bound ? t('yes') : t('dashEmDash')}</td>
                    <td className="mono">{b.fingerprint || t('dashEmDash')}</td>
                    <td>
                      <button type="button" className="btn btn--sm" onClick={() => void onBind(b.browserId)}>
                        {t('btnBind')}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="empty-hint">
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
