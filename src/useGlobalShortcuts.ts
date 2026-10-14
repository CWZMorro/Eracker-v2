import { useEffect } from 'react';
import { useStore, filteredTxns } from './store';
import { addMonth, currentMonth } from './lib';

/** Global keyboard shortcuts (read-only app: navigation, selection, search). */
export function useGlobalShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const tag = (e.target as HTMLElement)?.tagName?.toUpperCase();
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      const meta = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        if (s.modal) { s.setModal(null); return; }
        if (s.selection.length) { s.setSelection([]); return; }
        if (s.search) { s.setSearch(''); return; }
        return;
      }

      // global
      if (meta && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        s.setModal({ name: 'palette' });
        return;
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        s.togglePrivacy();
        return;
      }

      if (s.modal) return; // modal-local keys are handled by the modal components

      if (!typing && e.key === '?') {
        e.preventDefault();
        s.setModal({ name: 'shortcuts' });
        return;
      }

      const isAccount = s.route.name === 'account';
      const isDashboard = s.route.name === 'dashboard';

      if (isDashboard && !typing) {
        if (e.key === 'ArrowLeft') { s.setMonth(addMonth(s.month, -1)); return; }
        if (e.key === 'ArrowRight') { s.setMonth(addMonth(s.month, 1)); return; }
        if (e.key === '0') { s.setMonth(currentMonth()); return; }
      }

      if (!isAccount) return;

      if (meta && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const el = document.getElementById('search-input') as HTMLInputElement | null;
        if (el) document.activeElement === el ? el.blur() : el.focus();
        return;
      }
      if (meta && e.key.toLowerCase() === 'a' && !typing) {
        e.preventDefault();
        s.setSelection(filteredTxns(s).map(t => t.id));
        return;
      }

      if (typing) return;

      const rows = filteredTxns(s);
      const idx = s.cursor ? rows.findIndex(t => t.id === s.cursor) : -1;
      const toggleSel = (id: string, range: boolean) => {
        let sel = [...s.selection];
        if (range && s.cursor) {
          const ids = rows.map(t => t.id);
          const a = ids.indexOf(s.cursor), b = ids.indexOf(id);
          if (a >= 0 && b >= 0) {
            const [lo, hi] = a < b ? [a, b] : [b, a];
            for (let i = lo; i <= hi; i++) if (!sel.includes(ids[i])) sel.push(ids[i]);
            s.setSelection(sel);
            s.setCursor(id);
            return;
          }
        }
        sel = sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id];
        s.setSelection(sel);
        s.setCursor(id);
      };

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          // Opens the filter dropdown — AccountHeader listens for this event.
          window.dispatchEvent(new CustomEvent('eracker:toggle-filter'));
          return;
        case 'j':
        case 'arrowdown': {
          e.preventDefault();
          const next = rows[Math.min(rows.length - 1, idx + 1)];
          if (next) s.setCursor(next.id);
          return;
        }
        case 'k':
        case 'arrowup': {
          e.preventDefault();
          const prev = rows[idx < 0 ? 0 : Math.max(0, idx - 1)];
          if (prev) s.setCursor(prev.id);
          return;
        }
        case ' ':
          e.preventDefault();
          if (s.cursor) toggleSel(s.cursor, e.shiftKey);
          return;
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
