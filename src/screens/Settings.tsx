import { useMemo, useState } from "react";
import { Card, Icon, Button, Avatar } from "@/ds";
import { useAuth } from "@/contexts/AuthContext";
import { useAccess } from "@/hooks/use-access";
import { useProjects } from "@/hooks/use-projects";
import { useCollaborators } from "@/hooks/use-collaborators";
import ShareProjectModal from "@/components/pf/ShareProjectModal";

function AccessCard() {
  const { user } = useAuth();
  const { projects: allProjects } = useProjects();
  // Only projects this account owns can have their access managed — a
  // project it's merely a collaborator on doesn't belong here.
  const projects = useMemo(() => allProjects.filter((p) => p.ownerId === user?.id), [allProjects, user?.id]);
  const { collaborators } = useCollaborators();
  const [manageId, setManageId] = useState<string | null>(null);

  const countByProject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of collaborators) map[c.projectId] = (map[c.projectId] ?? 0) + 1;
    return map;
  }, [collaborators]);

  const manageProject = projects.find((p) => p.id === manageId) ?? null;

  return (
    <Card padding={22} style={{ marginTop: 16 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Client &amp; team access</h3>
      <p style={{ margin: "8px 0 14px", fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        Invite a client or team member to one project at a time — they'll only ever see that project's tasks and
        attachments, and can comment and use the AI assistant for status reports.
      </p>
      {projects.length === 0 ? (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-tertiary)" }}>No projects yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {projects.map((p) => {
            const count = countByProject[p.id] ?? 0;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </span>
                {count > 0 && (
                  <span style={{ flexShrink: 0, fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, color: "var(--text-tertiary)" }}>
                    {count} {count === 1 ? "person" : "people"}
                  </span>
                )}
                <button
                  onClick={() => setManageId(p.id)}
                  style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700 }}
                >
                  <Icon name="Profile2userProperty1Linear" size={13} /> Manage access
                </button>
              </div>
            );
          })}
        </div>
      )}
      {manageProject && <ShareProjectModal project={manageProject} onClose={() => setManageId(null)} />}
    </Card>
  );
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const { isOwner } = useAccess();
  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "You";
  const email = user?.email ?? "";

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Settings</h1>

      <Card padding={22} style={{ marginTop: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={name} size={52} status="online" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{name}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{email}</div>
          </div>
          <Button variant="secondary" onClick={() => signOut()} leadingIcon={<Icon name="LogoutProperty1Linear" size={16} />}>
            Log out
          </Button>
        </div>
      </Card>

      {isOwner && <AccessCard />}

      <Card padding={22} style={{ marginTop: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>About your data</h3>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {isOwner === false
            ? "You have view and comment access to the project(s) you were invited to. Nothing else in this workspace is visible to you."
            : "Your tasks, projects, clients, people, habits and health sync to your private Supabase workspace and are visible only to you and anyone you invite. Connect more tools on the Integrations screen."}
        </p>
      </Card>
    </div>
  );
}
