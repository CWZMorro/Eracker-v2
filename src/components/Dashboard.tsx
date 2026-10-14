import { useStore, monthTotals, spendingBreakdown } from './../store';
import { addMonth, currentMonth, formatAmount, monthName, monthShort } from './../lib';
import { CashFlowChart, Donut, Legend } from './Charts';
import { ScopeSwitch, useScope } from './ScopeSwitch';

const QUAL_COLORS = [
  'var(--color-chartQual1)', 'var(--color-chartQual2)', 'var(--color-chartQual3)',
  'var(--color-chartQual4)', 'var(--color-chartQual5)', 'var(--color-chartQual6)',
  'var(--color-chartQual7)', 'var(--color-chartQual8)', 'var(--color-chartQual9)',
];

function ChangePill({ delta, invert }: { delta: number; invert?: boolean }) {
  const good = invert ? delta <= 0 : delta >= 0;
  return (
    <span className={`pill tnum pf ${good ? 'good' : 'bad'}`} style={{ marginTop: 8 }}>
      {delta >= 0 ? '+' : ''}{formatAmount(delta)} vs last month
    </span>
  );
}

export function Dashboard() {
  const accounts = useStore(s => s.accounts);
  const txns = useStore(s => s.txns);
  const categories = useStore(s => s.categories);
  const scope = useScope();
  const month = useStore(s => s.month);
  const setMonth = useStore(s => s.setMonth);

  const data = { accounts, txns, categories };
  const mt = monthTotals(data, month, scope);
  const pm = monthTotals(data, addMonth(month, -1), scope);
  const net = mt.income - mt.expense;

  const cashFlow = Array.from({ length: 6 }, (_, i) => {
    const m = addMonth(month, i - 5);
    return { label: monthShort(m), ...monthTotals(data, m, scope) };
  });

  // Top 7 slices plus "Other". Where refunds outweigh purchases the total is negative: it is
  // listed but gets no slice, so the list still adds up to the Expenses card.
  const breakdown = spendingBreakdown(data, month, scope);
  const positive = breakdown.filter(([, v]) => v > 0);
  const rest = positive.slice(7).reduce((acc, [, v]) => acc + v, 0);
  const slices = [...positive.slice(0, 7), ...(rest > 0 ? [['Other', rest] as [string, number]] : [])]
    .map(([name, value], i) => ({ name, value, color: QUAL_COLORS[i % QUAL_COLORS.length] }));
  const legend = [
    ...slices,
    ...breakdown.filter(([, v]) => v < 0).map(([name, value]) => ({ name: `${name} (refund)`, value, color: 'transparent' })),
  ];
  // off-budget transactions have no categories in Actual
  const breakdownBy = scope === 'onbudget' ? 'category' : 'payee';

  return (
    <div className="page" data-screen-label="Dashboard">
      <div style={{ display: 'flex', alignItems: 'center', marginLeft: 20, gap: 20 }}>
        <div style={{ fontSize: 25, fontWeight: 500 }}>Dashboard</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn-bare" title="Previous month (←)" onClick={() => setMonth(addMonth(month, -1))}>‹</button>
          <div
            style={{ minWidth: 110, textAlign: 'center', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
            title="Current month (0)"
            onClick={() => setMonth(currentMonth())}
          >
            {monthName(month)}
          </div>
          <button className="btn-bare" title="Next month (→)" onClick={() => setMonth(addMonth(month, 1))}>›</button>
        </div>
        <ScopeSwitch />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: 20 }}>
        <div className="card" style={{ flex: 1, minWidth: 180, padding: 20 }}>
          <div className="card-title">Income</div>
          <div className="card-subtitle">{monthName(month)}</div>
          <div className="tnum pf" style={{ fontSize: 22, fontWeight: 500, marginTop: 12, color: 'var(--color-noticeTextLight)' }}>
            {formatAmount(mt.income)}
          </div>
          <ChangePill delta={mt.income - pm.income} />
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180, padding: 20 }}>
          <div className="card-title">Expenses</div>
          <div className="card-subtitle">{monthName(month)}</div>
          <div className="tnum pf" style={{ fontSize: 22, fontWeight: 500, marginTop: 12, color: 'var(--color-errorText)' }}>
            {formatAmount(mt.expense)}
          </div>
          <ChangePill delta={mt.expense - pm.expense} invert />
        </div>
        <div className="card" style={{ flex: 1, minWidth: 180, padding: 20 }}>
          <div className="card-title">Net</div>
          <div className="card-subtitle">{monthName(month)}</div>
          <div className="tnum pf" style={{ fontSize: 22, fontWeight: 500, marginTop: 12, color: net >= 0 ? 'var(--color-noticeTextLight)' : 'var(--color-errorText)' }}>
            {formatAmount(net)}
          </div>
          <div style={{ marginTop: 8, color: 'var(--color-pageTextSubdued)' }}>income − expenses</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: '0 20px 20px', alignItems: 'stretch' }}>
        <div className="card" style={{ flex: 2, minWidth: 420, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', padding: 20, paddingBottom: 0 }}>
            <div style={{ flex: 1 }}>
              <div className="card-title">Cash Flow</div>
              <div className="card-subtitle">{monthName(addMonth(month, -5))} – {monthName(month)}</div>
            </div>
            <Legend />
          </div>
          <div style={{ padding: '10px 20px 16px' }}>
            <CashFlowChart data={cashFlow} height={200} />
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 20, paddingBottom: 0 }}>
            <div className="card-title">Spending by {breakdownBy}</div>
            <div className="card-subtitle">{monthName(month)}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px 16px' }}>
            <Donut slices={slices} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              {legend.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{d.name}</span>
                  <span className="tnum pf" style={{ color: 'var(--color-pageTextLight)' }}>{formatAmount(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
