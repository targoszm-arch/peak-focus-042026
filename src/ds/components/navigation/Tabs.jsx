import React from 'react';

/** Underline tab bar. Controlled via `value` + `onChange`. */
export function Tabs({ tabs = [], value, onChange, style, ...rest }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-soft)', ...style }} {...rest}>
      {tabs.map(tab => {
        const key = typeof tab === 'string' ? tab : tab.value;
        const label = typeof tab === 'string' ? tab : tab.label;
        const count = typeof tab === 'object' ? tab.count : undefined;
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange && onChange(key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', border: 'none',
              background: 'transparent', cursor: 'pointer', position: 'relative',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-medium)',
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: active ? 'inset 0 -2px 0 var(--action-primary)' : 'none',
              transition: 'color var(--duration-fast) var(--ease-standard)',
            }}
          >
            {label}
            {count != null && (
              <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 'var(--radius-full)', background: active ? 'var(--primary-50)' : 'var(--surface-sunken)', color: active ? 'var(--primary-600)' : 'var(--text-tertiary)', fontSize: 11, fontWeight: 'var(--weight-bold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
