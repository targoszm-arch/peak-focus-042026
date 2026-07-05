import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/ds";
import { useTasks, type Task, type Priority, type TaskStatus, INBOX_ID } from "@/hooks/use-tasks";
import { useProjects, type ProjectFull } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { usePeople } from "@/hooks/use-people";
import { PRIORITY_TOKEN, PRIORITY_LABEL } from "./pf-helpers";
import Attachments from "./Attachments";
import RichText from "./RichText";
import NotesField from "./NotesField";

/* Shared modal chrome — ported from the design system's EditModals.jsx. */

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 120,
  background: "rgba(17,22,37,.42)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "11vh 14px 20px",
  backdropFilter: "blur(2px)",
};
const fieldLabel: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontSize: 11.5,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".05em",
  color: "var(--text-tertiary)",
  marginBottom: 7,
};
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
const ghostBtn: React.CSSProperties = {
  height: 40,
  padding: "0 16px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-strong)",
  background: "var(--surface-card)",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  fontSize: 13.5,
  fontWeight: 700,
  color: "var(--text-secondary)",
};
const primaryBtn: React.CSSProperties = {
  height: 40,
  padding: "0 18px",
  borderRadius: "var(--radius-md)",
  border: "none",
  background: "var(--primary-500)",
  color: "#fff",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  fontSize: 13.5,
  fontWeight: 700,
};
const TASK_STATUS: { id: TaskStatus; title: string; dot: string }[] = [
  { id: "todo", title: "To Do", dot: "var(--neutral-400, #9aa3b2)" },
  { id: "progress", title: "In Progress", dot: "var(--primary-500)" },
  { id: "review", title: "In Review", dot: "var(--secondary-500)" },
  { id: "done", title: "Done", dot: "var(--green-600, #2A9E75)" },
];

export function ModalShell({
  title,
  icon,
  onClose,
  children,
  footer,
  width,
}: {
  title: string;
  icon: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  width?: number;
}) {
  // Freeze the page beneath while the modal is open — scrolling inside the
  // modal must not chain into .pf-scroll.
  useEffect(() => {
    document.documentElement.classList.add("pf-modal-open");
    return () => document.documentElement.classList.remove("pf-modal-open");
  }, []);

  // Portaled to <body>: keeps the fixed overlay independent of the shell
  // (which shrinks while the keyboard is open) and of list re-renders that
  // could unmount the row the modal was opened from.
  return createPortal(
    <div onClick={onClose} style={{ ...overlay, touchAction: "none", overscrollBehavior: "none" }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: width || 520,
          maxWidth: "94vw",
          // Shrinks with the on-screen keyboard (--pf-vvh) so fields stay reachable.
          maxHeight: "min(82vh, calc(var(--pf-vvh, 100vh) - 13vh))",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface-card)",
          border: "1px solid var(--border-soft)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          animation: "pf-pop .2s ease both",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "16px 20px", borderBottom: "1px solid var(--border-soft)", flexShrink: 0 }}>
          <span style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", color: "var(--primary-500)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={icon} size={18} />
          </span>
          <span style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>{title}</span>
          <button onClick={onClose} title="Close" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, margin: -8, flexShrink: 0 }}>
            <Icon name="CloseCircleProperty1Linear" size={24} />
          </button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain", touchAction: "pan-y", flex: 1 }}>{children}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 20px", borderTop: "1px solid var(--border-soft)", background: "var(--surface-sunken)", flexShrink: 0 }}>{footer}</div>
      </div>
    </div>,
    document.body
  );
}

/* ── Task edit modal — name, priority, project, due date, assignees,
      execution checklist (child tasks via parent_id), notes, delete. ── */

