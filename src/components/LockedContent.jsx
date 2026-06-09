import React, { useState } from 'react';
import Paywall from './Paywall';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

export default function LockedContent({ children, unlocked, onUnlock }) {
  const [paywallDismissed, setPaywallDismissed] = useState(false);
  const { lang } = useLang();

  if (unlocked) return <>{children}</>;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>
      {!paywallDismissed && (
        <Paywall onUnlock={onUnlock} onClose={() => setPaywallDismissed(true)} />
      )}
      {paywallDismissed && (
        <div style={{
          marginTop: 16,
          padding: '12px 20px',
          background: 'rgba(29,158,117,0.06)',
          border: '1px solid rgba(29,158,117,0.15)',
          borderRadius: 10,
          textAlign: 'center',
          fontSize: 13,
          color: 'rgba(226,237,232,0.5)',
        }}>
          {t[lang].paywall_locked_banner}{' '}
          <button
            onClick={() => setPaywallDismissed(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#1D9E75', fontWeight: 600, fontSize: 13,
              textDecoration: 'underline', fontFamily: 'inherit',
              padding: 0,
            }}
          >
            {t[lang].paywall_locked_link}
          </button>
        </div>
      )}
    </div>
  );
}
