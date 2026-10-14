import type { Account, DateFormat, Transaction } from './types';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonth(m: string, delta: number): string {
  let [y, mo] = m.split('-').map(Number);
  mo += delta;
  while (mo < 1) { mo += 12; y--; }
  while (mo > 12) { mo -= 12; y++; }
  return `${y}-${String(mo).padStart(2, '0')}`;
}

export function monthName(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  return `${MONTHS[mo - 1]} ${y}`;
}

export function monthShort(m: string): string {
  const [, mo] = m.split('-').map(Number);
  return MONTHS[mo - 1].slice(0, 3);
}

export function formatAmount(cents: number, symbol = ''): string {
  const neg = cents < 0;
  const s = (Math.abs(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${neg ? '-' : ''}${symbol}${s}`;
}

export function formatDate(iso: string, format: DateFormat): string {
  const [y, m, d] = iso.split('-');
  if (format === 'yyyy-MM-dd') return iso;
  if (format === 'dd/MM/yyyy') return `${d}/${m}/${y}`;
  return `${m}/${d}/${y}`;
}

export function exportCsv(txns: Transaction[], accounts: Account[]) {
  const byId = Object.fromEntries(accounts.map(a => [a.id, a.name]));
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  const head = 'date,account,payee,notes,category,amount,cleared\n';
  const body = txns
    .map(t =>
      [t.date, byId[t.account] ?? t.account, t.payee, t.notes, t.category, (t.amount / 100).toFixed(2), t.cleared]
        .map(esc)
        .join(','),
    )
    .join('\n');
  const blob = new Blob([head + body], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'eracker-export.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
