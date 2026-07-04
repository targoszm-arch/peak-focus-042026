import React from "react";
// Dashboard — Peak Focus overview home on brand tokens (light surfaces, warm-blue
// primary + coral accent). Live-clock header, Time Tracker card (Summary/Projects/
// Tasks tabs + charts), Productivity donut, Completed-task area chart, Urgent Tasks
// table, and a right rail (Notifications + Recent Activity). Exposes window.DashboardScreen.
function DashboardScreen({ tasks, habits, onToggleTask, onOpenProject, onGoto }) {
  const { useState, useEffect, useRef, useMemo } = React;
  const D = window.PFData;
  const PD = window.PFDate;

  // ── brand palette via design-system tokens ──
  const T = {
    page: 'var(--surface-page)', panel: 'var(--surface-card)', inner: 'var(--surface-page)',
    b1: 'var(--border-soft)', b2: 'var(--border-strong)',
    soft: 'var(--surface-sunken)', soft2: 'var(--surface-sunken)',
    text: 'var(--text-primary)', text2: 'var(--text-secondary)', muted: 'var(--text-tertiary)',
    accent: 'var(--secondary-500)', primary: 'var(--primary-500)',
    green: 'var(--green-600)', red: 'var(--red-500)',
    rMd: 8, rLg: 12, rXl: 16,
    fSans: 'var(--font-sans)', fDisp: 'var(--font-display)',
  };
  // data-viz palette — rooted in the brand ramp (coral, gold, green, blue, tints)
  const CHART = ['#F1613C', '#E6A609', '#2A9E75', '#266DF0', '#7BA5F8', '#F6A48C'];

  const fmtMin = (v) => {
    const m = Math.max(0, Math.round(v)); const h = Math.floor(m / 60), r = m % 60;
    if (!h) return r + 'm'; if (!r) return h + 'h'; return h + 'h ' + String(r).padStart(2, '0') + 'm';
  };

  // ── tiny inline glyphs (stroke, currentColor) ──
  const S = ({ d, sz = 16, sw = 1.9, fill = 'none' }) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0 }}><path d={d} /></svg>
  );
  const Cal = (p) => <S {...p} d="M8 2v3M16 2v3M3.5 9.5h17M4 6.5h16a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1Z" />;
  const Clk = (p) => <S {...p} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7.5V12l3 2" />;
  const Dots = (p) => <svg width={p.sz || 15} height={p.sz || 15} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>;
  const AUR = (p) => <S {...p} d="M7 17 17 7M9 7h8v8" />;
  const ADR = (p) => <S {...p} d="M7 7l10 10M17 9v8H9" />;
  const FlagI = (p) => <S {...p} d="M5 21V4M5 4h11l-2 4 2 4H5" />;
  const TagI = (p) => <S {...p} d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9ZM7.5 7.5h.01" />;
  const Ext = (p) => <S {...p} d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />;
  const Chk = (p) => <S {...p} sw={p.sw || 3} d="M4 12l5 5L20 6" />;
  const FileI = (p) => <S {...p} d="M14 3v5h5M7 3h8l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />;
  const SquareI = (p) => <svg width={p.sz || 13} height={p.sz || 13} viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}><rect x="5" y="5" width="14" height="14" rx="2.5" /></svg>;

  // ── generic card-corner menu ──
  function Menu({ items }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      if (!open) return;
      const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
      window.addEventListener('mousedown', down); window.addEventListener('keydown', esc);
      return () => { window.removeEventListener('mousedown', down); window.removeEventListener('keydown', esc); };
    }, [open]);
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(v => !v)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: T.rMd, border: '1px solid ' + T.b1, background: T.soft, color: T.text2, cursor: 'pointer' }}>
          <Dots />
        </button>
        {open && (
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 190, zIndex: 30, padding: 5, borderRadius: 14, border: '1px solid ' + T.b1, background: T.panel, boxShadow: 'var(--shadow-lg, 0 24px 64px -32px rgba(17,22,37,0.35))' }}>
            {items.map((it, i) => (
              <button key={i} onClick={() => { it.onSelect(); setOpen(false); }} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, padding: '8px 9px', borderRadius: 10, border: 'none', textAlign: 'left', cursor: 'pointer', background: it.active ? 'color-mix(in srgb,' + T.primary + ' 10%, transparent)' : 'transparent', color: it.active ? T.text : (it.accent ? T.primary : T.text2), fontFamily: T.fSans, fontSize: 12.5, fontWeight: it.active ? 600 : 500 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, border: '1px solid ' + (it.active ? 'color-mix(in srgb,' + T.primary + ' 24%, transparent)' : T.b1), background: it.active ? 'color-mix(in srgb,' + T.primary + ' 11%, transparent)' : T.soft2, color: it.active ? T.primary : T.text2 }}>{it.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── panel shell ──
  const Panel = ({ title, action, children, style }) => (
    <section style={{ borderRadius: T.rXl, border: '1px solid ' + T.b1, background: T.panel, padding: 20, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(17,22,37,0.04))', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <h3 style={{ margin: 0, fontFamily: T.fDisp, fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: T.text }}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );

  const Trend = ({ v, size = 18 }) => {
    const up = (v ?? 0) >= 0; const c = up ? T.green : T.accent;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.fSans, fontSize: 12.5, fontWeight: 700, color: c }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: '50%', border: '1.5px solid currentColor', opacity: 0.9 }}>{up ? <AUR sz={10} sw={3} /> : <ADR sz={10} sw={3} />}</span>
        {Math.abs(v)}%
      </span>
    );
  };

  const Avatar = ({ initials, tone, sz = 36 }) => {
    const tones = { sand: ['#E4B681', '#5A3E17'], rose: ['#EDA394', '#5A2318'], olive: ['#A9C088', '#28380F'], slate: ['#9EA6D8', '#22264A'], peach: ['#F3A481', '#5A2A15'] };
    const [bg, fg] = tones[tone] || tones.sand;
    return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: sz, height: sz, borderRadius: '50%', background: bg, color: fg, fontFamily: T.fSans, fontSize: sz * 0.32, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>{initials}</span>;
  };

  // ══════════════ derived data ══════════════
  const weekly = D.weekdays.map((label, i) => ({ label, min: [165, 210, 150, 285, 225, 75, 110][i], color: CHART[i % CHART.length] }));
  const wkTotal = weekly.reduce((s, d) => s + d.min, 0);
  const wkToday = weekly[D.todayIdx].min;
  const wkPrev = Math.round(wkTotal * 0.87);
  const wkTrend = Math.round(((wkTotal - wkPrev) / wkPrev) * 100);
  const wkMax = Math.max(...weekly.map(d => d.min));

  const projBreak = [
    { name: 'Website Revamp', min: 420, sessions: 14, tasks: 6 },
    { name: 'Mobile App v2', min: 360, sessions: 11, tasks: 4 },
    { name: 'Q3 Launch', min: 240, sessions: 8, tasks: 3 },
    { name: 'Brand Refresh', min: 180, sessions: 6, tasks: 2 },
    { name: 'Home Move', min: 120, sessions: 4, tasks: 2 },
  ].map((p, i) => ({ ...p, color: CHART[i % CHART.length] }));
  const pTotal = projBreak.reduce((s, p) => s + p.min, 0);
  const pAvg = Math.round(pTotal / projBreak.length);
  const pTop = projBreak[0];

  const taskBreak = [
    { title: 'Finalize homepage hero copy', proj: 'Website Revamp', min: 180 },
    { title: 'QA checkout on mobile', proj: 'Mobile App v2', min: 150 },
    { title: 'Wireframe pricing page', proj: 'Website Revamp', min: 120 },
    { title: 'Export new logo files', proj: 'Brand Refresh', min: 90 },
    { title: 'Draft Q3 announcement', proj: 'Q3 Launch', min: 75 },
    { title: 'Order moving boxes', proj: 'Home Move', min: 45 },
  ].map((t, i) => ({ ...t, color: CHART[i % CHART.length] }));
  const tTotal = taskBreak.reduce((s, t) => s + t.min, 0);
  const tMax = Math.max(...taskBreak.map(t => t.min));

  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const prodTrend = 24;

  const completedSeries = [1, 0, 2, 1, 3, 1, 2].map((v, i) => ({ day: D.weekdays[i], v }));
  const compTrend = 18;

  const FALLBACK = ['sand', 'rose', 'olive', 'slate', 'peach'];
  const rank = { High: 3, Medium: 2, Low: 1, Done: 0 };
  const custOf = (pid) => { const p = D.projects.find(x => x.id === pid); return p ? D.customers.find(c => c.id === p.customer) : null; };
  const urgent = useMemo(() => tasks.filter(t => !t.done).map(t => {
    const off = t.due ? PD.daysFromToday(t.due) : Infinity;
    return { ...t, off, urgent: t.priority === 'High' || off <= 3 };
  }).filter(t => t.urgent).sort((a, b) => (a.off - b.off) || (rank[b.priority] - rank[a.priority]))
    .slice(0, 5).map((t, i) => {
      const proj = t.project ? D.projects.find(p => p.id === t.project) : null;
      const cust = t.project ? custOf(t.project) : null;
      const owner = D.user.name.split(' ').map(w => w[0]).join('').slice(0, 2);
      return { ...t, projName: proj ? proj.name : 'Chores', tag: cust ? cust.name : 'Personal', assignees: [{ initials: owner, tone: FALLBACK[i % 5] }] };
    }), [tasks]);

  const dueLabel = (iso) => {
    const off = iso ? PD.daysFromToday(iso) : null;
    if (off === null) return 'No due date';
    if (off < 0) return 'Overdue by ' + Math.abs(off) + 'd';
    if (off === 0) return 'Due today'; if (off === 1) return 'Due tomorrow';
    return PD.parse(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const priTone = (p) => p === 'High' ? T.accent : p === 'Medium' ? '#C98A08' : T.text2;

  const notifications = [
    { kind: 'calendar', title: 'Homepage copy due', time: 'in 2h', body: 'Finalize homepage hero copy is due today at 5:00 PM.' },
    { kind: 'avatar', initials: 'AC', tone: 'sand', title: 'Acme Co', time: '25m', body: 'New comment on the contract email thread — needs your reply.' },
    { kind: 'check', title: 'Invoice sent', time: '1h', body: 'Send invoice to Acme was marked complete.' },
    { kind: 'avatar', initials: 'LH', tone: 'slate', title: 'Lumen Health', time: '3h', body: 'Mobile App v2 onboarding screens are ready for review.' },
  ];
  const activity = [
    { initials: 'MR', tone: 'peach', status: 'online', name: 'You', time: '12m', action: 'moved QA checkout on mobile to In Progress', detail: null },
    { initials: 'MR', tone: 'peach', status: 'online', name: 'You', time: '1h', action: 'uploaded a file to Brand Refresh', detail: 'logo-final-v3.txt' },
    { initials: 'MR', tone: 'peach', status: 'neutral', name: 'You', time: '3h', action: 'completed Confirm venue for launch party', detail: null },
    { initials: 'MR', tone: 'peach', status: 'online', name: 'You', time: '5h', action: 'created Q3 Launch project', detail: null },
  ];

  // ── clock ──
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const tz = (now.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop()) || 'Local';

  // ── time-tracker tabs ──
  const [tab, setTab] = useState('Summary');
  const btnRefs = useRef({});
  const [ind, setInd] = useState({ left: 0, width: 0 });
  useEffect(() => { const el = btnRefs.current[tab]; if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth }); }, [tab]);
  const [prodRange, setProdRange] = useState(7);
  const [compRange, setCompRange] = useState(7);
  const [barsIn, setBarsIn] = useState(false);
  useEffect(() => { const id = setTimeout(() => setBarsIn(true), 120); return () => clearTimeout(id); }, [tab]);

  const pill = { display: 'inline-flex', alignItems: 'center', gap: 10, height: 46, padding: '0 15px', borderRadius: T.rMd, border: '1px solid ' + T.b1, background: T.panel, color: T.text2, fontFamily: T.fSans, fontSize: 13, fontWeight: 600, boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(17,22,37,0.04))' };
  const softBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: T.rMd, border: '1px solid ' + T.b1, background: T.soft, color: T.primary, fontFamily: T.fSans, fontWeight: 700, cursor: 'pointer' };
  const innerCard = { borderRadius: T.rXl, border: '1px solid ' + T.b1, background: T.inner, padding: 18 };

  // ── donut ──
  const Donut = ({ data, size = 200 }) => {
    const R = size * 0.4, C = 2 * Math.PI * R, cx = size / 2; let off = 0;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        {data.map((d, i) => {
          const len = (d.min / pTotal) * C; const gap = C * 0.012;
          const seg = <circle key={i} r={R} cx={cx} cy={cx} fill="none" stroke={d.color} strokeWidth={size * 0.13} strokeDasharray={`${Math.max(0, len - gap)} ${C - Math.max(0, len - gap)}`} strokeDashoffset={-off} transform={`rotate(-90 ${cx} ${cx})`} strokeLinecap="round" />;
          off += len; return seg;
        })}
      </svg>
    );
  };

  // ── area chart ──
  const Area = ({ data }) => {
    const W = 320, H = 132, pad = 6; const max = Math.max(...data.map(d => d.v), 1);
    const xs = (i) => pad + (i / (data.length - 1)) * (W - pad * 2);
    const ys = (v) => H - pad - (v / max) * (H - pad * 2);
    const line = data.map((d, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(d.v).toFixed(1)}`).join(' ');
    const area = `${line} L${xs(data.length - 1).toFixed(1)},${H} L${xs(0).toFixed(1)},${H} Z`;
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="pfdStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#E6A609" /><stop offset="55%" stopColor="#F1613C" /><stop offset="100%" stopColor="#F6A48C" /></linearGradient>
          <linearGradient id="pfdArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F1613C" stopOpacity="0.22" /><stop offset="60%" stopColor="#F1613C" stopOpacity="0.07" /><stop offset="100%" stopColor="#F1613C" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f, i) => <line key={i} x1={pad} x2={W - pad} y1={H * f} y2={H * f} stroke="rgba(17,22,37,0.06)" strokeDasharray="3 8" />)}
        <path d={area} fill="url(#pfdArea)" />
        <path d={line} fill="none" stroke="url(#pfdStroke)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => <circle key={i} cx={xs(i)} cy={ys(d.v)} r="3.2" fill="#F1613C" stroke="var(--surface-card)" strokeWidth="2.2" />)}
      </svg>
    );
  };

  const menuIcon = (d) => <S d={d} sz={14} />;
  const trackerMenu = [
    { label: 'Summary View', icon: menuIcon('M3 13h8V3H3v10ZM13 21h8V3h-8v18ZM3 21h8v-6H3v6Z'), active: tab === 'Summary', onSelect: () => setTab('Summary') },
    { label: 'Projects View', icon: menuIcon('M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z'), active: tab === 'Projects', onSelect: () => setTab('Projects') },
    { label: 'Tasks View', icon: menuIcon('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'), active: tab === 'Tasks', onSelect: () => setTab('Tasks') },
    { label: 'Open Tasks Board', icon: menuIcon('M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z'), accent: true, onSelect: () => onGoto && onGoto('tasks') },
  ];
  const rangeMenu = (range, setRange) => [
    { label: 'Last 7 Days', icon: <Cal sz={14} />, active: range === 7, onSelect: () => setRange(7) },
    { label: 'Last 30 Days', icon: menuIcon('M3 13h4v8H3zM10 8h4v13h-4zM17 3h4v18h-4z'), active: range === 30, onSelect: () => setRange(30) },
    { label: 'View All Tasks', icon: menuIcon('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'), accent: true, onSelect: () => onGoto && onGoto('tasks') },
  ];

  return (
    <div style={{ background: T.page, minHeight: '100%', color: T.text, fontFamily: T.fSans }}>
      <style>{`
        .pfd-grid{display:grid;grid-template-columns:minmax(0,1fr);align-items:start;}
        .pfd-main{min-width:0;padding:26px 30px;}
        .pfd-top{display:grid;grid-template-columns:1fr;gap:20px;align-items:start;}
        .pfd-stack{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;}
        .pfd-rail{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:22px;border-top:1px solid var(--border-soft);background:var(--surface-page);}
        .pfd-pfoot{display:flex;align-items:stretch;}
        .pfd-utable{min-width:600px;}
        @media (min-width:1120px){ .pfd-top{grid-template-columns:minmax(0,1.35fr) minmax(260px,0.7fr);} .pfd-stack{grid-template-columns:1fr;} }
        @media (min-width:1360px){ .pfd-grid{grid-template-columns:minmax(0,1fr) 344px;} .pfd-rail{grid-template-columns:1fr;border-top:none;border-left:1px solid var(--border-soft);} }
        @media (max-width:640px){ .pfd-stack{grid-template-columns:1fr;} .pfd-rail{grid-template-columns:1fr;} .pfd-main{padding:20px 16px;} }
      `}</style>

      {/* header */}
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between', padding: '24px 30px', borderBottom: '1px solid ' + T.b1, background: T.panel }}>
        <h1 style={{ margin: 0, fontFamily: T.fDisp, fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: T.text }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={pill}><span style={{ color: T.primary, display: 'inline-flex' }}><Cal sz={16} /></span>{dateLabel}</div>
          <div style={pill}><span style={{ color: T.primary, display: 'inline-flex' }}><Clk sz={16} /></span><span style={{ color: T.text, fontVariantNumeric: 'tabular-nums' }}>{timeLabel}</span><span style={{ fontSize: 11.5, color: T.muted }}>{tz}</span></div>
        </div>
      </header>

      <div className="pfd-grid">
        {/* ── main column ── */}
        <div style={{ minWidth: 0 }}>
          <div className="pfd-main" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div className="pfd-top">
              {/* Time Tracker */}
              <Panel title="Time Tracker" action={<Menu items={trackerMenu} />}>
                {/* active timer */}
                <div style={{ borderRadius: T.rLg, border: '1px solid ' + T.b1, background: T.soft, padding: '13px 16px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: '1px solid color-mix(in srgb,' + T.accent + ' 22%,transparent)', background: 'color-mix(in srgb,' + T.accent + ' 12%,transparent)', color: T.accent, padding: '4px 10px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Currently tracking</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, border: '1px solid color-mix(in srgb,' + T.green + ' 26%,transparent)', background: 'color-mix(in srgb,' + T.green + ' 12%,transparent)', color: T.green, padding: '4px 10px', fontSize: 10.5, fontWeight: 700 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />Live</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em', color: T.text }}>Website Revamp</p>
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: T.text2 }}>Finalize homepage hero copy</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button style={{ ...softBtn, color: T.text2, padding: '9px 13px', fontSize: 12, background: T.panel }}><SquareI sz={12} /> Stop Timer</button>
                    <div style={{ minWidth: 120, borderRadius: 12, border: '1px solid ' + T.b1, background: T.panel, padding: '9px 13px', textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: T.text, fontVariantNumeric: 'tabular-nums' }}>1:24:06</p>
                      <p style={{ margin: '3px 0 0', fontSize: 11.5, color: T.text2 }}>Started 9:00 AM</p>
                    </div>
                  </div>
                </div>

                {/* tabs */}
                <div style={{ position: 'relative', display: 'flex', gap: 20, borderBottom: '1px solid ' + T.b1, paddingBottom: 14, marginBottom: 18 }}>
                  {['Summary', 'Projects', 'Tasks'].map(t => (
                    <button key={t} ref={el => { if (el) btnRefs.current[t] = el; }} onClick={() => setTab(t)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 0 10px', fontFamily: T.fSans, fontSize: 14, fontWeight: tab === t ? 700 : 500, color: tab === t ? T.text : T.muted, transition: 'color .2s' }}>{t}</button>
                  ))}
                  <span style={{ position: 'absolute', bottom: -1, left: ind.left, width: ind.width, height: 2, borderRadius: 999, background: T.primary, transition: 'left .3s cubic-bezier(.22,1,.36,1),width .3s cubic-bezier(.22,1,.36,1)' }} />
                </div>

                {/* SUMMARY */}
                {tab === 'Summary' && (
                  <div style={{ ...innerCard }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: '1 1 176px', minWidth: 0 }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 12.5, color: T.text2 }}>Tracked this week</p>
                          <p style={{ margin: '4px 0 0', fontFamily: T.fDisp, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: T.text }}>{fmtMin(wkTotal)}</p>
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                          {[['Today', fmtMin(wkToday)], ['Previous 7 days', fmtMin(wkPrev)], ['Active timers', '1 running']].map(([k, v]) => (
                            <div key={k} style={{ borderRadius: 10, background: T.panel, border: '1px solid ' + T.b1, padding: '9px 12px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                              <span style={{ fontSize: 12, color: T.text2 }}>{k}</span><span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{v}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><Trend v={wkTrend} /><span style={{ fontSize: 12, color: T.muted }}>vs previous 7 days</span></div>
                      </div>
                      <div style={{ flex: '2 1 220px', minWidth: 200, height: 220, display: 'flex', alignItems: 'flex-end', gap: '4%', paddingLeft: 8 }}>
                        {weekly.map((d, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                            <div title={fmtMin(d.min)} style={{ width: '100%', maxWidth: 40, height: barsIn ? (d.min / wkMax * 168) : 0, borderRadius: '8px 8px 0 0', background: `linear-gradient(to top, ${d.color}cc, ${d.color})`, transition: 'height .8s cubic-bezier(.22,1,.36,1) ' + (i * 40) + 'ms' }} />
                            <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>{d.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* PROJECTS */}
                {tab === 'Projects' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ ...innerCard }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: 200, height: 220 }}>
                          <Donut data={projBreak} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted }}>Tracked</span>
                            <span style={{ margin: '4px 0 0', fontFamily: T.fDisp, fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', color: T.text }}>{fmtMin(pTotal)}</span>
                            <span style={{ marginTop: 2, fontSize: 12, color: T.text2 }}>last 7 days</span>
                          </div>
                        </div>
                        <div style={{ flex: '1 1 220px', minWidth: 0, display: 'grid', gap: 8 }}>
                          {projBreak.map(p => (
                            <div key={p.name} style={{ borderRadius: T.rLg, border: '1px solid ' + T.b1, background: T.panel, padding: '9px 12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                                <span style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: p.color, flexShrink: 0 }} /><span style={{ fontSize: 12.5, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span></span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{fmtMin(p.min)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 5, fontSize: 10.5, color: T.muted }}><span>{p.sessions} sessions · {p.tasks} tasks</span><span>{Math.round(p.min / pTotal * 100)}%</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="pfd-pfoot" style={{ borderTop: '1px solid ' + T.b1, paddingTop: 16 }}>
                      {[['Tracked total', fmtMin(pTotal), 'across projects'], ['Avg / project', fmtMin(pAvg), 'per active project']].map(([a, b, c], i) => (
                        <React.Fragment key={a}><div style={{ flex: 1, padding: i ? '0 16px' : '0 16px 0 0' }}><p style={{ margin: 0, fontSize: 11.5, color: T.muted }}>{a}</p><p style={{ margin: '2px 0', fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', color: T.text }}>{b}</p><p style={{ margin: 0, fontSize: 11, color: T.muted }}>{c}</p></div><div style={{ width: 1, background: T.b1 }} /></React.Fragment>
                      ))}
                      <div style={{ flex: 1, padding: '0 0 0 16px' }}><p style={{ margin: 0, fontSize: 11.5, color: T.muted }}>Top project</p><div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: pTop.color }} /><p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.text }}>{pTop.name}</p></div><p style={{ margin: 0, fontSize: 11, color: pTop.color, fontWeight: 700 }}>{fmtMin(pTop.min)}</p></div>
                    </div>
                  </div>
                )}

                {/* TASKS */}
                {tab === 'Tasks' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ ...innerCard, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {taskBreak.map((t, i) => (
                        <div key={t.title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ width: 116, flexShrink: 0, fontSize: 12.5, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                          <div style={{ flex: 1, height: 16, borderRadius: 999, background: T.soft, overflow: 'hidden' }}>
                            <div style={{ width: barsIn ? (t.min / tMax * 100) + '%' : 0, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${t.color}, ${t.color}cc)`, transition: 'width .8s cubic-bezier(.22,1,.36,1) ' + (i * 55) + 'ms' }} />
                          </div>
                          <span style={{ width: 44, textAlign: 'right', fontSize: 12, fontWeight: 700, color: T.text }}>{fmtMin(t.min)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid ' + T.b1, paddingTop: 16, display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                      <div style={{ minWidth: 150 }}><p style={{ margin: 0, fontSize: 12.5, color: T.text2 }}>Total tracked</p><p style={{ margin: '4px 0 0', fontFamily: T.fDisp, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: T.text }}>{fmtMin(tTotal)}</p><p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>{taskBreak.length} task buckets, last 7 days</p></div>
                      <div style={{ flex: 1, minWidth: 220, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, alignContent: 'start' }}>
                        {taskBreak.map(t => (
                          <div key={t.title} style={{ borderRadius: 8, background: T.soft, padding: '7px 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}><span style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0 }} /><span style={{ fontSize: 11.5, color: T.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span></span><span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{(t.min / tTotal * 100).toFixed(1)}%</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Panel>

              {/* Productivity + Completed stacked */}
              <div className="pfd-stack">
                <Panel title="Productivity" action={<Menu items={rangeMenu(prodRange, setProdRange)} />}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: T.fDisp, fontSize: 40, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: T.text }}>{pct}%</div>
                      <p style={{ margin: '6px 0 0', fontSize: 12.5, color: T.text2 }}>Task completion rate</p>
                      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: T.text2, flexWrap: 'wrap' }}><span>vs previous {prodRange} days</span><Trend v={prodTrend} /></div>
                    </div>
                    <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from 220deg, #E6A609 0%, #F1613C ${Math.max(18, pct * 0.55)}%, #F6A48C ${pct}%, var(--surface-sunken) ${pct}% 100%)` }} />
                      <div style={{ position: 'absolute', inset: 22, borderRadius: '50%', background: T.panel }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}><span style={{ fontFamily: T.fDisp, fontSize: 17, fontWeight: 800, color: T.text }}>{pct}%</span><span style={{ fontSize: 10, color: T.muted }}>done</span></div>
                    </div>
                  </div>
                </Panel>

                <Panel title="Completed Task" action={<Menu items={rangeMenu(compRange, setCompRange)} />}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                      <div>
                        <div style={{ fontFamily: T.fDisp, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: T.text }}>{done}</div>
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: T.text2 }}><span>Total Completed</span><Trend v={compTrend} /></div>
                      </div>
                      <button onClick={() => onGoto && onGoto('tasks')} style={{ ...softBtn, height: 38, padding: '0 15px', fontSize: 12.5 }}>View all</button>
                    </div>
                    <div style={{ height: 132 }}><Area data={completedSeries} /></div>
                  </div>
                </Panel>
              </div>
            </div>

            {/* Urgent tasks */}
            <Panel title="Urgent Tasks" action={<button onClick={() => onGoto && onGoto('tasks')} style={{ ...softBtn, height: 46, padding: '0 18px', fontSize: 13.5 }}>See all tasks</button>}>
              {urgent.length === 0 ? (
                <div style={{ borderRadius: T.rLg, border: '1px dashed ' + T.b2, padding: '32px 16px', textAlign: 'center', fontSize: 13, color: T.muted }}>No urgent tasks yet.</div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: T.rLg, border: '1px solid ' + T.b1 }}>
                  <div className="pfd-utable">
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.9fr 0.8fr 0.8fr', gap: 16, padding: '14px 20px', background: T.soft, fontSize: 13, fontWeight: 600, color: T.text2 }}>
                      <span>Task Name</span><span>Assigned to</span><span>Due Date</span><span>Tags</span><span>Priority</span>
                    </div>
                    <div>
                      {urgent.map((t, i) => (
                        <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.9fr 0.8fr 0.8fr', gap: 16, alignItems: 'center', padding: '16px 20px', borderTop: '1px solid ' + T.b1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                            <button onClick={() => onToggleTask && onToggleTask(t.id)} style={{ width: 17, height: 17, borderRadius: '50%', border: '1.5px solid ' + T.b2, background: 'transparent', cursor: 'pointer', flexShrink: 0 }} aria-label="Complete task" />
                            <div style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span><span style={{ fontSize: 11.5, color: T.muted }}>{t.projName}</span></div>
                          </div>
                          <div style={{ display: 'flex' }}>{t.assignees.map((a, j) => <span key={j} style={{ marginLeft: j ? -8 : 0, borderRadius: '50%', boxShadow: j ? '0 0 0 2px ' + T.panel : 'none' }}><Avatar initials={a.initials} tone={a.tone} sz={32} /></span>)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text2 }}><span style={{ color: T.muted, display: 'inline-flex' }}><Cal sz={16} /></span>{dueLabel(t.due)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text2 }}><span style={{ color: T.muted, display: 'inline-flex' }}><TagI sz={15} /></span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.tag}</span></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: priTone(t.priority) }}><FlagI sz={15} />{t.priority}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>

        {/* ── right rail ── */}
        <aside className="pfd-rail">
            <div style={{ minWidth: 0 }}>
              <Panel title="Notifications" action={<button onClick={() => onGoto && onGoto('today')} style={{ ...softBtn, width: 40, height: 40, padding: 0, color: T.text2 }}><Ext sz={16} /></button>}>
                <div>
                  {notifications.map((n, i) => (
                    <article key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '15px 0', borderTop: i ? '1px solid ' + T.b1 : 'none' }}>
                      {n.kind === 'avatar' ? <span style={{ borderRadius: T.rLg, overflow: 'hidden' }}><Avatar initials={n.initials} tone={n.tone} sz={36} /></span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: T.rLg, background: n.kind === 'calendar' ? T.primary : T.green, color: '#fff', flexShrink: 0 }}>{n.kind === 'calendar' ? <Cal sz={18} /> : <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.28)' }}><Chk sz={13} /></span>}</span>}
                      <div style={{ minWidth: 0, paddingTop: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}><h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.text }}>{n.title}</h4><span style={{ fontSize: 11.5, color: T.muted }}>{n.time}</span></div>
                        <p style={{ margin: '3px 0 0', fontSize: 12.5, lineHeight: 1.35, color: T.text2 }}>{n.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            </div>
            <div style={{ minWidth: 0 }}>
              <Panel title="Recent Activity" action={<button onClick={() => onGoto && onGoto('today')} style={{ ...softBtn, width: 40, height: 40, padding: 0, color: T.text2 }}><Ext sz={16} /></button>}>
                <div>
                  {activity.map((a, i) => (
                    <article key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '15px 0', borderTop: i ? '1px solid ' + T.b1 : 'none' }}>
                      <span style={{ position: 'relative', flexShrink: 0 }}><Avatar initials={a.initials} tone={a.tone} sz={36} /><span style={{ position: 'absolute', right: 0, bottom: 0, width: 11, height: 11, borderRadius: '50%', border: '2px solid ' + T.panel, background: a.status === 'online' ? T.green : a.status === 'busy' ? T.red : T.muted }} /></span>
                      <div style={{ minWidth: 0, paddingTop: 1 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}><h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: T.text }}>{a.name}</h4><span style={{ fontSize: 11.5, color: T.muted }}>{a.time}</span></div>
                        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.35, color: T.text2 }}>{a.action}</p>
                        {a.detail && <div style={{ marginTop: 6, borderRadius: T.rMd, border: '1px solid ' + T.b1, padding: '6px 10px', fontSize: 12, color: T.text2, display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ color: T.primary, display: 'inline-flex' }}><FileI sz={14} /></span>{a.detail}</div>}
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            </div>
        </aside>
      </div>
    </div>
  );
}
window.DashboardScreen = DashboardScreen;
