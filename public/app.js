const API = '/dashboard/api';

const STRINGS = {
  appTitle: 'Chat Export',
  loginTitle: 'Dashboard sign-in',
  loginHint: 'Session cookie is scoped to /dashboard.',
  username: 'Username',
  password: 'Password',
  signIn: 'Sign in',
  signOut: 'Sign out',
  navOverview: 'Overview',
  navBrowsers: 'Browsers & tokens',
  navQueues: 'Queues',
  navCache: 'Temp chat cache',
  navLogs: 'Logs & alerts',
  serverOnline: 'Server',
  loading: 'Loading…',
  refresh: 'Refresh',
  rotateMcp: 'Rotate MCP token (cem_)',
  copySnippet: 'Copy MCP snippet',
  enrollBrowser: 'Enroll browser (ceb_)',
  cancelJob: 'Cancel',
  deleteCache: 'Delete cache',
  autoRefresh: 'Auto-refresh',
  serverLog: 'server.log',
  alertsLog: 'alerts.log'
};

function t(key) {
  const ext = window.__localeStrings;
  if (ext && ext[key]) return ext[key];
  return STRINGS[key] ?? key;
}

function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' && el.type === 'submit') {
      el.value = val;
    } else {
      el.textContent = val;
    }
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}

async function loadLocale(locale) {
  try {
    const res = await fetch(`/dashboard/locales/${locale}.json`);
    if (res.ok) {
      window.__localeStrings = await res.json();
      document.documentElement.lang = locale === 'ru' ? 'ru' : 'en';
      return;
    }
  } catch {
    /* fallback */
  }
  window.__localeStrings = null;
  document.documentElement.lang = locale === 'ru' ? 'ru' : 'en';
}

function resolveScheme(schemePref) {
  if (schemePref === 'auto') {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    return mq.matches ? 'light' : 'dark';
  }
  return schemePref;
}

function initThemeHooks() {
  const html = document.documentElement;
  const skinSel = document.getElementById('skin-select');
  const schemeSel = document.getElementById('scheme-select');
  const localeSel = document.getElementById('locale-select');

  const stored = {
    skin: localStorage.getItem('ce_dash_skin') || 'default',
    scheme: localStorage.getItem('ce_dash_scheme') || 'dark',
    locale: localStorage.getItem('ce_dash_locale') || 'en'
  };

  html.dataset.skin = stored.skin === 'default' ? 'chatgpt' : stored.skin;
  html.dataset.scheme = resolveScheme(stored.scheme);
  html.dataset.locale = stored.locale;

  const schemeMq = window.matchMedia('(prefers-color-scheme: light)');
  schemeMq.addEventListener('change', () => {
    if (localStorage.getItem('ce_dash_scheme') === 'auto') {
      html.dataset.scheme = resolveScheme('auto');
    }
  });

  if (skinSel) {
    skinSel.value = stored.skin;
    skinSel.addEventListener('change', () => {
      const v = skinSel.value;
      localStorage.setItem('ce_dash_skin', v);
      html.dataset.skin = v === 'default' ? 'chatgpt' : v;
    });
  }
  if (schemeSel) {
    schemeSel.value = stored.scheme;
    schemeSel.addEventListener('change', () => {
      const v = schemeSel.value;
      localStorage.setItem('ce_dash_scheme', v);
      html.dataset.scheme = resolveScheme(v);
    });
  }
  if (localeSel) {
    localeSel.value = stored.locale;
    localeSel.addEventListener('change', async () => {
      const v = localeSel.value;
      localStorage.setItem('ce_dash_locale', v);
      html.dataset.locale = v;
      await loadLocale(v);
      applyI18n();
      if (state.section === 'overview') loadOverview();
      else if (state.section === 'browsers') loadBrowsers();
      else if (state.section === 'queues') loadJobs();
      else if (state.section === 'cache') loadCacheList();
    });
  }
}

