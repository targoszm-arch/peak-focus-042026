import React from 'react';

/** Small squared tag/chip, optional close button. Neutral by default. */
export function Tag({ children, tone = 'neutral', onRemove, style, ...rest }) {
  const tones = {
    neutral: { fg: 'var(--text-secondary)', bg: 'var(--surface-sunken)' },
    primary: { fg: 'var(--primary-600)', bg: 'var(--primary-50)' },
    accent:  { fg: 'var(--secondary-600)', bg: 'var(--secondary-50)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 8px 0 10px', borderRadius: 'var(--radius-sm)', background: t.bg, color: t.fg, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 'var(--weight-medium)', ...style }} {...rest}>
      {children}
      {onRemove && (
        <button onClick={onRemove} style={{ display: 'inline-flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: 2 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      )}
    </span>
  );
}
