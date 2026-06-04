import React, { useRef, useState } from 'react';
import { PAGES } from '../constants';
import Paywall from './Paywall';

const STEPS = [
  { n: '1', title: 'Upload your CV',    desc: 'PDF or Word, any format works fine' },
  { n: '2', title: 'Paste job posting', desc: 'Copy directly from any job board' },
  { n: '3', title: 'Get results',       desc: 'Optimized CV & cover letter ready to send' },
];

const FEATURES = [
  { icon: '✦', title: 'CV Optimizer',            desc: 'AI rewrites your CV with the right keywords for each job — ATS-optimized and recruiter-ready' },
  { icon: '✉', title: 'Cover Letter Generator',  desc: 'Human-sounding, specific to the exact role — generated in under 2 minutes, no clichés' },
  { icon: '◎', title: 'Interview Prep',          desc: 'The 8 most likely questions for your role with answer frameworks so you walk in prepared' },
  { icon: '◈', title: 'CV Builder',              desc: 'No CV yet? Build a professional one from scratch with AI guidance in 6 simple steps' },
];

const STATS = [
  { n: '3x',    label: 'More interviews on average' },
  { n: '<5min', label: 'Per full application' },
  { n: '5',     label: 'Professional CV templates' },
  { n: '€27',   label: 'One-time payment, unlimited use' },
];

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
          }}>AI-Powered Job Applications</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 52, fontWeight: 700, lineHeight: 1.12,
          letterSpacing: '-1.5px', marginBottom: 20, color: '#e2ede8',
        }}>
          Get{' '}
          <span style={{ color: '#1D9E75', textShadow: '0 0 28px rgba(29,158,117,0.5)' }}>
            3x more interviews
          </span>
          {' '}with AI in minutes
        </h1>

        {/* Subheadline */}
        <p style={{
          maxWidth: 420, margin: '0 auto 52px',
          fontSize: 16, color: 'rgba(226,237,232,0.45)', lineHeight: 1.72,
        }}>
          Stop applying randomly. Let AI tailor every CV, cover letter, and interview prep to the exact job — done in under 5 minutes.
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
            Start with CV Optimizer →
          </button>
          <button
            className="home-cta-secondary"
            onClick={scrollToFeatures}
          >
            See how it works
          </button>
        </div>
      </div>

      {/* ── Section 4: Divider ── */}
      <Divider />

      {/* ── Section 5: Features Grid ── */}
      <div ref={featuresRef} style={{ maxWidth: 860, margin: '0 auto', padding: '0 40px 60px' }}>
        <SectionLabel text="WHAT YOU GET" />
        <div className="home-features-grid">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="home-feature-card">
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
        <SectionLabel text="BY THE NUMBERS" />
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
            Start getting interviews.
          </span>
        </h2>
        <p style={{
          fontSize: 14, color: 'rgba(226,237,232,0.5)',
          maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.6,
        }}>
          Join hundreds of job seekers already landing more callbacks with AI.
        </p>
        <button
          className="home-final-cta"
          onClick={() => setShowPaywall(true)}
        >
          Get Full Access — €27 →
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
