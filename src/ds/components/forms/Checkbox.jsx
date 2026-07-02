import React from 'react';

/** Checkbox matching the task-list row check style. Controlled via `checked`. */
export function Checkbox({ checked = false, indeterminate = false, disabled = false, label, size = 18, onChange, style, ...rest }) {
  const on = checked || indeterminate;
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: size, height: size, flexShrink: 0, borderRadius: 'var(--radius-xs)',
          background: on ? 'var(--action-primary)' : 'var(--surface-card)',
          border: `1.5px solid ${on ? 'var(--action-primary)' : 'var(--border-strong)'}`,
          transition: 'all var(--duration-fast) var(--ease-standard)',
        }}
        {...rest}
      >
        {checked && !indeterminate && (
          <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {indeterminate && <span style={{ width: size * 0.5, height: 2, background: '#fff', borderRadius: 1 }} />}
      </span>
      {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>{label}</span>}
    </label>
  );
}
