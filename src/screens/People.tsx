import { useMemo, useState } from "react";
import { Icon, Avatar, Badge } from "@/ds";
import { usePeople, type TeamRole, type Person } from "@/hooks/use-people";
import { useTasks, INBOX_ID } from "@/hooks/use-tasks";
import { ModalShell } from "@/components/pf/modals";

/* People — teammate directory cards with role, contact, workload (open tasks
   + projects from task assignments) and a full add/edit modal. Ported from
   the design system's PeopleScreen. */

const TEAM_ROLES: TeamRole[] = ["Admin", "User", "Viewer"];
const roleTone: Record<TeamRole, "primary" | "neutral" | "accent"> = {
  Admin: "primary",
  User: "neutral",
  Viewer: "accent",
};

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

function PersonModal({ member, onClose }: { member: Person | null; onClose: () => void }) {
  const { addPerson, updatePerson, removePerson } = usePeople();
  const isNew = !member;
  const [f, setF] = useState(() => ({
    name: member?.name ?? "",
    role: member?.role ?? "",
    email: member?.email ?? "",
    teamRole: (member?.teamRole ?? "User") as TeamRole,
  }));
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    const n = f.name.trim();
    if (!n) return;
    if (isNew) await addPerson({ ...f, name: n });
    else await updatePerson(member.id, { ...f, name: n });
    onClose();
  };

  const ghost: React.CSSProperties = { height: 40, padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700, color: "var(--text-secondary)" };
  const primary: React.CSSProperties = { height: 40, padding: "0 18px", borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700 };

  return (
    <ModalShell title={isNew ? "Add person" : "Edit person"} icon={isNew ? "AddProperty1Bold" : "EditProperty1Linear"} width={500} onClose={onClose} footer={
      <>
        {!isNew && (
          <button
            onClick={() => {
              if (window.confirm(`Remove "${member.name}" from your team?`)) {
                void removePerson(member.id);
                onClose();
              }
            }}
            style={{ ...ghost, color: "var(--red-500)", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Icon name="TrashProperty1Linear" size={15} /> Remove
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button onClick={onClose} style={ghost}>Cancel</button>
        <button onClick={save} style={primary}>{isNew ? "Add person" : "Save changes"}</button>
      </>
    }>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar name={f.name || "?"} size={52} />
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Full name</label>
          <input autoFocus value={f.name} onChange={(e) => set("name", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void save(); }} style={inputStyle} placeholder="e.g. Sana Okafor" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={fieldLabel}>Role / title</label>
          <input value={f.role} onChange={(e) => set("role", e.target.value)} style={inputStyle} placeholder="e.g. Designer" />
        </div>
        <div style={{ flex: "1 1 140px" }}>
          <label style={fieldLabel}>Access</label>
          <select value={f.teamRole} onChange={(e) => set("teamRole", e.target.value as TeamRole)} style={{ ...inputStyle, cursor: "pointer" }}>
            {TEAM_ROLES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={fieldLabel}>Email</label>
        <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} placeholder="name@company.com" />
      </div>
    </ModalShell>
  );
}

export default function People() {
  const { people, loading } = usePeople();
  const { rootTasks, assigneesByTask } = useTasks();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ member: Person | null } | null>(null);

  // Workload per person, from task assignments.
  const workload = useMemo(() => {
    const map = new Map<string, { open: number; projects: Set<string> }>();
    for (const t of rootTasks) {
      for (const pid of assigneesByTask[t.id] ?? []) {
        const w = map.get(pid) ?? { open: 0, projects: new Set<string>() };
        if (!t.completed) w.open += 1;
        if (t.projectId !== INBOX_ID) w.projects.add(t.projectId);
        map.set(pid, w);
      }
    }
    return map;
  }, [rootTasks, assigneesByTask]);

  const q = query.trim().toLowerCase();
  const list = people.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
  );

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box", padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
      <style>{`.pf-ppl-grid{display:grid;grid-template-columns:1fr;gap:14px;} @media (min-width:620px){ .pf-ppl-grid{grid-template-columns:repeat(2,1fr);} } @media (min-width:1080px){ .pf-ppl-grid{grid-template-columns:repeat(3,1fr);} }`}</style>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>People</h1>
          <p style={{ margin: "5px 0 0", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-secondary)" }}>
            {people.length} teammate{people.length === 1 ? "" : "s"} you assign work to
          </p>
        </div>
        <button onClick={() => setModal({ member: null })} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700, boxShadow: "var(--shadow-sm)", flexShrink: 0 }}>
          <Icon name="AddProperty1Bold" size={17} /> Add person
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 42, padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)" }}>
        <Icon name="SearchNormalProperty1Linear" size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, role or email" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-primary)" }} />
      </div>

      <div className="pf-ppl-grid">
        {list.map((p) => {
          const w = workload.get(p.id);
          return (
            <div key={p.id} style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={p.name} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 15.5, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-secondary)" }}>{p.role || "—"}</div>
                </div>
                <button
                  onClick={() => setModal({ member: p })}
                  title="Edit person"
                  style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary-500)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                >
                  <Icon name="EditProperty1Linear" size={17} />
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <Icon name="SmsProperty1Linear" size={14} />
                {p.email ? <a href={`mailto:${p.email}`} style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>{p.email}</a> : "—"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 12, borderTop: "1px solid var(--border-soft)" }}>
                <Badge tone={roleTone[p.teamRole] ?? "neutral"}>{p.teamRole}</Badge>
                <span style={{ flex: 1 }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>
                  <Icon name="TaskSquareProperty1Linear" size={14} /> {w?.open ?? 0} open
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>
                  <Icon name="FolderProperty1Linear" size={14} /> {w?.projects.size ?? 0}
                </span>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: 40, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-tertiary)" }}>
            {loading ? "Loading people…" : q ? "No people match this search." : "No teammates yet — add someone above, then assign them from a task's edit panel."}
          </div>
        )}
      </div>

      {modal && <PersonModal member={modal.member} onClose={() => setModal(null)} />}
    </div>
  );
}
