import React from 'react';

/** Base surface card — white, soft border, subtle shadow, generous radius. */
export function Card({ children, padding = 20, hover = false, style, ...rest }) {
  return (
    <div
      className={hover ? 'pf-card pf-card--hover' : 'pf-card'}
      style={{
        background: 'var(--surface-card)', border: '1px solid var(--border-soft)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding,
        transition: 'box-shadow var(--duration-base) var(--ease-standard), transform var(--duration-base) var(--ease-standard)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
