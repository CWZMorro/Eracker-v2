import { useMemo, useState, type ReactNode } from 'react';
import { useStore, scopeOptions } from './../store';
import { SHORTCUT_GROUPS, META_KEY, type ShortcutDef } from './../shortcuts';
import { currentMonth } from './../lib';
import type { Theme } from './../types';
import { ArrowLeft, Remove, Search } from './../icons';

export function Modals() {
  const modal = useStore(s => s.modal);
  if (!modal) return null;
  if (modal.name === 'shortcuts') return <ShortcutsModal />;
  if (modal.name === 'palette') return <CommandPalette />;
  return null;
}

function Overlay({ children, center = true }: { children: ReactNode; center?: boolean }) {
  const setModal = useStore(s => s.setModal);
  return (
    <div
      className="overlay"
      style={center ? undefined : { alignItems: 'flex-start', paddingTop: '12vh' }}
      onClick={() => setModal(null)}
    >
      <div onClick={e => e.stopPropagation()} style={{ display: 'contents' }}>{children}</div>
    </div>
  );
}

/* ---------------- keyboard shortcuts (?) ---------------- */

function KeyCaps({ item }: { item: ShortcutDef }) {
  const keys: string[] = [];
  if (item.shift) keys.push('Shift');
  if (item.meta) keys.push(META_KEY);
  keys.push(item.shortcut);
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
      {keys.map((k, i) => (
        <span key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {i > 0 && <span>+</span>}
          <span className="key-cap">{k}</span>
        </span>
      ))}
    </div>
  );
}

function ShortcutsModal() {
  const setModal = useStore(s => s.setModal);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const searching = query.length > 0;
  const drilled = category !== null;
  const group = SHORTCUT_GROUPS.find(g => g.id === category);

  const items = useMemo(() => {
    if (searching) {
      const q = query.toLowerCase();
      return SHORTCUT_GROUPS.flatMap(g => g.items.filter(i => i.description.toLowerCase().includes(q)));
    }
    return group?.items ?? [];
  }, [query, group, searching]);

  const title = searching ? 'Search results' : group ? `${group.name} shortcuts` : 'Keyboard shortcuts';

  return (
    <Overlay>
      <div className="modal" data-screen-label="Keyboard shortcuts modal" style={{ width: 700, maxWidth: '92vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 60, flexShrink: 0, position: 'relative' }}>
          {(drilled || searching) && (
            <button
              className="btn-bare"
              style={{ position: 'absolute', left: 15, zIndex: 1, gap: 5 }}
              onClick={() => { setQuery(''); setCategory(null); }}
            >
              <ArrowLeft size={10} />
              <span>Back</span>
            </button>
          )}
          <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 700 }}>{title}</div>
          <button className="btn-bare" style={{ position: 'absolute', right: 15, padding: 6 }} onClick={() => setModal(null)}>
            <Remove size={10} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 13, padding: '0 16px 16px' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', height: 28, borderRadius: 4,
              background: 'var(--color-tableBackground)',
              border: '1px solid var(--color-formInputBorder)', marginBottom: 10,
            }}
          >
            <Search size={13} style={{ flexShrink: 0, margin: '5px 0 5px 5px' }} />
            <input
              autoFocus
              value={query}
              onChange={e => { setQuery(e.target.value); setCategory(null); }}
              placeholder="Search shortcuts"
              style={{ flex: 1, border: 0, background: 'transparent', color: 'inherit', padding: '4px 6px', outline: 'none' }}
            />
          </div>

          <div
            style={{
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
              maxHeight: '60vh', height: 400,
              background: 'var(--color-tableBackground)',
              border: '1px solid var(--color-tableBorder)', borderRadius: 4,
            }}
          >
            {!searching && !drilled
              ? SHORTCUT_GROUPS.map(g => (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 5, padding: 12, height: 45, flexShrink: 0,
                      borderBottom: '1px solid var(--color-tableBorder)', cursor: 'pointer',
                    }}
                    onClick={() => setCategory(g.id)}
                  >
                    <span style={{ fontWeight: 700 }}>{g.name}</span>
                    <span style={{ color: 'var(--color-pageTextLight)' }}>
                      {g.items.length} shortcut{g.items.length === 1 ? '' : 's'} ›
                    </span>
                  </div>
                ))
              : items.length
                ? items.map(i => (
                    <div
                      key={i.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: 5, padding: 12, height: 45, flexShrink: 0,
                        borderBottom: '1px solid var(--color-tableBorder)',
                      }}
                    >
                      <span>{i.description}</span>
                      <KeyCaps item={i} />
                    </div>
                  ))
                : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontSize: 15 }}>
                    No matching shortcuts
                  </div>
                )}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------------- command palette (Ctrl+K) ---------------- */

