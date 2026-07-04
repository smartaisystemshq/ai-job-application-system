import React from 'react';
import { useLang } from '../context/LanguageContext';
import { PAGES } from '../constants';

export default function NotFound({ onNavigate }) {
  const { lang } = useLang();
  return (
    <div style={{ textAlign: 'center', padding: '80px 40px' }}>
      <h1 style={{ fontSize: 64, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>404</h1>
      <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 24 }}>
        {lang === 'DE' ? 'Seite nicht gefunden.' : 'Page not found.'}
      </p>
      <button className="btn btn-primary" onClick={() => onNavigate(PAGES.HOME)}>
        {lang === 'DE' ? '← Zurück zur Startseite' : '← Back to Home'}
      </button>
    </div>
  );
}
