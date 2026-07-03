import React from "react";
// People — the teammates who collaborate on projects. Directory cards with
// role, contact, workload (tasks + projects), and an add/edit modal.
// Exposes window.PeopleScreen.
function PeopleScreen({ tasks, onGoto }) {
  const { useState } = React;
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon, Badge, Avatar } = NS;
  const D = window.PFData;

  const [people, setPeople] = useState(() => D.team.map(m => ({ ...m })));
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null); // null | {mode:'new'} | {mode:'edit', member}

  const roleTone = { Admin: 'primary', User: 'neutral', Viewer: 'accent' };
  const workload = (id) => {
    const list = tasks.filter(t => (t.assignees || []).some(a => (a.id || a.name) === id || a.name === (people.find(p => p.id === id) || {}).name));
    const open = list.filter(t => !t.done).length;
    const projects = new Set(list.map(t => t.project).filter(Boolean)).size;
    return { open, total: list.length, projects };
  };

  const q = query.trim().toLowerCase();
  const list = people.filter(p => !q || p.name.toLowerCase().includes(q) || (p.role || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q));

  const saveMember = (id, patch) => {
    if (id) setPeople(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
    else setPeople(ps => [...ps, { id: 'pp' + Date.now(), ...patch }]);
  };
  const deleteMember = (id) => setPeople(ps => ps.filter(p => p.id !== id));

  return (
    <div className="pf-page" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
      <style>{`.pf-ppl-grid{display:grid;grid-template-columns:1fr;gap:14px;} @media (min-width:620px){ .pf-ppl-grid{grid-template-columns:repeat(2,1fr);} } @media (min-width:1080px){ .pf-ppl-grid{grid-template-columns:repeat(3,1fr);} }`}</style>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>People</h1>
          <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)' }}>{people.length} teammates you assign work to</p>
        </div>
        <button onClick={() => setModal({ mode: 'new' })} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary-500)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700, boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
          <Icon name="AddProperty1Bold" size={17} /> Add person
        </button>
      </div>

      {/* search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-soft)', background: 'var(--surface-card)' }}>
        <Icon name="SearchNormalProperty1Linear" size={17} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, role or email"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }} />
      </div>

      {/* cards */}
      <div className="pf-ppl-grid">
        {list.map(p => {
          const w = workload(p.id);
          return (
            <div key={p.id} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={p.name} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)' }}>{p.role}</div>
                </div>
                <button onClick={() => setModal({ mode: 'edit', member: p })} title="Edit" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-500)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                  <Icon name="EditProperty1Linear" size={17} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Icon name="MessageProperty1Linear" size={14} /> {p.email || '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                <Badge tone={roleTone[p.teamRole] || 'neutral'}>{p.teamRole || 'User'}</Badge>
                <span style={{ flex: 1 }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}><Icon name="TaskSquareProperty1Linear" size={14} /> {w.open} open</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}><Icon name="FolderProperty1Linear" size={14} /> {w.projects}</span>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-tertiary)' }}>No people match this search.</div>}
      </div>

      {modal && <PersonModal member={modal.mode === 'edit' ? modal.member : null} onSave={saveMember} onDelete={deleteMember} onClose={() => setModal(null)} />}
    </div>
  );
}

// ---- Person add / edit modal ----
function PersonModal({ member, onSave, onDelete, onClose }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon, Avatar } = NS;
  const isNew = !member;
  const [f, setF] = React.useState(() => ({
    name: member ? member.name : '', role: member ? member.role || '' : '', email: member ? member.email || '' : '', teamRole: member ? member.teamRole || 'User' : 'User',
  }));
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const overlay = { position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(17,22,37,.42)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '11vh', backdropFilter: 'blur(2px)' };
  const label = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-tertiary)', marginBottom: 7 };
  const input = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };
  const ghost = { height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700, color: 'var(--text-secondary)' };
  const primary = { height: 40, padding: '0 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary-500)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700 };
  const save = () => { const n = f.name.trim(); if (!n) return; onSave(isNew ? null : member.id, { ...f, name: n }); onClose(); };

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={{ width: 500, maxWidth: '92vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
          <span style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', color: 'var(--primary-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={isNew ? 'AddProperty1Bold' : 'EditProperty1Linear'} size={18} /></span>
          <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{isNew ? 'Add person' : 'Edit person'}</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', padding: 2 }}><Icon name="CloseCircleProperty1Linear" size={22} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={f.name || '?'} size={52} />
            <div style={{ flex: 1 }}><label style={label}>Full name</label><input autoFocus value={f.name} onChange={e => set('name', e.target.value)} style={input} placeholder="e.g. Sana Okafor" /></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={label}>Role / title</label><input value={f.role} onChange={e => set('role', e.target.value)} style={input} placeholder="e.g. Designer" /></div>
            <div style={{ flex: 1 }}><label style={label}>Access</label>
              <select value={f.teamRole} onChange={e => set('teamRole', e.target.value)} style={{ ...input, cursor: 'pointer' }}>{['Admin', 'User', 'Viewer'].map(o => <option key={o} value={o}>{o}</option>)}</select>
            </div>
          </div>
          <div><label style={label}>Email</label><input value={f.email} onChange={e => set('email', e.target.value)} style={input} placeholder="name@company.com" /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderTop: '1px solid var(--border-soft)', background: 'var(--surface-sunken)', flexShrink: 0 }}>
          {!isNew && <button onClick={() => { onDelete(member.id); onClose(); }} style={{ ...ghost, color: 'var(--red-500)', borderColor: 'var(--red-100)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="TrashProperty1Linear" size={15} /> Remove</button>}
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={ghost}>Cancel</button>
          <button onClick={save} style={primary}>{isNew ? 'Add person' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}
window.PeopleScreen = PeopleScreen;