function CommandPalette() {
  const store = useStore;
  const accounts = useStore(s => s.accounts);
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);

  const commands = useMemo(() => {
    const s = store.getState();
    const go = (route: Parameters<typeof s.navigate>[0]) => () => { s.navigate(route); s.setModal(null); };
    const cmds: Array<{ name: string; hint: string; run: () => void }> = [
      { name: 'Go to Dashboard', hint: '', run: go({ name: 'dashboard' }) },
      { name: 'Go to Reports', hint: '', run: go({ name: 'reports' }) },
      { name: 'Go to Settings', hint: '', run: go({ name: 'settings' }) },
      { name: 'Go to All accounts', hint: '', run: go({ name: 'account', id: null }) },
      ...accounts.map(a => ({ name: `Go to account: ${a.name}`, hint: '', run: go({ name: 'account', id: a.id }) })),
      {
        name: 'Refresh data', hint: '',
        run: () => { s.setModal(null); s.load(true).then(() => s.toast('Up to date with the server'), () => s.toast('Refresh failed')); },
      },
      ...scopeOptions(accounts, s.separateOffBudget).map(o => ({
        name: `Dashboard and reports: ${o.label}`, hint: '', run: () => { s.setScope(o.value); s.setModal(null); },
      })),
      {
        name: s.separateOffBudget ? 'Combine off-budget accounts' : 'Separate off-budget accounts', hint: '',
        run: () => { s.toggleSeparateOffBudget(); s.setModal(null); },
      },
      { name: 'Toggle privacy filter', hint: `Shift+${META_KEY}+P`, run: () => { s.togglePrivacy(); s.setModal(null); } },
      ...(['light', 'dark', 'midnight'] as Theme[]).map(t => ({
        name: `Theme: ${t[0].toUpperCase()}${t.slice(1)}`, hint: '',
        run: () => { s.setTheme(t); s.setModal(null); },
      })),
      { name: 'Keyboard shortcuts', hint: '?', run: () => s.setModal({ name: 'shortcuts' }) },
      { name: 'View current month', hint: '0', run: () => { s.setMonth(currentMonth()); s.navigate({ name: 'dashboard' }); s.setModal(null); } },
    ];
    return cmds;
  }, [accounts, store]);

  const filtered = commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const active = Math.min(idx, Math.max(0, filtered.length - 1));

  return (
    <Overlay center={false}>
      <div
        className="modal"
        data-screen-label="Command palette"
        style={{ width: 600, maxWidth: '92vw', background: 'var(--color-menuBackground)', color: 'var(--color-menuItemText)', overflow: 'hidden' }}
      >
        <input
          autoFocus
          value={query}
          onChange={e => { setQuery(e.target.value); setIdx(0); }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(filtered.length - 1, i + 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
            else if (e.key === 'Enter') { e.preventDefault(); filtered[active]?.run(); }
          }}
          placeholder="Type a command…"
          style={{
            border: 0, borderBottom: '1px solid var(--color-menuBorder)',
            background: 'transparent', color: 'inherit',
            padding: '14px 16px', fontSize: 15, outline: 'none',
          }}
        />
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: '4px 0' }}>
          {filtered.map((c, i) => (
            <div
              key={c.name}
              className="menu-item"
              style={i === active ? { background: 'var(--color-menuItemBackgroundHover)' } : undefined}
              onClick={c.run}
              onMouseEnter={() => setIdx(i)}
            >
              <span>{c.name}</span>
              <span className="key" style={{ fontSize: 12 }}>{c.hint}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 16, color: 'var(--color-pageTextSubdued)' }}>No matching commands</div>
          )}
        </div>
      </div>
    </Overlay>
  );
}
