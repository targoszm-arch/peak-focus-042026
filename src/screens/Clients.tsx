import { useState } from "react";
import { Card, Button, Icon, Avatar, Badge } from "@/ds";
import { useClients, type Client, type ClientHealth } from "@/hooks/use-clients";

const HEALTH_TONE: Record<ClientHealth, "success" | "warning" | "danger"> = {
  Healthy: "success",
  Watch: "warning",
  "At risk": "danger",
};

const HEALTH_OPTIONS: ClientHealth[] = ["Healthy", "Watch", "At risk"];

function money(arr: number) {
  if (!arr) return "$0";
  return arr >= 1000 ? `$${arr / 1000}k` : `$${arr}`;
}

function renewalLabel(renewal: string | null) {
  if (!renewal) return null;
  const d = new Date(renewal);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontSize: 11.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".05em",
  color: "var(--text-tertiary)",
  marginBottom: 6,
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-soft)",
  background: "var(--surface-card)",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  color: "var(--text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

type FormState = {
  name: string;
  website: string;
  contactName: string;
  email: string;
  stage: string;
  health: ClientHealth;
  arr: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  website: "",
  contactName: "",
  email: "",
  stage: "Active",
  health: "Healthy",
  arr: "",
};

function AddClientForm({
  onAdd,
  onClose,
}: {
  onAdd: ReturnType<typeof useClients>["addClient"];
  onClose: () => void;
}) {
  const [f, setF] = useState<FormState>(EMPTY_FORM);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = f.name.trim();
    if (!name) return;
    void onAdd({
      name,
      website: f.website.trim(),
      contactName: f.contactName.trim(),
      email: f.email.trim(),
      stage: f.stage.trim() || "Active",
      health: f.health,
      arr: Number(f.arr) || 0,
    });
    onClose();
  };

  return (
    <Card padding={20} style={{ marginTop: 16 }}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            Add a client
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", padding: 2 }}
          >
            <Icon name="CloseCircleProperty1Linear" size={20} />
          </button>
        </div>

        <div>
          <label style={fieldLabel}>Company name</label>
          <input autoFocus value={f.name} onChange={(e) => set("name", e.target.value)} style={fieldInput} placeholder="e.g. Acme Co" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div>
            <label style={fieldLabel}>Website</label>
            <input value={f.website} onChange={(e) => set("website", e.target.value)} style={fieldInput} placeholder="company.com" />
          </div>
          <div>
            <label style={fieldLabel}>Primary contact</label>
            <input value={f.contactName} onChange={(e) => set("contactName", e.target.value)} style={fieldInput} placeholder="Full name" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div>
            <label style={fieldLabel}>Email</label>
            <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} style={fieldInput} placeholder="name@company.com" />
          </div>
          <div>
            <label style={fieldLabel}>Stage</label>
            <input value={f.stage} onChange={(e) => set("stage", e.target.value)} style={fieldInput} placeholder="Active" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div>
            <label style={fieldLabel}>Health</label>
            <select
              value={f.health}
              onChange={(e) => set("health", e.target.value as ClientHealth)}
              style={{ ...fieldInput, cursor: "pointer" }}
            >
              {HEALTH_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>ARR (USD)</label>
            <input type="number" value={f.arr} onChange={(e) => set("arr", e.target.value)} style={fieldInput} placeholder="0" min={0} />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 2 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="accent">Add client</Button>
        </div>
      </form>
    </Card>
  );
}

function ClientCard({
  client,
  onRemove,
}: {
  client: Client;
  onRemove: (id: string) => void;
}) {
  const renewal = renewalLabel(client.renewal);
  const color = client.color || "#266DF0";
  return (
    <Card padding={18} hover style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar
          name={client.name}
          size={42}
          style={{
            // colored circle tinted from the client's brand color
            background: `color-mix(in srgb, ${color} 16%, white)`,
            borderRadius: "var(--radius-full)",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {client.name}
          </div>
          {client.website && (
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {client.website}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(client.id)}
          aria-label={`Remove ${client.name}`}
          title="Remove client"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-tertiary)",
            display: "inline-flex",
            padding: 4,
            flexShrink: 0,
          }}
        >
          <Icon name="TrashProperty1Linear" size={16} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Badge tone={HEALTH_TONE[client.health] ?? "neutral"} dot>
          {client.health}
        </Badge>
        {client.stage && <Badge tone="neutral">{client.stage}</Badge>}
        <span style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {money(client.arr)}
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, color: "var(--text-tertiary)", marginLeft: 4 }}>
            ARR
          </span>
        </span>
      </div>

      <div style={{ height: 1, background: "var(--border-soft)" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13.5,
              fontWeight: 600,
              color: client.contactName ? "var(--text-primary)" : "var(--text-tertiary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {client.contactName || "No contact yet"}
          </div>
          {client.contactRole && (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-tertiary)" }}>
              {client.contactRole}
            </div>
          )}
        </div>
        {renewal && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-tertiary)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            title="Next renewal"
          >
            <Icon name="CalendarProperty1Linear" size={13} /> {renewal}
          </span>
        )}
      </div>
    </Card>
  );
}

export default function Clients() {
  const { clients, loading, addClient, removeClient } = useClients();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="pf-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px 56px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Clients</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
            The accounts your work is for — keep tabs on health, renewals and who you talk to.
          </p>
        </div>
        <Button
          variant="accent"
          leadingIcon={<Icon name="AddProperty1Bold" size={17} />}
          onClick={() => setShowForm((s) => !s)}
        >
          Add client
        </Button>
      </div>

      {showForm && <AddClientForm onAdd={addClient} onClose={() => setShowForm(false)} />}

      {clients.length === 0 && !loading ? (
        <Card padding={40} style={{ marginTop: 20, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
            No clients yet
          </div>
          <p style={{ margin: "8px auto 0", maxWidth: 380, fontSize: 14, color: "var(--text-secondary)" }}>
            No clients yet — add your first to start tracking work per client.
          </p>
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          {clients.map((c) => (
            <ClientCard key={c.id} client={c} onRemove={removeClient} />
          ))}
        </div>
      )}
    </div>
  );
}
