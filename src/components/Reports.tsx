import { useStore, monthTotals, scopeBalance } from './../store';
import { addMonth, currentMonth, formatAmount, monthName, monthShort } from './../lib';
import { AreaChart, CashFlowChart, Legend } from './Charts';
import { ScopeSwitch, useScope } from './ScopeSwitch';

export function Reports() {
  const accounts = useStore(s => s.accounts);
  const txns = useStore(s => s.txns);
  const categories = useStore(s => s.categories);
  const scope = useScope();

  const data = { accounts, txns, categories };
  const months = Array.from({ length: 12 }, (_, i) => addMonth(currentMonth(), i - 11));

  const cashFlow = months.map(m => ({ label: monthShort(m), ...monthTotals(data, m, scope) }));
  const balances = months.map(m => ({ label: monthShort(m), value: scopeBalance(data, m, scope) }));
  const balance = balances[balances.length - 1].value;
  const balanceChange = balance - balances[0].value;

  const summary = [...months].reverse()
    .map(m => ({ m, ...monthTotals(data, m, scope) }))
    .filter(x => x.income || x.expense);

  const range = `${monthName(months[0])} – ${monthName(months[11])}`;

  return (
    <div className="page" data-screen-label="Reports">
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div className="page-title">Reports</div>
        <ScopeSwitch />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, padding: 20 }}>
        <div className="card" style={{ flex: 1, minWidth: 420, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', padding: 20, paddingBottom: 0 }}>
            <div style={{ flex: 1 }}>
              <div className="card-title">Balance</div>
              <div className="card-subtitle">{range}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="tnum pf" style={{ fontSize: 15, fontWeight: 500, marginBottom: 5 }}>{formatAmount(balance)}</div>
              <span className={`pill tnum pf ${balanceChange >= 0 ? 'good' : 'bad'}`}>
                {balanceChange >= 0 ? '+' : ''}{formatAmount(balanceChange)}
              </span>
            </div>
          </div>
          <div style={{ padding: '10px 20px 16px' }}>
            <AreaChart data={balances} height={180} />
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 420, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', padding: 20, paddingBottom: 0 }}>
            <div style={{ flex: 1 }}>
              <div className="card-title">Cash Flow</div>
              <div className="card-subtitle">{range}</div>
            </div>
            <Legend />
          </div>
          <div style={{ padding: '10px 20px 16px' }}>
            <CashFlowChart data={cashFlow} height={180} />
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 640 }}>
          <div style={{ padding: '20px 20px 10px' }}>
            <div className="card-title">Monthly summary</div>
            <div className="card-subtitle">{range}</div>
          </div>
          <div
            style={{
              display: 'flex', height: 32, alignItems: 'center', fontWeight: 300,
              color: 'var(--color-tableHeaderText)',
              borderTop: '1px solid var(--color-tableBorder)',
              borderBottom: '1px solid var(--color-tableBorder)',
              padding: '0 20px',
            }}
          >
            <div style={{ flex: 1 }}>Month</div>
            <div style={{ width: 120, textAlign: 'right' }}>Income</div>
            <div style={{ width: 120, textAlign: 'right' }}>Expenses</div>
            <div style={{ width: 120, textAlign: 'right' }}>Net</div>
          </div>
          {summary.map(x => {
            const net = x.income - x.expense;
            return (
              <div
                key={x.m}
                className="register-row"
                style={{ padding: '0 20px', alignItems: 'center', border: 0, borderBottom: '1px solid var(--color-tableBorder)' }}
              >
                <div style={{ flex: 1 }}>{monthName(x.m)}</div>
                <div className="tnum pf" style={{ width: 120, textAlign: 'right' }}>{formatAmount(x.income)}</div>
                <div className="tnum pf" style={{ width: 120, textAlign: 'right' }}>{formatAmount(x.expense)}</div>
                <div className="tnum pf" style={{ width: 120, textAlign: 'right', color: net >= 0 ? 'var(--color-noticeTextLight)' : 'var(--color-errorText)' }}>
                  {formatAmount(net)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
