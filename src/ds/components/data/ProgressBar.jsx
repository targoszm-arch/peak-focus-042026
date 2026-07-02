import React from 'react';

/** Horizontal progress bar with optional label + percentage. */
export function ProgressBar({ value = 0, tone = 'primary', height = 8, label, showValue = false, style, ...rest }) {
  const colors = { primary: 'var(--action-primary)', accent: 'var(--action-accent)', success: 'var(--status-success)' };
  const c = colors[tone] || colors.primary;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ width: '100%', ...style }} {...rest}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-sans)', fontSize: 13 }}>
          {label && <span style={{ color: 'var(--text-secondary)' }}>{label}</span>}
          {showValue && <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--weight-semibold)' }}>{pct}%</span>}
        </div>
      )}
      <div style={{ width: '100%', height, borderRadius: 'var(--radius-full)', background: 'var(--surface-sunken)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 'var(--radius-full)', background: c, transition: 'width var(--duration-base) var(--ease-standard)' }} />
      </div>
    </div>
  );
}
