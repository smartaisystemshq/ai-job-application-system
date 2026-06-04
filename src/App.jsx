import React, { useState, useEffect } from 'react';
import TopNav from './components/TopNav';
import WaveBackground from './components/WaveBackground';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import CVOptimizer from './components/CVOptimizer';
import CoverLetterGenerator from './components/CoverLetterGenerator';
import InterviewPrep from './components/InterviewPrep';
import CVBuilder from './components/CVBuilder';
import FAQ from './components/FAQ';
import { PAGES } from './constants';
import { isUnlocked } from './utils/accessControl';

export default function App() {
  const [activePage, setActivePage] = useState(PAGES.HOME);
  const [pageKey, setPageKey] = useState(0);
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const handleUnlock = () => setUnlocked(true);

  const navigate = (page) => {
    if (page === activePage) return;
    setActivePage(page);
    setPageKey(k => k + 1);
  };

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('sr-visible');
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

      <TopNav
        activePage={activePage}
        onNavigate={navigate}
        unlocked={unlocked}
        onUnlock={handleUnlock}
      />

      <div className="main-wrapper">
        <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div key={pageKey} className="page-transition">
            {activePage === PAGES.HOME          && <Home />}
            {activePage === PAGES.DASHBOARD     && <Dashboard />}
            {activePage === PAGES.CV_OPTIMIZER  && <CVOptimizer unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.COVER_LETTER  && <CoverLetterGenerator unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.INTERVIEW_PREP && <InterviewPrep unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.CV_BUILDER    && <CVBuilder unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.FAQ           && <FAQ />}
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
