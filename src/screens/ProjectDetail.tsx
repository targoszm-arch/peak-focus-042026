import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon, ProgressBar, AvatarGroup } from "@/ds";
import QuickAdd from "@/components/pf/QuickAdd";
import TaskRow from "@/components/pf/TaskRow";
import Attachments from "@/components/pf/Attachments";
import { ProjectEditModal } from "@/components/pf/modals";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { usePeople } from "@/hooks/use-people";
import { label as dueLabel } from "@/lib/pfdate";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rootTasks, assigneesByTask } = useTasks();
  const { projects, updateProject } = useProjects();
  const { clients } = useClients();
  const { people } = usePeople();
  const [editOpen, setEditOpen] = useState(false);

  const project = projects.find((p) => p.id === id) ?? null;
  const client = project ? clients.find((c) => c.id === project.clientId) ?? null : null;

  const list = useMemo(() => rootTasks.filter((t) => t.projectId === id), [rootTasks, id]);
  const open = list.filter((t) => !t.completed);
  const done = list.filter((t) => t.completed);
  const pct = list.length ? Math.round((done.length / list.length) * 100) : 0;

  // Unique people assigned across this project's tasks.
  const team = useMemo(() => {
    const ids = new Set<string>();
    for (const t of list) for (const pid of assigneesByTask[t.id] ?? []) ids.add(pid);
    return people.filter((p) => ids.has(p.id));
  }, [list, assigneesByTask, people]);

  if (!project) {
    return (
      <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Project not found.{" "}
          <button onClick={() => navigate("/projects")} style={{ border: "none", background: "none", color: "var(--primary-500)", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            Back to projects
          </button>
        </p>
      </div>
    );
  }

  const color = client?.color ?? project.color;

  const groupHead = (label: string, count: number, danger = false) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 2px 10px" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: danger ? "var(--red-500)" : "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)" }}>{count}</span>
      <span style={{ flex: 1, height: 1, background: "var(--border-soft)" }} />
    </div>
  );

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "24px 32px 48px", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate("/projects")} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600 }}>
          <Icon name="ArrowLeftProperty1Linear" size={16} /> Projects
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={() => setEditOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700 }}>
          <Icon name="EditProperty1Linear" size={15} /> Edit project
        </button>
      </div>

      {/* header card */}
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ width: 46, height: 46, borderRadius: "var(--radius-lg)", background: `color-mix(in srgb, ${color} 14%, white)`, color, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="FolderProperty1Bold" size={24} />
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              title="Click to edit"
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
                else if (e.key === "Escape") { e.currentTarget.textContent = project.name; (e.currentTarget as HTMLElement).blur(); }
              }}
              onFocus={(e) => { e.currentTarget.style.background = "var(--surface-sunken)"; }}
              onBlur={(e) => {
                e.currentTarget.style.background = "transparent";
                const v = e.currentTarget.textContent?.trim() ?? "";
                if (v && v !== project.name) void updateProject(project.id, { name: v });
                else e.currentTarget.textContent = project.name;
              }}
              style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-primary)", outline: "none", borderRadius: "var(--radius-sm)", padding: "2px 5px", marginLeft: -5, cursor: "text", display: "inline-block" }}
            >
              {project.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-secondary)", flexWrap: "wrap" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} /> {client?.name ?? "No client"}
              <span style={{ color: "var(--text-tertiary)" }}>·</span>
              <Icon name="CalendarProperty1Linear" size={13} style={{ color: "var(--text-tertiary)" }} /> Due {dueLabel(project.due)}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>{pct}%</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-tertiary)" }}>{done.length}/{list.length} done</div>
          </div>
        </div>
        <ProgressBar value={pct} height={8} tone={pct === 100 ? "success" : "primary"} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: "1px solid var(--border-soft)", flexWrap: "wrap" }}>
          {team.length > 0 ? (
            <>
              <AvatarGroup users={team.map((a) => ({ name: a.name }))} size={28} max={5} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                {team.length} {team.length === 1 ? "member" : "members"}
              </span>
            </>
          ) : (
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-tertiary)" }}>
              No one assigned yet — assign people from a task's edit panel.
            </span>
          )}
          <span style={{ flex: 1 }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--text-tertiary)" }}>
            <Icon name="TaskSquareProperty1Bold" size={14} /> {open.length} open · {done.length} done
          </span>
        </div>
      </div>

      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", padding: 18 }}>
        <Attachments projectId={project.id} />
      </div>

      <QuickAdd defaultProjectId={project.id} placeholder={`Add a task to ${project.name}…`} />

      {/* open tasks */}
      <div>
        {groupHead("To do", open.length)}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {open.length === 0 ? (
            <div style={{ padding: 22, textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--surface-card)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-lg)" }}>
              No open tasks — this project is all caught up.
            </div>
          ) : (
            open.map((t) => <TaskRow key={t.id} task={t} showProject={false} />)
          )}
        </div>
      </div>

      {/* done */}
      {done.length > 0 && (
        <div>
          {groupHead("Done", done.length)}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {done.map((t) => <TaskRow key={t.id} task={t} showProject={false} />)}
          </div>
        </div>
      )}

      {editOpen && <ProjectEditModal project={project} onClose={() => setEditOpen(false)} />}
    </div>
  );
}
