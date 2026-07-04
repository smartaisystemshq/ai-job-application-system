import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLang } from './context/LanguageContext';
import { t } from './translations';
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
import NotFound from './components/NotFound';
import { PAGES } from './constants';
import { isUnlocked } from './utils/accessControl';

function FooterContent({ onNavigate }) {
  const { lang } = useLang();
  return (
    <footer style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
      <span style={{ fontSize: '12px', color: 'rgba(226,237,232,0.25)' }}>
        © {new Date().getFullYear()} Smart AI Systems · AI Job Application System
      </span>
      <span style={{ margin: '0 8px', color: 'rgba(226,237,232,0.15)' }}>·</span>
      <span
        onClick={() => onNavigate(PAGES.LEGAL)}
        style={{ fontSize: '12px', color: 'rgba(226,237,232,0.35)', cursor: 'pointer', textDecoration: 'underline' }}
      >
        {t[lang].nav_legal}
      </span>
      <span style={{ margin: '0 8px', color: 'rgba(226,237,232,0.15)' }}>·</span>
      <span style={{ fontSize: '11px', color: 'rgba(226,237,232,0.2)' }}>
        {t[lang].footer_ai_disclosure}
      </span>
    </footer>
  );
}

function getInitialPage() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return path === '' ? PAGES.HOME : 'not-found';
}

export default function App() {
  const [activePage, setActivePage] = useState(getInitialPage);
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
            {!Object.values(PAGES).includes(activePage) && <NotFound onNavigate={navigate} />}
          </div>
        </main>

        <FooterContent onNavigate={navigate} />
      </div>
    </div>
    </LanguageProvider>
  );
}
