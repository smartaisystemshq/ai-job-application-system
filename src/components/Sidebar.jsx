import React, { useState } from 'react';
import { PAGES } from '../constants';
import { unlockApp } from '../utils/accessControl';

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}

function CVIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="16" y2="17"/>
      <line x1="8" y1="9" x2="10" y2="9"/>
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function ChevronIcon({ collapsed }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', flexShrink: 0 }}
    >
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { id: PAGES.DASHBOARD,     label: 'Dashboard',     description: 'Track all your applications',   Icon: DashboardIcon },
  { id: PAGES.CV_OPTIMIZER,  label: 'CV Optimizer',  description: 'Tailor your CV for each role',   Icon: CVIcon },
  { id: PAGES.COVER_LETTER,  label: 'Cover Letter',  description: 'Write compelling cover letters', Icon: EnvelopeIcon },
  { id: PAGES.INTERVIEW_PREP, label: 'Interview Prep', description: 'Prepare for your interviews', Icon: ChatIcon },
  { id: PAGES.CV_BUILDER,    label: 'CV Builder',    description: 'Build a CV from scratch',        Icon: PencilIcon },
  { id: PAGES.HELP_INFO,     label: 'Help & Info',   description: 'FAQ and contact support',        Icon: HelpIcon },
];

function SidebarUnlock({ onUnlock }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const valid = await unlockApp(code.trim());
      if (valid) {
        onUnlock?.();
        setOpen(false);
        setCode('');
      } else {
        setError('Invalid code.');
      }
    } catch {
      setError('Error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
      <button
        onClick={() => { setOpen(o => !o); setError(''); }}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--accent)', fontSize: 12, fontWeight: 600, textAlign: 'left',
          padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
        }}
        title="Enter access code"
      >
        <span style={{ fontSize: 14 }}>🔓</span>
        <span>Enter Access Code</span>
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            className="input"
            placeholder="Access code..."
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleUnlock()}
            disabled={loading}
            style={{ fontSize: 13, padding: '6px 10px' }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleUnlock}
            disabled={loading || !code.trim()}
          >
            {loading ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: 'white' }} /> : 'Unlock'}
          </button>
          {error && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse, mobileOpen, unlocked, onUnlock }) {
  return (
    <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' sidebar-mobile-open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <img
          src="/logo.png"
          alt="Smart AI Systems"
          style={{ height: 44, width: 44, objectFit: 'contain', flexShrink: 0 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>Smart AI Systems</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2, whiteSpace: 'nowrap', marginTop: 2 }}>Job Application System</div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 10px', overflow: 'hidden auto' }}>
        {NAV_ITEMS.map(({ id, label, description, Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`sidebar-nav-item${isActive ? ' active' : ''}${collapsed ? ' collapsed' : ''}`}
            >
              <span style={{ flexShrink: 0, display: 'flex' }}><Icon /></span>
              {!collapsed && (
                <div>
                  <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, lineHeight: 1.3 }}>{label}</div>
                  <div style={{ fontSize: 12, color: isActive ? 'rgba(29,158,117,0.7)' : 'var(--text-muted)', lineHeight: 1.3, marginTop: 2 }}>{description}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Unlock section — visible only when collapsed is false and not yet unlocked */}
      {!collapsed && !unlocked && (
        <SidebarUnlock onUnlock={onUnlock} />
      )}

      {/* Collapse toggle */}
      <div style={{ padding: '10px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`sidebar-collapse-btn${collapsed ? ' collapsed' : ''}`}
        >
          <ChevronIcon collapsed={collapsed} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
