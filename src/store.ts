import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Account, Category, DateFormat, Modal, Route, Scope, Snapshot, SortField, Theme, Toast, Transaction,
} from './types';
import { currentMonth } from './lib';

interface ErackerState {
  // budget data from the server (read-only)
  accounts: Account[];
  txns: Transaction[];
  categories: Category[];
  updatedAt: string | null;
  loading: boolean;
  error: string | null;

  // persisted preferences
  theme: Theme;
  privacy: boolean;
  dateFormat: DateFormat;
  showBalanceCol: boolean;
  showClearedCol: boolean;
  /** show each off-budget account on its own instead of adding them together */
  separateOffBudget: boolean;
  scope: Scope;

  // ui state (not persisted)
  route: Route;
  month: string;
  search: string;
  filterCat: string | null;
  filterUncleared: boolean;
  sortField: SortField;
  sortAsc: boolean;
  selection: string[];
  cursor: string | null;
  modal: Modal;
  toasts: Toast[];

  // actions
  load: (refresh?: boolean) => Promise<void>;
  navigate: (route: Route) => void;
  setTheme: (t: Theme) => void;
  togglePrivacy: () => void;
  setDateFormat: (f: DateFormat) => void;
  setScope: (s: Scope) => void;
  toggleSeparateOffBudget: () => void;
  setMonth: (m: string) => void;
  setSearch: (q: string) => void;
  setFilterCat: (c: string | null) => void;
  toggleFilterUncleared: () => void;
  clearFilters: () => void;
  setSort: (f: SortField) => void;
  setSelection: (ids: string[]) => void;
  setCursor: (id: string | null) => void;
  toggleBalanceCol: () => void;
  toggleClearedCol: () => void;
  setModal: (m: Modal) => void;
  toast: (msg: string) => void;
}

let toastId = 0;

export const useStore = create<ErackerState>()(
  persist(
    set => ({
      accounts: [],
      txns: [],
      categories: [],
      updatedAt: null,
      loading: false,
      error: null,

      theme: 'dark',
      privacy: false,
      dateFormat: 'MM/dd/yyyy',
      showBalanceCol: true,
      showClearedCol: true,
      separateOffBudget: true,
      scope: 'onbudget',

      route: { name: 'dashboard' },
      month: currentMonth(),
      search: '',
      filterCat: null,
      filterUncleared: false,
      sortField: 'date',
      sortAsc: false,
      selection: [],
      cursor: null,
      modal: null,
      toasts: [],

      load: async refresh => {
        set({ loading: true });
        try {
          const res = await fetch(`api/data${refresh ? '?refresh=1' : ''}`);
          if (!res.ok) throw new Error(`server answered ${res.status}`);
          const data: Snapshot = await res.json();
          set({ ...data, error: null });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : String(err) });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      navigate: route =>
        set({
          route, selection: [], cursor: null,
          search: '', filterCat: null, filterUncleared: false,
        }),
      setTheme: theme => set({ theme }),
      togglePrivacy: () => set(s => ({ privacy: !s.privacy })),
      setDateFormat: dateFormat => set({ dateFormat }),
      setScope: scope => set({ scope }),
      toggleSeparateOffBudget: () => set(s => ({ separateOffBudget: !s.separateOffBudget })),
      setMonth: month => set({ month }),
      setSearch: search => set({ search }),
      setFilterCat: filterCat => set({ filterCat }),
      toggleFilterUncleared: () => set(s => ({ filterUncleared: !s.filterUncleared })),
      clearFilters: () => set({ filterCat: null, filterUncleared: false, search: '' }),
      setSort: f =>
        set(s => ({
          sortField: f,
          sortAsc: s.sortField === f ? !s.sortAsc : f === 'payee' || f === 'category',
        })),
      setSelection: selection => set({ selection }),
      setCursor: cursor => set({ cursor }),
      toggleBalanceCol: () => set(s => ({ showBalanceCol: !s.showBalanceCol })),
      toggleClearedCol: () => set(s => ({ showClearedCol: !s.showClearedCol })),
      setModal: modal => set({ modal }),
      toast: msg => {
        const id = ++toastId;
        set(s => ({ toasts: [...s.toasts, { id, msg }] }));
        setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 2600);
      },
    }),
    {
      name: 'eracker',
      version: 1,
      // v0 stored light as the default theme; dark is the default now
      migrate: (persisted, version) => {
        const p = persisted as Partial<ErackerState>;
        return (version < 1 ? { ...p, theme: 'dark' } : p) as ErackerState;
      },
      partialize: s => ({
        theme: s.theme,
        privacy: s.privacy,
        dateFormat: s.dateFormat,
        showBalanceCol: s.showBalanceCol,
        showClearedCol: s.showClearedCol,
        separateOffBudget: s.separateOffBudget,
        scope: s.scope,
      }),
    },
  ),
);

// ---------- derived selectors ----------

type BudgetData = Pick<ErackerState, 'accounts' | 'txns' | 'categories'>;

export function accountIdsForRoute(route: Route, accounts: Account[]): string[] {
  if (route.name !== 'account') return [];
  if (route.id === null) return accounts.map(a => a.id);
  if (route.id === 'onbudget') return accounts.filter(a => !a.off).map(a => a.id);
  if (route.id === 'offbudget') return accounts.filter(a => a.off).map(a => a.id);
  return [route.id];
}

