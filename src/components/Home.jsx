import React, { useRef, useState } from 'react';
import { PAGES } from '../constants';
import Paywall from './Paywall';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

const Divider = () => (
  <div style={{
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(29,158,117,0.14), transparent)',
    margin: '0 40px 60px',
  }} />
);

const SectionLabel = ({ text }) => (
  <p style={{
    fontSize: 9,
    letterSpacing: '2.5px',
    color: 'rgba(29,158,117,0.55)',
    textTransform: 'uppercase',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: 600,
  }}>{text}</p>
);

export default function Home({ onNavigate, onUnlock }) {
  const featuresRef = useRef(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { lang } = useLang();

  const STEPS = [
    { n: '1', title: t[lang].home_step1_title, desc: t[lang].home_step1_desc },
    { n: '2', title: t[lang].home_step2_title, desc: t[lang].home_step2_desc },
    { n: '3', title: t[lang].home_step3_title, desc: t[lang].home_step3_desc },
  ];

  const FEATURES = [
    { icon: '✦', title: t[lang].home_feat1_title, desc: t[lang].home_feat1_desc },
    { icon: '✉', title: t[lang].home_feat2_title, desc: t[lang].home_feat2_desc },
    { icon: '◎', title: t[lang].home_feat3_title, desc: t[lang].home_feat3_desc },
    { icon: '◈', title: t[lang].home_feat4_title, desc: t[lang].home_feat4_desc },
  ];

  const STATS = [
    { n: '3x',    label: t[lang].home_stat1_label },
    { n: '<5min', label: t[lang].home_stat2_label },
    { n: '5',     label: t[lang].home_stat3_label },
    { n: '€27',   label: t[lang].home_stat4_label },
  ];

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* ── Section 1: Hero ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '70px 40px 50px', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(29,158,117,0.07)',
          border: '1px solid rgba(29,158,117,0.15)',
          borderRadius: 100,
          padding: '5px 15px',
          marginBottom: 28,
        }}>
          <span className="home-pulse-dot" />
          <span style={{
            fontSize: 10, letterSpacing: '0.7px',
            color: 'rgba(29,158,117,0.8)',
            textTransform: 'uppercase', fontWeight: 600,
          }}>{t[lang].home_badge}</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 52, fontWeight: 700, lineHeight: 1.12,
          letterSpacing: '-1.5px', marginBottom: 20, color: '#e2ede8',
        }}>
          Get{' '}
          <span style={{ color: '#1D9E75', textShadow: '0 0 28px rgba(29,158,117,0.5)' }}>
            {t[lang].home_headline_highlight}
          </span>
          {' '}with AI in minutes
        </h1>

        {/* Subheadline */}
        <p style={{
          maxWidth: 420, margin: '0 auto 52px',
          fontSize: 16, color: 'rgba(226,237,232,0.45)', lineHeight: 1.72,
        }}>
          {t[lang].home_sub}
        </p>

        {/* ── Section 2: Step Cards ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 40, flexWrap: 'wrap' }}>
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="home-step-card">
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(29,158,117,0.1)',
                border: '1px solid rgba(29,158,117,0.24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: 12, fontWeight: 700, color: '#1D9E75',
              }}>{n}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2ede8', marginBottom: 5 }}>{title}</div>
              <div style={{ fontSize: 11, color: 'rgba(226,237,232,0.35)', lineHeight: 1.55 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* ── Section 3: CTA Row ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 80, flexWrap: 'wrap' }}>
          <button
            className="home-cta-primary"
            onClick={() => onNavigate(PAGES.CV_OPTIMIZER)}
          >
            {t[lang].home_cta_primary}
          </button>
          <button
            className="home-cta-secondary"
            onClick={scrollToFeatures}
          >
            {t[lang].home_cta_secondary}
          </button>
        </div>
      </div>

      {/* ── Section 4: Divider ── */}
      <Divider />

      {/* ── Section 5: Features Grid ── */}
      <div ref={featuresRef} style={{ maxWidth: 860, margin: '0 auto', padding: '0 40px 60px' }}>
        <SectionLabel text={t[lang].home_features_label} />
        <div className="home-features-grid">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={icon} className="home-feature-card">
              <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2ede8', marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'rgba(226,237,232,0.35)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 6: Divider ── */}
      <Divider />

      {/* ── Section 7: Stats ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 40px 72px', textAlign: 'center' }}>
        <SectionLabel text={t[lang].home_stats_label} />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {STATS.map(({ n, label }, i) => (
            <div
              key={n}
              style={{
                padding: '22px 40px',
                borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div style={{
                fontSize: 36, fontWeight: 700,
                color: '#1D9E75',
                textShadow: '0 0 18px rgba(29,158,117,0.45)',
                marginBottom: 5,
              }}>{n}</div>
              <div style={{ fontSize: 11, color: 'rgba(226,237,232,0.35)', letterSpacing: '0.3px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 8: Final CTA ── */}
      <div style={{ textAlign: 'center', padding: '0 40px 100px' }}>
        <h2 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px',
          marginBottom: 12, color: '#e2ede8',
        }}>
          Stop guessing.{' '}
          <span style={{ color: '#1D9E75', textShadow: '0 0 20px rgba(29,158,117,0.45)' }}>
            {t[lang].home_final_highlight}
          </span>
        </h2>
        <p style={{
          fontSize: 14, color: 'rgba(226,237,232,0.5)',
          maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.6,
        }}>
          {t[lang].home_final_sub}
        </p>
        <button
          className="home-final-cta"
          onClick={() => setShowPaywall(true)}
        >
          {t[lang].home_final_cta}
        </button>
      </div>

      {showPaywall && (
        <Paywall
          onUnlock={() => { onUnlock?.(); setShowPaywall(false); }}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </>
  );
}
