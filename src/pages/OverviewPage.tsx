import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import type { OverviewResponse } from '../types/api';
import { formatDate, formatUptime } from '../utils/format';

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
  onServerOk: (ok: boolean) => void;
};

export function OverviewPage({ t, onUnauthorized, onServerOk }: Props) {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<OverviewResponse>('GET', '/overview');
      setData(res);
      onServerOk(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        onUnauthorized();
        return;
      }
      onServerOk(false);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, onServerOk]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <section className="panel panel--active">
        <div className="toolbar">
          <h2>{t('navOverview')}</h2>
        </div>
        <p className="empty-hint">{t('loading')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel panel--active">
        <div className="msg msg--error">{error}</div>
      </section>
    );
  }

  if (!data) return null;

  const queue = data.queue || {};
  const queueRows = Object.entries(queue);
  const hub = data.hub || {};
  const db = data.database || {};
  const tools = data.mcpToolStats || [];
  const dash = data.dashboard?.enabled ? t('enabled') : t('off');

  return (
    <section className="panel panel--active">
      <div className="toolbar">
        <h2>{t('navOverview')}</h2>
        <span className="top-bar__spacer" />
        <button type="button" className="btn btn--sm" onClick={() => void load()}>
          {t('refresh')}
        </button>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>{t('serverOnline')}</h3>
          <dl>
            <div className="stat-row">
              <dt>{t('version')}</dt>
              <dd>{data.version || t('dashEmDash')}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('uptime')}</dt>
              <dd>{formatUptime(data.uptimeMs || 0)}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('started')}</dt>
              <dd>{formatDate(data.startedAt, t('dashEmDash'))}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('database')}</dt>
              <dd className="mono">{db.path || db.kind || 'sqlite'}</dd>
            </div>
          </dl>
        </div>
        <div className="card">
          <h3>{t('hubBoundBrowser')}</h3>
          <dl>
            <div className="stat-row">
              <dt>{t('bound')}</dt>
              <dd>{hub.boundBrowserId || t('dashEmDash')}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('connections')}</dt>
              <dd>{hub.connections ?? t('dashEmDash')}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('dashboard')}</dt>
              <dd>{dash}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>{t('jobQueueCounts')}</h3>
        {queueRows.length ? (
          queueRows.map(([k, v]) => (
            <div key={k} className="stat-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))
        ) : (
          <p className="empty-hint">{t('noJobsInDb')}</p>
        )}
      </div>
      <h3 style={{ marginBottom: '0.5rem' }}>{t('mcpToolUsage')}</h3>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t('thTool')}</th>
              <th>{t('thCalls')}</th>
              <th>{t('thOk')}</th>
              <th>{t('thErrors')}</th>
              <th>{t('thAvgMs')}</th>
            </tr>
          </thead>
          <tbody>
            {tools.length ? (
              tools.map((r) => (
                <tr key={r.tool}>
                  <td className="mono">{r.tool}</td>
                  <td>{r.calls}</td>
                  <td>{r.okCount}</td>
                  <td>{r.errCount}</td>
                  <td>{r.avgMs != null ? r.avgMs : t('dashEmDash')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty-hint">
                  {t('noMetricsYet')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
