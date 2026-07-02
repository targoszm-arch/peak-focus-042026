import React from 'react';

/** Circular avatar with image or initials fallback. Optional status dot. */
export function Avatar({ src, name = '', size = 36, status, ring = false, style, ...rest }) {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const statusColor = { online: 'var(--status-success)', busy: 'var(--status-danger)', away: 'var(--status-warning)' }[status];
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, ...style }} {...rest}>
      <span style={{
        width: size, height: size, borderRadius: 'var(--radius-full)', overflow: 'hidden',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--primary-100)', color: 'var(--primary-600)',
        fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-semibold)', fontSize: size * 0.38,
        border: ring ? '2px solid var(--surface-card)' : 'none',
      }}>
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </span>
      {statusColor && (
        <span style={{
          position: 'absolute', right: 0, bottom: 0, width: size * 0.28, height: size * 0.28,
          borderRadius: '50%', background: statusColor, border: '2px solid var(--surface-card)',
        }} />
      )}
    </span>
  );
}
