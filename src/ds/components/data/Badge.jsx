import React from 'react';

/** Status/label pill. Soft-tinted background with matching text. */
export function Badge({ children, tone = 'neutral', variant = 'soft', dot = false, style, ...rest }) {
  const tones = {
    neutral: { fg: 'var(--text-secondary)', bg: 'var(--surface-sunken)', solid: 'var(--neutral-500)' },
    primary: { fg: 'var(--primary-600)', bg: 'var(--primary-50)', solid: 'var(--primary-500)' },
    accent:  { fg: 'var(--secondary-600)', bg: 'var(--secondary-50)', solid: 'var(--secondary-500)' },
    success: { fg: 'var(--status-success)', bg: 'var(--status-success-bg)', solid: 'var(--status-success)' },
    danger:  { fg: 'var(--status-danger)', bg: 'var(--status-danger-bg)', solid: 'var(--status-danger)' },
    warning: { fg: 'var(--yellow-500)', bg: 'var(--status-warning-bg)', solid: 'var(--yellow-500)' },
  };
  const t = tones[tone] || tones.neutral;
  const solid = variant === 'solid';
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 24, padding: '0 10px',
        borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-sans)', fontSize: 12,
        fontWeight: 'var(--weight-semibold)', lineHeight: 1, whiteSpace: 'nowrap',
        background: solid ? t.solid : t.bg, color: solid ? '#fff' : t.fg, ...style,
      }}
      {...rest}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: solid ? '#fff' : t.solid }} />}
      {children}
    </span>
  );
}
