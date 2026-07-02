import React from 'react';

/**
 * Peak Focus primary button. Variants map to the dashboard's action colors:
 * `accent` = warm coral CTA ("Add New Project"), `primary` = brand blue,
 * `secondary` = white w/ border, `ghost` = transparent, `danger` = red.
 */
export function Button({
  children,
  variant = 'accent',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled = false,
  style,
  ...rest
}) {
  const sizes = {
    sm: { height: 34, padding: '0 12px', fontSize: 13, gap: 6, radius: 'var(--radius-md)' },
    md: { height: 40, padding: '0 16px', fontSize: 14, gap: 8, radius: 'var(--radius-md)' },
    lg: { height: 48, padding: '0 22px', fontSize: 15, gap: 8, radius: 'var(--radius-lg)' },
  };
  const variants = {
    accent:    { background: 'var(--action-accent)', color: '#fff', border: '1px solid transparent' },
    primary:   { background: 'var(--action-primary)', color: '#fff', border: '1px solid transparent' },
    secondary: { background: 'var(--surface-card)', color: 'var(--text-primary)', border: '1px solid var(--border-soft)' },
    ghost:     { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
    danger:    { background: 'var(--status-danger)', color: '#fff', border: '1px solid transparent' },
  };
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.accent;
  return (
    <button
      disabled={disabled}
      className={`pf-btn pf-btn--${variant}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: s.gap, height: s.height, padding: s.padding, borderRadius: s.radius,
        fontFamily: 'var(--font-sans)', fontSize: s.fontSize, fontWeight: 'var(--weight-semibold)',
        lineHeight: 1, letterSpacing: '-0.01em', cursor: disabled ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto', whiteSpace: 'nowrap',
        transition: 'filter var(--duration-fast) var(--ease-standard), background var(--duration-fast) var(--ease-standard)',
        opacity: disabled ? 0.5 : 1, ...v, ...style,
      }}
      {...rest}
    >
      {leadingIcon && <span style={{ display: 'inline-flex' }}>{leadingIcon}</span>}
      {children}
      {trailingIcon && <span style={{ display: 'inline-flex' }}>{trailingIcon}</span>}
    </button>
  );
}
