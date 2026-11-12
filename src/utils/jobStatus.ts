const STATUS_KEYS: Record<string, string> = {
  queued: 'jobStatusQueued',
  running: 'jobStatusRunning',
  waiting_host: 'jobStatusWaitingHost',
  assigned: 'jobStatusAssigned',
  done: 'jobStatusDone',
  error: 'jobStatusError',
  failed: 'jobStatusFailed',
  cancelled: 'jobStatusCancelled'
};

export function jobStatusLabel(status: string, t: (key: string) => string): string {
  const key = STATUS_KEYS[status];
  if (!key) return status;
  const label = t(key);
  return label === key ? status : label;
}
