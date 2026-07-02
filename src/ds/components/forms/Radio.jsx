import React from 'react';

/** Radio button. Controlled via `checked`; group by shared `name`. */
export function Radio({ checked = false, disabled = false, label, size = 18, onChange, style, ...rest }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        onClick={() => !disabled && onChange && onChange(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: size, height: size, flexShrink: 0, borderRadius: 'var(--radius-full)',
          background: 'var(--surface-card)',
          border: `1.5px solid ${checked ? 'var(--action-primary)' : 'var(--border-strong)'}`,
          transition: 'all var(--duration-fast) var(--ease-standard)',
        }}
        {...rest}
      >
        {checked && <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: '50%', background: 'var(--action-primary)' }} />}
      </span>
      {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>{label}</span>}
    </label>
  );
}
