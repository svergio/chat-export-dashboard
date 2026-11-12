import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import { useDashboardRefresh } from '../hooks/useDashboardRefresh';

type LogType = 'server' | 'alerts';

type LogRecord = Record<string, unknown>;

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
  onServerOk: (ok: boolean) => void;
};

const LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR', 'ALERT', 'DEBUG'] as const;

function formatTs(ts: unknown): string {
  if (typeof ts !== 'string') return '';
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

function logLevel(entry: LogRecord): string {
  const raw = entry.raw != null ? 'info' : String(entry.level || 'info');
  return raw.toLowerCase();
}

function logMessage(entry: LogRecord): string {
  if (typeof entry.raw === 'string') return entry.raw;
  if (typeof entry.message === 'string') return entry.message;
  return '';
}

function matchesLevel(entry: LogRecord, level: string): boolean {
  if (level === 'ALL') return true;
  return logLevel(entry).toUpperCase() === level;
}

function matchesSearch(entry: LogRecord, q: string): boolean {
  if (!q) return true;
  const hay = JSON.stringify(entry).toLowerCase();
  return hay.includes(q.toLowerCase());
}

function LogLine({ entry }: { entry: LogRecord }) {
  const [open, setOpen] = useState(false);
  const level = logLevel(entry);
  const badgeClass = `log-badge log-badge--${level}`;
  const lineClass = `log-line log-line--${level}`;
  const ts = formatTs(entry.ts);
  const component = entry.component != null ? String(entry.component) : '';
  const tool = entry.tool != null ? String(entry.tool) : '';
  const platform = entry.platform != null ? String(entry.platform) : '';
  const duration = entry.duration_ms != null ? `${entry.duration_ms}ms` : '';
  const ok =
    entry.ok === true ? 'ok' : entry.ok === false ? 'err' : entry.code != null ? String(entry.code) : '';
  const detailKeys = Object.keys(entry).filter(
    (k) => !['ts', 'level', 'message', 'component', 'tool', 'platform', 'duration_ms', 'ok', 'raw'].includes(k)
  );
  const hasDetail = detailKeys.length > 0;

  return (
    <div className={lineClass}>
      <span className="log-ts">{ts}</span>
      <span className={badgeClass}>{level}</span>
      {component ? <span className="mono">{component}</span> : null}
      {tool ? (
        <>
          {' · '}
          <span className="mono">{tool}</span>
        </>
      ) : null}
      {platform ? (
        <>
          {' · '}
          <span>{platform}</span>
        </>
      ) : null}
      {duration ? <span style={{ marginLeft: '0.35rem', opacity: 0.8 }}>{duration}</span> : null}
      {ok ? <span className="badge" style={{ marginLeft: '0.35rem' }}>{ok}</span> : null}
      <span style={{ marginLeft: '0.5rem' }}>{logMessage(entry)}</span>
      {hasDetail ? (
        <button type="button" className="log-detail-toggle btn btn--sm" onClick={() => setOpen((v) => !v)}>
          {open ? '[-]' : '[+]'}
        </button>
      ) : null}
      {open && hasDetail ? (
        <pre className="log-detail-pre">{JSON.stringify(entry, null, 2)}</pre>
      ) : null}
      {!hasDetail && typeof entry.raw === 'string' ? null : null}
    </div>
  );
}

export function LogsPage({ t, onUnauthorized, onServerOk }: Props) {
  const { tick, markRefreshed, intervalMs } = useDashboardRefresh();
  const [logType, setLogType] = useState<LogType>('server');
  const [entries, setEntries] = useState<LogRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [levelFilter, setLevelFilter] = useState<(typeof LEVELS)[number]>('ALL');
  const [search, setSearch] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const pauseForSelection = useRef(false);
  const userScrolledUp = useRef(false);

  const load = useCallback(async () => {
    if (pauseForSelection.current) return;
    try {
      const data = await api<{ entries: unknown[] }>(
        'GET',
        `/logs?type=${logType === 'alerts' ? 'alerts' : 'server'}&lines=150`
      );
      const rows = (data.entries || []).map((e) => {
        if (e && typeof e === 'object' && !Array.isArray(e)) return e as LogRecord;
        if (typeof e === 'string') {
          try {
            return JSON.parse(e) as LogRecord;
          } catch {
            return { raw: e, level: 'info', ts: '', message: e };
          }
        }
        return { raw: JSON.stringify(e), level: 'info' };
      });
      setEntries(rows);
      setLoadError(null);
      onServerOk(true);
      markRefreshed();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        onUnauthorized();
        return;
      }
      onServerOk(false);
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, [logType, onUnauthorized, onServerOk, markRefreshed]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    void load();
  }, [tick, live, load]);

  useEffect(() => {
    if (intervalMs <= 0) setLive(false);
    else setLive(true);
  }, [intervalMs]);

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      const panel = panelRef.current;
      if (!sel || !panel || sel.isCollapsed) {
        pauseForSelection.current = false;
        return;
      }
      const anchor = sel.anchorNode;
      if (anchor && panel.contains(anchor)) {
        pauseForSelection.current = true;
        setLive(false);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || userScrolledUp.current) return;
    panel.scrollTop = panel.scrollHeight;
  }, [entries]);

  const onPanelScroll = () => {
    const panel = panelRef.current;
    if (!panel) return;
    const atBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 48;
    userScrolledUp.current = !atBottom;
  };

  const filtered = useMemo(
    () => entries.filter((e) => matchesLevel(e, levelFilter) && matchesSearch(e, search.trim())),
    [entries, levelFilter, search]
  );

  const onCopy = async () => {
    const text = filtered.map((e) => (typeof e.raw === 'string' ? e.raw : JSON.stringify(e))).join('\n');
    try {
      await navigator.clipboard.writeText(text || t('emptyLog'));
    } catch {
      /* ignore */
    }
  };

  const toggleLive = () => {
    if (!live) {
      userScrolledUp.current = false;
      pauseForSelection.current = false;
    }
    setLive((v) => !v);
  };

  return (
    <section className="panel panel--active">
      <h2>{t('navLogs')}</h2>
      <div className="tabs-sub toolbar logs-toolbar">
        <button
          type="button"
          className={`btn btn--sm${logType === 'server' ? ' active' : ''}`}
          onClick={() => setLogType('server')}
        >
          {t('serverLog')}
        </button>
        <button
          type="button"
          className={`btn btn--sm${logType === 'alerts' ? ' active' : ''}`}
          onClick={() => setLogType('alerts')}
        >
          {t('alertsLog')}
        </button>
        <span className="top-bar__spacer" />
        <button type="button" className={`btn btn--sm${live ? ' active' : ''}`} onClick={toggleLive}>
          <span className={`logs-live-dot ${live ? 'logs-live-dot--on' : 'logs-live-dot--off'}`} />
          {live ? t('logsLive') : t('logsPaused')}
        </button>
        <select
          className="ce-select"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as (typeof LEVELS)[number])}
          aria-label={t('logsLevelAll')}
        >
          {LEVELS.map((lv) => (
            <option key={lv} value={lv}>
              {lv}
            </option>
          ))}
        </select>
        <input
          type="search"
          className="logs-search"
          placeholder={t('logsSearchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn btn--sm" onClick={() => void onCopy()}>
          {t('logsCopy')}
        </button>
      </div>
      {loadError ? <div className="msg msg--error">{loadError}</div> : null}
      <div ref={panelRef} className="log-panel" onScroll={onPanelScroll} aria-live="polite">
        {filtered.length ? (
          filtered.map((entry, i) => <LogLine key={`${i}-${String(entry.ts)}`} entry={entry} />)
        ) : (
          <div className="empty-hint">{t('emptyLog')}</div>
        )}
      </div>
    </section>
  );
}
