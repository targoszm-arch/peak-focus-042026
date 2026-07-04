import React from "react";
// Clients — the accounts projects belong to. Metrics row + directory table
// (stage / health badges, project counts, ARR), plus an add/edit modal.
// Light warm-blue tokens, mirroring the Planix clients reference. Exposes window.ClientsScreen.
function ClientsScreen({ onOpenProject, onGoto }) {
  const { useState } = React;
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon, Badge, Avatar } = NS;
  const D = window.PFData;
  const PD = window.PFDate;

  const [clients, setClients] = useState(() => D.customers.filter(c => c.id !== 'personal').map(c => ({ ...c })));
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null); // null | {mode:'new'} | {mode:'edit', client}

  const projectsOf = (cid) => D.projects.filter(p => p.customer === cid);
  const stageTone = { Active: 'success', Expansion: 'primary', Paused: 'neutral', Onboarding: 'accent' };
  const healthTone = { Healthy: 'success', Watch: 'warning', 'At Risk': 'danger' };
  const money = (n) => n ? '$' + (n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'k' : n) : '—';

  const q = query.trim().toLowerCase();
  const list = clients.filter(c => !q || c.name.toLowerCase().includes(q) || (c.contact || '').toLowerCase().includes(q) || (c.website || '').toLowerCase().includes(q));

  const totalArr = clients.reduce((s, c) => s + (c.arr || 0), 0);
  const atRisk = clients.filter(c => c.health === 'At Risk' || c.health === 'Watch').length;
  const renewalsSoon = clients.filter(c => c.renewal && PD.daysFromToday(c.renewal) <= 90 && PD.daysFromToday(c.renewal) >= 0).length;

  const metrics = [
    { label: 'Active accounts', value: String(clients.length).padStart(2, '0'), icon: 'CategoryProperty1Bold', tone: '--primary-500', detail: clients.length + ' client' + (clients.length === 1 ? '' : 's') + ' in your book' },
    { label: 'Managed ARR', value: money(totalArr), icon: 'ChartProperty1Bold', tone: '--green-600', detail: 'Across the full portfolio' },
    { label: 'Renewals in 90 days', value: String(renewalsSoon).padStart(2, '0'), icon: 'CalendarProperty1Bold', tone: '--secondary-500', detail: renewalsSoon ? 'Coming up soon' : 'Nothing due soon' },
    { label: 'Accounts at risk', value: String(atRisk).padStart(2, '0'), icon: 'FlagProperty1Bold', tone: '--red-500', detail: atRisk ? 'Watch or at-risk health' : 'All healthy' },
  ];

  const saveClient = (id, patch) => {
    if (id) setClients(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
    else setClients(cs => [{ id: 'cl' + Date.now(), initial: (patch.name || '?')[0].toUpperCase(), color: '--primary-500', ...patch }, ...cs]);
  };
  const deleteClient = (id) => setClients(cs => cs.filter(c => c.id !== id));

  return (
    <div className="pf-page" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '28px 32px 48px', display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
      <style>{`.pf-cl-metrics{display:grid;grid-template-columns:1fr;gap:14px;} @media (min-width:640px){ .pf-cl-metrics{grid-template-columns:repeat(2,1fr);} } @media (min-width:1080px){ .pf-cl-metrics{grid-template-columns:repeat(4,1fr);} } .pf-cl-hide{display:none;} @media (min-width:760px){ .pf-cl-hide{display:flex;} }`}</style>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Clients</h1>
          <p style={{ margin: '5px 0 0', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)' }}>The accounts your projects are for</p>
        </div>
        <button onClick={() => setModal({ mode: 'new' })} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary-500)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700, boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
          <Icon name="AddProperty1Bold" size={17} /> Add client
        </button>
      </div>

      {/* metrics */}
      <div className="pf-cl-metrics">
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginTop: 8 }}>{m.value}</div>
              </div>
              <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 'var(--radius-lg)', background: `color-mix(in srgb, var(${m.tone}) 13%, white)`, color: `var(${m.tone})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={m.icon} size={22} /></span>
            </div>
            <div style={{ height: 1, background: 'var(--border-soft)' }} />
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--text-tertiary)' }}>{m.detail}</div>
          </div>
        ))}
      </div>

      {/* search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-soft)', background: 'var(--surface-card)' }}>
        <Icon name="SearchNormalProperty1Linear" size={17} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search company, contact or website"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }} />
      </div>

      {/* table */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="pf-cl-hide" style={{ gridTemplateColumns: '1.6fr 1.2fr 0.8fr 0.8fr 0.7fr 0.7fr 40px', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface-sunken)', display: 'grid', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-tertiary)' }}>
          <span>Client</span><span>Contact</span><span>Stage</span><span>Health</span><span>Projects</span><span>ARR</span><span />
        </div>
        {list.map(c => {
          const projs = projectsOf(c.id);
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 0.8fr 0.8fr 0.7fr 0.7fr 40px', gap: 12, padding: '13px 18px', borderBottom: '1px solid var(--border-soft)', alignItems: 'center' }} className="pf-cl-row">
              <style>{`@media (max-width:759px){ .pf-cl-row{grid-template-columns:1fr auto !important; } .pf-cl-row .pf-cl-cell{display:none !important;} }`}</style>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 'var(--radius-md)', background: `color-mix(in srgb, var(${c.color}) 15%, white)`, color: `var(${c.color})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 800 }}>{c.initial}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>{c.website}</div>
                </div>
              </div>
              <div className="pf-cl-cell" style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.contact}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>{c.role}</div>
              </div>
              <div className="pf-cl-cell"><Badge tone={stageTone[c.stage] || 'neutral'}>{c.stage}</Badge></div>
              <div className="pf-cl-cell"><Badge tone={healthTone[c.health] || 'neutral'} dot>{c.health}</Badge></div>
              <div className="pf-cl-cell">
                <button onClick={() => projs[0] && onOpenProject(projs[0].id)} style={{ border: 'none', background: 'transparent', padding: 0, cursor: projs.length ? 'pointer' : 'default', textAlign: 'left' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{projs.length}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--text-tertiary)' }}>open</div>
                </button>
              </div>
              <div className="pf-cl-cell" style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{money(c.arr)}</div>
              <button onClick={() => setModal({ mode: 'edit', client: c })} title="Edit client" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-500)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                <Icon name="EditProperty1Linear" size={17} />
              </button>
            </div>
          );
        })}
        {list.length === 0 && <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-tertiary)' }}>No clients match this search.</div>}
      </div>

      {modal && <ClientModal client={modal.mode === 'edit' ? modal.client : null} onSave={saveClient} onDelete={deleteClient} onClose={() => setModal(null)} />}
    </div>
  );
}

