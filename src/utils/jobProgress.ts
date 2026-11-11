export type JobProgressShape = {
  done?: number;
  total?: number;
  current?: unknown;
};

export function formatJobProgress(progress: unknown): {
  label: string;
  pct: number | null;
  current: string | null;
} {
  if (progress == null) return { label: '', pct: null, current: null };
  if (typeof progress === 'number') {
    return { label: String(progress), pct: null, current: null };
  }
  if (typeof progress === 'object') {
    const p = progress as JobProgressShape;
    const done = typeof p.done === 'number' ? p.done : 0;
    const total = typeof p.total === 'number' ? p.total : 0;
    const label = total > 0 ? `${done} / ${total}` : done > 0 ? String(done) : '';
    const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : null;
    let current: string | null = null;
    if (p.current != null && p.current !== '') {
      current = typeof p.current === 'string' ? p.current : JSON.stringify(p.current);
    }
    return { label, pct, current };
  }
  return { label: String(progress), pct: null, current: null };
}
