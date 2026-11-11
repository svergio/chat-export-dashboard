import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import type { JobRow, OverviewResponse } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../utils/format';

const TERMINAL = new Set(['done', 'error', 'failed', 'cancelled']);

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
};

export function QueuesPage({ t, onUnauthorized }: Props) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [overview, jobsRes] = await Promise.all([
        api<OverviewResponse>('GET', '/overview'),
        api<{ jobs: JobRow[] }>('GET', '/jobs?limit=200')
      ]);
      const list = jobsRes.jobs || [];
      setJobs(list);
      const q = overview.queue || {};
      setSummary(
        `${t('jobsSummaryPrefix')} ${list.length} ${t('jobsSummaryJobs')} · ${t('jobsSummaryQueued')}=${q.queued ?? 0} ${t('jobsSummaryRunning')}=${q.running ?? 0}`
      );
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [t, onUnauthorized]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCancel = async (jobId: string) => {
    try {
      await api('POST', '/jobs/cancel', { jobId });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="panel panel--active">
      <div className="toolbar">
        <h2>{t('navQueues')}</h2>
        <span className="top-bar__spacer" />
        <span className="empty-hint">{summary}</span>
        <button type="button" className="btn btn--sm" onClick={() => void load()}>
          {t('refresh')}
        </button>
      </div>
      {error ? <div className="msg msg--error">{error}</div> : null}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>{t('thJobId')}</th>
              <th>{t('thKind')}</th>
              <th>{t('thStatus')}</th>
              <th>{t('thPlatform')}</th>
              <th>{t('thBrowser')}</th>
              <th>{t('thProgress')}</th>
              <th>{t('thUpdated')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jobs.length ? (
              jobs.map((j) => {
                const terminal = TERMINAL.has(j.status);
                return (
                  <tr key={j.job_id}>
                    <td className="mono">{j.job_id}</td>
                    <td>{j.kind}</td>
                    <td>
                      <StatusBadge status={j.status} />
                    </td>
                    <td>{j.platform || t('dashEmDash')}</td>
                    <td className="mono">{j.browserId || t('dashEmDash')}</td>
                    <td>{j.progress != null ? j.progress : t('dashEmDash')}</td>
                    <td>{formatDate(j.updatedAt, t('dashEmDash'))}</td>
                    <td>
                      {!terminal ? (
                        <button type="button" className="btn btn--sm btn--danger" onClick={() => void onCancel(j.job_id)}>
                          {t('cancelJob')}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="empty-hint">
                  {t('queueEmpty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
