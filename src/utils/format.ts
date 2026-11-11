export function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h || d) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

export function formatDate(iso: string | undefined, emDash: string): string {
  if (!iso) return emDash;
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function mcpSnippet(token?: string): string {
  const host = window.location.origin;
  const line = token || 'cem_YOUR_TOKEN_HERE';
  return JSON.stringify(
    {
      mcpServers: {
        'chat-export': {
          url: `${host}/mcp`,
          headers: { Authorization: `Bearer ${line}` }
        }
      }
    },
    null,
    2
  );
}
