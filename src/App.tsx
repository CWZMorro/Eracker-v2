import { useEffect } from 'react';
import { useStore } from './store';
import { useGlobalShortcuts } from './useGlobalShortcuts';
import { Sidebar } from './components/Sidebar';
import { Titlebar } from './components/Titlebar';
import { AccountPage } from './components/AccountPage';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { SettingsPage } from './components/SettingsPage';
import { Modals } from './components/Modals';
import { Toasts } from './components/Toasts';

const REFRESH_MS = 5 * 60_000;

export function App() {
  const route = useStore(s => s.route);
  const theme = useStore(s => s.theme);
  const privacy = useStore(s => s.privacy);
  const updatedAt = useStore(s => s.updatedAt);
  const error = useStore(s => s.error);

  useGlobalShortcuts();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const load = () => useStore.getState().load().catch(() => {});
    load();
    const timer = setInterval(load, REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  return (
    <div className="app" data-privacy={privacy ? 'on' : 'off'}>
      <Sidebar />
      <div className="main">
        <Titlebar />
        {!updatedAt ? (
          <div className="page" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--color-pageTextSubdued)' }}>
            {error ? `Can't reach the Eracker server (${error}).` : 'Loading…'}
          </div>
        ) : (
          <>
            {route.name === 'account' && <AccountPage />}
            {route.name === 'dashboard' && <Dashboard />}
            {route.name === 'reports' && <Reports />}
            {route.name === 'settings' && <SettingsPage />}
          </>
        )}
      </div>
      <Modals />
      <Toasts />
    </div>
  );
}
