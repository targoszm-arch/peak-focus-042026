import React from 'react';

/** Lightweight select-styled trigger (visual; wire up your own menu). */
export function Select({ value, placeholder = 'Select', size = 'md', leadingIcon, style, ...rest }) {
  const sizes = { sm: { height: 36, fontSize: 13, pad: 10 }, md: { height: 42, fontSize: 14, pad: 12 } };
  const s = sizes[size] || sizes.md;
  return (
    <button
      className="pf-select"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, height: s.height, padding: `0 ${s.pad}px`,
        background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-sans)', fontSize: s.fontSize, color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
        cursor: 'pointer', ...style,
      }}
      {...rest}
    >
      {leadingIcon && <span style={{ display: 'inline-flex', color: 'var(--text-tertiary)' }}>{leadingIcon}</span>}
      <span style={{ flex: 1, textAlign: 'left' }}>{value || placeholder}</span>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path d="M4 6l4 4 4-4" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
