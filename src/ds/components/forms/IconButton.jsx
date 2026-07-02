import React from 'react';

/** Square icon-only button. Matches topbar utility controls (search, notifications). */
export function IconButton({ icon, size = 'md', variant = 'secondary', badge, disabled = false, style, ...rest }) {
  const dims = { sm: 32, md: 40, lg: 44 };
  const d = dims[size] || dims.md;
  const variants = {
    secondary: { background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-soft)' },
    ghost:     { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' },
    solid:     { background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid transparent' },
    accent:    { background: 'var(--action-accent)', color: '#fff', border: '1px solid transparent' },
  };
  const v = variants[variant] || variants.secondary;
  return (
    <button
      disabled={disabled}
      className={`pf-iconbtn pf-iconbtn--${variant}`}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: d, height: d, borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background var(--duration-fast) var(--ease-standard)', opacity: disabled ? 0.5 : 1,
        ...v, ...style,
      }}
      {...rest}
    >
      {icon}
      {badge != null && (
        <span style={{
          position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, padding: '0 4px',
          borderRadius: 'var(--radius-full)', background: 'var(--action-accent)', color: '#fff',
          fontSize: 10, fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-sans)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--surface-card)',
        }}>{badge}</span>
      )}
    </button>
  );
}
