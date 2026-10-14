import { useStore, activeScope, scopeOptions } from './../store';
import type { Scope } from './../types';

/** The scope the dashboard and reports show. */
export function useScope(): Scope {
  const accounts = useStore(s => s.accounts);
  const separate = useStore(s => s.separateOffBudget);
  const scope = useStore(s => s.scope);
  return activeScope(accounts, separate, scope);
}

/** Switches the dashboard and reports between on-budget and off-budget accounts. */
export function ScopeSwitch() {
  const accounts = useStore(s => s.accounts);
  const separate = useStore(s => s.separateOffBudget);
  const setScope = useStore(s => s.setScope);
  const scope = useScope();
  const options = scopeOptions(accounts, separate);
  if (options.length < 2) return null;

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button
          key={o.value}
          className={`btn-normal${scope === o.value ? ' selected' : ''}`}
          onClick={() => setScope(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
