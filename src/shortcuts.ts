export interface ShortcutDef {
  id: string;
  shortcut: string;
  description: string;
  meta?: boolean;
  shift?: boolean;
}

export interface ShortcutGroup {
  id: string;
  name: string;
  items: ShortcutDef[];
}

export const IS_MAC = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
export const META_KEY = IS_MAC ? '⌘' : 'Ctrl';

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: 'global',
    name: 'Global',
    items: [
      { id: 'help', shortcut: '?', description: 'Open the keyboard shortcuts menu' },
      { id: 'palette', shortcut: 'K', meta: true, description: 'Open the Command Palette' },
      { id: 'privacy', shortcut: 'P', meta: true, shift: true, description: 'Toggle the privacy filter' },
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    items: [
      { id: 'cur-month', shortcut: '0', description: 'View current month' },
      { id: 'prev-month', shortcut: '←', description: 'View previous month' },
      { id: 'next-month', shortcut: '→', description: 'View next month' },
    ],
  },
  {
    id: 'account-general',
    name: 'Account page general',
    items: [
      { id: 'filter', shortcut: 'F', description: 'Show filter dropdown when no transactions are selected' },
      { id: 'search', shortcut: 'F', meta: true, description: 'Focus the search box' },
    ],
  },
  {
    id: 'selection',
    name: 'Transaction selection',
    items: [
      { id: 'select-all', shortcut: 'A', meta: true, description: 'Select all transactions' },
      { id: 'toggle-sel', shortcut: 'Space', description: 'Toggle selection of current transaction' },
      { id: 'range-sel', shortcut: 'Space', shift: true, description: 'Toggle transactions between current and most recently selected transaction' },
      { id: 'down', shortcut: 'J', description: 'Move down to the next transaction' },
      { id: 'down-arrow', shortcut: '↓', description: 'Move down to the next transaction' },
      { id: 'up', shortcut: 'K', description: 'Move up to the previous transaction' },
      { id: 'up-arrow', shortcut: '↑', description: 'Move up to the previous transaction' },
    ],
  },
];
