import { useState } from "react";
import { Card, Button, Icon, Badge, ProgressBar, Input } from "@/ds";
import { useProjects, type ProjectStatus } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { useTasks } from "@/hooks/use-tasks";
import { label as dueLabel } from "@/lib/pfdate";

const STATUS_TONE: Record<ProjectStatus, "primary" | "success" | "warning" | "neutral"> = {
  active: "primary",
  done: "success",
  on_hold: "warning",
  archived: "neutral",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "active",
  done: "done",
  on_hold: "on hold",
  archived: "archived",
};

export default function Projects() {
  const { projects, addProject, removeProject } = useProjects();
  const { clients } = useClients();
  const { projectStats } = useTasks();

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [due, setDue] = useState("");

  const resetForm = () => {
    setName("");
    setClientId("");
    setDue("");
    setAdding(false);
  };

  const submit = async () => {
    if (!name.trim()) return;
    await addProject({
      name: name.trim(),
      clientId: clientId || null,
      due: due || null,
    });
    resetForm();
  };

  return (
    <div className="pf-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px 56px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Projects</h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
            Group your tasks into projects and watch each one climb.
          </p>
        </div>
        <Button variant="accent" leadingIcon={<Icon name="AddProperty1Bold" size={16} />} onClick={() => setAdding((v) => !v)}>
          New project
        </Button>
      </div>

      {/* inline add form */}
      {adding && (
        <Card padding={18} style={{ marginTop: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <div style={{ flex: "2 1 220px", minWidth: 200 }}>
              <Input
                autoFocus
                placeholder="Project name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter") void submit();
                  if (e.key === "Escape") resetForm();
                }}
              />
            </div>

            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              style={{
                flex: "1 1 160px",
                minWidth: 150,
                height: 42,
                padding: "0 12px",
                background: "var(--surface-card)",
                border: "1px solid var(--border-soft)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: clientId ? "var(--text-primary)" : "var(--text-tertiary)",
                cursor: "pointer",
              }}
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div style={{ flex: "1 1 150px", minWidth: 140 }}>
              <Input
                type="date"
                value={due}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDue(e.target.value)}
              />
            </div>

            <Button variant="primary" onClick={() => void submit()}>Add</Button>
            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* grid */}
      {projects.length === 0 ? (
        <Card padding={28} style={{ marginTop: 22, textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
          No projects yet — group your tasks into a project to track progress.
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            marginTop: 22,
          }}
        >
          {projects.map((p) => {
            const client = p.clientId ? clients.find((c) => c.id === p.clientId) : undefined;
            const stats = projectStats[p.id] ?? { total: 0, completed: 0, remaining: 0 };
            const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return (
              <Card key={p.id} padding={18} hover>
                {/* title row */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: p.color,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: "var(--font-display)",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {p.name}
                  </span>
                  <button
                    onClick={() => void removeProject(p.id)}
                    aria-label="Delete project"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-tertiary)",
                      cursor: "pointer",
                      flexShrink: 0,
                      padding: 2,
                    }}
                  >
                    <Icon name="TrashProperty1Linear" size={16} />
                  </button>
                </div>

                {/* client chip + due */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                  {client && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: "var(--font-sans)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: client.color }} />
                      {client.name}
                    </span>
                  )}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    <Icon name="CalendarProperty1Linear" size={13} /> {dueLabel(p.due)}
                  </span>
                </div>

                {/* progress */}
                <div style={{ marginTop: 16 }}>
                  <ProgressBar value={pct} tone="primary" />
                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {stats.completed} of {stats.total} tasks done
                  </div>
                </div>

                {/* status */}
                <div style={{ marginTop: 14 }}>
                  <Badge tone={STATUS_TONE[p.status]} dot>
                    {STATUS_LABEL[p.status]}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
