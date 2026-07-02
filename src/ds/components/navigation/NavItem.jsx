import React from 'react';

/** Sidebar navigation item. Active = tinted pill + brand text; icon inherits color. */
export function NavItem({ icon, label, active = false, badge, onClick, style, ...rest }) {
  return (
    <button
      onClick={onClick}
      className={active ? 'pf-navitem pf-navitem--active' : 'pf-navitem'}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', height: 42,
        padding: '0 12px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
        background: active ? 'var(--primary-50)' : 'transparent',
        color: active ? 'var(--primary-600)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
        transition: 'background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)',
        position: 'relative', ...style,
      }}
      {...rest}
    >
      <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      {badge != null && (
        <span style={{
          minWidth: 20, height: 20, padding: '0 6px', borderRadius: 'var(--radius-full)',
          background: active ? 'var(--primary-500)' : 'var(--surface-sunken)', color: active ? '#fff' : 'var(--text-secondary)',
          fontSize: 11, fontWeight: 'var(--weight-bold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{badge}</span>
      )}
    </button>
  );
}
