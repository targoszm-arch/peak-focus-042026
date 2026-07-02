import React from 'react';

/** Toggle switch. Blue track when on. */
export function Switch({ checked = false, disabled = false, size = 'md', label, onChange, style, ...rest }) {
  const dims = { sm: { w: 34, h: 20, k: 14 }, md: { w: 44, h: 24, k: 18 } };
  const d = dims[size] || dims.md;
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          position: 'relative', width: d.w, height: d.h, flexShrink: 0,
          borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--action-primary)' : 'var(--border-strong)',
          transition: 'background var(--duration-base) var(--ease-standard)',
        }}
        {...rest}
      >
        <span style={{
          position: 'absolute', top: (d.h - d.k) / 2, left: checked ? d.w - d.k - (d.h - d.k) / 2 : (d.h - d.k) / 2,
          width: d.k, height: d.k, borderRadius: '50%', background: '#fff',
          boxShadow: 'var(--shadow-sm)', transition: 'left var(--duration-base) var(--ease-standard)',
        }} />
      </span>
      {label && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>{label}</span>}
    </label>
  );
}
