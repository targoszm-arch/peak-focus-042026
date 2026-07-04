import React from "react";
// Shared helpers: PFProject (project/customer lookup), TaskRow, QuickAdd.
// Exposes window.PFProject, window.TaskRow, window.QuickAdd, window.PFChip.
(function () {
  const D = window.PFData;

  // lookup helpers
  window.PFProject = {
    get: (id) => D.projects.find(p => p.id === id) || null,
    customer: (cid) => D.customers.find(c => c.id === cid) || null,
    // returns {name, color} for a task's project (or Chores)
    tag(projectId) {
      if (!projectId) return { name: 'Chores', color: '--neutral-400' };
      const p = window.PFProject.get(projectId);
      if (!p) return { name: 'Chores', color: '--neutral-400' };
      const c = window.PFProject.customer(p.customer);
      return { name: p.name, color: c ? c.color : '--primary-500' };
    },
  };

  // small colored dot + label chip for a project
  window.PFChip = function PFChip({ projectId, size = 12 }) {
    const t = window.PFProject.tag(projectId);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(${t.color})`, flexShrink: 0 }} />
        {t.name}
      </span>
    );
  };
})();

// Lightweight styled hover tooltip. Wraps a trigger; shows `label` above it on
// hover, clamped so it never runs off either edge of the viewport.
function Tip({ label, children }) {
  const [show, setShow] = React.useState(false);
  const [dx, setDx] = React.useState(0);
  const wrapRef = React.useRef(null);
  const tipRef = React.useRef(null);
  React.useLayoutEffect(() => {
    if (!show || !tipRef.current || !wrapRef.current) return;
    const m = 8;
    const w = wrapRef.current.getBoundingClientRect();
    const tw = tipRef.current.getBoundingClientRect().width;
    const center = w.left + w.width / 2;
    const desiredLeft = center - tw / 2;
    const clampedLeft = Math.max(m, Math.min(desiredLeft, window.innerWidth - m - tw));
    setDx(clampedLeft - desiredLeft);
  }, [show, label]);
  return (
    <span
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => { setShow(false); setDx(0); }}
    >
      {children}
      {show && label && (
        <span ref={tipRef} style={{
          position: 'absolute', bottom: 'calc(100% + 7px)', left: '50%', transform: `translateX(calc(-50% + ${dx}px))`,
          background: 'var(--neutral-900, #111625)', color: '#fff', fontFamily: 'var(--font-sans)',
          fontSize: 11.5, fontWeight: 600, lineHeight: 1, padding: '6px 9px', borderRadius: 'var(--radius-sm)',
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 80, boxShadow: 'var(--shadow-md)',
        }}>
          {label}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: `translateX(calc(-50% - ${dx}px))`, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--neutral-900, #111625)' }} />
        </span>
      )}
    </span>
  );
}

// A single checkable task row. Props: task, onToggle, onOpen, showProject (default true), dense.
function TaskRow({ task, onToggle, onOpen, showProject = true, dense = false }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Checkbox, Icon } = NS;
  const D = window.PFData;
  const PD = window.PFDate;
  const overdue = !task.done && PD.bucket(task.due) === 'overdue';
  const prTone = { High: '--red-500', Medium: '--primary-500', Low: '--neutral-400' }[task.priority];
  const prColors = { High: '--red-500', Medium: '--primary-500', Low: '--neutral-400' };
  const editable = !!window.PFUpdateTask;
  const tag = window.PFProject.tag(task.project);
  const [menu, setMenu] = React.useState(null); // 'project' | 'priority' | 'due' | null
  const set = (patch) => { window.PFUpdateTask(task.id, patch); setMenu(null); };
  React.useEffect(() => { if (!menu) return; const h = () => setMenu(null); document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [menu]);
  const dueMap = { today: '2026-07-01', tomorrow: '2026-07-02', week: '2026-07-05', none: null };
  const menuBox = { position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40, background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 6, minWidth: 168, textAlign: 'left' };
  const menuItem = (sel) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', background: sel ? 'var(--surface-sunken)' : 'transparent', whiteSpace: 'nowrap' });
  const trigger = { display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: editable ? 'pointer' : 'default', padding: '3px 6px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', flexShrink: 0 };
  return (
    <div
      onClick={() => onOpen && onOpen(task)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: dense ? '9px 12px' : '12px 14px',
        background: 'var(--surface-card)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-soft)', cursor: onOpen ? 'pointer' : 'default',
        transition: 'border-color .15s, box-shadow .15s', opacity: task.done ? 0.6 : 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
    >
      <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex' }}>
        <Checkbox checked={task.done} onChange={() => onToggle && onToggle(task.id)} />
      </span>
      <span
        contentEditable={!!window.PFUpdateTask}
        suppressContentEditableWarning
        spellCheck={false}
        title="Click to edit"
        onClick={e => { if (window.PFUpdateTask) e.stopPropagation(); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
          else if (e.key === 'Escape') { e.currentTarget.textContent = task.name; e.currentTarget.blur(); }
        }}
        onFocus={e => { e.currentTarget.style.background = 'var(--surface-sunken)'; }}
        onBlur={e => {
          e.currentTarget.style.background = 'transparent';
          const v = e.currentTarget.textContent.trim();
          if (v && v !== task.name) window.PFUpdateTask(task.id, { name: v });
          else e.currentTarget.textContent = task.name;
        }}
        style={{
        flex: 1, minWidth: 0, fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
        color: 'var(--text-primary)', textDecoration: task.done ? 'line-through' : 'none',
        overflowWrap: 'anywhere', wordBreak: 'break-word',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        outline: 'none', borderRadius: 'var(--radius-sm)', padding: '2px 4px', margin: '-2px -4px', cursor: window.PFUpdateTask ? 'text' : 'inherit',
      }}>{task.name}</span>

      {/* category / project */}
      {showProject && (
        <span onClick={e => e.stopPropagation()} style={{ position: 'relative', flexShrink: 0 }}>
          <Tip label={editable ? `${tag.name} · change category` : tag.name}>
          <button onClick={() => editable && setMenu(menu === 'project' ? null : 'project')} title={undefined} style={{ ...trigger, fontSize: 12, color: 'var(--text-secondary)' }}
            onMouseEnter={e => { if (editable) e.currentTarget.style.background = 'var(--surface-sunken)'; }} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(${tag.color})` }} /> <span className="pf-hide-narrow">{tag.name}</span>
          </button>
          </Tip>
          {menu === 'project' && (
            <div style={{ ...menuBox, maxHeight: 260, overflowY: 'auto' }}>
              <div style={menuItem(task.project === null)} onClick={() => set({ project: null })}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neutral-400)' }} /> Chores</div>
              {D.customers.map(c => (
                <React.Fragment key={c.id}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '8px 10px 4px' }}>{c.name}</div>
                  {D.projects.filter(p => p.customer === c.id).map(p => (
                    <div key={p.id} style={menuItem(task.project === p.id)} onClick={() => set({ project: p.id })}><span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(${c.color})` }} /> {p.name}</div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}
        </span>
      )}

      {/* priority */}
      <span onClick={e => e.stopPropagation()} style={{ position: 'relative', flexShrink: 0 }}>
        <Tip label={editable ? `${task.priority} priority · change` : `${task.priority} priority`}>
        <button onClick={() => editable && setMenu(menu === 'priority' ? null : 'priority')} title={undefined} style={{ ...trigger, color: `var(${prTone})`, padding: '3px 4px' }}
          onMouseEnter={e => { if (editable) e.currentTarget.style.background = 'var(--surface-sunken)'; }} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Icon name="FlagProperty1Bold" size={15} />
        </button>
        </Tip>
        {menu === 'priority' && (
          <div style={menuBox}>
            {['High', 'Medium', 'Low'].map(p => (
              <div key={p} style={menuItem(task.priority === p)} onClick={() => set({ priority: p })}>
                <Icon name="FlagProperty1Bold" size={14} style={{ color: `var(${prColors[p]})` }} /> {p}
              </div>
            ))}
          </div>
        )}
      </span>

      {/* due */}
      <span onClick={e => e.stopPropagation()} style={{ position: 'relative', flexShrink: 0 }}>
        <Tip label={editable ? `${PD.label(task.due)} · set date` : PD.label(task.due)}>
        <button className="pf-due-btn" onClick={() => editable && setMenu(menu === 'due' ? null : 'due')} title={undefined} style={{ ...trigger, gap: 5, minWidth: 78, justifyContent: 'flex-end', fontSize: 12, fontWeight: 600, color: overdue ? 'var(--red-500)' : 'var(--text-tertiary)' }}
          onMouseEnter={e => { if (editable) e.currentTarget.style.background = 'var(--surface-sunken)'; }} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Icon name="CalendarProperty1Linear" size={13} /> <span className="pf-hide-narrow">{PD.label(task.due)}</span>
        </button>
        </Tip>
        {menu === 'due' && (
          <div style={menuBox}>
            {[['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'This week'], ['none', 'Someday']].map(([k, l]) => (
              <div key={k} style={menuItem(false)} onClick={() => set({ due: dueMap[k] })}>
                <Icon name="CalendarProperty1Linear" size={14} style={{ color: 'var(--text-tertiary)' }} /> {l}
              </div>
            ))}
          </div>
        )}
      </span>

      {/* row actions: add-to-focus + edit */}
      <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        {window.PFFocus && (() => {
          const queued = window.PFFocus.has(task.id);
          return (
            <Tip label={queued ? 'In focus queue' : 'Add to focus'}>
            <button onClick={() => queued ? window.PFFocus.remove(task.id) : window.PFFocus.add(task.id)}
              style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: 'none', background: queued ? 'var(--primary-50)' : 'transparent', cursor: 'pointer', color: queued ? 'var(--primary-500)' : 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              onMouseEnter={e => { if (!queued) e.currentTarget.style.color = 'var(--primary-500)'; }} onMouseLeave={e => { if (!queued) e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
              <Icon name="TimerProperty1Bold" size={15} />
            </button>
            </Tip>
          );
        })()}
        {window.PFEditTask && (
          <Tip label="Edit task">
          <button onClick={() => window.PFEditTask(task)}
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-500)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
            <Icon name="EditProperty1Linear" size={15} />
          </button>
          </Tip>
        )}
      </span>
    </div>
  );
}
window.TaskRow = TaskRow;

// Low-friction quick add. Defaults new task to Chores; optional priority + project + due popovers.
// Props: onAdd({name, project, priority, due}), defaultProject (null=Chores), autoFocus, placeholder.
function QuickAdd({ onAdd, defaultProject = null, autoFocus = false, placeholder = 'Add a task…  (goes to Chores)' }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon } = NS;
  const D = window.PFData;
  const [name, setName] = React.useState('');
  const [priority, setPriority] = React.useState('Medium');
  const [project, setProject] = React.useState(defaultProject);
  const [due, setDue] = React.useState('today');
  const [menu, setMenu] = React.useState(null); // 'priority' | 'project' | 'due' | null
  const inputRef = React.useRef(null);

  React.useEffect(() => { if (autoFocus && inputRef.current) inputRef.current.focus(); }, [autoFocus]);

  const dueMap = { today: '2026-07-01', tomorrow: '2026-07-02', week: '2026-07-05', none: null };
  const submit = () => {
    const n = name.trim();
    if (!n) return;
    onAdd({ name: n, project, priority, due: dueMap[due] });
    setName(''); setMenu(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const prColor = { High: '--red-500', Medium: '--primary-500', Low: '--neutral-400' }[priority];
  const projTag = window.PFProject.tag(project);
  const dueLabel = { today: 'Today', tomorrow: 'Tomorrow', week: 'This week', none: 'Someday' }[due];

  const pill = (active) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 10px',
    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-soft)',
    background: active ? 'var(--surface-sunken)' : 'var(--surface-card)', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap',
  });
  const menuBox = { position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 20, background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 6, minWidth: 170 };
  const menuItem = (sel) => ({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-primary)', background: sel ? 'var(--surface-sunken)' : 'transparent' });

  return (
    <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-lg)', padding: 12, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'var(--secondary-500)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="AddProperty1Bold" size={20} />
        </span>
        <input
          ref={inputRef} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--text-primary)' }}
        />
        <button onClick={submit} disabled={!name.trim()} style={{
          height: 34, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none',
          background: name.trim() ? 'var(--primary-500)' : 'var(--neutral-200)',
          color: name.trim() ? '#fff' : 'var(--text-tertiary)', fontFamily: 'var(--font-sans)',
          fontSize: 13, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default', flexShrink: 0,
        }}>Add</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingLeft: 44, flexWrap: 'wrap' }}>
        {/* priority */}
        <div style={{ position: 'relative' }}>
          <div style={pill(menu === 'priority')} onClick={() => setMenu(menu === 'priority' ? null : 'priority')}>
            <Icon name="FlagProperty1Bold" size={13} style={{ color: `var(${prColor})` }} /> {priority}
          </div>
          {menu === 'priority' && (
            <div style={menuBox}>
              {['High', 'Medium', 'Low'].map(p => (
                <div key={p} style={menuItem(p === priority)} onClick={() => { setPriority(p); setMenu(null); }}>
                  <Icon name="FlagProperty1Bold" size={14} style={{ color: `var(${{ High: '--red-500', Medium: '--primary-500', Low: '--neutral-400' }[p]})` }} /> {p}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* project */}
        <div style={{ position: 'relative' }}>
          <div style={pill(menu === 'project')} onClick={() => setMenu(menu === 'project' ? null : 'project')}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(${projTag.color})` }} /> {projTag.name}
          </div>
          {menu === 'project' && (
            <div style={{ ...menuBox, maxHeight: 260, overflowY: 'auto' }}>
              <div style={menuItem(project === null)} onClick={() => { setProject(null); setMenu(null); }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neutral-400)' }} /> Chores
              </div>
              {D.customers.map(c => (
                <React.Fragment key={c.id}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '8px 10px 4px' }}>{c.name}</div>
                  {D.projects.filter(p => p.customer === c.id).map(p => (
                    <div key={p.id} style={menuItem(project === p.id)} onClick={() => { setProject(p.id); setMenu(null); }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: `var(${c.color})` }} /> {p.name}
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        {/* due */}
        <div style={{ position: 'relative' }}>
          <div style={pill(menu === 'due')} onClick={() => setMenu(menu === 'due' ? null : 'due')}>
            <Icon name="CalendarProperty1Linear" size={13} /> {dueLabel}
          </div>
          {menu === 'due' && (
            <div style={menuBox}>
              {[['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'This week'], ['none', 'Someday']].map(([k, l]) => (
                <div key={k} style={menuItem(due === k)} onClick={() => { setDue(k); setMenu(null); }}>
                  <Icon name="CalendarProperty1Linear" size={14} style={{ color: 'var(--text-tertiary)' }} /> {l}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
window.QuickAdd = QuickAdd;
