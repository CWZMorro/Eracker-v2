export type Theme = 'light' | 'dark' | 'midnight';
export type DateFormat = 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';

export interface Account {
  id: string;
  name: string;
  off: boolean;
  closed: boolean;
}

export interface Category {
  id: string;
  name: string;
  group: string;
  isIncome: boolean;
}

export interface Transaction {
  id: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  account: string;
  payee: string;
  notes: string;
  /** category name, '' when none (transfers, off-budget accounts) */
  category: string;
  /** integer cents; negative = payment, positive = deposit */
  amount: number;
  cleared: boolean;
  /** the other account of a transfer, null for everything else */
  transferAccount: string | null;
}

/** Read-only budget snapshot served by the Eracker server (server/server.mjs). */
export interface Snapshot {
  accounts: Account[];
  categories: Category[];
  txns: Transaction[];
  updatedAt: string;
}

/** Which accounts the dashboard and reports cover: 'onbudget', 'offbudget', or one account's id. */
export type Scope = string;

export type Route =
  | { name: 'dashboard' }
  | { name: 'reports' }
  | { name: 'settings' }
  | { name: 'account'; id: string | null }; // null = all, 'onbudget' | 'offbudget' = groups

export type SortField = 'date' | 'payee' | 'category' | 'payment' | 'deposit';

export type Modal =
  | { name: 'shortcuts' }
  | { name: 'palette' }
  | null;

export interface Toast {
  id: number;
  msg: string;
}