async function api(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: {}
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, opts);
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.code || res.statusText;
    const err = new Error(msg || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h || d) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

function formatDate(iso) {
  if (!iso) return t('dashEmDash');
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusBadge(status) {
  const s = String(status || '').toLowerCase();
  let cls = 'badge';
  if (s === 'online') cls += ' badge--online';
  else if (s === 'offline' || s === 'registered') cls += ' badge--offline';
  else if (s === 'queued' || s === 'waiting_host') cls += ' badge--queued';
  else if (s === 'running') cls += ' badge--running';
  else if (s === 'error' || s === 'failed') cls += ' badge--error';
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const state = {
  user: null,
  section: 'overview',
  logType: 'server',
  logTimer: null,
  overviewTimer: null
};

function showLogin() {
  document.getElementById('login-screen')?.classList.remove('hidden');
  document.getElementById('app-shell')?.classList.add('hidden');
  stopAutoRefresh();
}

function showApp(username) {
  state.user = username;
  document.getElementById('login-screen')?.classList.add('hidden');
  document.getElementById('app-shell')?.classList.remove('hidden');
  const userEl = document.getElementById('top-user');
  if (userEl) userEl.textContent = username;
  navigate(state.section);
}

function stopAutoRefresh() {
  if (state.logTimer) {
    clearInterval(state.logTimer);
    state.logTimer = null;
  }
  if (state.overviewTimer) {
    clearInterval(state.overviewTimer);
    state.overviewTimer = null;
  }
}

function navigate(section) {
  state.section = section;
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('nav-btn--active', btn.dataset.section === section);
  });
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('panel--active', panel.dataset.panel === section);
  });
  stopAutoRefresh();
  if (section === 'overview') loadOverview();
  if (section === 'browsers') loadBrowsers();
  if (section === 'queues') loadJobs();
  if (section === 'cache') loadCacheList();
  if (section === 'logs') {
    loadLogs();
    state.logTimer = setInterval(loadLogs, 3000);
  }
}

async function onLoginSubmit(ev) {
  ev.preventDefault();
  const form = ev.target;
  const errEl = document.getElementById('login-error');
  errEl?.classList.add('hidden');
  const username = form.username.value.trim();
  const password = form.password.value;
  try {
    const data = await api('POST', '/login', { username, password });
    showApp(data.username || username);
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || t('loginFailed');
      errEl.classList.remove('hidden');
    }
  }
}

async function onLogout() {
  try {
    await api('POST', '/logout');
  } catch {
    /* ignore */
  }
  state.user = null;
  showLogin();
}

