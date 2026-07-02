import React from 'react';
import { Avatar } from './Avatar.jsx';

/** Overlapping row of avatars with a "+N" overflow chip. */
export function AvatarGroup({ users = [], size = 32, max = 4, style, ...rest }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', ...style }} {...rest}>
      {shown.map((u, i) => (
        <span key={i} style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: i }}>
          <Avatar {...u} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span style={{
          marginLeft: -size * 0.32, width: size, height: size, borderRadius: 'var(--radius-full)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-sunken)', color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-semibold)', fontSize: size * 0.34,
          border: '2px solid var(--surface-card)', zIndex: shown.length,
        }}>+{extra}</span>
      )}
    </div>
  );
}