// ---- Client add / edit modal ----
function ClientModal({ client, onSave, onDelete, onClose }) {
  const NS = window.PeakFocusDesignSystem_2ecfec;
  const { Icon } = NS;
  const isNew = !client;
  const [f, setF] = React.useState(() => ({
    name: client ? client.name : '', contact: client ? client.contact || '' : '', role: client ? client.role || '' : '',
    email: client ? client.email || '' : '', website: client ? client.website || '' : '', location: client ? client.location || '' : '',
    stage: client ? client.stage || 'Active' : 'Active', health: client ? client.health || 'Healthy' : 'Healthy', arr: client ? client.arr || 0 : 0,
    renewal: client ? client.renewal || '' : '',
  }));
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const overlay = { position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(17,22,37,.42)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '9vh', backdropFilter: 'blur(2px)' };
  const label = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-tertiary)', marginBottom: 7 };
  const input = { width: '100%', height: 42, padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };
  const ghost = { height: 40, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--surface-card)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700, color: 'var(--text-secondary)' };
  const primary = { height: 40, padding: '0 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary-500)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 700 };
  const save = () => { const n = f.name.trim(); if (!n) return; onSave(isNew ? null : client.id, { ...f, name: n, arr: Number(f.arr) || 0 }); onClose(); };

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: '92vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-card)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
          <span style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', color: 'var(--primary-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={isNew ? 'AddProperty1Bold' : 'EditProperty1Linear'} size={18} /></span>
          <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>{isNew ? 'Add client' : 'Edit client'}</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'inline-flex', padding: 2 }}><Icon name="CloseCircleProperty1Linear" size={22} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
          <div><label style={label}>Company</label><input autoFocus value={f.name} onChange={e => set('name', e.target.value)} style={input} placeholder="e.g. Acme Co" /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={label}>Primary contact</label><input value={f.contact} onChange={e => set('contact', e.target.value)} style={input} placeholder="Full name" /></div>
            <div style={{ flex: 1 }}><label style={label}>Role</label><input value={f.role} onChange={e => set('role', e.target.value)} style={input} placeholder="e.g. VP Product" /></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={label}>Email</label><input value={f.email} onChange={e => set('email', e.target.value)} style={input} placeholder="name@company.com" /></div>
            <div style={{ flex: 1 }}><label style={label}>Website</label><input value={f.website} onChange={e => set('website', e.target.value)} style={input} placeholder="company.com" /></div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={label}>Stage</label>
              <select value={f.stage} onChange={e => set('stage', e.target.value)} style={{ ...input, cursor: 'pointer' }}>{['Active', 'Expansion', 'Onboarding', 'Paused'].map(o => <option key={o} value={o}>{o}</option>)}</select>
            </div>
            <div style={{ flex: 1 }}><label style={label}>Health</label>
              <select value={f.health} onChange={e => set('health', e.target.value)} style={{ ...input, cursor: 'pointer' }}>{['Healthy', 'Watch', 'At Risk'].map(o => <option key={o} value={o}>{o}</option>)}</select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><label style={label}>ARR (USD)</label><input type="number" value={f.arr} onChange={e => set('arr', e.target.value)} style={input} placeholder="0" /></div>
            <div style={{ flex: 1 }}><label style={label}>Next renewal</label><input type="date" value={f.renewal} onChange={e => set('renewal', e.target.value)} style={{ ...input, cursor: 'pointer' }} /></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderTop: '1px solid var(--border-soft)', background: 'var(--surface-sunken)', flexShrink: 0 }}>
          {!isNew && <button onClick={() => { onDelete(client.id); onClose(); }} style={{ ...ghost, color: 'var(--red-500)', borderColor: 'var(--red-100)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="TrashProperty1Linear" size={15} /> Delete</button>}
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={ghost}>Cancel</button>
          <button onClick={save} style={primary}>{isNew ? 'Add client' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );
}
window.ClientsScreen = ClientsScreen;
