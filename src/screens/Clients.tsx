import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Badge, StatCard } from "@/ds";
import { useClients, type Client, type ClientHealth } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import { daysFromToday } from "@/lib/pfdate";
import { ModalShell } from "@/components/pf/modals";

/* Clients — metrics row + directory table (stage / health badges, project
   counts, ARR) + full add/edit modal. Ported from the design system's
   ClientsScreen. */

const STAGES = ["Pipeline", "Onboarding", "Active", "Expansion", "Paused"];
const HEALTHS: ClientHealth[] = ["Healthy", "Watch", "At risk"];
const stageTone: Record<string, "success" | "primary" | "neutral" | "accent"> = {
  Pipeline: "neutral",
  Onboarding: "accent",
  Active: "success",
  Expansion: "primary",
  Paused: "neutral",
};
const healthTone: Record<ClientHealth, "success" | "warning" | "danger"> = {
  Healthy: "success",
  Watch: "warning",
  "At risk": "danger",
};
const money = (n: number) => (n ? "$" + (n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + "k" : String(n)) : "—");

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", marginBottom: 7,
};
const inputStyle: React.CSSProperties = {
  width: "100%", height: 42, padding: "0 12px", borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-strong)", background: "var(--surface-card)",
  fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-primary)",
  outline: "none", boxSizing: "border-box",
};

