import React, { useState } from 'react';
import { unlockApp } from '../utils/accessControl';

const FEATURES = [
  'Unlimited CV Optimizations — tailored to every job',
  'AI Cover Letter in under 2 minutes',
  'Interview Question Generator — role-specific',
  'CV Builder from scratch with AI guidance',
  'ATS Keyword Match score for every application',
  'Adjust any output with AI chat in seconds',
  'Pay once — use forever',
];

export default function Paywall({ onUnlock, onClose }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const valid = await unlockApp(code.trim());
      if (valid) {
        onUnlock?.();
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch {
      setError('Could not verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: '3px solid #1D9E75',
        borderRadius: 14,
        padding: '36px 32px',
        maxWidth: 480,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 16,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(226,237,232,0.4)', fontSize: 16, lineHeight: 1,
              padding: '4px 6px', borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2ede8'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(226,237,232,0.4)'; }}
            aria-label="Close"
          >✕</button>
        )}

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <img
            src="/logo.png"
            alt="Smart AI Systems"
            style={{ height: 40, objectFit: 'contain', flexShrink: 0 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Smart AI Systems</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.2, marginTop: 2 }}>AI Job Application System</div>
          </div>
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>Unlock Full Access</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>One-time payment. Unlimited use.</p>

        {/* Price */}
        <div style={{ fontSize: 44, fontWeight: 900, color: '#1D9E75', marginBottom: 20, lineHeight: 1 }}>€37</div>

        {/* Features */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FEATURES.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.45 }}>
              <span style={{ color: '#1D9E75', flexShrink: 0, fontWeight: 700, marginTop: 1 }}>✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <a
          href="https://systemsbyniklas.gumroad.com/l/zilhaq"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            background: '#1D9E75',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 8,
            padding: '14px 24px',
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 24,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          Get Access — €37
        </a>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }} />

        {/* Code entry */}
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>Already have a code? Enter it here</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="Enter your access code..."
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleUnlock()}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleUnlock}
            disabled={loading || !code.trim()}
            style={{ flexShrink: 0, minWidth: 80 }}
          >
            {loading
              ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} />
              : 'Unlock'}
          </button>
        </div>
        {error && (
          <p style={{ fontSize: 13, color: '#f87171', marginTop: 8 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
