import { useEffect, useState } from 'react';
import {
  useStore, filteredTxns, accountIdsForRoute, accountBalance, showsGroupTotal,
} from './../store';
import { formatAmount, exportCsv } from './../lib';
import { Filter, Search, Remove, Dots } from './../icons';
import { TransactionsTable } from './TransactionsTable';

export function AccountPage() {
  const route = useStore(s => s.route);
  const accounts = useStore(s => s.accounts);
  const txns = useStore(s => s.txns);
  const search = useStore(s => s.search);
  const filterCat = useStore(s => s.filterCat);
  const filterUncleared = useStore(s => s.filterUncleared);
  const sortField = useStore(s => s.sortField);
  const sortAsc = useStore(s => s.sortAsc);
  const selection = useStore(s => s.selection);
  const showBalanceCol = useStore(s => s.showBalanceCol);
  const showClearedCol = useStore(s => s.showClearedCol);
  const separate = useStore(s => s.separateOffBudget);

  const setSearch = useStore(s => s.setSearch);
  const setFilterCat = useStore(s => s.setFilterCat);
  const toggleFilterUncleared = useStore(s => s.toggleFilterUncleared);
  const clearFilters = useStore(s => s.clearFilters);
  const setSelection = useStore(s => s.setSelection);
  const toggleBalanceCol = useStore(s => s.toggleBalanceCol);
  const toggleClearedCol = useStore(s => s.toggleClearedCol);

  const [filterMenu, setFilterMenu] = useState(false);
  const [acctMenu, setAcctMenu] = useState(false);

  // 'F' shortcut toggles the filter dropdown
  useEffect(() => {
    const h = () => setFilterMenu(v => !v);
    window.addEventListener('eracker:toggle-filter', h);
    return () => window.removeEventListener('eracker:toggle-filter', h);
  }, []);

  if (route.name !== 'account') return null;

  const ids = accountIdsForRoute(route, accounts);
  const singleAccount = route.id !== null && !['onbudget', 'offbudget'].includes(route.id);
  const balance = ids.reduce((acc, id) => acc + accountBalance(txns, id), 0);
  // a group of separate off-budget accounts has no single meaningful balance
  const showBalance = singleAccount || showsGroupTotal(route.id, accounts, separate);
  const total = (list: typeof txns) => formatAmount(list.reduce((acc, t) => acc + t.amount, 0));

  const title =
    route.id === null ? 'All accounts'
    : route.id === 'onbudget' ? 'On budget'
    : route.id === 'offbudget' ? 'Off budget'
    : accounts.find(a => a.id === route.id)?.name ?? 'Account';

  const list = filteredTxns({ txns, accounts, route, search, filterCat, filterUncleared, sortField, sortAsc });
  const isFiltered = !!(search || filterCat || filterUncleared);
  const selected = txns.filter(t => selection.includes(t.id));

  const usedCats = [...new Set(
    txns.filter(t => ids.includes(t.account)).map(t => t.category).filter(c => c && c !== 'Starting Balance'),
  )].sort();

  return (
    <div data-screen-label="Account register" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingTop: 8 }}>
      <div style={{ padding: '0 20px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 2, gap: 5, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 25, fontWeight: 500, whiteSpace: 'nowrap' }}>{title}</div>
          {showBalance && (
            <div
              className="tnum pf"
              style={{
                fontSize: 22,
                color: balance < 0 ? 'var(--color-numberNegative)'
                  : balance > 0 ? 'var(--color-numberPositive)'
                  : 'var(--color-pageTextSubdued)',
              }}
            >
              {formatAmount(balance)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, position: 'relative' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button className="btn-bare" title="Filter (F)" onClick={() => setFilterMenu(v => !v)}>
              <Filter size={12} />
              <span>Filter</span>
            </button>
            {filterMenu && (
              <div className="menu" style={{ top: 30, left: 0, maxHeight: 300, overflow: 'auto' }} onMouseLeave={() => setFilterMenu(false)}>
                <div className="menu-header">Category</div>
                {usedCats.map(c => (
                  <div
                    key={c}
                    className="menu-item"
                    style={filterCat === c ? { color: 'var(--color-menuItemTextSelected)' } : undefined}
                    onClick={() => { setFilterCat(filterCat === c ? null : c); setFilterMenu(false); }}
                  >
                    <span>{c}</span>
                    <span>{filterCat === c ? '✓' : ''}</span>
                  </div>
                ))}
                <div className="menu-divider" />
                <div className="menu-item" onClick={() => { toggleFilterUncleared(); setFilterMenu(false); }}>
                  <span>Uncleared only</span>
                  <span>{filterUncleared ? '✓' : ''}</span>
                </div>
                <div className="menu-item" style={{ color: 'var(--color-errorText)' }} onClick={() => { clearFilters(); setFilterMenu(false); }}>
                  Clear filters
                </div>
              </div>
            )}
          </div>

          {isFiltered && (
            <span
              className="tnum"
              style={{ borderRadius: 4, padding: '4px 6px', color: 'var(--color-pillText)', background: 'var(--color-pillBackground)' }}
            >
              Filtered total: <b className="pf">{total(list)}</b>
            </span>
          )}

          <div style={{ flex: 1 }} />

          <div className="search-box">
            <Search size={13} style={{ flexShrink: 0, margin: '5px 0 5px 5px', color: search ? 'var(--color-menuItemTextSelected)' : 'inherit' }} />
            <input
              id="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setSearch(''); (e.target as HTMLInputElement).blur(); } }}
              placeholder="Search"
            />
            {search && (
              <button className="btn-bare" style={{ padding: '4px 8px' }} onClick={() => setSearch('')}>
                <Remove size={8} />
              </button>
            )}
          </div>

          {selection.length > 0 && (
            <button className="btn-normal tnum" title="Clear selection (Esc)" onClick={() => setSelection([])}>
              {selection.length} selected · <b className="pf">{total(selected)}</b>
            </button>
          )}

          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <button className="btn-bare" onClick={() => setAcctMenu(v => !v)}>
              <Dots style={{ transform: 'rotate(90deg)' }} />
            </button>
            {acctMenu && (
              <div className="menu" style={{ top: 30, right: 0, minWidth: 220 }} onMouseLeave={() => setAcctMenu(false)}>
                <div className="menu-item" onClick={() => { toggleBalanceCol(); setAcctMenu(false); }}>
                  {showBalanceCol ? 'Hide running balance' : 'Show running balance'}
                </div>
                <div className="menu-item" onClick={() => { toggleClearedCol(); setAcctMenu(false); }}>
                  {showClearedCol ? 'Hide "cleared" checkboxes' : 'Show "cleared" checkboxes'}
                </div>
                <div className="menu-item" onClick={() => { setAcctMenu(false); exportCsv(txns, accounts); }}>
                  Export
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionsTable list={list} singleAccount={singleAccount} />
    </div>
  );
}
