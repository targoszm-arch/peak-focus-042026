import React from "react";
// Integrations — active connections + a live analytics summary of what each
// service has synced. Toggle to connect/disconnect. Exposes window.IntegrationsScreen.
function IntegrationsScreen({ integrations, onToggle }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon, Switch, Badge } = NS;
  const D = window.PFData;

  const active = integrations.filter(i => i.connected);
  const available = integrations.filter(i => !i.connected);
  const itemsSynced = active.reduce((s, i) => s + (i.metricValue || 0), 0);

  const summary = [
    { label: 'Active integrations', value: active.length, icon: 'Element3Property1Bold', tone: '--primary-500' },
    { label: 'Items synced this week', value: itemsSynced.toLocaleString(), icon: 'ChartProperty1Bold', tone: '--secondary-500' },
    { label: 'Last sync', value: active.length ? '2 min ago' : '—', icon: 'TimerProperty1Bold', tone: '--green-600' },
    { label: 'Auto-sync', value: 'On', icon: 'TickCircleProperty1Bold', tone: '--primary-500' },
  ];

  const tile = (i) => (
    <span style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: i.color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800 }}>{i.initial}</span>
  );

  return (
    <div className="pf-page" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 26, minWidth: 0 }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Integrations</h1>
        <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)' }}>Connect your tools — Peak Focus pulls their data into your tasks, calendar and health.</p>
      </div>

      {/* analytics summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {summary.map(s => (
          <div key={s.label} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: `color-mix(in srgb, var(${s.tone}) 14%, white)`, color: `var(${s.tone})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={s.icon} size={19} /></span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* active */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 12px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-secondary)' }}>Active</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{active.length}</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {active.map(i => (
            <div key={i.id} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {tile(i)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.name}</span>
                    <Badge tone="success" dot>Active</Badge>
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{i.account}</div>
                </div>
                <Switch checked onChange={() => onToggle(i.id)} />
              </div>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{i.blurb}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border-soft)', fontFamily: 'var(--font-sans)', fontSize: 12.5 }}>
                <Icon name="ChartProperty1Linear" size={15} style={{ color: 'var(--green-600)' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{(i.metricValue || 0).toLocaleString()}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{i.metricLabel}</span>
                <span style={{ flex: 1 }} />
                <span style={{ color: 'var(--text-tertiary)' }}>{i.lastSync}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* available */}
      {available.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 12px' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-secondary)' }}>Available</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{available.length}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {available.map(i => (
              <div key={i.id} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                {tile(i)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{i.name}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.blurb}</div>
                </div>
                <button onClick={() => onToggle(i.id)} style={{ height: 34, padding: '0 15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-500)', background: 'var(--surface-card)', color: 'var(--primary-500)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>Connect</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
window.IntegrationsScreen = IntegrationsScreen;
