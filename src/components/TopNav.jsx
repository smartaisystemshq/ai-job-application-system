import React, { useState } from 'react';
import { PAGES } from '../constants';
import Paywall from './Paywall';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

const NAV_TABS = [
  { id: PAGES.HOME,           labelKey: 'nav_home' },
  { id: PAGES.CV_OPTIMIZER,   labelKey: 'nav_cv' },
  { id: PAGES.COVER_LETTER,   labelKey: 'nav_cover' },
  { id: PAGES.INTERVIEW_PREP, labelKey: 'nav_interview' },
  { id: PAGES.CV_BUILDER,     labelKey: 'nav_builder' },
  { id: PAGES.DASHBOARD,      labelKey: 'nav_dashboard' },
  { id: PAGES.FAQ,            labelKey: 'nav_faq' },
];

export default function TopNav({ activePage, onNavigate, unlocked, onUnlock }) {
  const [showPaywall, setShowPaywall] = useState(false);
  const { lang, setLang } = useLang();

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
          <div className="topnav-logo">
            <img src="/logo.png" alt="Smart AI Systems" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
          </div>
          <span className="topnav-brand-name">
            Smart <span className="topnav-ai">AI</span> Systems
          </span>
        </div>

        {/* Center — Tab navigation */}
        <div className="topnav-tabs">
          {NAV_TABS.map(({ id, labelKey }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`topnav-tab${activePage === id ? ' active' : ''}`}
            >
              {t[lang][labelKey]}
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
              {t[lang].nav_unlock}
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
