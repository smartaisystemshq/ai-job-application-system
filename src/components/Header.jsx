import React, { useState } from 'react';
import { PAGES } from '../App';

const NAV_ITEMS = [
  { id: PAGES.DASHBOARD, label: 'Dashboard', icon: '▦' },
  { id: PAGES.CV_OPTIMIZER, label: 'CV Optimizer', icon: '✦' },
  { id: PAGES.COVER_LETTER, label: 'Cover Letter', icon: '✉' },
  { id: PAGES.INTERVIEW_PREP, label: 'Interview Prep', icon: '◈' },
];

export default function Header({ activePage, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 32,
            height: 32,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: 'white',
          }}>S</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>Smart AI Systems</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2 }}>Job Application System</div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 4 }} className="desktop-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activePage === item.id ? 'var(--accent-dim)' : 'transparent',
                color: activePage === item.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: activePage === item.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all var(--transition)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (activePage !== item.id) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }
              }}
              onMouseLeave={e => {
                if (activePage !== item.id) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 12 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: 22,
            cursor: 'pointer',
            padding: 4,
          }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          padding: '8px 16px 16px',
        }} className="mobile-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activePage === item.id ? 'var(--accent-dim)' : 'transparent',
                color: activePage === item.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: activePage === item.id ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: 2,
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
