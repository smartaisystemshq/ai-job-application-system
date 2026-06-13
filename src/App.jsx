import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import TopNav from './components/TopNav';
import WaveBackground from './components/WaveBackground';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import CVOptimizer from './components/CVOptimizer';
import CoverLetterGenerator from './components/CoverLetterGenerator';
import InterviewPrep from './components/InterviewPrep';
import CVBuilder from './components/CVBuilder';
import FAQ from './components/FAQ';
import Legal from './components/Legal';
import { PAGES } from './constants';
import { isUnlocked } from './utils/accessControl';

export default function App() {
  const [activePage, setActivePage] = useState(PAGES.HOME);
  const [pageKey, setPageKey] = useState(0);
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const handleUnlock = () => setUnlocked(true);

  const [sharedCvText, setSharedCvText] = useState(() => localStorage.getItem('sas_cv_text') || '');
  const [sharedJdText, setSharedJdText] = useState(() =>
    localStorage.getItem('sas_jd_text') || localStorage.getItem('sas_cv_jd') || ''
  );
  useEffect(() => { localStorage.setItem('sas_cv_text', sharedCvText); }, [sharedCvText]);
  useEffect(() => { localStorage.setItem('sas_jd_text', sharedJdText); }, [sharedJdText]);

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
    <LanguageProvider>
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
          <div key={pageKey} className="page-transition section-fade">
            {activePage === PAGES.HOME          && <Home onNavigate={navigate} onUnlock={handleUnlock} />}
            {activePage === PAGES.DASHBOARD     && <Dashboard />}
            {activePage === PAGES.CV_OPTIMIZER  && <CVOptimizer unlocked={unlocked} onUnlock={handleUnlock} cvText={sharedCvText} setCvText={setSharedCvText} jdText={sharedJdText} setJdText={setSharedJdText} />}
            {activePage === PAGES.COVER_LETTER  && <CoverLetterGenerator unlocked={unlocked} onUnlock={handleUnlock} cvText={sharedCvText} setCvText={setSharedCvText} jdText={sharedJdText} setJdText={setSharedJdText} />}
            {activePage === PAGES.INTERVIEW_PREP && <InterviewPrep unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.CV_BUILDER    && <CVBuilder unlocked={unlocked} onUnlock={handleUnlock} />}
            {activePage === PAGES.FAQ           && <FAQ />}
            {activePage === PAGES.LEGAL         && <Legal />}
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <span>© {new Date().getFullYear()} Smart AI Systems · AI Job Application System</span>
          <button
            onClick={() => navigate(PAGES.LEGAL)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'rgba(226,237,232,0.4)',
              fontFamily: 'inherit', padding: 0,
              textDecoration: 'underline',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1D9E75'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(226,237,232,0.4)'; }}
          >
            Legal
          </button>
        </footer>
      </div>
    </div>
    </LanguageProvider>
  );
}
