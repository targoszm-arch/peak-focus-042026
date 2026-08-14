import { useState } from "react";
import { Icon } from "@/ds";
import { useCollaborators, type CollaboratorStatus } from "@/hooks/use-collaborators";
import type { CollaboratorRole } from "@/hooks/use-access";

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", marginBottom: 7,
};
const inputStyle: React.CSSProperties = {
  height: 38, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)",
  background: "var(--surface-card)", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-primary)",
  outline: "none", boxSizing: "border-box",
};

const STATUS_STYLE: Record<CollaboratorStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: "color-mix(in srgb, var(--secondary-500, #E6A609) 14%, white)", color: "var(--secondary-500, #E6A609)", label: "Pending" },
  active: { bg: "color-mix(in srgb, var(--green-600, #2A9E75) 14%, white)", color: "var(--green-600, #2A9E75)", label: "Active" },
  revoked: { bg: "var(--surface-sunken)", color: "var(--text-tertiary)", label: "Revoked" },
};

/** Invite-by-email + list/revoke UI for one project's collaborators. */
export default function CollaboratorManager({ projectId }: { projectId: string }) {
  const { collaborators, loading, error, invite, revoke } = useCollaborators(projectId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("client");
  const [inviting, setInviting] = useState(false);

  const submit = async () => {
    const trimmed = email.trim();
    if (!trimmed || inviting) return;
    setInviting(true);
    const result = await invite(projectId, trimmed, role);
    setInviting(false);
    if (result) setEmail("");
  };

  return (
    <div>
      <label style={fieldLabel}>Invite by email</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void submit(); } }}
          placeholder="name@company.com"
          style={{ ...inputStyle, flex: "1 1 200px" }}
        />
        <select value={role} onChange={(e) => setRole(e.target.value as CollaboratorRole)} style={{ ...inputStyle, cursor: "pointer", flex: "0 0 140px" }}>
          <option value="client">Client</option>
          <option value="team">Team member</option>
        </select>
        <button
          onClick={() => void submit()}
          disabled={inviting || !email.trim()}
          style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 14px",
            borderRadius: "var(--radius-md)", border: "none", background: email.trim() ? "var(--primary-500)" : "var(--border-strong)",
            color: "#fff", cursor: email.trim() ? "pointer" : "default", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
          }}
        >
          <Icon name="AddProperty1Linear" size={14} /> {inviting ? "Inviting…" : "Invite"}
        </button>
      </div>
      {error && <div style={{ marginTop: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--red-500)" }}>{error}</div>}
      <div style={{ marginTop: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-tertiary)" }}>
        They can view this project's tasks and attachments, comment, and ask the AI assistant for a status report — nothing else.
        If they don't have an account yet, they just need to sign up at this address.
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={fieldLabel}>Who has access</label>
        {!loading && collaborators.length === 0 && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-tertiary)" }}>No one invited yet.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {collaborators.map((c) => {
            const s = STATUS_STYLE[c.status];
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)" }}>
                <Icon name="Profile2userProperty1Linear" size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.invitedEmail}
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-tertiary)" }}>
                    {c.role === "client" ? "Client" : "Team member"}
                  </div>
                </div>
                <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: "var(--radius-full)", fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
                  {s.label}
                </span>
                <button
                  onClick={() => { if (window.confirm(`Remove ${c.invitedEmail}'s access?`)) void revoke(c.id); }}
                  title="Revoke access"
                  style={{ flexShrink: 0, width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-sm)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red-500)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                >
                  <Icon name="TrashProperty1Linear" size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
