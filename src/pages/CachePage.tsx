import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import type { CacheDetail, CacheRow, CacheSummary } from '../types/api';
import { formatDate } from '../utils/format';
import { useDashboardRefresh } from '../hooks/useDashboardRefresh';

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
  onServerOk: (ok: boolean) => void;
};

function formatBytes(n: number, t: (key: string) => string): string {
  if (!n) return t('dashEmDash');
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / 1048576).toFixed(2)} MiB`;
}

function formatCount(n: number): string {
  return new Intl.NumberFormat().format(n || 0);
}

export function CachePage({ t, onUnauthorized, onServerOk }: Props) {
  const { tick, markRefreshed } = useDashboardRefresh();
  const [rows, setRows] = useState<CacheRow[]>([]);
  const [summary, setSummary] = useState<CacheSummary | null>(null);
  const [detail, setDetail] = useState<CacheDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      const data = await api<{ caches: CacheRow[]; summary?: CacheSummary }>('GET', '/cache?limit=200');
      setRows(data.caches || []);
      setSummary(data.summary || null);
      setDetail(null);
      onServerOk(true);
      markRefreshed();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        onUnauthorized();
        return;
      }
      onServerOk(false);
    }
  }, [onUnauthorized, onServerOk, markRefreshed]);

  useEffect(() => {
    void loadList();
  }, [loadList, tick]);

  const loadDetail = async (cacheId: string) => {
    setDetailError(null);
    setDetail(null);
    try {
      const data = await api<{ cache: CacheDetail }>('GET', `/cache/${encodeURIComponent(cacheId)}`);
      setDetail(data.cache);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : String(err));
    }
  };

  const onDelete = async (cacheId: string) => {
    if (!confirm(t('confirmDeleteCache'))) return;
    try {
      await api('DELETE', `/cache/${encodeURIComponent(cacheId)}`);
      await loadList();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="panel panel--active">
      <div className="toolbar">
        <h2>{t('navCache')}</h2>
      </div>

      {summary ? (
        <div className="overview-charts cache-summary">
          <div className="card">
            <h3>{t('cacheSummaryTitle')}</h3>
            <dl>
              <div className="stat-row">
                <dt>{t('cacheSummaryChats')}</dt>
                <dd>{formatCount(summary.totalCaches)}</dd>
              </div>
              <div className="stat-row">
                <dt>{t('cacheSummaryBlocks')}</dt>
                <dd>{formatCount(summary.totalBlocks)}</dd>
              </div>
              <div className="stat-row">
                <dt>{t('cacheSummaryTurns')}</dt>
                <dd>{formatCount(summary.totalTurns)}</dd>
              </div>
              <div className="stat-row">
                <dt>{t('cacheSummaryChars')}</dt>
                <dd>{formatCount(summary.totalChars)}</dd>
              </div>
            </dl>
          </div>
          <div className="card">
            <h3>{t('cacheSummaryDb')}</h3>
            <dl>
              <div className="stat-row">
                <dt>{t('overviewDbSize')}</dt>
                <dd>{formatBytes(summary.db?.dbSizeBytes || 0, t)}</dd>
              </div>
              <div className="stat-row">
                <dt>{t('overviewWal')}</dt>
                <dd>{formatBytes(summary.db?.walSizeBytes || 0, t)}</dd>
              </div>
              <div className="stat-row">
                <dt>{t('database')}</dt>
                <dd className="mono">{summary.db?.path || t('dashEmDash')}</dd>
              </div>
            </dl>
          </div>
          <div className="card">
            <h3>{t('cacheSummaryByPlatform')}</h3>
            {summary.byPlatform?.length ? (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>{t('thPlatform')}</th>
                      <th>{t('cacheSummaryChats')}</th>
                      <th>{t('thTurns')}</th>
                      <th>{t('thChars')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byPlatform.map((row) => (
                      <tr key={row.platform}>
                        <td>{row.platform}</td>
                        <td>{formatCount(row.caches)}</td>
                        <td>{formatCount(row.turns)}</td>
                        <td>{formatCount(row.chars)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-hint">{t('noCachedChats')}</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t('thCacheId')}</th>
              <th>{t('thPlatform')}</th>
              <th>{t('thTitle')}</th>
              <th>{t('thTurns')}</th>
              <th>{t('thChars')}</th>
              <th>{t('thUpdated')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((c) => (
                <tr key={c.cacheId}>
                  <td className="mono">{c.cacheId}</td>
                  <td>{c.platform}</td>
                  <td>{c.title || t('dashEmDash')}</td>
                  <td>{c.totalTurns ?? t('dashEmDash')}</td>
                  <td>{c.totalChars ?? t('dashEmDash')}</td>
                  <td>{formatDate(c.updatedAt, t('dashEmDash'))}</td>
                  <td>
                    <button type="button" className="btn btn--sm" onClick={() => void loadDetail(c.cacheId)}>
                      {t('btnView')}
                    </button>{' '}
                    <button type="button" className="btn btn--sm btn--danger" onClick={() => void onDelete(c.cacheId)}>
                      {t('deleteCache')}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="empty-hint">
                  {t('noCachedChats')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {detailError ? <div className="msg msg--error">{detailError}</div> : null}
      {detail ? (
        <div className="card">
          <h3>{t('cacheDetail')}</h3>
          <dl>
            <div className="stat-row">
              <dt>{t('cacheIdLabel')}</dt>
              <dd className="mono">{detail.cacheId}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('chat')}</dt>
              <dd className="mono">{detail.chatId}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('browser')}</dt>
              <dd className="mono">{detail.browserId}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('model')}</dt>
              <dd>{detail.model || t('dashEmDash')}</dd>
            </div>
            <div className="stat-row">
              <dt>{t('blocks')}</dt>
              <dd>
                {detail.blocks ?? 0} ({t('blocksMaxRev')} {detail.maxRevision ?? t('dashEmDash')})
              </dd>
            </div>
          </dl>
          {detail.meta ? <pre className="log-view">{JSON.stringify(detail.meta, null, 2)}</pre> : null}
        </div>
      ) : null}
    </section>
  );
}
