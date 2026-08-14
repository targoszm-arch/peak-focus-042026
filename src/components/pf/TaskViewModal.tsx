import { Icon } from "@/ds";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { usePeople } from "@/hooks/use-people";
import type { ProjectFull } from "@/hooks/use-projects";
import { PRIORITY_TOKEN, PRIORITY_LABEL } from "./pf-helpers";
import { ModalShell } from "./modals";
import Attachments from "./Attachments";
import Comments from "./Comments";
import { label as dueLabel } from "@/lib/pfdate";

const fieldLabel: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
  textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", marginBottom: 7,
};

const STATUS_LABEL: Record<Task["status"], string> = { todo: "To do", progress: "In progress", review: "In review", done: "Done" };

/** Read-only task detail for invited collaborators — view + comment only, no edit controls. */
export default function TaskViewModal({ task, project, onClose }: { task: Task; project: ProjectFull; onClose: () => void }) {
  const { childrenByParent, assigneesByTask } = useTasks();
  const { people } = usePeople();

  const checklist = childrenByParent[task.id] ?? [];
  const doneCount = checklist.filter((c) => c.completed).length;
  const assignees = people.filter((p) => (assigneesByTask[task.id] ?? []).includes(p.id));

  return (
    <ModalShell title={task.title} icon="TaskSquareProperty1Linear" width={676} onClose={onClose} footer={
      <>
        <span style={{ flex: 1 }} />
        <button onClick={onClose} style={{ height: 40, padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", background: "var(--surface-card)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700, color: "var(--text-secondary)" }}>
          Close
        </button>
      </>
    }>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {task.priority !== "none" && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: "var(--radius-md)", border: `1px solid var(${PRIORITY_TOKEN[task.priority]})`, color: `var(${PRIORITY_TOKEN[task.priority]})`, fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700 }}>
            <Icon name="FlagProperty1Bold" size={13} /> {PRIORITY_LABEL[task.priority]}
          </span>
        )}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700 }}>
          {STATUS_LABEL[task.status]}
        </span>
        {task.endsAt && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700 }}>
            <Icon name="CalendarProperty1Linear" size={13} /> Due {dueLabel(task.endsAt)}
          </span>
        )}
      </div>

      {assignees.length > 0 && (
        <div>
          <label style={fieldLabel}>Assigned to</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {assignees.map((p) => (
              <span key={p.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 30, padding: "0 12px", borderRadius: "var(--radius-full)", border: "1px solid var(--border-strong)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {task.notes && (
        <div>
          <label style={fieldLabel}>Notes</label>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{task.notes}</div>
        </div>
      )}

      {checklist.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
            <label style={{ ...fieldLabel, marginBottom: 0 }}>Checklist</label>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, color: "var(--text-tertiary)" }}>{doneCount}/{checklist.length} done</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {checklist.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)" }}>
                <span style={{ width: 18, height: 18, borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1.5px solid " + (c.completed ? "var(--primary-500)" : "var(--border-strong)"), background: c.completed ? "var(--primary-500)" : "transparent", color: "#fff", flexShrink: 0 }}>
                  {c.completed && <Icon name="TickCircleProperty1Bold" size={12} />}
                </span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: c.completed ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: c.completed ? "line-through" : "none" }}>{c.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Attachments taskId={task.id} readOnly />
      <Comments projectId={project.id} ownerId={project.ownerId} taskId={task.id} />
    </ModalShell>
  );
}
