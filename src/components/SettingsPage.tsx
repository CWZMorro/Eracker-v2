import { useStore } from './../store';
import { exportCsv } from './../lib';
import type { DateFormat, Theme } from './../types';

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'midnight', label: 'Midnight' },
];

const DATE_FORMATS: DateFormat[] = ['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd'];

export function SettingsPage() {
  const theme = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);
  const dateFormat = useStore(s => s.dateFormat);
  const setDateFormat = useStore(s => s.setDateFormat);
  const txns = useStore(s => s.txns);
  const updatedAt = useStore(s => s.updatedAt);
  const accounts = useStore(s => s.accounts);
  const separate = useStore(s => s.separateOffBudget);
  const toggleSeparate = useStore(s => s.toggleSeparateOffBudget);

  return (
    <div className="page" data-screen-label="Settings">
      <div className="page-title">Settings</div>
      <div style={{ margin: '10px 20px 40px', maxWidth: 530, display: 'flex', flexDirection: 'column', gap: 30 }}>
        <div className="settings-section">
          <span>
            <b>Eracker</b> is a read-only view of your Actual Budget data.
            Actual stays the source of truth; Eracker never changes it.
          </span>
          <span>Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : '—'}</span>
          <span>Client version: v2.0.0</span>
        </div>

        <div className="settings-section">
          <div style={{ fontWeight: 500 }}>Theme</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {THEMES.map(t => (
              <button
                key={t.value}
                className={`btn-normal${theme === t.value ? ' selected' : ''}`}
                onClick={() => setTheme(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span style={{ color: 'var(--color-pageTextLight)' }}>
            <b>Themes</b> change the user interface colors across the whole app.
          </span>
        </div>

        <div className="settings-section">
          <div style={{ fontWeight: 500 }}>Off-budget accounts</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn-normal${separate ? ' selected' : ''}`} onClick={() => separate || toggleSeparate()}>
              Separate
            </button>
            <button className={`btn-normal${!separate ? ' selected' : ''}`} onClick={() => separate && toggleSeparate()}>
              Combined
            </button>
          </div>
          <span style={{ color: 'var(--color-pageTextLight)' }}>
            <b>Separate</b> shows each off-budget account on its own in the dashboard and reports, and
            never adds their balances together. <b>Combined</b> treats them as one group, like Actual.
          </span>
        </div>

        <div className="settings-section">
          <div style={{ fontWeight: 500 }}>Formatting</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontWeight: 500, color: 'var(--color-pageTextLight)' }}>Date format</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {DATE_FORMATS.map(f => (
                <button
                  key={f}
                  className={`btn-normal tnum${dateFormat === f ? ' selected' : ''}`}
                  onClick={() => setDateFormat(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <span style={{ color: 'var(--color-pageTextLight)' }}>
            <b>Formatting</b> affects how dates are displayed in the register.
          </span>
        </div>

        <div className="settings-section">
          <span><b>Export</b> all transactions as a CSV file.</span>
          <button className="btn-normal" onClick={() => exportCsv(txns, accounts)}>Export data</button>
        </div>

      </div>
    </div>
  );
}
