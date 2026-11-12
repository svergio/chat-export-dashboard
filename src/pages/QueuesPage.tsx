import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import type { JobRow, OverviewResponse } from '../types/api';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../utils/format';
import { formatJobProgress } from '../utils/jobProgress';
import { jobStatusLabel } from '../utils/jobStatus';
import { useDashboardRefresh } from '../hooks/useDashboardRefresh';

const TERMINAL = new Set(['done', 'error', 'failed', 'cancelled']);
const PIPELINE_ORDER = ['queued', 'running', 'waiting_host', 'assigned', 'done', 'error', 'cancelled'] as const;

const STATUS_COLORS: Record<string, string> = {
  queued: '#8b949e',
  running: '#58a6ff',
  waiting_host: '#d29922',
  assigned: '#a371f7',
  done: '#3fb950',
  error: '#f85149',
  cancelled: '#6e7681'
};

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
  onServerOk: (ok: boolean) => void;
};

function ProgressCell({
  progress,
  terminal,
  t
}: {
  progress: unknown;
  terminal: boolean;
  t: (key: string) => string;
}) {
  if (terminal) return <span>{t('dashEmDash')}</span>;
  const { label, pct, current } = formatJobProgress(progress);
  if (!label && !current) return <span>{t('dashEmDash')}</span>;
  return (
    <div className="progress-cell">
      {label || t('dashEmDash')}
      {pct != null ? (
        <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      {current ? (
        <span className="progress-current badge">
          {t('progressCurrent')}: {current}
        </span>
      ) : null}
    </div>
  );
}

export function QueuesPage({ t, onUnauthorized, onServerOk }: Props) {
  const { tick, markRefreshed } = useDashboardRefresh();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [overview, jobsRes] = await Promise.all([
        api<OverviewResponse>('GET', '/overview'),
        api<{ jobs: JobRow[] }>('GET', '/jobs?limit=200')
      ]);
      setJobs(jobsRes.jobs || []);
      setQueueCounts(overview.queue || {});
      onServerOk(true);
      markRefreshed();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        onUnauthorized();
        return;
      }
      onServerOk(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [onUnauthorized, onServerOk, markRefreshed]);

  useEffect(() => {
    void load();
  }, [load, tick]);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    for (const j of jobs) {
      if (j.platform) set.add(j.platform);
    }
    return [...set].sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (statusFilter && j.status !== statusFilter) return false;
      if (platformFilter && (j.platform || '') !== platformFilter) return false;
      return true;
    });
  }, [jobs, statusFilter, platformFilter]);

  const pipelineTotal = useMemo(
    () => Object.values(queueCounts).reduce((a, b) => a + Number(b), 0),
    [queueCounts]
  );

  const activeByBrowser = useMemo(() => {
    const map = new Map<string, JobRow[]>();
    for (const j of jobs) {
      if (TERMINAL.has(j.status)) continue;
      const bid = j.browserId || t('dashEmDash');
      const list = map.get(bid) || [];
      list.push(j);
      map.set(bid, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [jobs, t]);

  const onCancel = async (jobId: string) => {
    if (!confirm(t('cancelJobConfirm'))) return;
    try {
      await api('POST', '/jobs/cancel', { jobId, confirm: true });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="panel panel--active">
      <div className="toolbar">
        <h2>{t('navQueues')}</h2>
      </div>
      {error ? <div className="msg msg--error">{error}</div> : null}

      <div className="card queue-pipeline">
        <h3>{t('queuePipeline')}</h3>
        <div className="queue-pipeline__bar" aria-hidden={pipelineTotal === 0}>
          {PIPELINE_ORDER.map((status) => {
            const count = Number(queueCounts[status] || 0);
            if (!count || !pipelineTotal) return null;
            const pct = (count / pipelineTotal) * 100;
            return (
              <div
                key={status}
                className="queue-pipeline__seg"
                style={{ width: `${pct}%`, background: STATUS_COLORS[status] || '#8b949e' }}
                title={`${jobStatusLabel(status, t)}: ${count}`}
              />
            );
          })}
        </div>
        <div className="queue-pipeline__legend">
          {PIPELINE_ORDER.map((status) => {
            const count = Number(queueCounts[status] || 0);
            if (!count) return null;
            return (
              <span key={status} className="queue-pipeline__legend-item">
                <span className="queue-pipeline__swatch" style={{ background: STATUS_COLORS[status] }} />
                <StatusBadge status={status} label={jobStatusLabel(status, t)} /> {count}
              </span>
            );
          })}
          {!pipelineTotal ? <span className="empty-hint">{t('queueEmpty')}</span> : null}
        </div>
      </div>

      {activeByBrowser.length ? (
        <div className="queue-workers">
          <h3 style={{ gridColumn: '1 / -1', margin: 0 }}>{t('queueWorkers')}</h3>
          {activeByBrowser.map(([browserId, list]) => (
            <div key={browserId} className="queue-worker-card">
              <h4 className="mono">{browserId}</h4>
              {list.map((j) => (
                <div key={j.job_id} style={{ marginBottom: '0.35rem' }}>
                  <StatusBadge status={j.status} label={jobStatusLabel(j.status, t)} />{' '}
                  <span className="mono">{j.kind}</span>
                  {j.platform ? ` · ${j.platform}` : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      <div className="toolbar" style={{ marginBottom: '0.75rem' }}>
        <label className="empty-hint">
          {t('queueFilterStatus')}
          <select
            className="ce-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ marginLeft: '0.35rem' }}
          >
            <option value="">{t('queueFilterAll')}</option>
            {PIPELINE_ORDER.map((s) => (
              <option key={s} value={s}>
                {jobStatusLabel(s, t)}
              </option>
            ))}
          </select>
        </label>
        <label className="empty-hint">
          {t('queueFilterPlatform')}
          <select
            className="ce-select"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            style={{ marginLeft: '0.35rem' }}
          >
            <option value="">{t('queueFilterAll')}</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <span className="empty-hint">
          {t('jobsSummaryPrefix')} {filtered.length} {t('jobsSummaryJobs')}
        </span>
      </div>

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
            {filtered.length ? (
              filtered.map((j) => {
                const terminal = TERMINAL.has(j.status);
                return (
                  <tr key={j.job_id}>
                    <td className="mono">{j.job_id}</td>
                    <td>{j.kind}</td>
                    <td>
                      <StatusBadge status={j.status} label={jobStatusLabel(j.status, t)} />
                    </td>
                    <td>{j.platform || t('dashEmDash')}</td>
                    <td className="mono">{j.browserId || t('dashEmDash')}</td>
                    <td>
                      <ProgressCell progress={j.progress} terminal={terminal} t={t} />
                    </td>
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
