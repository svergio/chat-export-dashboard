import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import type { CacheDetail, CacheRow } from '../types/api';
import { formatDate } from '../utils/format';

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
};

export function CachePage({ t, onUnauthorized }: Props) {
  const [rows, setRows] = useState<CacheRow[]>([]);
  const [detail, setDetail] = useState<CacheDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      const data = await api<{ caches: CacheRow[] }>('GET', '/cache?limit=200');
      setRows(data.caches || []);
      setDetail(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) onUnauthorized();
    }
  }, [onUnauthorized]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

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
        <span className="top-bar__spacer" />
        <button type="button" className="btn btn--sm" onClick={() => void loadList()}>
          {t('refresh')}
        </button>
      </div>
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
          {detail.meta ? (
            <pre className="log-view">{JSON.stringify(detail.meta, null, 2)}</pre>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
