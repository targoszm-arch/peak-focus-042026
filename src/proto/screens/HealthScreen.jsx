import React from "react";
// Health — Oura-style daily readout: metric cards with sparklines, a paginated
// day-by-day sleep chart (7 days at a time, prev/next week), and a 30-day summary.
// Exposes window.HealthScreen.
function HealthScreen() {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon } = NS;
  const D = window.PFData;
  const H = D.health;

  // Sync from Oura (simulated pull)
  const [syncing, setSyncing] = React.useState(false);
  const [updated, setUpdated] = React.useState(H.updated);
  const doSync = () => { if (syncing) return; setSyncing(true); setTimeout(() => { setSyncing(false); setUpdated('just now'); }, 1300); };
  const RefreshGlyph = ({ size = 14, spin }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spin ? 'pf-spin .8s linear infinite' : 'none' }}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
    </svg>
  );

  const toneVar = (tone) => tone === 'accent' ? '--secondary-500' : tone === 'success' ? '--green-600' : '--primary-500';
  const toneSoft = (tone) => tone === 'accent' ? '--secondary-50' : tone === 'success' ? '--green-50' : '--primary-50';

  // whether a trend reads as good (lower is better for HR / respiration)
  const quality = (m) => {
    if (!m.trend || m.trend === 'flat') return 'flat';
    const lowerBetter = m.key === 'restingHr' || m.key === 'respRate';
    const good = lowerBetter ? m.trend === 'down' : m.trend === 'up';
    return good ? 'good' : 'bad';
  };

  // ── sparkline ──
  const Spark = ({ data, color }) => {
    const w = 96, h = 30, pad = 3;
    const min = Math.min(...data), max = Math.max(...data);
    const span = max - min || 1;
    const pts = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / span) * (h - pad * 2);
      return [x, y];
    });
    const line = pts.map(p => p.join(',')).join(' ');
    const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
    const gid = 'sg' + Math.round(color.length * 97);
    return (
      <svg width={w} height={h} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`var(${color})`} stopOpacity="0.18" />
            <stop offset="100%" stopColor={`var(${color})`} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gid})`} />
        <polyline points={line} fill="none" stroke={`var(${color})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={`var(${color})`} />
      </svg>
    );
  };

  // ── metric card ──
  const Card = ({ m }) => {
    const q = quality(m);
    const chipColor = q === 'good' ? '--green-600' : q === 'bad' ? '--red-500' : '--text-tertiary';
    const chipBg = q === 'good' ? '--green-50' : q === 'bad' ? '--red-50' : '--surface-sunken';
    return (
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: `var(${toneSoft(m.tone)})`, color: `var(${toneVar(m.tone)})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={m.icon} size={16} />
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{m.value}</span>
              {m.unit ? <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>{m.unit}</span> : null}
            </div>
            {m.delta ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 7, height: 20, padding: '0 7px', borderRadius: 'var(--radius-full)', background: `var(${chipBg})`, color: `var(${chipColor})`, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700 }}>
                {q !== 'flat' && <Icon name={m.trend === 'up' ? 'ArrowUpProperty1Bold' : 'ArrowDownProperty1Bold'} size={10} />}
                {m.delta}
              </span>
            ) : null}
          </div>
          {m.spark
            ? <div style={{ flexShrink: 0 }}><Spark data={m.spark} color={toneVar(m.tone)} /></div>
            : m.moodScale != null
              ? <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  {[1, 2, 3, 4, 5].map(n => <span key={n} style={{ width: 8, height: 8, borderRadius: '50%', background: n <= m.moodScale ? `var(${toneVar(m.tone)})` : 'var(--surface-sunken)' }} />)}
                </div>
              : null}
        </div>
      </div>
    );
  };

  // ── sleep pagination ──
  const log = H.sleepLog;
  const N = log.length;
  const maxOffset = Math.floor((N - 7) / 7);          // 0 = latest week
  const [weekOffset, setWeekOffset] = React.useState(0);
  const end = N - weekOffset * 7;                       // exclusive
  const start = Math.max(0, end - 7);
  const meta = (k) => {
    const gi = start + k;
    const daysAgo = (N - 1) - gi;
    const date = new Date(window.PF_TODAY.getTime() - daysAgo * 86400000);
    return { date, isToday: daysAgo === 0 };
  };
  const sleepDays = log.slice(start, end).map((d, k) => ({ ...meta(k), val: d.h, score: d.s }));
  const stepDays = (H.stepsLog || []).slice(start, end).map((v, k) => ({ ...meta(k), val: v }));
  const fmt = (dt) => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const rangeLabel = sleepDays.length ? `${fmt(sleepDays[0].date)} – ${fmt(sleepDays[sleepDays.length - 1].date)}` : '';
  const avgH = sleepDays.reduce((s, d) => s + d.val, 0) / (sleepDays.length || 1);
  const avgSteps = stepDays.reduce((s, d) => s + d.val, 0) / (stepDays.length || 1);
  const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // one stacked bar chart — shorter, shared week window
  const DayBars = ({ days, max, strong, soft, height, fmtVal }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, alignItems: 'end', height, marginTop: 10 }}>
      {days.map((d, i) => {
        const bh = Math.max(5, Math.round((d.val / max) * (height - 34)));
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{fmtVal(d.val)}</span>
            <div style={{ width: '100%', maxWidth: 40, height: bh, borderRadius: 'var(--radius-sm)', background: d.isToday ? `var(${strong})` : `var(${soft})`, transition: 'height .2s ease' }} />
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontWeight: 700, color: d.isToday ? `var(${strong})` : 'var(--text-tertiary)' }}>{WD[d.date.getDay()]} {d.date.getDate()}</div>
          </div>
        );
      })}
    </div>
  );
  const fmtHours = (v) => v.toFixed(1);
  const fmtSteps = (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(v);

  const navBtn = (dir, disabled) => (
    <button onClick={() => setWeekOffset(o => Math.min(maxOffset, Math.max(0, o + (dir === 'prev' ? 1 : -1))))} disabled={disabled}
      title={dir === 'prev' ? 'Previous week' : 'Next week'}
      style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: disabled ? 'default' : 'pointer', color: disabled ? 'var(--neutral-300)' : 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={dir === 'prev' ? 'ArrowLeftProperty1Linear' : 'ArrowRightProperty1Linear'} size={16} />
    </button>
  );

  return (
    <div className="pf-page" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Health</h1>
          <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)' }}>Synced from {H.device} · {updated}</p>
        </div>
        <button onClick={doSync} disabled={syncing} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: syncing ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: syncing ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
          <RefreshGlyph size={14} spin={syncing} /> {syncing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      {/* day-by-day: sleep + steps as two separate cards */}
      <div className="pf-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* sleep card */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--primary-500)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Sleep</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>avg {avgH.toFixed(1)}h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {navBtn('prev', weekOffset >= maxOffset)}
              {navBtn('next', weekOffset <= 0)}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{rangeLabel}</div>
          <DayBars days={sleepDays} max={9} strong="--primary-500" soft="--primary-200" height={104} fmtVal={fmtHours} />
        </div>

        {/* steps card */}
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--secondary-500)' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Steps</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>avg {fmtSteps(Math.round(avgSteps))}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {navBtn('prev', weekOffset >= maxOffset)}
              {navBtn('next', weekOffset <= 0)}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{rangeLabel}</div>
          <DayBars days={stepDays} max={12000} strong="--secondary-500" soft="--secondary-100" height={104} fmtVal={fmtSteps} />
        </div>
      </div>

      {/* metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {H.metrics.map(m => <Card key={m.key} m={m} />)}
      </div>

      {/* 30-day summary + streak */}
      <div className="pf-2col" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: '6px 20px' }}>
          {H.summary.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: i < H.summary.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--text-secondary)' }}>{s.label}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700, color: s.trend === 'up' ? 'var(--green-600)' : 'var(--text-primary)' }}>
                {s.trend === 'up' && <Icon name="ArrowUpProperty1Bold" size={12} />}
                {s.value}
              </span>
            </div>
          ))}
        </div>
        <div style={{ background: 'linear-gradient(150deg, var(--primary-500), var(--primary-700))', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{H.streak.value}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, opacity: 0.9, marginTop: 6 }}>{H.streak.label}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, opacity: 0.75, marginTop: 10 }}>Keep logging to grow your streak.</div>
        </div>
      </div>
    </div>
  );
}
window.HealthScreen = HealthScreen;
