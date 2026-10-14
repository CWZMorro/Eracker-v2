import { useState } from 'react';
import { useStore, accountBalance, showsGroupTotal } from './../store';
import { formatAmount, exportCsv } from './../lib';
import type { Account, Route } from './../types';
import { ExpandArrow, Wallet, Reports, Cog, CheveronDown, CheveronRight } from './../icons';

function routeMatches(route: Route, name: Route['name'], id?: string | null): boolean {
  if (route.name !== name) return false;
  if (name === 'account') return (route as { id: string | null }).id === id;
  return true;
}

export function Sidebar() {
  const route = useStore(s => s.route);
  const accounts = useStore(s => s.accounts);
  const txns = useStore(s => s.txns);
  const navigate = useStore(s => s.navigate);
  const separate = useStore(s => s.separateOffBudget);
  const [moreOpen, setMoreOpen] = useState(false);
  const [brandMenu, setBrandMenu] = useState(false);

  const onBudget = accounts.filter(a => !a.off);
  const offBudget = accounts.filter(a => a.off);
  const total = (group: string | null, list: Account[]) =>
    showsGroupTotal(group, accounts, separate)
      ? formatAmount(list.reduce((acc, a) => acc + accountBalance(txns, a.id), 0))
      : '';

  const AccountRow = ({ account }: { account: Account }) => (
    <div
      className={`sidebar-item sidebar-item-account${routeMatches(route, 'account', account.id) ? ' active' : ''}`}
      onClick={() => navigate({ name: 'account', id: account.id })}
    >
      <span className="name">{account.name}</span>
      <span className="tnum pf">{formatAmount(accountBalance(txns, account.id))}</span>
    </div>
  );

  return (
    <div className="sidebar" data-screen-label="Sidebar">
      <div style={{ position: 'relative', paddingTop: 35, height: 30, display: 'flex', alignItems: 'center', margin: '0 8px 23px 20px', userSelect: 'none' }}>
        <div className="sidebar-brand" onClick={() => setBrandMenu(v => !v)}>
          <span>Eracker</span>
          <ExpandArrow size={7} />
        </div>
        {brandMenu && (
          <div className="menu" style={{ top: 68, left: 0 }} onMouseLeave={() => setBrandMenu(false)}>
            <div className="menu-item" onClick={() => { setBrandMenu(false); navigate({ name: 'settings' }); }}>Settings</div>
            <div className="menu-item" onClick={() => { setBrandMenu(false); exportCsv(useStore.getState().txns, accounts); }}>Export data</div>
          </div>
        )}
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flexShrink: 0 }}>
          <div
            className={`sidebar-item sidebar-item-primary${routeMatches(route, 'dashboard') ? ' active' : ''}`}
            onClick={() => navigate({ name: 'dashboard' })}
          >
            <Wallet />
            <span>Dashboard</span>
          </div>
          <div
            className={`sidebar-item sidebar-item-primary${routeMatches(route, 'reports') ? ' active' : ''}`}
            onClick={() => navigate({ name: 'reports' })}
          >
            <Reports />
            <span>Reports</span>
          </div>
          <div className="sidebar-item sidebar-item-primary" onClick={() => setMoreOpen(v => !v)}>
            {moreOpen ? <CheveronDown /> : <CheveronRight />}
            <span>More</span>
          </div>
          {moreOpen && (
            <div
              className={`sidebar-item${routeMatches(route, 'settings') ? ' active' : ''}`}
              style={{ fontSize: 13, padding: '4px 15px 4px 29px', margin: '2px 0 8px', gap: 8 }}
              onClick={() => navigate({ name: 'settings' })}
            >
              <Cog size={12} />
              <span>Settings</span>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--color-sidebarItemBackgroundHover)', marginTop: 15, flexShrink: 0 }} />

        <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div
            className={`sidebar-item sidebar-group-header${routeMatches(route, 'account', null) ? ' active' : ''}`}
            style={{ marginTop: 15 }}
            onClick={() => navigate({ name: 'account', id: null })}
          >
            <span>All accounts</span>
            <span className="tnum pf">{total(null, accounts)}</span>
          </div>

          <div
            className={`sidebar-item sidebar-group-header${routeMatches(route, 'account', 'onbudget') ? ' active' : ''}`}
            onClick={() => navigate({ name: 'account', id: 'onbudget' })}
          >
            <span className="label">On budget</span>
            <span className="tnum pf">{total('onbudget', onBudget)}</span>
          </div>
          {onBudget.map(a => <AccountRow key={a.id} account={a} />)}

          <div
            className={`sidebar-item sidebar-group-header${routeMatches(route, 'account', 'offbudget') ? ' active' : ''}`}
            onClick={() => navigate({ name: 'account', id: 'offbudget' })}
          >
            <span className="label">Off budget</span>
            <span className="tnum pf">{total('offbudget', offBudget)}</span>
          </div>
          {offBudget.map(a => <AccountRow key={a.id} account={a} />)}
        </div>

      </div>
    </div>
  );
}
