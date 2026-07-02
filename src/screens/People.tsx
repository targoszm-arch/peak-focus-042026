import { useState } from "react";
import { Card, Button, Icon, Avatar, Badge } from "@/ds";
import { usePeople, type TeamRole, type Person } from "@/hooks/use-people";

const ROLE_TONE: Record<TeamRole, "primary" | "neutral"> = {
  Admin: "primary",
  User: "neutral",
  Viewer: "neutral",
};

const TEAM_ROLES: TeamRole[] = ["Admin", "User", "Viewer"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-strong)",
  background: "var(--surface-card)",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  color: "var(--text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontSize: 11.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".05em",
  color: "var(--text-tertiary)",
  marginBottom: 7,
};

function AddPersonForm({
  onAdd,
  onClose,
}: {
  onAdd: (p: { name: string; role: string; email: string; teamRole: TeamRole }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [teamRole, setTeamRole] = useState<TeamRole>("User");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, role: role.trim(), email: email.trim(), teamRole });
    onClose();
  };

  return (
    <Card padding={20} style={{ marginTop: 16 }}>
      <form onSubmit={submit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
          }}
        >
          <div>
            <label style={labelStyle}>Full name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sana Okafor"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Role / title</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Designer"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Access</label>
            <select
              value={teamRole}
              onChange={(e) => setTeamRole(e.target.value as TeamRole)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" disabled={!name.trim()}>
            Add person
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PersonRow({
  person,
  onRemove,
}: {
  person: Person;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border-soft)",
        minWidth: 520,
      }}
    >
      {/* person */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <Avatar name={person.name} size={40} style={{ background: person.color }} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {person.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-sans)",
              fontSize: 12.5,
              color: "var(--text-tertiary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {person.email ? (
              <>
                <Icon name="SmsProperty1Linear" size={13} /> {person.email}
              </>
            ) : (
              "no email yet"
            )}
          </div>
        </div>
      </div>

      {/* role */}
      <div
        className="pf-hide-narrow"
        style={{
          width: 160,
          flexShrink: 0,
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          color: "var(--text-secondary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {person.role || "—"}
      </div>

      {/* access */}
      <div style={{ width: 84, flexShrink: 0, display: "flex", justifyContent: "flex-start" }}>
        <Badge tone={ROLE_TONE[person.teamRole]}>{person.teamRole}</Badge>
      </div>

      {/* remove */}
      <button
        onClick={() => onRemove(person.id)}
        title={`Remove ${person.name}`}
        aria-label={`Remove ${person.name}`}
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: "var(--radius-sm)",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--text-tertiary)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--status-danger)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
      >
        <Icon name="TrashProperty1Linear" size={17} />
      </button>
    </div>
  );
}

export default function People() {
  const { people, loading, addPerson, removePerson } = usePeople();
  const [adding, setAdding] = useState(false);

  return (
    <div className="pf-page" style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px 56px" }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>
            People
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
            {people.length === 0
              ? "The teammates you can assign work to live here."
              : `${people.length} ${people.length === 1 ? "teammate" : "teammates"} you can assign work to.`}
          </p>
        </div>
        <Button
          variant="accent"
          leadingIcon={<Icon name="AddProperty1Bold" size={17} />}
          onClick={() => setAdding((v) => !v)}
        >
          Add person
        </Button>
      </div>

      {adding && <AddPersonForm onAdd={addPerson} onClose={() => setAdding(false)} />}

      {/* body */}
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <Card padding={28} style={{ textAlign: "center", color: "var(--text-tertiary)" }}>
            Loading your team…
          </Card>
        ) : people.length === 0 ? (
          <Card padding={28} style={{ textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            No teammates yet — add people so you can assign them to tasks.
          </Card>
        ) : (
          <Card padding={0} style={{ overflow: "hidden" }}>
            <div className="pf-hscroll" style={{ overflowX: "auto" }}>
              {/* column header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 16px",
                  minWidth: 520,
                  background: "var(--surface-sunken)",
                  borderBottom: "1px solid var(--border-soft)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".05em",
                  color: "var(--text-tertiary)",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>Person</span>
                <span className="pf-hide-narrow" style={{ width: 160, flexShrink: 0 }}>
                  Role
                </span>
                <span style={{ width: 84, flexShrink: 0 }}>Access</span>
                <span style={{ width: 32, flexShrink: 0 }} />
              </div>
              {people.map((p) => (
                <PersonRow key={p.id} person={p} onRemove={removePerson} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
