import React, { useState } from 'react';
import { PAGES } from '../constants';
import Paywall from './Paywall';

const NAV_TABS = [
  { id: PAGES.HOME,           label: 'Home' },
  { id: PAGES.CV_OPTIMIZER,   label: 'Optimize CV' },
  { id: PAGES.COVER_LETTER,   label: 'Cover Letter' },
  { id: PAGES.INTERVIEW_PREP, label: 'Interview Prep' },
  { id: PAGES.CV_BUILDER,     label: 'Build CV' },
  { id: PAGES.DASHBOARD,      label: 'Dashboard' },
  { id: PAGES.FAQ,            label: 'FAQ' },
];

export default function TopNav({ activePage, onNavigate, unlocked, onUnlock }) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [lang, setLang] = useState('EN');

  return (
    <>
      <nav className="topnav">
        {/* Left — Brand */}
        <div
          className="topnav-brand"
          onClick={() => onNavigate(PAGES.HOME)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onNavigate(PAGES.HOME)}
        >
          <div className="topnav-logo">S</div>
          <span className="topnav-brand-name">
            Smart <span className="topnav-ai">AI</span> Systems
          </span>
        </div>

        {/* Center — Tab navigation */}
        <div className="topnav-tabs">
          {NAV_TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`topnav-tab${activePage === id ? ' active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right — Controls */}
        <div className="topnav-controls">
          <div className="topnav-lang-toggle">
            {['EN', 'DE'].map(l => (
              <button
                key={l}
                className={`topnav-lang-btn${lang === l ? ' active' : ''}`}
                onClick={() => setLang(l)}
              >
                {l}
              </button>
            ))}
          </div>

          {!unlocked ? (
            <button
              className="topnav-unlock-btn"
              onClick={() => setShowPaywall(true)}
            >
              <span className="topnav-status-dot" />
              Unlock Access
            </button>
          ) : (
            <div className="topnav-unlocked-badge">
              <span className="topnav-status-dot" />
              Unlocked
            </div>
          )}
        </div>
      </nav>

      {showPaywall && (
        <Paywall
          onUnlock={() => { onUnlock(); setShowPaywall(false); }}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </>
  );
}
