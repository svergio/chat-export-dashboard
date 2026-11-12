import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from './api/client';
import type { Section } from './types/api';
import { useTheme } from './hooks/useTheme';
import { useUiPrefs } from './hooks/useUiPrefs';
import { useLocale } from './hooks/useLocale';
import { DashboardRefreshProvider } from './hooks/useDashboardRefresh';
import { LoginScreen } from './components/LoginScreen';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { LegalFooter } from './components/LegalFooter';
import { OverviewPage } from './pages/OverviewPage';
import { BrowsersPage } from './pages/BrowsersPage';
import { QueuesPage } from './pages/QueuesPage';
import { CachePage } from './pages/CachePage';
import { LogsPage } from './pages/LogsPage';

export function App() {
  const { skin, schemePref, localePref, locale, setSkin, setSchemePref, setLocalePref } =
    useTheme();
  const { fontPref, uiSizePref, setFontPref, setUiSizePref } = useUiPrefs();
  const { t } = useLocale(locale);
  const [user, setUser] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('overview');
  const [serverOk, setServerOk] = useState(false);
  const [bootError, setBootError] = useState<string | undefined>();

  const onUnauthorized = useCallback(() => {
    setUser(null);
    setServerOk(false);
  }, []);

  const onLogout = useCallback(async () => {
    try {
      await api('POST', '/logout');
    } catch {
      /* ignore */
    }
    setUser(null);
    setServerOk(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await api<{ username?: string }>('GET', '/session');
        if (!cancelled) {
          setUser(session.username || null);
          setServerOk(Boolean(session.username));
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiClientError && err.status === 401) {
          setUser(null);
        } else {
          setUser(null);
          setBootError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return (
      <LoginScreen
        t={t}
        initialError={bootError}
        localePref={localePref}
        schemePref={schemePref}
        skin={skin}
        fontPref={fontPref}
        uiSizePref={uiSizePref}
        onLocale={setLocalePref}
        onScheme={setSchemePref}
        onSkin={setSkin}
        onFont={setFontPref}
        onUiSize={setUiSizePref}
        onSuccess={(username) => {
          setBootError(undefined);
          setUser(username);
          setSection('overview');
        }}
      />
    );
  }

  let panel = null;
  if (section === 'overview') {
    panel = <OverviewPage t={t} onUnauthorized={onUnauthorized} onServerOk={setServerOk} />;
  } else if (section === 'browsers') {
    panel = <BrowsersPage t={t} onUnauthorized={onUnauthorized} onServerOk={setServerOk} />;
  } else if (section === 'queues') {
    panel = <QueuesPage t={t} onUnauthorized={onUnauthorized} onServerOk={setServerOk} />;
  } else if (section === 'cache') {
    panel = <CachePage t={t} onUnauthorized={onUnauthorized} onServerOk={setServerOk} />;
  } else if (section === 'logs') {
    panel = <LogsPage t={t} onUnauthorized={onUnauthorized} onServerOk={setServerOk} />;
  }

  return (
    <DashboardRefreshProvider>
      <div className="app-shell">
        <TopBar
          t={t}
          username={user}
          serverOk={serverOk}
          localePref={localePref}
          schemePref={schemePref}
          skin={skin}
          fontPref={fontPref}
          uiSizePref={uiSizePref}
          onLocale={setLocalePref}
          onScheme={setSchemePref}
          onSkin={setSkin}
          onFont={setFontPref}
          onUiSize={setUiSizePref}
          onLogout={() => void onLogout()}
        />
        <div className="layout">
          <Sidebar t={t} section={section} onNavigate={setSection} />
          <main className="main">{panel}</main>
        </div>
        <LegalFooter t={t} />
      </div>
    </DashboardRefreshProvider>
  );
}
