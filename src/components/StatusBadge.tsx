function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dotTone(status: string): string | null {
  const s = String(status || '').toLowerCase();
  if (s === 'online') return 'ok';
  if (s === 'offline' || s === 'registered') return 'muted';
  if (s === 'queued' || s === 'waiting_host') return 'warn';
  if (s === 'error' || s === 'failed') return 'danger';
  if (s === 'running') return 'ok';
  return null;
}

export function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  let extra = '';
  if (s === 'online') extra = ' badge--online';
  else if (s === 'offline' || s === 'registered') extra = ' badge--offline';
  else if (s === 'queued' || s === 'waiting_host') extra = ' badge--queued';
  else if (s === 'running') extra = ' badge--running';
  else if (s === 'error' || s === 'failed') extra = ' badge--error';
  const tone = dotTone(status);
  return (
    <span className={`badge badge--with-dot${extra}`}>
      {tone ? <span className={`status-dot status-dot--${tone}`} aria-hidden="true" /> : null}
      {escapeHtml(status)}
    </span>
  );
}
