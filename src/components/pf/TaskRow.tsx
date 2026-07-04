import { useEffect, useState } from "react";
import { Icon, Checkbox } from "@/ds";
import { useTasks, type Task } from "@/hooks/use-tasks";
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
  const [menu, setMenu] = useState<Menu>(null);
  const [editing, setEditing] = useState(false);
  const sub = checklistStats(task.id);
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
    minHeight: 36,
    padding: "5px 8px",
    borderRadius: "var(--radius-sm)",
    fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
  // Icon-only actions get a full thumb-sized (40px) hit area.
  const iconBtn: React.CSSProperties = {
    ...trigger,
    width: 40,
    height: 40,
    padding: 0,
    justifyContent: "center",
  };
  const menuBox: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
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

  /* Two stacked rows on a shared grid: row 1 = checkbox + task name,
     row 2 = meta chips + actions (in the name's column), so a long name
     never fights the actions line for horizontal space. */
  return (
    <div
      onClick={() => setEditing(true)}
      title="Open task"
      className={`grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 ${dense ? "px-3 py-2" : "px-3.5 py-3"}`}
      style={{
        background: "var(--surface-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-soft)",
        transition: "border-color .15s, box-shadow .15s",
        opacity: task.completed ? 0.6 : 1,
        cursor: "pointer",
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
      {/* row 1 — checkbox + name */}
      <span onClick={(e) => e.stopPropagation()} className="inline-flex pt-px">
        <Checkbox checked={task.completed} onChange={() => toggleTask(task.id)} />
      </span>

      <span
        title="Open task"
        className="min-w-0 whitespace-normal break-words outline-none"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.45,
          color: "var(--text-primary)",
          textDecoration: task.completed ? "line-through" : "none",
          borderRadius: "var(--radius-sm)",
          padding: "1px 4px",
          margin: "-1px -4px",
        }}
      >
        {task.title}
      </span>

      {/* row 2 — meta chips + actions, aligned under the name */}
      <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1">
        {/* checklist progress */}
        {sub.total > 0 && (
          <span
            title={`${sub.done}/${sub.total} checklist steps done`}
            className="inline-flex shrink-0 items-center gap-1"
            style={{
              fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700,
              color: sub.done === sub.total ? "var(--status-success, #2A9E75)" : "var(--text-tertiary)",
            }}
          >
            <Icon name="TaskSquareProperty1Bold" size={13} /> {sub.done}/{sub.total}
          </span>
        )}

        {/* project */}
        {showProject && (
          <span onClick={(e) => e.stopPropagation()} className="relative shrink-0">
            <button
              onClick={() => setMenu(menu === "project" ? null : "project")}
              title="Change project"
              style={{ ...trigger, fontSize: 12, color: "var(--text-secondary)", maxWidth: 150 }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
              <span className="overflow-hidden text-ellipsis">{tag.name}</span>
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
        <span onClick={(e) => e.stopPropagation()} className="relative shrink-0">
          <button
            onClick={() => setMenu(menu === "priority" ? null : "priority")}
            title="Change priority"
            style={{ ...iconBtn, color: `var(${prTone})` }}
          >
            <Icon name="FlagProperty1Bold" size={18} />
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
        <span onClick={(e) => e.stopPropagation()} className="relative shrink-0">
          <button
            onClick={() => setMenu(menu === "due" ? null : "due")}
            title="Set date"
            style={{
              ...trigger,
              gap: 5,
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

        {/* actions: add-to-focus, edit, delete — pushed to the row's end */}
        <span onClick={(e) => e.stopPropagation()} className="ml-auto inline-flex shrink-0 items-center gap-0.5">
          {!task.completed && (
            <button
              onClick={() => (queued ? focus.remove(task.id) : focus.add(task.id))}
              title={queued ? "In focus queue — remove" : "Add to focus"}
              style={{
                ...iconBtn,
                background: queued ? "var(--primary-50, #E8F0FE)" : "transparent",
                color: queued ? "var(--primary-500)" : "var(--text-tertiary)",
              }}
              onMouseEnter={(e) => { if (!queued) e.currentTarget.style.color = "var(--primary-500)"; }}
              onMouseLeave={(e) => { if (!queued) e.currentTarget.style.color = "var(--text-tertiary)"; }}
            >
              <Icon name="TimerProperty1Bold" size={18} />
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            title="Edit task — checklist, notes, dates"
            aria-label={`Edit task ${task.title}`}
            style={{ ...iconBtn, color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary-500)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
          >
            <Icon name="EditProperty1Linear" size={18} />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Delete "${task.title}"?`)) removeTask(task.id);
            }}
            title="Delete task"
            aria-label={`Delete task ${task.title}`}
            style={{ ...iconBtn, color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--red-500)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
          >
            <Icon name="TrashProperty1Linear" size={18} />
          </button>
        </span>
      </div>

      {editing && (
        <span onClick={(e) => e.stopPropagation()} className="contents">
          <TaskEditModal task={task} onClose={() => setEditing(false)} />
        </span>
      )}
    </div>
  );
}
