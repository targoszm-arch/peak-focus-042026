import React from "react";
// Edit / create modals for tasks and projects. Exposes window.TaskEditModal
// and window.ProjectEditModal. Both use a shared ModalShell.
(function () {
  const NS = window.PeakFocusDesignSystem_2ecfec;

  const overlay = { position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(17,22,37,.42)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '11vh', backdropFilter: 'blur(2px)' };
  const fieldLabel = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-tertiary)', marginBottom: 7 };
  const inputStyle = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };
  const ghostBtn = { height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700, color: 'var(--text-secondary)' };
  const primaryBtn = { height: 40, padding: '0 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary-500)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700 };

  function ModalShell({ title, icon, onClose, children, footer, width }) {
    const { Icon } = NS;
    return (
      <div onClick={onClose} style={overlay}>
        <div onClick={e => e.stopPropagation()} style={{ width: width || 520, maxWidth: '92vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', animation: 'pf-pop .2s ease both', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
            <span style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', color: 'var(--primary-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={18} /></span>
            <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{title}</span>
            <button onClick={onClose} title="Close" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', padding: 2 }}><Icon name="CloseCircleProperty1Linear" size={22} /></button>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>{children}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderTop: '1px solid var(--border-soft)', background: 'var(--surface-sunken)', flexShrink: 0 }}>{footer}</div>
        </div>
      </div>
    );
  }

  // ---- Task edit ----
  function TaskEditModal({ task, onSave, onDelete, onClose }) {
    const { Icon } = NS;
    const D = window.PFData;
    const [name, setName] = React.useState(task.name);
    const [priority, setPriority] = React.useState(task.priority);
    const [project, setProject] = React.useState(task.project || '');
    const [due, setDue] = React.useState(task.due || '');
    // execution checklist — seed from an existing checklist, else synthesise from subtask counts
    const seedList = () => {
      if (Array.isArray(task.checklist) && task.checklist.length) return task.checklist.map((c, i) => ({ id: c.id || 'c' + i, text: c.text, done: !!c.done }));
      const s = task.subtasks;
      if (s && s.total) return Array.from({ length: s.total }, (_, i) => ({ id: 'c' + i, text: 'Step ' + (i + 1), done: i < s.done }));
      return [];
    };
    const [checklist, setChecklist] = React.useState(seedList);
    const [draft, setDraft] = React.useState('');
    const addItem = () => { const t = draft.trim(); if (!t) return; setChecklist(l => [...l, { id: 'c' + Date.now(), text: t, done: false }]); setDraft(''); };
    const toggleItem = (id) => setChecklist(l => l.map(c => c.id === id ? { ...c, done: !c.done } : c));
    const editItem = (id, text) => setChecklist(l => l.map(c => c.id === id ? { ...c, text } : c));
    const removeItem = (id) => setChecklist(l => l.filter(c => c.id !== id));
    const doneCount = checklist.filter(c => c.done).length;

    const save = () => { const n = name.trim(); if (!n) return; const cl = checklist.filter(c => c.text.trim()).map(c => ({ id: c.id, text: c.text.trim(), done: c.done })); onSave(task.id, { name: n, priority, project: project || null, due: due || null, checklist: cl, subtasks: cl.length ? { done: cl.filter(c => c.done).length, total: cl.length } : null }); onClose(); };
    const prColors = { High: '--red-500', Medium: '--primary-500', Low: '--neutral-400' };

    return (
      <ModalShell title="Edit task" icon="EditProperty1Linear" width={676} onClose={onClose} footer={
        <React.Fragment>
          <button onClick={() => { onDelete(task.id); onClose(); }} style={{ ...ghostBtn, color: 'var(--red-500)', borderColor: 'var(--red-100)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="TrashProperty1Linear" size={15} /> Delete</button>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={save} style={primaryBtn}>Save changes</button>
        </React.Fragment>
      }>
        <div>
          <label style={fieldLabel}>Task</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} style={inputStyle} placeholder="Task name" />
        </div>
        <div>
          <label style={fieldLabel}>Priority</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['High', 'Medium', 'Low'].map(p => {
              const on = priority === p; const col = prColors[p];
              return (
                <button key={p} onClick={() => setPriority(p)} style={{ flex: 1, height: 40, borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid ' + (on ? `var(${col})` : 'var(--border-strong)'), background: on ? `color-mix(in srgb, var(${col}) 12%, white)` : 'var(--surface-card)', color: on ? `var(${col})` : 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="FlagProperty1Bold" size={13} /> {p}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Project</label>
            <select value={project} onChange={e => setProject(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Chores (no project)</option>
              {D.customers.map(c => (
                <optgroup key={c.id} label={c.name}>
                  {D.projects.filter(p => p.customer === c.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Due date</label>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
            <label style={{ ...fieldLabel, marginBottom: 0 }}>Execution checklist</label>
            {checklist.length > 0 && <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700, color: 'var(--text-tertiary)' }}>{doneCount}/{checklist.length} done</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {checklist.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-soft)', background: 'var(--surface-card)' }}>
                <button onClick={() => toggleItem(c.id)} title={c.done ? 'Mark not done' : 'Mark done'} style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (c.done ? 'var(--primary-500)' : 'var(--border-strong)'), background: c.done ? 'var(--primary-500)' : 'transparent', color: '#fff', padding: 0 }}>
                  {c.done && <Icon name="TickCircleProperty1Bold" size={14} />}
                </button>
                <input value={c.text} onChange={e => editItem(c.id, e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 13.5, color: c.done ? 'var(--text-tertiary)' : 'var(--text-primary)', textDecoration: c.done ? 'line-through' : 'none' }} />
                <button onClick={() => removeItem(c.id)} title="Remove step" style={{ flexShrink: 0, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', padding: 2 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red-500)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}><Icon name="CloseCircleProperty1Linear" size={17} /></button>
              </div>
            ))}
            {checklist.length === 0 && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-tertiary)', padding: '2px 2px 4px' }}>No steps yet — break this task into an execution checklist below.</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 2 }}>
              <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 'var(--radius-sm)', border: '1.5px dashed var(--border-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}><Icon name="AddProperty1Linear" size={13} /></span>
              <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }} placeholder="Add a step and press Enter" style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={addItem} style={{ ...ghostBtn, height: 34, padding: '0 12px' }}>Add</button>
            </div>
          </div>
        </div>
      </ModalShell>
    );
  }
  window.TaskEditModal = TaskEditModal;

  // ---- Project edit / create ----
  function ProjectEditModal({ project, onSave, onDelete, onClose }) {
    const { Icon } = NS;
    const D = window.PFData;
    const isNew = !project;
    const [name, setName] = React.useState(project ? project.name : '');
    const [customer, setCustomer] = React.useState(project ? project.customer : D.customers[0].id);
    const [due, setDue] = React.useState(project ? project.due || '' : '');

    const save = () => { const n = name.trim(); if (!n) return; onSave(isNew ? null : project.id, { name: n, customer, due: due || null }); onClose(); };

    return (
      <ModalShell title={isNew ? 'New project' : 'Edit project'} icon={isNew ? 'AddProperty1Bold' : 'EditProperty1Linear'} onClose={onClose} footer={
        <React.Fragment>
          {!isNew && <button onClick={() => { onDelete(project.id); onClose(); }} style={{ ...ghostBtn, color: 'var(--red-500)', borderColor: 'var(--red-100)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="TrashProperty1Linear" size={15} /> Delete</button>}
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={ghostBtn}>Cancel</button>
          <button onClick={save} style={primaryBtn}>{isNew ? 'Create project' : 'Save changes'}</button>
        </React.Fragment>
      }>
        <div>
          <label style={fieldLabel}>Project name</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save(); }} style={inputStyle} placeholder="e.g. Website Revamp" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Client</label>
            <select value={customer} onChange={e => setCustomer(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {D.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Target date</label>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} />
          </div>
        </div>
        {!isNew && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>Deleting a project moves its tasks to Chores — it won't delete them.</div>}
      </ModalShell>
    );
  }
  window.ProjectEditModal = ProjectEditModal;
})();