export function accountBalance(txns: Transaction[], id: string): number {
  return txns.reduce((acc, t) => (t.account === id ? acc + t.amount : acc), 0);
}

export function scopeAccountIds(accounts: Account[], scope: Scope): Set<string> {
  if (scope === 'onbudget') return new Set(accounts.filter(a => !a.off).map(a => a.id));
  if (scope === 'offbudget') return new Set(accounts.filter(a => a.off).map(a => a.id));
  return new Set([scope]);
}

/** Scopes to choose from: on budget, then off budget as one group or one per account. */
export function scopeOptions(accounts: Account[], separateOffBudget: boolean): Array<{ value: Scope; label: string }> {
  const offBudget = accounts.filter(a => a.off && !a.closed);
  if (offBudget.length === 0) return [{ value: 'onbudget', label: 'On budget' }];
  return [
    { value: 'onbudget', label: 'On budget' },
    ...(separateOffBudget
      ? offBudget.map(a => ({ value: a.id, label: a.name }))
      : [{ value: 'offbudget', label: 'Off budget' }]),
  ];
}

/** The chosen scope, or the closest valid one after the accounts or the setting changed. */
export function activeScope(accounts: Account[], separateOffBudget: boolean, scope: Scope): Scope {
  const options = scopeOptions(accounts, separateOffBudget);
  if (options.some(o => o.value === scope)) return scope;
  // stay on the off-budget side when switching between combined and separate
  return scope !== 'onbudget' && options.length > 1 ? options[1].value : 'onbudget';
}

/**
 * Whether an account group's total is meaningful. With separate off-budget accounts, their
 * balances are never added to each other or to the on-budget ones.
 */
export function showsGroupTotal(group: string | null, accounts: Account[], separateOffBudget: boolean): boolean {
  if (!separateOffBudget || group === 'onbudget') return true;
  const offBudget = accounts.filter(a => a.off).length;
  if (group === 'offbudget') return offBudget <= 1;
  return group !== null || offBudget === 0;
}

export function filteredTxns(s: {
  txns: Transaction[]; accounts: Account[]; route: Route;
  search: string; filterCat: string | null; filterUncleared: boolean;
  sortField: SortField; sortAsc: boolean;
}): Transaction[] {
  const ids = accountIdsForRoute(s.route, s.accounts);
  let list = s.txns.filter(t => ids.includes(t.account));
  if (s.search) {
    const q = s.search.toLowerCase();
    list = list.filter(t =>
      `${t.payee} ${t.notes} ${t.category} ${(t.amount / 100).toFixed(2)}`.toLowerCase().includes(q),
    );
  }
  if (s.filterCat) list = list.filter(t => t.category === s.filterCat);
  if (s.filterUncleared) list = list.filter(t => !t.cleared);

  const dir = s.sortAsc ? 1 : -1;
  const f = s.sortField;
  const key = (t: Transaction): string | number => {
    if (f === 'payment') return t.amount < 0 ? -t.amount : -1;
    if (f === 'deposit') return t.amount > 0 ? t.amount : -1;
    return t[f];
  };
  return [...list].sort((a, b) => {
    const va = key(a), vb = key(b);
    if (va < vb) return -dir;
    if (va > vb) return dir;
    return (a.id < b.id ? -1 : 1) * dir;
  });
}

/**
 * Splits a month's money in a scope into income and spending. Money moving between two
 * accounts of the same scope is neither. A categorized transaction counts by its category
 * (so refunds reduce spending); one without a category (off-budget) counts by its sign.
 */
function monthFlows(data: BudgetData, month: string, scope: Scope) {
  const ids = scopeAccountIds(data.accounts, scope);
  const incomeCats = new Set(data.categories.filter(c => c.isIncome).map(c => c.name));
  const income: Transaction[] = [];
  const spending: Transaction[] = [];
  for (const t of data.txns) {
    if (!ids.has(t.account) || !t.date.startsWith(month)) continue;
    if (t.transferAccount && ids.has(t.transferAccount)) continue;
    const isIncome = t.category ? incomeCats.has(t.category) : t.amount > 0;
    (isIncome ? income : spending).push(t);
  }
  return { income, spending };
}

export function monthTotals(data: BudgetData, month: string, scope: Scope) {
  const { income, spending } = monthFlows(data, month, scope);
  return {
    income: income.reduce((acc, t) => acc + t.amount, 0),
    expense: spending.reduce((acc, t) => acc - t.amount, 0),
  };
}

/** Spending per category (per payee when there are no categories), largest first. */
export function spendingBreakdown(data: BudgetData, month: string, scope: Scope): Array<[string, number]> {
  const totals: Record<string, number> = {};
  for (const t of monthFlows(data, month, scope).spending) {
    const key = t.category || t.payee || 'Uncategorized';
    totals[key] = (totals[key] ?? 0) - t.amount;
  }
  return Object.entries(totals).filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]);
}

/** Total balance of the scope's accounts at the end of a month. */
export function scopeBalance(data: BudgetData, month: string, scope: Scope): number {
  const ids = scopeAccountIds(data.accounts, scope);
  const end = `${month}-31`;
  return data.txns.reduce((acc, t) => (ids.has(t.account) && t.date <= end ? acc + t.amount : acc), 0);
}
