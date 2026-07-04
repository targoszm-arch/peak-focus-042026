import React from "react";
// Project detail — header with progress, its task list (grouped open/done),
// inline quick-add scoped to this project. Exposes window.ProjectDetailScreen.
function ProjectDetailScreen({ projectId, tasks, onToggleTask, onAddTask, onBack }) {
  const { useState } = React;
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon, ProgressBar, AvatarGroup } = NS;
  const D = window.PFData;
  const PD = window.PFDate;
  const p = window.PFProject.get(projectId);
  const c = p ? window.PFProject.customer(p.customer) : null;
  if (!p) return null;

  const list = tasks.filter(t => t.project === projectId);
  const open = list.filter(t => !t.done);
  const done = list.filter(t => t.done);
  const pct = list.length ? Math.round(done.length / list.length * 100) : 0;
  // unique team members assigned across this project's tasks
  const teamMap = new Map();
  list.forEach(t => (t.assignees || []).forEach(a => teamMap.set(a.id || a.name, a)));
  const team = [...teamMap.values()];

  return (
    <div className="pf-page" style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 32px 48px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600 }}>
          <Icon name="ArrowLeftProperty1Linear" size={16} /> Projects
        </button>
        <span style={{ flex: 1 }} />
        {window.PFEditProject && (
          <button onClick={() => window.PFEditProject(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700 }}>
            <Icon name="EditProperty1Linear" size={15} /> Edit project
          </button>
        )}
      </div>

      {/* header card */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ width: 46, height: 46, borderRadius: 'var(--radius-lg)', background: `color-mix(in srgb, var(${c.color}) 14%, white)`, color: `var(${c.color})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="FolderProperty1Bold" size={24} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              contentEditable={!!window.PFUpdateProject}
              suppressContentEditableWarning
              spellCheck={false}
              title="Click to edit"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } else if (e.key === 'Escape') { e.currentTarget.textContent = p.name; e.currentTarget.blur(); } }}
              onFocus={e => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
              onBlur={e => { e.currentTarget.style.background = 'transparent'; const v = e.currentTarget.textContent.trim(); if (v && v !== p.name) window.PFUpdateProject(p.id, { name: v }); else e.currentTarget.textContent = p.name; }}
              style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', outline: 'none', borderRadius: 'var(--radius-sm)', padding: '2px 5px', margin: '-2px -5px', cursor: window.PFUpdateProject ? 'text' : 'inherit' }}>{p.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(${c.color})` }} /> {c.name}
              <span style={{ color: 'var(--text-tertiary)' }}>·</span>
              <Icon name="CalendarProperty1Linear" size={13} style={{ color: 'var(--text-tertiary)' }} /> Due {PD.label(p.due)}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>{pct}%</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>{done.length}/{list.length} done</div>
          </div>
        </div>
        <ProgressBar value={pct} height={8} tone={pct === 100 ? 'success' : 'primary'} />
        {team.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border-soft)' }}>
            <AvatarGroup users={team.map(a => ({ name: a.name }))} size={28} max={5} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{team.length} {team.length === 1 ? 'member' : 'members'}</span>
            <span style={{ flex: 1 }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-tertiary)' }}>
              <Icon name="TaskSquareProperty1Linear" size={14} /> {open.length} open · {done.length} done
            </span>
          </div>
        )}
      </div>

      <window.QuickAdd onAdd={(t) => onAddTask({ ...t, project: projectId })} defaultProject={projectId} placeholder={`Add a task to ${p.name}…`} />

      {/* open tasks */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 10px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-secondary)' }}>To do</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{open.length}</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {open.length === 0
            ? <div style={{ padding: 22, textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: 14, background: 'var(--surface-card)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)' }}>No open tasks — this project is all caught up.</div>
            : open.map(t => <window.TaskRow key={t.id} task={t} onToggle={onToggleTask} showProject={false} />)}
        </div>
      </div>

      {/* done */}
      {done.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 2px 10px' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-secondary)' }}>Done</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>{done.length}</span>
            <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {done.map(t => <window.TaskRow key={t.id} task={t} onToggle={onToggleTask} showProject={false} />)}
          </div>
        </div>
      )}
    </div>
  );
}
window.ProjectDetailScreen = ProjectDetailScreen;
