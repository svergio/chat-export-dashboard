export type Section = 'overview' | 'browsers' | 'queues' | 'cache' | 'logs';

export type ApiError = {
  code?: string;
  message?: string;
};

export type OverviewResources = {
  rssMb: number;
  heapUsedMb: number;
  heapTotalMb: number;
  dbSizeBytes: number;
  walSizeBytes: number;
  loadAvg: number[];
  uptimeMs: number;
};

export type OverviewResponse = {
  ok: boolean;
  uptimeMs: number;
  startedAt: string;
  version: string;
  database: { path?: string; kind?: string; file?: string; driver?: string };
  dashboard: { enabled: boolean };
  mcpToolStats: {
    tool: string;
    calls: number;
    okCount: number;
    errCount: number;
    avgMs: number | null;
  }[];
  queue: Record<string, number>;
  hub: {
    boundBrowserId?: string;
    connections?: number;
  } | null;
  resources?: OverviewResources;
};

export type BrowserRow = {
  browserId: string;
  browserLabel: string;
  status: string;
  allowCreate?: boolean;
  allowProjects?: boolean;
  allowDestructive?: boolean;
  tabs?: { platform?: string; url?: string; title?: string }[];
  bound?: boolean;
  fingerprint?: string;
};

export type JobRow = {
  job_id: string;
  kind: string;
  status: string;
  platform?: string;
  browserId?: string;
  progress?: number | { done?: number; total?: number; current?: unknown } | null;
  updatedAt?: string;
};

export type CacheRow = {
  cacheId: string;
  platform: string;
  title?: string;
  totalTurns?: number;
  totalChars?: number;
  updatedAt?: string;
};

export type CacheDetail = {
  cacheId: string;
  chatId: string;
  browserId: string;
  platform: string;
  title?: string;
  model?: string;
  totalTurns?: number;
  totalChars?: number;
  blocks?: number;
  maxRevision?: number | null;
  meta?: unknown;
};

export type McpTokenInfo = {
  active: {
    id: string;
    fingerprint: string;
    createdAt?: string;
    lastUsedAt?: string;
  } | null;
  revokedCount: number;
};

export type LocaleStrings = Record<string, string>;
