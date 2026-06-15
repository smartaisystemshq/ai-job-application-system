import React, { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

const LEGAL_STYLES = `
  .legal-content h2 { font-size: 18px; font-weight: 700; color: #e2ede8; margin: 0 0 16px; line-height: 1.3; }
  .legal-content h3 { font-size: 15px; font-weight: 600; color: #e2ede8; margin: 24px 0 8px; line-height: 1.4; }
  .legal-content p { margin: 0 0 10px; }
  .legal-content a { color: #1D9E75; text-decoration: underline; }
  .legal-content strong { color: #e2ede8; }
  .legal-content .indent { padding-left: 16px; margin-bottom: 10px; }
  .legal-content .muted { color: rgba(226,237,232,0.3); font-size: 12px; margin-top: 24px; margin-bottom: 0; }
  .legal-content .italic-note { font-style: italic; color: rgba(226,237,232,0.4); }
`;

function LegalSection({ children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: '32px',
      fontSize: 13,
      color: 'rgba(226,237,232,0.55)',
      lineHeight: 1.8,
    }}>
      {children}
    </div>
  );
}

export default function Legal() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState('impressum');

  const tabs = [
    { id: 'impressum', label: t[lang].legal_tab_impressum },
    { id: 'datenschutz', label: t[lang].legal_tab_privacy },
    { id: 'agb', label: t[lang].legal_tab_agb },
  ];

  const contentMap = {
    impressum: lang === 'DE' ? t.DE.legal_impressum_content_de : t.EN.legal_impressum_content_en,
    datenschutz: lang === 'DE' ? t.DE.legal_privacy_content_de : t.EN.legal_privacy_content_en,
    agb: lang === 'DE' ? t.DE.legal_agb_content_de : t.EN.legal_agb_content_en,
  };

  return (
    <div>
      <style>{LEGAL_STYLES}</style>

      {/* Hero */}
      <div className="tool-hero scroll-reveal">
        <div className="tool-hero-badge">
          <span>§</span><span>{t[lang].nav_legal}</span>
        </div>
        <h1 className="tool-hero-h1">
          {t[lang].legal_tab_impressum} · {t[lang].legal_tab_privacy} · {t[lang].legal_tab_agb}
        </h1>
        <p className="tool-hero-sub" style={{ maxWidth: 520 }}>
          {lang === 'DE'
            ? 'Rechtliche Informationen, Datenschutzerklärung und Allgemeine Geschäftsbedingungen.'
            : 'Legal notice, privacy policy and terms & conditions.'}
        </p>
      </div>

      <div className="tool-divider" style={{ margin: '24px 40px 32px' }} />

      <div className="tool-section" style={{ padding: '0 40px 80px' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#e2ede8' : 'rgba(226,237,232,0.45)',
                borderBottom: activeTab === tab.id ? '2px solid #1D9E75' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.15s, border-color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <LegalSection>
          <div
            className="legal-content"
            dangerouslySetInnerHTML={{ __html: contentMap[activeTab] }}
          />
        </LegalSection>
      </div>
    </div>
  );
}
