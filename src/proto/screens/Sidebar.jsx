import React from "react";
// Left sidebar — logo, prominent quick-add button, nav, user card.
// Exposes window.Sidebar.
function Sidebar({ active, onNavigate, onQuickAdd, open }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { NavItem, Icon, Avatar } = NS;
  const D = window.PFData;

  const nav = [
    ['dashboard', 'Dashboard', 'CategoryProperty1Linear'],
    ['today',    'Today',    'Home2Property1Linear'],
    ['tasks',    'Tasks',    'TaskSquareProperty1Linear'],
    ['projects', 'Projects', 'FolderProperty1Linear'],
    ['clients',  'Clients',  'CategoryProperty1Linear'],
    ['people',   'People',   'Profile2userProperty1Linear'],
    ['habits',   'Habits',   'StarProperty1Linear'],
    ['focus',    'Focus',    'TimerProperty1Linear'],
    ['health',   'Health',   'ChartProperty1Linear'],
    ['integrations', 'Integrations', 'Element3Property1Linear'],
  ];
  const openCount = D.tasks.filter(t => !t.done && (window.PFDate.bucket(t.due) === 'today' || window.PFDate.bucket(t.due) === 'overdue')).length;
  const badges = { today: openCount || null };

  return (
    <aside className={"sidebar" + (open ? " open" : "")} style={{ width: 'var(--sidebar-width)', flexShrink: 0, height: '100%', background: 'var(--surface-card)', borderRight: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 6px' }}>
        <img src={(window.__resources && window.__resources.logoDark) || "../../assets/logo/peak-focus-logo-transparent.png"} alt="Peak Focus" style={{ height: 30 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Peak Focus</span>
      </div>

      {/* Global quick add — always one click away */}
      <button onClick={onQuickAdd} style={{
        display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, padding: '11px 12px',
        borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary-500)', color: '#fff',
        cursor: 'pointer', width: '100%', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700,
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-600)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-500)'}>
        <Icon name="AddProperty1Bold" size={19} />
        <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>Quick add</span>
        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>N</span>
      </button>

      <div style={{ flex: 1, overflowY: 'auto', marginTop: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(([k, l, ic]) => (
          <NavItem key={k} icon={<Icon name={ic} size={20} />} label={l} badge={badges[k]} active={active === k} onClick={() => onNavigate(k)} />
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border-soft)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!(window.PFInstall && window.PFInstall.isStandalone) && (
          <NavItem
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v11m0 0l-4-4m4 4l4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/></svg>}
            label="Install app"
            onClick={() => window.PFInstall && window.PFInstall.prompt()}
          />
        )}
        <NavItem icon={<Icon name="Setting2Property1Linear" size={20} />} label="Settings" active={active === 'settings'} onClick={() => onNavigate('settings')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', marginTop: 4, borderRadius: 'var(--radius-md)', background: 'var(--surface-page)' }}>
          <Avatar name={D.user.name} size={36} status="online" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{D.user.name}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-tertiary)' }}>{D.user.role}</div>
          </div>
          <button onClick={() => onNavigate('signout')} title="Log out" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', padding: 4 }}>
            <Icon name="LogoutProperty1Linear" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;
