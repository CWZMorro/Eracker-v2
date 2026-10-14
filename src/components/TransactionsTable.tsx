import { useMemo } from 'react';
import { useStore } from './../store';
import { formatAmount, formatDate } from './../lib';
import type { Transaction } from './../types';
import { CheckCircle, CheckCircleHollow, Subtract } from './../icons';

interface Props {
  list: Transaction[];
  singleAccount: boolean;
}

export function TransactionsTable({ list, singleAccount }: Props) {
  const accounts = useStore(s => s.accounts);
  const dateFormat = useStore(s => s.dateFormat);
  const selection = useStore(s => s.selection);
  const cursor = useStore(s => s.cursor);
  const sortField = useStore(s => s.sortField);
  const sortAsc = useStore(s => s.sortAsc);
  const search = useStore(s => s.search);
  const filterCat = useStore(s => s.filterCat);
  const filterUncleared = useStore(s => s.filterUncleared);
  const showBalancePref = useStore(s => s.showBalanceCol);
  const showClearedCol = useStore(s => s.showClearedCol);

  const setSelection = useStore(s => s.setSelection);
  const setCursor = useStore(s => s.setCursor);
  const setSort = useStore(s => s.setSort);

  const acctName = useMemo(
    () => Object.fromEntries(accounts.map(a => [a.id, a.name])),
    [accounts],
  );

  // Running balance only makes sense on a single account, date-desc, unfiltered.
  const showBalanceCol =
    singleAccount && showBalancePref && sortField === 'date' && !sortAsc &&
    !search && !filterCat && !filterUncleared;

  const balances = useMemo(() => {
    if (!showBalanceCol) return {};
    const asc = [...list].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1,
    );
    const out: Record<string, number> = {};
    let run = 0;
    for (const t of asc) { run += t.amount; out[t.id] = run; }
    return out;
  }, [list, showBalanceCol]);

  const toggleSel = (id: string, range: boolean) => {
    let sel = [...selection];
    if (range && cursor) {
      const ids = list.map(t => t.id);
      const a = ids.indexOf(cursor), b = ids.indexOf(id);
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        for (let i = lo; i <= hi; i++) if (!sel.includes(ids[i])) sel.push(ids[i]);
        setSelection(sel);
        setCursor(id);
        return;
      }
    }
    sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id];
    setSelection(sel);
    setCursor(id);
  };

  const sortGlyph = (f: string) => (sortField === f ? (sortAsc ? ' ▲' : ' ▼') : '');

  const Header = () => (
    <div className="register-header">
      <div
        style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onClick={() => setSelection(selection.length ? [] : list.map(t => t.id))}
      >
        <div className={`checkbox${selection.length ? ' checked' : ''}`}>
          {selection.length > 0 && <Subtract size={6} />}
        </div>
      </div>
      <div className="cell" style={{ width: 110, cursor: 'pointer' }} onClick={() => setSort('date')}>Date{sortGlyph('date')}</div>
      {!singleAccount && <div className="cell grow">Account</div>}
      <div className="cell grow" style={{ cursor: 'pointer' }} onClick={() => setSort('payee')}>Payee{sortGlyph('payee')}</div>
      <div className="cell grow">Notes</div>
      <div className="cell grow" style={{ cursor: 'pointer' }} onClick={() => setSort('category')}>Category{sortGlyph('category')}</div>
      <div className="cell right" style={{ width: 100, cursor: 'pointer' }} onClick={() => setSort('payment')}>Payment{sortGlyph('payment')}</div>
      <div className="cell right" style={{ width: 100, cursor: 'pointer' }} onClick={() => setSort('deposit')}>Deposit{sortGlyph('deposit')}</div>
      {showBalanceCol && <div className="cell right" style={{ width: 103 }}>Balance</div>}
      {showClearedCol && <div className="cell" style={{ width: 38, justifyContent: 'center' }}>✓</div>}
    </div>
  );

  return (
    <div className="register">
      <Header />
      <div className="register-body">
        {list.map(t => {
          const sel = selection.includes(t.id);
          const bal = balances[t.id];
          return (
            <div
              key={t.id}
              className={`register-row${sel ? ' selected' : ''}`}
              onClick={e => toggleSel(t.id, e.shiftKey)}
            >
              <div
                style={{
                  width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  borderLeft: `2px solid ${cursor === t.id ? 'var(--color-formInputBorderSelected)' : 'transparent'}`,
                }}
              >
                <div className={`checkbox${sel ? ' checked' : ''}`}>{sel ? '✓' : ''}</div>
              </div>

              <div className="cell tnum" style={{ width: 110 }}>{formatDate(t.date, dateFormat)}</div>
              {!singleAccount && <div className="cell grow">{acctName[t.account] ?? ''}</div>}
              <div className="cell grow">{t.payee}</div>
              <div className="cell grow" style={{ color: 'var(--color-tableTextLight)' }}>{t.notes}</div>
              <div className="cell grow" style={t.transferAccount ? { color: 'var(--color-pageTextSubdued)' } : undefined}>
                {t.category || (t.transferAccount ? 'Between accounts' : '')}
              </div>
              <div className="cell right tnum pf" style={{ width: 100 }}>{t.amount < 0 ? formatAmount(-t.amount) : ''}</div>
              <div className="cell right tnum pf" style={{ width: 100 }}>{t.amount > 0 ? formatAmount(t.amount) : ''}</div>

              {showBalanceCol && (
                <div
                  className="cell right tnum pf"
                  style={{ width: 103, color: bal! < 0 ? 'var(--color-errorText)' : 'var(--color-tableTextLight)' }}
                >
                  {formatAmount(bal!)}
                </div>
              )}

              {showClearedCol && (
                <div
                  className="cell"
                  title={t.cleared ? 'Cleared' : 'Pending'}
                  style={{
                    width: 38, justifyContent: 'center',
                    color: t.cleared ? 'var(--color-noticeTextLight)' : 'var(--color-pageTextSubdued)',
                  }}
                >
                  {t.cleared ? <CheckCircle size={13} /> : <CheckCircleHollow size={13} />}
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-pageTextSubdued)' }}>
            No transactions
          </div>
        )}
      </div>
    </div>
  );
}