function ClientModal({ client, onClose }: { client: Client | null; onClose: () => void }) {
  const { addClient, updateClient, removeClient } = useClients();
  const isNew = !client;
  const [f, setF] = useState(() => ({
    name: client?.name ?? "",
    contactName: client?.contactName ?? "",
    contactRole: client?.contactRole ?? "",
    email: client?.email ?? "",
    website: client?.website ?? "",
    location: client?.location ?? "",
    stage: client?.stage ?? "Active",
    health: (client?.health ?? "Healthy") as ClientHealth,
    arr: client?.arr ?? 0,
    renewal: client?.renewal ?? "",
  }));
  const set = (k: keyof typeof f, v: string | number) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    const n = f.name.trim();
    if (!n) return;
    const patch = { ...f, name: n, arr: Number(f.arr) || 0, renewal: f.renewal || null };
    if (isNew) await addClient(patch);
    else await updateClient(client.id, patch);
    onClose();
  };

  const ghost: React.CSSProperties = { height: 40, padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700, color: "var(--text-secondary)" };
  const primary: React.CSSProperties = { height: 40, padding: "0 18px", borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700 };
  const row: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap" };
  const cell: React.CSSProperties = { flex: "1 1 200px" };

  return (
    <ModalShell title={isNew ? "Add client" : "Edit client"} icon={isNew ? "AddProperty1Bold" : "EditProperty1Linear"} width={560} onClose={onClose} footer={
      <>
        {!isNew && (
          <button
            onClick={() => {
              if (window.confirm(`Delete client "${client.name}"? Their projects keep existing without a client.`)) {
                void removeClient(client.id);
                onClose();
              }
            }}
            style={{ ...ghost, color: "var(--red-500)", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Icon name="TrashProperty1Linear" size={15} /> Delete
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button onClick={onClose} style={ghost}>Cancel</button>
        <button onClick={save} style={primary}>{isNew ? "Add client" : "Save changes"}</button>
      </>
    }>
      <div>
        <label style={fieldLabel}>Company</label>
        <input autoFocus value={f.name} onChange={(e) => set("name", e.target.value)} style={inputStyle} placeholder="e.g. Acme Co" />
      </div>
      <div style={row}>
        <div style={cell}><label style={fieldLabel}>Primary contact</label><input value={f.contactName} onChange={(e) => set("contactName", e.target.value)} style={inputStyle} placeholder="Full name" /></div>
        <div style={cell}><label style={fieldLabel}>Role</label><input value={f.contactRole} onChange={(e) => set("contactRole", e.target.value)} style={inputStyle} placeholder="e.g. VP Product" /></div>
      </div>
      <div style={row}>
        <div style={cell}><label style={fieldLabel}>Email</label><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} placeholder="name@company.com" /></div>
        <div style={cell}><label style={fieldLabel}>Website</label><input value={f.website} onChange={(e) => set("website", e.target.value)} style={inputStyle} placeholder="company.com" /></div>
      </div>
      <div style={row}>
        <div style={cell}><label style={fieldLabel}>Location</label><input value={f.location} onChange={(e) => set("location", e.target.value)} style={inputStyle} placeholder="e.g. Austin, TX" /></div>
        <div style={cell}>
          <label style={fieldLabel}>Stage</label>
          <select value={f.stage} onChange={(e) => set("stage", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {STAGES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div style={row}>
        <div style={cell}>
          <label style={fieldLabel}>Health</label>
          <select value={f.health} onChange={(e) => set("health", e.target.value as ClientHealth)} style={{ ...inputStyle, cursor: "pointer" }}>
            {HEALTHS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={cell}><label style={fieldLabel}>ARR (USD)</label><input type="number" min={0} value={f.arr} onChange={(e) => set("arr", e.target.value)} style={inputStyle} placeholder="0" /></div>
      </div>
      <div style={row}>
        <div style={cell}><label style={fieldLabel}>Next renewal</label><input type="date" value={f.renewal ?? ""} onChange={(e) => set("renewal", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} /></div>
        <div style={cell} />
      </div>
    </ModalShell>
  );
}

export default function Clients() {
  const navigate = useNavigate();
  const { clients, loading } = useClients();
  const { projects } = useProjects();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ client: Client | null } | null>(null);

  const projectsOf = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of projects) {
      if (!p.clientId) continue;
      const arr = map.get(p.clientId) ?? [];
      arr.push(p.id);
      map.set(p.clientId, arr);
    }
    return map;
  }, [projects]);

  const q = query.trim().toLowerCase();
  const list = clients.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.contactName.toLowerCase().includes(q) || c.website.toLowerCase().includes(q)
  );

  const totalArr = clients.reduce((s, c) => s + (c.arr || 0), 0);
  const atRisk = clients.filter((c) => c.health !== "Healthy").length;
  const renewalsSoon = clients.filter((c) => c.renewal && daysFromToday(c.renewal) >= 0 && daysFromToday(c.renewal) <= 90).length;

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
      <style>{`.pf-cl-head{display:none;} @media (min-width:760px){ .pf-cl-head{display:grid;} .pf-cl-row{grid-template-columns:1.6fr 1.2fr .8fr .8fr .7fr .7fr 40px !important;} .pf-cl-cell{display:block !important;} }`}</style>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>Clients</h1>
          <p style={{ margin: "5px 0 0", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-secondary)" }}>The accounts your projects are for</p>
        </div>
        <button onClick={() => setModal({ client: null })} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700, boxShadow: "var(--shadow-sm)", flexShrink: 0 }}>
          <Icon name="AddProperty1Bold" size={17} /> Add client
        </button>
      </div>

      {/* Same stat-card grid as Today/Dashboard — two columns on phones. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
        <StatCard icon={<Icon name="CategoryProperty1Bold" size={20} />} label="Active accounts" value={clients.length} iconTone="primary" />
        <StatCard icon={<Icon name="ChartProperty1Bold" size={20} />} label="Managed ARR" value={money(totalArr)} iconTone="success" />
        <StatCard icon={<Icon name="CalendarProperty1Bold" size={20} />} label="Renewals in 90 days" value={renewalsSoon} iconTone="accent" />
        <StatCard icon={<Icon name="FlagProperty1Bold" size={20} />} label="Accounts at risk" value={atRisk} iconTone="accent" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 42, padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)" }}>
        <Icon name="SearchNormalProperty1Linear" size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, contact or website" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-primary)" }} />
      </div>

      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
        <div className="pf-cl-head" style={{ gridTemplateColumns: "1.6fr 1.2fr .8fr .8fr .7fr .7fr 40px", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--border-soft)", background: "var(--surface-sunken)", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>
          <span>Client</span><span>Contact</span><span>Stage</span><span>Health</span><span>Projects</span><span>ARR</span><span />
        </div>
        {list.map((c) => {
          const projs = projectsOf.get(c.id) ?? [];
          return (
            <div key={c.id} className="pf-cl-row" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "13px 18px", borderBottom: "1px solid var(--border-soft)", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "var(--radius-md)", background: `color-mix(in srgb, ${c.color} 15%, white)`, color: c.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 800 }}>
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.website ? (
                      <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>
                        {c.website}
                      </a>
                    ) : "—"}
                  </div>
                </div>
              </div>
              <div className="pf-cl-cell" style={{ minWidth: 0, display: "none" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.contactName || "—"}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.email ? <a href={`mailto:${c.email}`} style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>{c.email}</a> : c.contactRole || "—"}
                </div>
              </div>
              <div className="pf-cl-cell" style={{ display: "none" }}><Badge tone={stageTone[c.stage] ?? "neutral"}>{c.stage}</Badge></div>
              <div className="pf-cl-cell" style={{ display: "none" }}><Badge tone={healthTone[c.health] ?? "neutral"} dot>{c.health}</Badge></div>
              <div className="pf-cl-cell" style={{ display: "none" }}>
                <button
                  onClick={() => projs[0] && navigate(`/projects/${projs[0]}`)}
                  title={projs.length ? "Open this client's first project" : undefined}
                  style={{ border: "none", background: "transparent", padding: 0, cursor: projs.length ? "pointer" : "default", textAlign: "left" }}
                >
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, color: projs.length ? "var(--primary-500)" : "var(--text-primary)" }}>{projs.length}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-tertiary)" }}>project{projs.length === 1 ? "" : "s"}</div>
                </button>
              </div>
              <div className="pf-cl-cell" style={{ display: "none", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{money(c.arr)}</div>
              <button
                onClick={() => setModal({ client: c })}
                title="Edit client"
                style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", justifySelf: "end" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary-500)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
              >
                <Icon name="EditProperty1Linear" size={19} />
              </button>
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-tertiary)" }}>
            {loading ? "Loading clients…" : q ? "No clients match this search." : "No clients yet — add your first above."}
          </div>
        )}
      </div>

      {modal && <ClientModal client={modal.client} onClose={() => setModal(null)} />}
    </div>
  );
}
