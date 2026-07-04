import React from "react";
// Projects — a grouped directory (My Projects · Favourites · Finished), styled after
// the Planix project-board reference but in Peak Focus warm-blue tokens.
// Collapsible tinted sections, search, star-to-favourite, progress rows.
// Exposes window.ProjectsScreen.
function ProjectsScreen({ tasks, onOpenProject }) {
  const { useState, useEffect } = React;
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon, ProgressBar, AvatarGroup } = NS;
  const D = window.PFData;
  const PD = window.PFDate;

  // top-level view across the projects workspace
  const VIEW_KEY = 'pf.projects.view';
  const [view, setView] = useState(() => { try { return localStorage.getItem(VIEW_KEY) || 'list'; } catch { return 'list'; } });
  const setV = (v) => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch {} };
  const projectTasks = tasks.filter(t => t.project);

  const custById = Object.fromEntries(D.customers.map(c => [c.id, c]));

  // ── per-project stats ──
  const stat = (pid) => {
    const list = tasks.filter(t => t.project === pid);
    const done = list.filter(t => t.done).length;
    const openDue = list.filter(t => !t.done && ['overdue', 'today'].includes(PD.bucket(t.due))).length;
    const teamMap = new Map();
    list.forEach(t => (t.assignees || []).forEach(a => teamMap.set(a.id || a.name, a)));
    return { total: list.length, done, pct: list.length ? Math.round(done / list.length * 100) : 0, openDue, team: [...teamMap.values()] };
  };

  // ── favourites (persisted) ──
  const STAR_KEY = 'pf.projects.starred';
  const [starred, setStarred] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(STAR_KEY) || '["website"]')); }
    catch { return new Set(['website']); }
  });
  const toggleStar = (id) => setStarred(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    try { localStorage.setItem(STAR_KEY, JSON.stringify([...next])); } catch {}
    return next;
  });

  // ── search ──
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const match = (p) => !q || p.name.toLowerCase().includes(q) || (custById[p.customer]?.name || '').toLowerCase().includes(q);

  // ── section buckets ──
  const withStat = D.projects.map(p => ({ ...p, s: stat(p.id) }));
  const finished = withStat.filter(p => p.s.total > 0 && p.s.pct === 100 && match(p));
  const finishedIds = new Set(finished.map(p => p.id));
  const visible = withStat.filter(p => !finishedIds.has(p.id) && match(p));
  const favourites = visible.filter(p => starred.has(p.id));

  // ── collapse state (persisted) ──
  const COL_KEY = 'pf.projects.collapsed';
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(COL_KEY) || '{}'); } catch { return {}; }
  });
  const toggleSec = (k) => setCollapsed(prev => {
    const next = { ...prev, [k]: !prev[k] };
    try { localStorage.setItem(COL_KEY, JSON.stringify(next)); } catch {}
    return next;
  });

  // section tints
  const SECTIONS = {
    visible:    { tint: 'var(--primary-500)', strong: 'var(--primary-700)', icon: 'FolderProperty1Bold',    label: 'My Projects' },
    favourites: { tint: 'var(--yellow-500)',  strong: '#B47D06',            icon: 'StarProperty1Bold',       label: 'Favourites' },
    finished:   { tint: 'var(--green-600)',   strong: '#1F7757',            icon: 'TickCircleProperty1Bold', label: 'Finished' },
  };

  const projectRow = (p, sec) => {
    const c = custById[p.customer] || {};
    const s = p.s;
    const isStar = starred.has(p.id);
    return (
      <button key={sec + '-' + p.id} onClick={() => onOpenProject(p.id)} style={{
        display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '11px 12px', borderRadius: 'var(--radius-md)', border: '1px solid transparent', background: 'transparent',
        transition: 'background .13s, border-color .13s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = `color-mix(in srgb, ${SECTIONS[sec].tint} 8%, white)`; e.currentTarget.style.borderColor = `color-mix(in srgb, ${SECTIONS[sec].tint} 20%, var(--border-soft))`; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
        {/* avatar tile */}
        <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-md)', background: `color-mix(in srgb, var(${c.color}) 15%, white)`, color: `var(${c.color})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 800 }}>
          {c.initial}
        </span>
        {/* name + client */}
        <span style={{ minWidth: 0, flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
        </span>
        {/* progress */}
        <span style={{ flex: '0 1 150px', minWidth: 96, display: 'none', flexDirection: 'column', gap: 5 }} className="pf-proj-progress">
          <span style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span>{s.done}/{s.total}</span><span>{s.pct}%</span>
          </span>
          <ProgressBar value={s.pct} height={6} tone={s.pct === 100 ? 'success' : 'primary'} />
        </span>
        {/* due */}
        <span style={{ flexShrink: 0, display: 'none', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: s.openDue > 0 ? 'var(--red-500)' : 'var(--text-tertiary)' }} className="pf-proj-due">
          <Icon name="CalendarProperty1Linear" size={13} /> {PD.label(p.due)}
        </span>
        {/* team */}
        <span style={{ flexShrink: 0, display: 'none' }} className="pf-proj-team">
          {s.team.length > 0 && <AvatarGroup users={s.team.map(a => ({ name: a.name }))} size={24} max={3} />}
        </span>
        {/* star toggle */}
        <span role="button" title={isStar ? 'Remove from favourites' : 'Add to favourites'} onClick={e => { e.stopPropagation(); toggleStar(p.id); }}
          style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isStar ? 'var(--yellow-500)' : 'var(--text-tertiary)' }}
          onMouseEnter={e => { if (!isStar) e.currentTarget.style.color = 'var(--yellow-500)'; }}
          onMouseLeave={e => { if (!isStar) e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
          <Icon name={isStar ? 'StarProperty1Bold' : 'StarProperty1Linear'} size={17} />
        </span>
      </button>
    );
  };

  const section = (key, list, emptyText) => {
    const cfg = SECTIONS[key];
    const isCollapsed = !!collapsed[key];
    return (
      <div style={{
        borderRadius: 'var(--radius-xl)', padding: 8,
        border: `1px solid color-mix(in srgb, ${cfg.tint} 18%, var(--border-soft))`,
        background: `linear-gradient(180deg, color-mix(in srgb, ${cfg.tint} 6%, white) 0%, var(--surface-card) 70%)`,
      }}>
        <button onClick={() => toggleSec(key)} aria-expanded={!isCollapsed} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10,
          padding: '7px 8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Icon name={cfg.icon} size={17} style={{ color: cfg.tint }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{cfg.label}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <span style={{
              minWidth: 26, height: 21, padding: '0 7px', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700, color: cfg.strong,
              border: `1px solid color-mix(in srgb, ${cfg.tint} 30%, white)`, background: `color-mix(in srgb, ${cfg.tint} 13%, white)`,
            }}>{list.length}</span>
            <Icon name="ArrowDownProperty1Linear" size={15} style={{ color: 'var(--text-tertiary)', transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform .2s' }} />
          </span>
        </button>
        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            {list.length > 0
              ? list.map(p => projectRow(p, key))
              : <div style={{ padding: '10px 12px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-tertiary)' }}>{emptyText}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pf-page" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
      <style>{`@media (min-width: 720px){ .pf-proj-progress{display:flex !important;} .pf-proj-star-wide{display:inline-flex;} } @media (min-width: 860px){ .pf-proj-due{display:inline-flex !important;} } @media (min-width: 980px){ .pf-proj-team{display:inline-flex !important;} }`}</style>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Projects</h1>
          <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)' }}>{D.projects.length} projects across {D.customers.length} clients</p>
        </div>
        {window.PFEditProject && (
          <button onClick={() => window.PFEditProject(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary-500)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700, boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
            <Icon name="AddProperty1Bold" size={17} /> New project
          </button>
        )}
      </div>

      {/* search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-soft)', background: 'var(--surface-card)' }}>
        <Icon name="SearchNormalProperty1Linear" size={17} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for a project or client"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }} />
      </div>

      {/* view switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 4, background: 'var(--surface-sunken, var(--surface-page))', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-soft)', alignSelf: 'flex-start' }}>
        {[['list', 'List', 'FolderProperty1Linear'], ['board', 'Board', 'Element3Property1Linear'], ['timeline', 'Timeline', 'ChartProperty1Linear'], ['calendar', 'Calendar', 'CalendarProperty1Linear']].map(([k, label, ic]) => (
          <button key={k} onClick={() => setV(k)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 13px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
            background: view === k ? 'var(--surface-card)' : 'transparent',
            color: view === k ? 'var(--text-primary)' : 'var(--text-secondary)',
            boxShadow: view === k ? 'var(--shadow-sm)' : 'none', transition: 'background .12s, color .12s',
          }}>
            <Icon name={ic} size={15} /> {label}
          </button>
        ))}
      </div>

      {view === 'board' && <window.KanbanView tasks={projectTasks} onMove={(id, status) => window.PFMoveTask && window.PFMoveTask(id, status)} onOpen={window.PFEditTask} />}
      {view === 'timeline' && <window.TimelineView tasks={projectTasks} onOpen={window.PFEditTask} />}
      {view === 'calendar' && <window.CalendarView tasks={projectTasks} onToggleTask={() => {}} onOpen={window.PFEditTask} />}

      {view === 'list' && (<>
      {/* sections */}
      {section('visible', visible, q ? 'No projects match this search.' : 'No active projects.')}
      {section('favourites', favourites, 'No starred projects yet — tap the star on any project.')}
      {section('finished', finished, 'No finished projects yet.')}
      </>)}
    </div>
  );
}
window.ProjectsScreen = ProjectsScreen;
