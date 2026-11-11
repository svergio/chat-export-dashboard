function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function StatusBadge({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  let extra = '';
  if (s === 'online') extra = ' badge--online';
  else if (s === 'offline' || s === 'registered') extra = ' badge--offline';
  else if (s === 'queued' || s === 'waiting_host') extra = ' badge--queued';
  else if (s === 'running') extra = ' badge--running';
  else if (s === 'error' || s === 'failed') extra = ' badge--error';
  return <span className={`badge${extra}`}>{escapeHtml(status)}</span>;
}
