import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiClientError } from '../api/client';

type LogType = 'server' | 'alerts';

type Props = {
  t: (key: string) => string;
  onUnauthorized: () => void;
};

export function LogsPage({ t, onUnauthorized }: Props) {
  const [logType, setLogType] = useState<LogType>('server');
  const [text, setText] = useState('');
  const preRef = useRef<HTMLPreElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<{ entries: unknown[] }>(
        'GET',
        `/logs?type=${logType === 'alerts' ? 'alerts' : 'server'}&lines=150`
      );
      const lines = (data.entries || []).map((e) => {
        if (typeof e === 'string') return e;
        if (e && typeof e === 'object' && 'line' in e) return String((e as { line: string }).line);
        return JSON.stringify(e);
      });
      setText(lines.join('\n') || t('emptyLog'));
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        onUnauthorized();
        return;
      }
      setText(err instanceof Error ? err.message : String(err));
    }
  }, [logType, t, onUnauthorized]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 3000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const el = preRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [text]);

  return (
    <section className="panel panel--active">
      <h2>{t('navLogs')}</h2>
      <div className="tabs-sub toolbar">
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
        <span className="empty-hint">{t('autoRefresh')} 3s</span>
      </div>
      <pre ref={preRef} className="log-view" aria-live="polite">
        {text}
      </pre>
    </section>
  );
}
