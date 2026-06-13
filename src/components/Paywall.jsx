import React, { useState } from 'react';
import { unlockApp } from '../utils/accessControl';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

export default function Paywall({ onUnlock, onClose }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { lang } = useLang();

  const FEATURES = [
    t[lang].paywall_bullet1,
    t[lang].paywall_bullet2,
    t[lang].paywall_bullet3,
    t[lang].paywall_bullet4,
    t[lang].paywall_bullet5,
    t[lang].paywall_bullet6,
    t[lang].paywall_bullet7,
  ];

  const handleUnlock = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const valid = await unlockApp(code.trim());
      if (valid) {
        onUnlock?.();
        onClose?.();
      } else {
        setError(t[lang].paywall_invalid);
        setLoading(false);
      }
    } catch {
      setError('Could not verify code. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes paywall-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .paywall-cta-btn {
          display: block;
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #1D9E75 0%, #0a6b4a 60%, #1D9E75 100%);
          background-size: 200%;
          animation: paywall-shimmer 3s ease infinite;
          border: 1px solid rgba(29,158,117,0.5);
          box-shadow: 0 0 28px rgba(29,158,117,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
          color: white;
          font-size: 15px;
          font-weight: 600;
          border-radius: 12px;
          text-decoration: none;
          text-align: center;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.2s;
          box-sizing: border-box;
        }
        .paywall-cta-btn:hover {
          box-shadow: 0 0 42px rgba(29,158,117,0.55);
          transform: translateY(-1px);
        }
      `}</style>
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
          background: 'rgba(6,13,10,0.97)',
          border: '1px solid rgba(29,158,117,0.15)',
          borderRadius: 16,
          padding: '28px 32px',
          maxWidth: 460,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 0 60px rgba(29,158,117,0.1), 0 24px 48px rgba(0,0,0,0.6)',
        }}>
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 14, right: 16,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(226,237,232,0.3)', fontSize: 16, lineHeight: 1,
                padding: '4px 6px', borderRadius: 6,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(226,237,232,0.7)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(226,237,232,0.3)'; }}
              aria-label="Close"
            >✕</button>
          )}

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)',
            borderRadius: 20, padding: '4px 12px', marginBottom: 14,
          }}>
            <span style={{ fontSize: 11, color: '#1D9E75', letterSpacing: '0.5px' }}>✦ Smart AI Systems</span>
          </div>

          {/* Headline */}
          <h2 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.5px', marginBottom: 8, marginTop: 0 }}>
            <span style={{ color: '#ffffff' }}>Stop getting ignored.</span>
            <br />
            <span style={{ color: '#1D9E75', textShadow: '0 0 20px rgba(29,158,117,0.4)' }}>Start getting callbacks.</span>
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(226,237,232,0.5)', marginBottom: 4, marginTop: 0 }}>
            The unfair advantage serious job seekers use.
          </p>
          <p style={{ fontSize: 13, color: 'rgba(226,237,232,0.4)', margin: 0 }}>
            Land your next job faster — AI does the heavy lifting.
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(29,158,117,0.3), transparent)', margin: '18px 0' }} />

          {/* Price */}
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <div style={{ fontSize: 42, fontWeight: 700, color: '#1D9E75', textShadow: '0 0 24px rgba(29,158,117,0.45)', lineHeight: 1 }}>€27</div>
            <div style={{ fontSize: 11, color: 'rgba(226,237,232,0.4)', letterSpacing: '0.3px', marginTop: 6 }}>one-time payment · unlimited use</div>
          </div>

          {/* What you get */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: '2px', color: 'rgba(29,158,117,0.55)', textTransform: 'uppercase', marginBottom: 12 }}>WHAT YOU GET</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#1D9E75', fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 12, color: 'rgba(226,237,232,0.7)', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <a
            href="https://systemsbyniklas.gumroad.com/l/zilhaq"
            target="_blank"
            rel="noopener noreferrer"
            className="paywall-cta-btn"
          >
            {t[lang].paywall_cta}
          </a>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(29,158,117,0.3), transparent)', margin: '20px 0' }} />

          {/* Code section */}
          <div>
            <p style={{ fontSize: 12, color: 'rgba(226,237,232,0.45)', marginBottom: 8, marginTop: 0 }}>{t[lang].paywall_code_label}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder={t[lang].paywall_code_placeholder}
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && handleUnlock()}
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#e2ede8',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = '#1D9E75'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
              <button
                onClick={handleUnlock}
                disabled={loading || !code.trim()}
                style={{
                  padding: '10px 18px',
                  background: 'rgba(29,158,117,0.15)',
                  border: '1px solid rgba(29,158,117,0.3)',
                  borderRadius: 8,
                  color: '#1D9E75',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading || !code.trim() ? 'default' : 'pointer',
                  opacity: loading || !code.trim() ? 0.5 : 1,
                  transition: 'background 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (!loading && code.trim()) e.currentTarget.style.background = 'rgba(29,158,117,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(29,158,117,0.15)'; }}
              >
                {loading
                  ? <span className="spinner" style={{ width: 14, height: 14, borderTopColor: '#1D9E75' }} />
                  : t[lang].paywall_code_btn}
              </button>
            </div>
            {error && <p style={{ fontSize: 13, color: '#f87171', marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