export function TaskEditModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { updateTaskFields, removeTask, addTask, toggleTask, childrenByParent, assigneesByTask, setAssignees } = useTasks();
  const { projects } = useProjects();
  const { clients } = useClients();
  const { people } = usePeople();

  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [projectId, setProjectId] = useState(task.projectId === INBOX_ID ? "" : task.projectId);
  const [due, setDue] = useState(task.endsAt ? task.endsAt.slice(0, 10) : "");
  const [notes, setNotes] = useState(task.notes ?? "");
  const [assignees, setAssigneesLocal] = useState<string[]>(assigneesByTask[task.id] ?? []);
  const [draft, setDraft] = useState("");

  // Auto-focus only with a physical pointer. On touch, focusing on open
  // brings the keyboard up immediately and hides half the form behind it —
  // the modal should open whole, with the keyboard appearing on tap.
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      titleRef.current?.focus({ preventScroll: true });
    }
  }, []);

  // Checklist steps are live child tasks — edits persist immediately.
  const checklist = childrenByParent[task.id] ?? [];
  const doneCount = checklist.filter((c) => c.completed).length;

  const addStep = () => {
    const t = draft.trim();
    if (!t) return;
    void addTask({ title: t, parentId: task.id, projectId: task.projectId, priority: "none" });
    setDraft("");
  };

  const save = async () => {
    const n = title.trim();
    if (!n) return;
    await Promise.all([
      updateTaskFields(task.id, {
        title: n,
        priority,
        status,
        projectId: projectId || INBOX_ID,
        endsAt: due || null,
      }),
      updateTaskFields(task.id, { notes }),
      setAssignees(task.id, assignees),
    ]);
    onClose();
  };

  const clientName = (cid: string | null) => clients.find((c) => c.id === cid)?.name ?? "No client";
  const grouped = [...projects].sort((a, b) => clientName(a.clientId).localeCompare(clientName(b.clientId)));

  return (
    <ModalShell title="Edit task" icon="EditProperty1Linear" width={676} onClose={onClose} footer={
      <>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${task.title}" and its checklist?`)) {
              void removeTask(task.id);
              onClose();
            }
          }}
          style={{ ...ghostBtn, color: "var(--red-500)", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="TrashProperty1Linear" size={15} /> Delete
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={onClose} style={ghostBtn}>Cancel</button>
        <button onClick={save} style={primaryBtn}>Save changes</button>
      </>
    }>
      <div>
        <label style={fieldLabel}>Task</label>
        <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void save(); }} style={inputStyle} placeholder="Task name" />
      </div>

      <div>
        <label style={fieldLabel}>Priority</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["high", "medium", "low"] as const).map((p) => {
            const on = priority === p;
            const col = `var(${PRIORITY_TOKEN[p]})`;
            return (
              <button key={p} onClick={() => setPriority(p)} style={{
                flex: 1, height: 40, borderRadius: "var(--radius-md)", cursor: "pointer",
                border: "1px solid " + (on ? col : "var(--border-strong)"),
                background: on ? `color-mix(in srgb, ${col} 12%, white)` : "var(--surface-card)",
                color: on ? col : "var(--text-secondary)",
                fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Icon name="FlagProperty1Bold" size={13} /> {PRIORITY_LABEL[p]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={fieldLabel}>Status</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          {TASK_STATUS.map((s) => {
            const on = status === s.id;
            return (
              <button key={s.id} onClick={() => setStatus(s.id)} style={{
                minHeight: 40, borderRadius: "var(--radius-md)", cursor: "pointer",
                border: "1px solid " + (on ? s.dot : "var(--border-strong)"),
                background: on ? `color-mix(in srgb, ${s.dot} 12%, white)` : "var(--surface-card)",
                color: on ? s.dot : "var(--text-secondary)",
                fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "0 8px",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} /> {s.title}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label style={fieldLabel}>Project</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">Chores (no project)</option>
            {grouped.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {clientName(p.clientId)}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <label style={fieldLabel}>Due date</label>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} />
        </div>
      </div>

      {people.length > 0 && (
        <div>
          <label style={fieldLabel}>Assigned to</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {people.map((p) => {
              const on = assignees.includes(p.id);
              return (
                <button key={p.id} onClick={() => setAssigneesLocal((prev) => on ? prev.filter((x) => x !== p.id) : [...prev, p.id])} style={{
                  display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 12px",
                  borderRadius: "var(--radius-full)", cursor: "pointer",
                  border: "1px solid " + (on ? "var(--primary-500)" : "var(--border-strong)"),
                  background: on ? "color-mix(in srgb, var(--primary-500) 10%, white)" : "var(--surface-card)",
                  color: on ? "var(--primary-500)" : "var(--text-secondary)",
                  fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
          <label style={{ ...fieldLabel, marginBottom: 0 }}>Execution checklist</label>
          {checklist.length > 0 && (
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, color: "var(--text-tertiary)" }}>
              {doneCount}/{checklist.length} done
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Capped + internally scrolled so adding steps doesn't push the
              notes editor (below) around while you copy items across. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto", overscrollBehavior: "contain", paddingRight: 2 }}>
          {checklist.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)" }}>
              <button onClick={() => void toggleTask(c.id)} title={c.completed ? "Mark not done" : "Mark done"} style={{
                flexShrink: 0, width: 40, height: 40, margin: "-7px 0", border: "none", background: "transparent",
                cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0,
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: "var(--radius-sm)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  border: "1.5px solid " + (c.completed ? "var(--primary-500)" : "var(--border-strong)"),
                  background: c.completed ? "var(--primary-500)" : "transparent", color: "#fff",
                }}>
                  {c.completed && <Icon name="TickCircleProperty1Bold" size={16} />}
                </span>
              </button>
              <input
                defaultValue={c.title}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== c.title) void updateTaskFields(c.id, { title: v });
                  else e.target.value = c.title;
                }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  fontFamily: "var(--font-sans)", fontSize: 13.5,
                  color: c.completed ? "var(--text-tertiary)" : "var(--text-primary)",
                  textDecoration: c.completed ? "line-through" : "none",
                }}
              />
              <button onClick={() => void removeTask(c.id)} title="Remove step" style={{ flexShrink: 0, border: "none", background: "transparent", cursor: "pointer", color: "var(--text-tertiary)", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, margin: "-7px -8px -7px 0", padding: 0 }}>
                <Icon name="CloseCircleProperty1Linear" size={20} />
              </button>
            </div>
          ))}
          {checklist.length === 0 && (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-tertiary)", padding: "2px 2px 4px" }}>
              No steps yet — break this task into an execution checklist below.
            </div>
          )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 2 }}>
            <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "var(--radius-sm)", border: "1.5px dashed var(--border-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)" }}>
              <Icon name="AddProperty1Bold" size={13} />
            </span>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStep(); } }} placeholder="Add a step and press Enter" style={{ ...inputStyle, width: "auto", minWidth: 0, height: 34, fontSize: 13.5, flex: 1 }} />
            <button onClick={addStep} style={{ ...ghostBtn, height: 34, padding: "0 12px" }}>Add</button>
          </div>
        </div>
      </div>

      <NotesField value={notes} onChange={setNotes} />

      <Attachments taskId={task.id} />
    </ModalShell>
  );
}

/* ── Project create / edit modal ── */

export function ProjectEditModal({ project, onClose }: { project: ProjectFull | null; onClose: () => void }) {
  const { addProject, updateProject, removeProject } = useProjects();
  const { clients } = useClients();
  const isNew = !project;
  const [name, setName] = useState(project?.name ?? "");
  const [clientId, setClientId] = useState(project?.clientId ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [due, setDue] = useState(project?.due ?? "");

  const save = async () => {
    const n = name.trim();
    if (!n) return;
    if (isNew) await addProject({ name: n, clientId: clientId || null, description, due: due || null });
    else await updateProject(project.id, { name: n, clientId: clientId || null, description, due: due || null });
    onClose();
  };

  return (
    <ModalShell title={isNew ? "New project" : "Edit project"} icon={isNew ? "AddProperty1Bold" : "EditProperty1Linear"} onClose={onClose} footer={
      <>
        {!isNew && (
          <button
            onClick={() => {
              if (window.confirm(`Delete project "${project.name}"? Its tasks move to Chores.`)) {
                void removeProject(project.id);
                onClose();
              }
            }}
            style={{ ...ghostBtn, color: "var(--red-500)", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Icon name="TrashProperty1Linear" size={15} /> Delete
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button onClick={onClose} style={ghostBtn}>Cancel</button>
        <button onClick={save} style={primaryBtn}>{isNew ? "Create project" : "Save changes"}</button>
      </>
    }>
      <div>
        <label style={fieldLabel}>Project name</label>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void save(); }} style={inputStyle} placeholder="e.g. Website Revamp" />
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label style={fieldLabel}>Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="">No client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <label style={fieldLabel}>Target date</label>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} />
        </div>
      </div>
      <div>
        <label style={fieldLabel}>Description</label>
        <RichText value={description} onChange={setDescription} />
      </div>
      {!isNew && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-tertiary)" }}>
          Deleting a project moves its tasks to Chores — it won't delete them.
        </div>
      )}
    </ModalShell>
  );
}
