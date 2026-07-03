import React from 'react';
import { useLang } from '../context/LanguageContext';

export default function NotFound() {
  const { lang } = useLang();
  return (
    <div style={{ textAlign: 'center', padding: '80px 40px' }}>
      <h1 style={{ fontSize: 64, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>404</h1>
      <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 0 }}>
        {lang === 'DE' ? 'Seite nicht gefunden.' : 'Page not found.'}
      </p>
    </div>
  );
}