function renderOverview(data) {
  const el = document.getElementById('overview-content');
  if (!el) return;
  const queue = data.queue || {};
  const queueRows = Object.entries(queue)
    .map(([k, v]) => `<div class="stat-row"><dt>${escapeHtml(k)}</dt><dd>${v}</dd></div>`)
    .join('');
  const hub = data.hub || {};
  const db = data.database || {};
  const tools = data.mcpToolStats || [];
  const toolRows = tools
    .map(
      (r) => `<tr>
        <td class="mono">${escapeHtml(r.tool)}</td>
        <td>${r.calls}</td>
        <td>${r.okCount}</td>
        <td>${r.errCount}</td>
        <td>${r.avgMs != null ? r.avgMs : t('dashEmDash')}</td>
      </tr>`
    )
    .join('');
  const dash = data.dashboard?.enabled ? t('enabled') : t('off');
  el.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h3 data-i18n="serverOnline">Server</h3>
        <dl>
          <div class="stat-row"><dt>${t('version')}</dt><dd>${escapeHtml(data.version || t('dashEmDash'))}</dd></div>
          <div class="stat-row"><dt>${t('uptime')}</dt><dd>${formatUptime(data.uptimeMs || 0)}</dd></div>
          <div class="stat-row"><dt>${t('started')}</dt><dd>${formatDate(data.startedAt)}</dd></div>
          <div class="stat-row"><dt>${t('database')}</dt><dd class="mono">${escapeHtml(db.path || db.kind || 'sqlite')}</dd></div>
        </dl>
      </div>
      <div class="card">
        <h3>${t('hubBoundBrowser')}</h3>
        <dl>
          <div class="stat-row"><dt>${t('bound')}</dt><dd>${escapeHtml(hub.boundBrowserId || t('dashEmDash'))}</dd></div>
          <div class="stat-row"><dt>${t('connections')}</dt><dd>${hub.connections ?? t('dashEmDash')}</dd></div>
          <div class="stat-row"><dt>${t('dashboard')}</dt><dd>${dash}</dd></div>
        </dl>
      </div>
    </div>
    <div class="card" style="margin-bottom:1rem">
      <h3>${t('jobQueueCounts')}</h3>
      ${queueRows || `<p class="empty-hint">${t('noJobsInDb')}</p>`}
    </div>
    <h3 style="margin-bottom:0.5rem">${t('mcpToolUsage')}</h3>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>${t('thTool')}</th><th>${t('thCalls')}</th><th>${t('thOk')}</th><th>${t('thErrors')}</th><th>${t('thAvgMs')}</th></tr></thead>
        <tbody>${toolRows || `<tr><td colspan="5" class="empty-hint">${t('noMetricsYet')}</td></tr>`}</tbody>
      </table>
    </div>
  `;
  applyI18n(el);
}

async function loadOverview() {
  const el = document.getElementById('overview-content');
  if (el) el.innerHTML = `<p class="empty-hint">${t('loading')}</p>`;
  try {
    const data = await api('GET', '/overview');
    renderOverview(data);
    const dot = document.getElementById('server-status-dot');
    dot?.classList.add('status-dot--ok');
  } catch (err) {
    if (err.status === 401) showLogin();
    else if (el) el.innerHTML = `<div class="msg msg--error">${escapeHtml(err.message)}</div>`;
  }
}

function mcpSnippet(token) {
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

async function loadMcpToken() {
  const el = document.getElementById('mcp-token-card');
  if (!el) return;
  try {
    const data = await api('GET', '/mcp-token');
    const active = data.active;
    el.innerHTML = `
      <h3>${t('mcpServerToken')}</h3>
      ${
        active
          ? `<dl>
          <div class="stat-row"><dt>${t('thId')}</dt><dd class="mono">${escapeHtml(active.id)}</dd></div>
          <div class="stat-row"><dt>${t('thFingerprint')}</dt><dd class="mono">${escapeHtml(active.fingerprint)}</dd></div>
          <div class="stat-row"><dt>${t('thCreated')}</dt><dd>${formatDate(active.createdAt)}</dd></div>
          <div class="stat-row"><dt>${t('thLastUsed')}</dt><dd>${formatDate(active.lastUsedAt)}</dd></div>
        </dl>
        <p class="empty-hint">${t('tokenShownOnce')}</p>`
          : `<p class="empty-hint">${t('noActiveMcpKey')}</p>`
      }
      <p class="empty-hint">${t('revokedKeys')}: ${data.revokedCount ?? 0}</p>
      <textarea class="token-snippet" id="mcp-snippet" readonly>${escapeHtml(mcpSnippet())}</textarea>
      <div class="actions-inline">
        <button type="button" class="btn btn--primary" id="btn-rotate-mcp" data-i18n="rotateMcp">${t('rotateMcp')}</button>
        <button type="button" class="btn" id="btn-copy-snippet" data-i18n="copySnippet">${t('copySnippet')}</button>
      </div>
      <div id="mcp-rotate-result" class="hidden"></div>
    `;
    document.getElementById('btn-copy-snippet')?.addEventListener('click', () => {
      const ta = document.getElementById('mcp-snippet');
      if (ta) {
        navigator.clipboard.writeText(ta.value).catch(() => {});
      }
    });
    document.getElementById('btn-rotate-mcp')?.addEventListener('click', onRotateMcp);
  } catch (err) {
    el.innerHTML = `<div class="msg msg--error">${escapeHtml(err.message)}</div>`;
  }
}

async function onRotateMcp() {
  const box = document.getElementById('mcp-rotate-result');
  if (!confirm(t('rotateMcpConfirm'))) return;
  try {
    const data = await api('POST', '/mcp-token/rotate');
    if (box) {
      box.classList.remove('hidden');
      box.className = 'msg msg--warn';
      box.innerHTML = `<strong>${t('newTokenCopyNow')}</strong><br><span class="mono">${escapeHtml(data.token)}</span>`;
    }
    const ta = document.getElementById('mcp-snippet');
    if (ta) ta.value = mcpSnippet(data.token);
    await loadMcpToken();
  } catch (err) {
    if (box) {
      box.classList.remove('hidden');
      box.className = 'msg msg--error';
      box.textContent = err.message;
    }
  }
}

function renderBrowsers(browsers) {
  const tbody = document.getElementById('browsers-tbody');
  if (!tbody) return;
  if (!browsers.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-hint">${t('noBrowsersEnrolled')}</td></tr>`;
    return;
  }
  tbody.innerHTML = browsers
    .map((b) => {
      const flags = [
        b.allowCreate ? t('flagCreate') : '',
        b.allowProjects ? t('flagProjects') : '',
        b.allowDestructive ? t('flagDelete') : ''
      ]
        .filter(Boolean)
        .join(', ') || t('dashEmDash');
      const tabs = Array.isArray(b.tabs) ? b.tabs.length : 0;
      return `<tr>
        <td class="mono">${escapeHtml(b.browserId)}</td>
        <td>${escapeHtml(b.browserLabel)}</td>
        <td>${statusBadge(b.status)}</td>
        <td>${escapeHtml(flags)}</td>
        <td>${tabs}</td>
        <td>${b.bound ? t('yes') : t('dashEmDash')}</td>
        <td class="mono">${escapeHtml(b.fingerprint || t('dashEmDash'))}</td>
        <td><button type="button" class="btn btn--sm" data-bind="${escapeHtml(b.browserId)}">${t('btnBind')}</button></td>
      </tr>`;
    })
    .join('');
  tbody.querySelectorAll('[data-bind]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const browserId = btn.getAttribute('data-bind');
      try {
        await api('POST', '/browsers/bind', { browserId });
        await loadBrowsers();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function renderTabsDetail(browsers) {
  const el = document.getElementById('tabs-detail');
  if (!el) return;
  const online = browsers.filter((b) => b.status === 'online' && b.tabs?.length);
  if (!online.length) {
    el.innerHTML = `<p class="empty-hint">${t('noLiveTabs')}</p>`;
    return;
  }
  el.innerHTML = online
    .map((b) => {
      const rows = (b.tabs || [])
        .map(
          (tab) => `<tr>
          <td>${escapeHtml(tab.platform || t('dashEmDash'))}</td>
          <td class="mono">${escapeHtml(tab.url || tab.title || t('dashEmDash'))}</td>
        </tr>`
        )
        .join('');
      return `<h4 style="margin:1rem 0 0.5rem">${escapeHtml(b.browserLabel)} (${escapeHtml(b.browserId)})</h4>
      <div class="table-wrap"><table class="data"><thead><tr><th>${t('thPlatform')}</th><th>${t('thUrlTitle')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    })
    .join('');
}

async function loadBrowsers() {
  await loadMcpToken();
  const msg = document.getElementById('enroll-msg');
  try {
    const data = await api('GET', '/browsers');
    renderBrowsers(data.browsers || []);
    renderTabsDetail(data.browsers || []);
    msg?.classList.add('hidden');
  } catch (err) {
    if (err.status === 401) showLogin();
  }
}

async function onEnrollSubmit(ev) {
  ev.preventDefault();
  const form = ev.target;
  const msg = document.getElementById('enroll-msg');
  const body = {
    browserId: form.browserId.value.trim(),
    key: form.key.value.trim(),
    browserLabel: form.browserLabel.value.trim() || undefined,
    allowCreate: form.allowCreate.checked,
    allowDestructive: form.allowDestructive.checked,
    allowProjects: form.allowProjects.checked
  };
  try {
    await api('POST', '/browsers/enroll', body);
    if (msg) {
      msg.className = 'msg msg--ok';
      msg.textContent = `${t('enrolledOk')} ${body.browserId}`;
      msg.classList.remove('hidden');
    }
    form.key.value = '';
    await loadBrowsers();
  } catch (err) {
    if (msg) {
      msg.className = 'msg msg--error';
      msg.textContent = err.message;
      msg.classList.remove('hidden');
    }
  }
}

async function loadJobs() {
  const tbody = document.getElementById('jobs-tbody');
  const summary = document.getElementById('jobs-summary');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8">${t('loading')}</td></tr>`;
  try {
    const [overview, jobsRes] = await Promise.all([api('GET', '/overview'), api('GET', '/jobs?limit=200')]);
    const jobs = jobsRes.jobs || [];
    if (summary) {
      const q = overview.queue || {};
      summary.textContent = `${t('jobsSummaryPrefix')} ${jobs.length} ${t('jobsSummaryJobs')} · ${t('jobsSummaryQueued')}=${q.queued ?? 0} ${t('jobsSummaryRunning')}=${q.running ?? 0}`;
    }
    if (!jobs.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="empty-hint">${t('queueEmpty')}</td></tr>`;
      return;
    }
    tbody.innerHTML = jobs
      .map((j) => {
        const terminal = ['done', 'error', 'failed', 'cancelled'].includes(j.status);
        const cancelBtn = terminal
          ? ''
          : `<button type="button" class="btn btn--sm btn--danger" data-cancel="${escapeHtml(j.job_id)}">${t('cancelJob')}</button>`;
        return `<tr>
          <td class="mono">${escapeHtml(j.job_id)}</td>
          <td>${escapeHtml(j.kind)}</td>
          <td>${statusBadge(j.status)}</td>
          <td>${escapeHtml(j.platform || t('dashEmDash'))}</td>
          <td class="mono">${escapeHtml(j.browserId || t('dashEmDash'))}</td>
          <td>${j.progress != null ? j.progress : t('dashEmDash')}</td>
          <td>${formatDate(j.updatedAt)}</td>
          <td>${cancelBtn}</td>
        </tr>`;
      })
      .join('');
    tbody.querySelectorAll('[data-cancel]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const jobId = btn.getAttribute('data-cancel');
        try {
          await api('POST', '/jobs/cancel', { jobId });
          await loadJobs();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    if (err.status === 401) showLogin();
    else tbody.innerHTML = `<tr><td colspan="8" class="msg msg--error">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadCacheList() {
  const tbody = document.getElementById('cache-tbody');
  const detail = document.getElementById('cache-detail');
  if (detail) detail.innerHTML = '';
  if (!tbody) return;
  try {
    const data = await api('GET', '/cache?limit=200');
    const rows = data.caches || [];
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-hint">${t('noCachedChats')}</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map(
        (c) => `<tr>
        <td class="mono">${escapeHtml(c.cacheId)}</td>
        <td>${escapeHtml(c.platform)}</td>
        <td>${escapeHtml(c.title || t('dashEmDash'))}</td>
        <td>${c.totalTurns ?? t('dashEmDash')}</td>
        <td>${c.totalChars ?? t('dashEmDash')}</td>
        <td>${formatDate(c.updatedAt)}</td>
        <td>
          <button type="button" class="btn btn--sm" data-view="${escapeHtml(c.cacheId)}">${t('btnView')}</button>
          <button type="button" class="btn btn--sm btn--danger" data-del="${escapeHtml(c.cacheId)}">${t('deleteCache')}</button>
        </td>
      </tr>`
      )
      .join('');
    tbody.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => loadCacheDetail(btn.getAttribute('data-view')));
    });
    tbody.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(t('confirmDeleteCache'))) return;
        try {
          await api('DELETE', `/cache/${encodeURIComponent(btn.getAttribute('data-del'))}`);
          await loadCacheList();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    if (err.status === 401) showLogin();
  }
}

async function loadCacheDetail(cacheId) {
  const el = document.getElementById('cache-detail');
  if (!el) return;
  el.innerHTML = `<p class="empty-hint">${t('loading')}</p>`;
  try {
    const data = await api('GET', `/cache/${encodeURIComponent(cacheId)}`);
    const c = data.cache;
    el.innerHTML = `
      <div class="card">
        <h3>${t('cacheDetail')}</h3>
        <dl>
          <div class="stat-row"><dt>${t('cacheIdLabel')}</dt><dd class="mono">${escapeHtml(c.cacheId)}</dd></div>
          <div class="stat-row"><dt>${t('chat')}</dt><dd class="mono">${escapeHtml(c.chatId)}</dd></div>
          <div class="stat-row"><dt>${t('browser')}</dt><dd class="mono">${escapeHtml(c.browserId)}</dd></div>
          <div class="stat-row"><dt>${t('model')}</dt><dd>${escapeHtml(c.model || t('dashEmDash'))}</dd></div>
          <div class="stat-row"><dt>${t('blocks')}</dt><dd>${c.blocks ?? 0} (${t('blocksMaxRev')} ${c.maxRevision ?? t('dashEmDash')})</dd></div>
        </dl>
        ${c.meta ? `<pre class="log-view">${escapeHtml(JSON.stringify(c.meta, null, 2))}</pre>` : ''}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="msg msg--error">${escapeHtml(err.message)}</div>`;
  }
}

async function loadLogs() {
  const view = document.getElementById('log-view');
  if (!view) return;
  const type = state.logType;
  try {
    const data = await api('GET', `/logs?type=${type === 'alerts' ? 'alerts' : 'server'}&lines=150`);
    const lines = (data.entries || []).map((e) => {
      if (typeof e === 'string') return e;
      if (e.line) return e.line;
      return JSON.stringify(e);
    });
    view.textContent = lines.join('\n') || t('emptyLog');
    view.scrollTop = view.scrollHeight;
  } catch (err) {
    if (err.status === 401) showLogin();
    else view.textContent = err.message;
  }
}

function bindUi() {
  document.getElementById('login-form')?.addEventListener('submit', onLoginSubmit);
  document.getElementById('btn-logout')?.addEventListener('click', onLogout);
  document.getElementById('enroll-form')?.addEventListener('submit', onEnrollSubmit);
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.section));
  });
  document.getElementById('btn-refresh-overview')?.addEventListener('click', loadOverview);
  document.getElementById('btn-refresh-jobs')?.addEventListener('click', loadJobs);
  document.getElementById('btn-refresh-cache')?.addEventListener('click', loadCacheList);
  document.querySelectorAll('[data-log-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.logType = btn.getAttribute('data-log-type');
      document.querySelectorAll('[data-log-type]').forEach((b) => b.classList.toggle('active', b === btn));
      loadLogs();
    });
  });
}

async function boot() {
  initThemeHooks();
  const locale = localStorage.getItem('ce_dash_locale') || 'en';
  await loadLocale(locale);
  applyI18n();
  bindUi();
  try {
    const overview = await api('GET', '/overview');
    showApp('admin');
    renderOverview(overview);
    const dot = document.getElementById('server-status-dot');
    dot?.classList.add('status-dot--ok');
  } catch (err) {
    if (err.status === 401) {
      showLogin();
    } else {
      showLogin();
      const errEl = document.getElementById('login-error');
      if (errEl) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
      }
    }
  }
}

boot();
