import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import type { OverviewResponse } from '../types/api';
import { formatDate, formatUptime } from '../utils/format';

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
  onServerOk: (ok: boolean) => void;
};

const QUEUE_CHART_COLORS: Record<string, string> = {
  queued: '#8b949e',
  running: '#58a6ff',
  waiting_host: '#d29922',
  assigned: '#a371f7',
  done: '#3fb950',
  error: '#f85149',
  cancelled: '#6e7681'
};

function formatBytes(n: number, t: (key: string) => string): string {
  if (!n) return t('dashEmDash');
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / 1048576).toFixed(2)} MiB`;
}

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

  const toolMaxCalls = useMemo(() => {
    if (!data?.mcpToolStats?.length) return 1;
    return Math.max(1, ...data.mcpToolStats.map((r) => r.calls));
  }, [data]);

  const toolMaxAvg = useMemo(() => {
    if (!data?.mcpToolStats?.length) return 1;
    const vals = data.mcpToolStats.map((r) => r.avgMs ?? 0).filter((v) => v > 0);
    return vals.length ? Math.max(...vals) : 1;
  }, [data]);

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
  const dbPath = db.path || (db as { file?: string }).file;
  const tools = data.mcpToolStats || [];
  const dash = data.dashboard?.enabled ? t('enabled') : t('off');
  const res = data.resources;

  const heapPct =
    res && res.heapTotalMb > 0 ? Math.min(100, Math.round((res.heapUsedMb / res.heapTotalMb) * 100)) : 0;
  const rssCap = res ? Math.max(res.rssMb, res.heapTotalMb * 1.5, 256) : 256;
  const rssPct = res ? Math.min(100, Math.round((res.rssMb / rssCap) * 100)) : 0;
  const dbTotal = res ? res.dbSizeBytes + res.walSizeBytes : 0;
  const dbPct = res && dbTotal > 0 ? Math.min(100, Math.round((res.dbSizeBytes / dbTotal) * 100)) : 0;

  return (
    <section className="panel panel--active">
      <div className="toolbar">
        <h2>{t('navOverview')}</h2>
        <span className="top-bar__spacer" />
        <button type="button" className="btn btn--sm" onClick={() => void load()}>
          {t('refresh')}
        </button>
      </div>

      {res ? (
        <div className="overview-charts">
          <div className="card">
            <h3>{t('overviewResources')}</h3>
            <div className="resource-meter">
              <div className="resource-meter__label">
                <span>{t('overviewHeap')}</span>
                <span>
                  {res.heapUsedMb} / {res.heapTotalMb} MiB
                </span>
              </div>
              <div className="resource-meter__track">
                <div className="resource-meter__fill" style={{ width: `${heapPct}%` }} />
              </div>
            </div>
            <div className="resource-meter">
              <div className="resource-meter__label">
                <span>{t('overviewRam')}</span>
                <span>{res.rssMb} MiB RSS</span>
              </div>
              <div className="resource-meter__track">
                <div className="resource-meter__fill" style={{ width: `${rssPct}%` }} />
              </div>
            </div>
            <div className="resource-meter">
              <div className="resource-meter__label">
                <span>{t('overviewDbSize')}</span>
                <span>{formatBytes(res.dbSizeBytes, t)}</span>
              </div>
              <div className="resource-meter__track">
                <div className="resource-meter__fill" style={{ width: `${dbPct}%` }} />
              </div>
            </div>
            <div className="stat-row">
              <dt>{t('overviewWal')}</dt>
              <dd>{formatBytes(res.walSizeBytes, t)}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('overviewLoadAvg')}</dt>
              <dd className="mono">{res.loadAvg?.join(' · ') ?? t('dashEmDash')}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('uptime')}</dt>
              <dd>{formatUptime(res.uptimeMs ?? data.uptimeMs ?? 0)}</dd>
            </div>
          </div>

          <div className="card">
            <h3>{t('jobQueueCounts')}</h3>
            {queueRows.length ? (
              <div className="queue-donut">
                {queueRows.map(([k, v]) => (
                  <div
                    key={k}
                    className="queue-donut__seg"
                    style={{
                      background: `color-mix(in srgb, ${QUEUE_CHART_COLORS[k] || '#8b949e'} 22%, transparent)`
                    }}
                  >
                    <span className="queue-donut__count">{v}</span>
                    {k}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-hint">{t('noJobsInDb')}</p>
            )}
          </div>
        </div>
      ) : null}

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
              <dd className="mono">{dbPath || db.kind || 'sqlite'}</dd>
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

      {tools.length ? (
        <div className="overview-charts">
          <div className="card">
            <h3>{t('overviewMcpCalls')}</h3>
            <div className="hbar-chart">
              {tools.map((r) => (
                <div key={r.tool} className="hbar-row">
                  <span className="hbar-row__tool mono" title={r.tool}>
                    {r.tool}
                  </span>
                  <div className="hbar-row__track">
                    <div
                      className="hbar-row__fill"
                      style={{ width: `${Math.round((r.calls / toolMaxCalls) * 100)}%` }}
                    />
                  </div>
                  <span className="hbar-row__meta">{r.calls}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>{t('overviewMcpLatency')}</h3>
            <div className="hbar-chart">
              {tools.map((r) => {
                const avg = r.avgMs ?? 0;
                const w = avg > 0 ? Math.round((avg / toolMaxAvg) * 100) : 0;
                return (
                  <div key={r.tool} className="hbar-row">
                    <span className="hbar-row__tool mono" title={r.tool}>
                      {r.tool}
                    </span>
                    <div className="hbar-row__track">
                      <div className="hbar-row__fill" style={{ width: `${w}%`, opacity: avg ? 1 : 0.25 }} />
                    </div>
                    <span className="hbar-row__meta">
                      {r.avgMs != null ? `${r.avgMs} ms` : t('dashEmDash')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

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