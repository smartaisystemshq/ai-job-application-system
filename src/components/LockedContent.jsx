import React from 'react';
import Paywall from './Paywall';

export default function LockedContent({ children, unlocked, onUnlock }) {
  if (unlocked) return <>{children}</>;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>
      <Paywall onUnlock={onUnlock} />
    </div>
  );
}
