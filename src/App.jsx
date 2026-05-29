import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import WaveBackground from './components/WaveBackground';
import Dashboard from './components/Dashboard';
import CVOptimizer from './components/CVOptimizer';
import CoverLetterGenerator from './components/CoverLetterGenerator';
import InterviewPrep from './components/InterviewPrep';
import CVBuilder from './components/CVBuilder';
import HelpInfo from './components/HelpInfo';
import { PAGES } from './constants';
import { isUnlocked } from './utils/accessControl';

export default function App() {
  const [activePage, setActivePage] = useState(PAGES.DASHBOARD);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const handleUnlock = () => setUnlocked(true);

  const navigate = (page) => {
    if (page === activePage) return;
    setActivePage(page);
    setPageKey(k => k + 1);
    setMobileSidebarOpen(false);
  };

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('sr-visible');
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    const refresh = () => {
      document.querySelectorAll('.scroll-reveal:not(.sr-visible)').forEach(el => observer.observe(el));
    };
    refresh();
    const mo = new MutationObserver(refresh);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); mo.disconnect(); };
  }, [activePage]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <WaveBackground />

      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
        />
      )}

      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        mobileOpen={mobileSidebarOpen}
        unlocked={unlocked}
        onUnlock={handleUnlock}
      />

      <div className={`main-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="hamburger-btn"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Smart AI Systems" style={{ height: 28, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Smart AI Systems</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div key={pageKey} className="page-transition">
            {activePage === PAGES.DASHBOARD    && <Dashboard />}
            {activePage === PAGES.CV_OPTIMIZER && <CVOptimizer unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.COVER_LETTER && <CoverLetterGenerator unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.INTERVIEW_PREP && <InterviewPrep unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.CV_BUILDER   && <CVBuilder unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.HELP_INFO    && <HelpInfo />}
          </div>
        </main>

        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-muted)',
          position: 'relative',
          zIndex: 1,
        }}>
          © {new Date().getFullYear()} Smart AI Systems · AI Job Application System
        </footer>
      </div>
    </div>
  );
}
