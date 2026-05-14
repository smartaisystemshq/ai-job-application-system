import React, { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CVOptimizer from './components/CVOptimizer';
import CoverLetterGenerator from './components/CoverLetterGenerator';
import InterviewPrep from './components/InterviewPrep';

export const PAGES = {
  DASHBOARD: 'dashboard',
  CV_OPTIMIZER: 'cv-optimizer',
  COVER_LETTER: 'cover-letter',
  INTERVIEW_PREP: 'interview-prep',
};

export default function App() {
  const [activePage, setActivePage] = useState(PAGES.DASHBOARD);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header activePage={activePage} onNavigate={setActivePage} />
      <main style={{ flex: 1 }}>
        {activePage === PAGES.DASHBOARD && <Dashboard />}
        {activePage === PAGES.CV_OPTIMIZER && <CVOptimizer />}
        {activePage === PAGES.COVER_LETTER && <CoverLetterGenerator />}
        {activePage === PAGES.INTERVIEW_PREP && <InterviewPrep />}
      </main>
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)',
      }}>
        © {new Date().getFullYear()} Smart AI Systems · AI Job Application System
      </footer>
    </div>
  );
}
