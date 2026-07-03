import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Checkbox } from "@/ds";
import { useTasks, INBOX_ID, type Task } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useFocusQueue } from "@/hooks/use-focus-queue";
import { bucket, label as dueLabelFor } from "@/lib/pfdate";
import { PRIORITY_LABEL, PRIORITY_TOKEN, DUE_PRESETS, dueFromPreset } from "./pf-helpers";
import { TaskEditModal } from "./modals";

type Menu = "project" | "priority" | "due" | null;

export default function TaskRow({
  task,
  showProject = true,
  dense = false,
}: {
  task: Task;
  showProject?: boolean;
  dense?: boolean;
}) {
  const { toggleTask, updateTaskFields, removeTask, checklistStats } = useTasks();
  const { projects } = useProjects();
  const focus = useFocusQueue();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<Menu>(null);
  const [editing, setEditing] = useState(false);
  const sub = checklistStats(task.id);
  const canOpen = task.projectId !== INBOX_ID;
  const queued = focus.has(task.id);

  useEffect(() => {
    if (!menu) return;
    const h = () => setMenu(null);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [menu]);

  const overdue = !task.completed && bucket(task.endsAt) === "overdue";
  const project = projects.find((p) => p.id === task.projectId) || null;
  const tag = { name: project?.name ?? "Chores", color: project?.color ?? "#8796AF" };
  const prTone = task.priority === "none" ? "--neutral-400" : PRIORITY_TOKEN[task.priority];

  const set = (patch: Parameters<typeof updateTaskFields>[1]) => {
    updateTaskFields(task.id, patch);
    setMenu(null);
  };

  const trigger: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "3px 6px",
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
  const menuBox: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    zIndex: 40,
    background: "var(--surface-card)",
    border: "1px solid var(--border-soft)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-lg)",
    padding: 6,
    minWidth: 176,
    maxHeight: 260,
    overflowY: "auto",
    textAlign: "left",
  };
  const menuItem = (sel: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    background: sel ? "var(--surface-sunken)" : "transparent",
  });

  return (
    <div
      onClick={() => { if (canOpen) navigate(`/projects/${task.projectId}`); }}
      title={canOpen ? "Open project" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: dense ? "9px 12px" : "12px 14px",
        background: "var(--surface-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-soft)",
        transition: "border-color .15s, box-shadow .15s",
        opacity: task.completed ? 0.6 : 1,
        cursor: canOpen ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--border-soft)";
      }}
    >
      <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex" }}>
        <Checkbox checked={task.completed} onChange={() => toggleTask(task.id)} />
      </span>

      <span
        onClickCapture={(e) => e.stopPropagation()}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        title="Click to edit"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.currentTarget as HTMLElement).blur();
          } else if (e.key === "Escape") {
            e.currentTarget.textContent = task.title;
            (e.currentTarget as HTMLElement).blur();
          }
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = "var(--surface-sunken)";
          e.currentTarget.style.whiteSpace = "normal";
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.whiteSpace = "nowrap";
          const v = e.currentTarget.textContent?.trim() ?? "";
          if (v && v !== task.title) updateTaskFields(task.id, { title: v });
          else e.currentTarget.textContent = task.title;
        }}
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--text-primary)",
          textDecoration: task.completed ? "line-through" : "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          outline: "none",
          borderRadius: "var(--radius-sm)",
          padding: "2px 4px",
          margin: "-2px -4px",
          cursor: "text",
        }}
      >
        {task.title}
      </span>

      {/* checklist progress */}
      {sub.total > 0 && (
        <span
          title={`${sub.done}/${sub.total} checklist steps done`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
            fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
            color: sub.done === sub.total ? "var(--status-success, #2A9E75)" : "var(--text-tertiary)",
          }}
        >
          <Icon name="TaskSquareProperty1Bold" size={13} /> {sub.done}/{sub.total}
        </span>
      )}

      {/* project */}
      {showProject && (
        <span onClick={(e) => e.stopPropagation()} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setMenu(menu === "project" ? null : "project")}
            title="Change project"
            style={{ ...trigger, fontSize: 12, color: "var(--text-secondary)", maxWidth: 140 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{tag.name}</span>
          </button>
          {menu === "project" && (
            <div style={menuBox}>
              <div style={menuItem(task.projectId === "inbox")} onClick={() => set({ projectId: "inbox" })}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8796AF" }} /> Chores
              </div>
              {projects.map((p) => (
                <div key={p.id} style={menuItem(task.projectId === p.id)} onClick={() => set({ projectId: p.id })}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} /> {p.name}
                </div>
              ))}
            </div>
          )}
        </span>
      )}

      {/* priority */}
      <span onClick={(e) => e.stopPropagation()} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setMenu(menu === "priority" ? null : "priority")}
          title="Change priority"
          style={{ ...trigger, color: `var(${prTone})`, padding: "3px 4px" }}
        >
          <Icon name="FlagProperty1Bold" size={15} />
        </button>
        {menu === "priority" && (
          <div style={menuBox}>
            {(["high", "medium", "low"] as const).map((p) => (
              <div key={p} style={menuItem(task.priority === p)} onClick={() => set({ priority: p })}>
                <Icon name="FlagProperty1Bold" size={14} style={{ color: `var(${PRIORITY_TOKEN[p]})` }} /> {PRIORITY_LABEL[p]}
              </div>
            ))}
          </div>
        )}
      </span>

      {/* due */}
      <span onClick={(e) => e.stopPropagation()} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setMenu(menu === "due" ? null : "due")}
          title="Set date"
          style={{
            ...trigger,
            gap: 5,
            minWidth: 74,
            justifyContent: "flex-end",
            fontSize: 12,
            fontWeight: 600,
            color: overdue ? "var(--red-500)" : "var(--text-tertiary)",
          }}
        >
          <Icon name="CalendarProperty1Linear" size={13} /> {dueLabelFor(task.endsAt)}
        </button>
        {menu === "due" && (
          <div style={menuBox}>
            {DUE_PRESETS.map(([k, l]) => (
              <div key={k} style={menuItem(false)} onClick={() => set({ endsAt: dueFromPreset(k) })}>
                <Icon name="CalendarProperty1Linear" size={14} style={{ color: "var(--text-tertiary)" }} /> {l}
              </div>
            ))}
          </div>
        )}
      </span>

      {/* row actions: add-to-focus, edit, delete */}
      <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        {!task.completed && (
          <button
            onClick={() => (queued ? focus.remove(task.id) : focus.add(task.id))}
            title={queued ? "In focus queue — remove" : "Add to focus"}
            style={{
              ...trigger, padding: "3px 4px",
              background: queued ? "var(--primary-50, #E8F0FE)" : "transparent",
              color: queued ? "var(--primary-500)" : "var(--text-tertiary)",
            }}
            onMouseEnter={(e) => { if (!queued) e.currentTarget.style.color = "var(--primary-500)"; }}
            onMouseLeave={(e) => { if (!queued) e.currentTarget.style.color = "var(--text-tertiary)"; }}
          >
            <Icon name="TimerProperty1Bold" size={15} />
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          title="Edit task — checklist, notes, dates"
          aria-label={`Edit task ${task.title}`}
          style={{ ...trigger, padding: "3px 4px", color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary-500)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          <Icon name="EditProperty1Linear" size={15} />
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${task.title}"?`)) removeTask(task.id);
          }}
          title="Delete task"
          aria-label={`Delete task ${task.title}`}
          style={{ ...trigger, padding: "3px 4px", color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red-500)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          <Icon name="TrashProperty1Linear" size={15} />
        </button>
      </span>

      {editing && (
        <span onClick={(e) => e.stopPropagation()}>
          <TaskEditModal task={task} onClose={() => setEditing(false)} />
        </span>
      )}
    </div>
  );
}
