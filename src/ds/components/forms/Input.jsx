import React from 'react';

/** Text input matching the dashboard's search/field style. Supports leading/trailing icons. */
export function Input({ leadingIcon, trailingIcon, size = 'md', invalid = false, style, wrapStyle, ...rest }) {
  const sizes = { sm: { height: 36, fontSize: 13, pad: 10 }, md: { height: 42, fontSize: 14, pad: 12 }, lg: { height: 48, fontSize: 15, pad: 14 } };
  const s = sizes[size] || sizes.md;
  return (
    <div
      className="pf-input"
      style={{
        display: 'flex', alignItems: 'center', gap: 8, height: s.height,
        padding: `0 ${s.pad}px`, background: 'var(--surface-card)',
        border: `1px solid ${invalid ? 'var(--status-danger)' : 'var(--border-soft)'}`,
        borderRadius: 'var(--radius-md)', transition: 'border-color var(--duration-fast) var(--ease-standard)',
        ...wrapStyle,
      }}
    >
      {leadingIcon && <span style={{ display: 'inline-flex', color: 'var(--text-tertiary)', flexShrink: 0 }}>{leadingIcon}</span>}
      <input
        style={{
          flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'var(--font-sans)', fontSize: s.fontSize, color: 'var(--text-primary)', ...style,
        }}
        {...rest}
      />
      {trailingIcon && <span style={{ display: 'inline-flex', color: 'var(--text-tertiary)', flexShrink: 0 }}>{trailingIcon}</span>}
    </div>
  );
}
