import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

const STORAGE_KEY = 'ce_dash_refresh_ms';

export const REFRESH_INTERVALS = [
  { ms: 0, key: 'refreshOff' },
  { ms: 5000, key: 'refresh5s' },
  { ms: 10000, key: 'refresh10s' },
  { ms: 30000, key: 'refresh30s' },
  { ms: 60000, key: 'refresh1m' }
] as const;

function readStoredInterval(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return 0;
    if (REFRESH_INTERVALS.some((opt) => opt.ms === n)) return n;
  } catch {
    /* ignore */
  }
  return 0;
}

type RefreshContextValue = {
  intervalMs: number;
  setIntervalMs: (ms: number) => void;
  tick: number;
  lastRefreshAt: number | null;
  refreshNow: () => void;
  markRefreshed: () => void;
};

const RefreshContext = createContext<RefreshContextValue | null>(null);

export function DashboardRefreshProvider({ children }: { children: ReactNode }) {
  const [intervalMs, setIntervalMsState] = useState(readStoredInterval);
  const [tick, setTick] = useState(0);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);

  const setIntervalMs = useCallback((ms: number) => {
    setIntervalMsState(ms);
    try {
      localStorage.setItem(STORAGE_KEY, String(ms));
    } catch {
      /* ignore */
    }
  }, []);

  const refreshNow = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  const markRefreshed = useCallback(() => {
    setLastRefreshAt(Date.now());
  }, []);

  useEffect(() => {
    if (intervalMs <= 0) return;
    const id = window.setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  const value = useMemo(
    () => ({
      intervalMs,
      setIntervalMs,
      tick,
      lastRefreshAt,
      refreshNow,
      markRefreshed
    }),
    [intervalMs, setIntervalMs, tick, lastRefreshAt, refreshNow, markRefreshed]
  );

  return createElement(RefreshContext.Provider, { value }, children);
}

export function useDashboardRefresh(): RefreshContextValue {
  const ctx = useContext(RefreshContext);
  if (!ctx) {
    throw new Error('useDashboardRefresh requires DashboardRefreshProvider');
  }
  return ctx;
}
