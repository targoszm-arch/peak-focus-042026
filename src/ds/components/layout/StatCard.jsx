import React from 'react';
import { Card } from './Card.jsx';

/**
 * KPI stat card — icon tile, big value, label, and delta vs. last period.
 * Matches the dashboard's "Total Projects / Total Tasks" row.
 */
export function StatCard({ icon, label, value, delta, deltaDirection = 'up', iconTone = 'accent', style, ...rest }) {
  const tones = {
    accent:  { bg: 'var(--secondary-50)', fg: 'var(--secondary-500)' },
    primary: { bg: 'var(--primary-50)', fg: 'var(--primary-500)' },
    success: { bg: 'var(--status-success-bg)', fg: 'var(--status-success)' },
  };
  const t = tones[iconTone] || tones.accent;
  const up = deltaDirection === 'up';
  return (
    <Card padding={18} style={{ display: 'flex', flexDirection: 'column', gap: 14, ...style }} {...rest}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: t.bg, color: t.fg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 'var(--weight-bold)', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</span>
        {delta != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 'var(--weight-semibold)', color: up ? 'var(--status-success)' : 'var(--status-danger)' }}>
            <span style={{ fontSize: 13 }}>{up ? '▲' : '▼'}</span>{delta}
          </span>
        )}
      </div>
    </Card>
  );
}
