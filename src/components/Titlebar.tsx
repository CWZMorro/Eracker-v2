import { useState } from 'react';
import { useStore } from './../store';
import { Eye, EyeHide, Refresh, Help } from './../icons';

export function Titlebar() {
  const privacy = useStore(s => s.privacy);
  const togglePrivacy = useStore(s => s.togglePrivacy);
  const setModal = useStore(s => s.setModal);
  const toast = useStore(s => s.toast);
  const load = useStore(s => s.load);
  const syncing = useStore(s => s.loading);
  const [helpOpen, setHelpOpen] = useState(false);

  const sync = () => {
    load(true).then(() => toast('Up to date with the server'), err => toast(`Refresh failed: ${err.message}`));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px 0 15px', height: 36, flexShrink: 0 }}>
      <div style={{ flex: 1 }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn-bare" title="Toggle the privacy filter" onClick={togglePrivacy}>
          {privacy ? <EyeHide /> : <Eye />}
        </button>
        <button className="btn-bare" title="Refresh data from the server" onClick={sync}>
          <Refresh className={syncing ? 'spinning' : undefined} />
        </button>
        <button className="btn-bare" onClick={() => setHelpOpen(v => !v)}>
          <Help />
          <span>Help</span>
        </button>
        {helpOpen && (
          <div className="menu" style={{ top: 34, right: 0 }} onMouseLeave={() => setHelpOpen(false)}>
            <div className="menu-item" onClick={() => { setHelpOpen(false); setModal({ name: 'shortcuts' }); }}>
              <span>Keyboard shortcuts</span>
              <span className="key">?</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
