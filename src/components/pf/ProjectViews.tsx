import { Fragment, useEffect, useRef, useState } from "react";
import { Icon, AvatarGroup, Checkbox } from "@/ds";
import { useTasks, type Task, type TaskStatus } from "@/hooks/use-tasks";
import { usePeople } from "@/hooks/use-people";
import { useProjects } from "@/hooks/use-projects";
import { bucket, label as dueLabel } from "@/lib/pfdate";
import { PRIORITY_LABEL, PRIORITY_TOKEN } from "./pf-helpers";
import TaskRow from "./TaskRow";

/* Project task views — Board (kanban drag-drop), Timeline (gantt), Calendar.
   Ported from the design system's ProjectViews.jsx onto the live data layer.
   Status changes flow through useTasks().updateTaskFields({ status }). */

export const PF_STATUS: { id: TaskStatus; title: string; dot: string }[] = [
  { id: "todo", title: "To Do", dot: "var(--neutral-400, #9aa3b2)" },
  { id: "progress", title: "In Progress", dot: "var(--primary-500)" },
  { id: "review", title: "In Review", dot: "var(--secondary-500)" },
  { id: "done", title: "Done", dot: "var(--green-600, #2A9E75)" },
];

function parseDay(iso: string | null): Date | null {
  if (!iso) return null;
  const d = iso.length <= 10 ? new Date(iso + "T00:00:00") : new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
const dayMs = 86400000;
const statusMeta = (status: TaskStatus) => PF_STATUS.find((s) => s.id === status) ?? PF_STATUS[0];

// Module-level (not component state) so the horizontal scroll position
// survives switching to another Projects tab and back — TimelineView
// unmounts when the view switcher leaves "timeline". Resets on full reload.
let timelineScrollLeft: number | null = null;

/* ── shared card used by the board (and any other card-grid view) ── */
export function PFTaskCard({ task, onOpen, dragging }: { task: Task; onOpen: (t: Task) => void; dragging: boolean }) {
  const { checklistStats, assigneesByTask, toggleTask } = useTasks();
  const { people } = usePeople();
  const { projects } = useProjects();
  const overdue = bucket(task.endsAt) === "overdue" && !task.completed;
  const sub = checklistStats(task.id);
  const subPct = sub.total ? Math.round((sub.done / sub.total) * 100) : 0;
  const assignees = (assigneesByTask[task.id] ?? [])
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as { name: string }[];
  const project = projects.find((p) => p.id === task.projectId) || null;
  const status = statusMeta(task.status);
  const prTone = task.priority === "none" ? "--neutral-400" : PRIORITY_TOKEN[task.priority];
  const formattedDate = task.endsAt
    ? parseDay(task.endsAt)?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) ?? "No date"
    : "No date";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/pf-task", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onOpen(task)}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-soft)",
        borderRadius: "var(--radius-lg)",
        padding: "13px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 11,
        cursor: "grab",
        boxShadow: dragging ? "var(--shadow-md)" : "0 1px 2px rgba(17,22,37,.05)",
        opacity: task.completed ? 0.66 : 1,
        transition: "box-shadow .15s, border-color .15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-soft)"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(17,22,37,.05)"; }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span onClick={(e) => e.stopPropagation()} className="inline-flex shrink-0">
            <Checkbox checked={task.completed} onChange={() => toggleTask(task.id)} />
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: "var(--text-primary)", textDecoration: task.completed ? "line-through" : "none", flex: 1, minWidth: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {task.title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: status.dot, background: `color-mix(in srgb, ${status.dot} 12%, white)`, border: `1px solid color-mix(in srgb, ${status.dot} 28%, white)`, borderRadius: "var(--radius-full)", padding: "2px 7px", flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.dot }} /> {status.title}
          </span>
          {task.priority !== "none" && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: `var(${prTone})`, flexShrink: 0 }}>
              <Icon name="FlagProperty1Bold" size={12} /> {PRIORITY_LABEL[task.priority]}
            </span>
          )}
        </div>
      </div>

      {sub.total > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Icon name="TaskSquareProperty1Linear" size={12} /> {sub.done}/{sub.total} steps
            </span>
            <span>{subPct}%</span>
          </div>
          <div style={{ height: 5, borderRadius: "var(--radius-full)", background: "var(--surface-sunken)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${subPct}%`, borderRadius: "var(--radius-full)", background: task.completed || subPct === 100 ? "var(--green-600, #2A9E75)" : "var(--primary-500)", transition: "width .2s" }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10, borderTop: "1px solid var(--border-soft)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, color: "var(--text-tertiary)", minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: project?.color ?? "#8796AF", flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project?.name ?? "Chores"}</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, color: overdue ? "var(--red-500)" : "var(--text-tertiary)", flexShrink: 0 }}>
          <Icon name="CalendarProperty1Linear" size={12} /> {formattedDate}
        </span>
        <span style={{ flex: 1 }} />
        {assignees.length > 0 && <AvatarGroup users={assignees.map((a) => ({ name: a.name }))} size={22} max={3} />}
      </div>
    </div>
  );
}

/* ── responsive card grid — same PFTaskCard as the board, but a flat,
   wrapping grid (3-5 columns depending on width, 1 on phones) for plain
   task lists like Tasks and a project's To do/Done sections. ── */
export function TaskCardGrid({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
      {tasks.map((t) => <PFTaskCard key={t.id} task={t} onOpen={onOpen} dragging={false} />)}
    </div>
  );
}

/* ══════════ BOARD (kanban) ══════════ */
export function taskCmp(sortKey: string) {
  return (a: Task, b: Task) => {
    if (sortKey === "name") return a.title.localeCompare(b.title);
    if (sortKey === "progress") return Number(a.completed) - Number(b.completed) || (a.endsAt ?? "9999-99").localeCompare(b.endsAt ?? "9999-99");
    return (a.endsAt ?? "9999-99").localeCompare(b.endsAt ?? "9999-99") || a.title.localeCompare(b.title); // due / client fallback
  };
}

export function KanbanView({ tasks, onOpen, sortKey = "due" }: { tasks: Task[]; onOpen: (t: Task) => void; sortKey?: string }) {
  const { updateTaskFields } = useTasks();
  const [over, setOver] = useState<TaskStatus | null>(null);
  const dragId = useRef<string | null>(null);

  return (
    <div className="pf-hscroll" style={{ overflowX: "auto", paddingBottom: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${PF_STATUS.length}, minmax(230px, 1fr))`, gap: 14, minWidth: 0 }}>
        {PF_STATUS.map((col) => {
          const items = tasks.filter((t) => t.status === col.id).sort(taskCmp(sortKey));
          const isOver = over === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== col.id) setOver(col.id); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver((o) => (o === col.id ? null : o)); }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/pf-task") || dragId.current;
                setOver(null);
                if (id) void updateTaskFields(id, { status: col.id });
              }}
              style={{
                display: "flex", flexDirection: "column", gap: 10, padding: 10,
                borderRadius: "var(--radius-lg)",
                background: isOver ? `color-mix(in srgb, ${col.dot} 11%, white)` : "var(--surface-page)",
                border: isOver ? `1.5px dashed ${col.dot}` : "1.5px solid transparent",
                transition: "background .15s, border-color .15s", minHeight: 120,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: col.dot }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{col.title}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)", background: "var(--surface-card)", borderRadius: "var(--radius-full)", minWidth: 22, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {items.map((t) => <PFTaskCard key={t.id} task={t} onOpen={onOpen} dragging={false} />)}
                {items.length === 0 && (
                  <div style={{ padding: "18px 10px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-tertiary)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-md)" }}>
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════ TIMELINE (gantt) ══════════ */
export function TimelineView({ tasks, onOpen, sortKey = "name" }: { tasks: Task[]; onOpen: (t: Task) => void; sortKey?: string }) {
  const { projects } = useProjects();

  // Per-project collapse (persists across view switches).
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("pf.timeline.collapsed") || "[]")); } catch { return new Set(); }
  });
  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      try { localStorage.setItem("pf.timeline.collapsed", JSON.stringify([...n])); } catch { /* ignore */ }
      return n;
    });

  // Resizable label column.
  // Default narrower on small screens so the day grid is visible without
  // needing to drag-resize first — the resize handle is hard to hit precisely
  // with a finger, so mobile shouldn't depend on it just to see any tasks.
  const [labelW, setLabelW] = useState(() => (typeof window !== "undefined" && window.innerWidth < 700 ? 130 : 280));
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientX - dragRef.current.startX;
      setLabelW(Math.min(520, Math.max(90, dragRef.current.startW + delta)));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const dated = tasks.filter((t) => t.endsAt);
  const startOf = (t: Task) => startOfDay(parseDay(t.startsAt || t.endsAt)!);
  const endOf = (t: Task) => startOfDay(parseDay(t.endsAt)!);
  const now = startOfDay(new Date());
  let min = dated.length ? startOf(dated[0]) : now;
  let max = dated.length ? endOf(dated[0]) : now;
  dated.forEach((t) => {
    const s = startOf(t), e = endOf(t);
    if (s < min) min = s;
    if (e > max) max = e;
  });
  min = new Date(min.getTime() - dayMs);
  max = new Date(max.getTime() + dayMs);
  const spanDays = Math.round((max.getTime() - min.getTime()) / dayMs) + 1;
  const days = Array.from({ length: spanDays }, (_, i) => new Date(min.getTime() + i * dayMs));
  const dayW = 58, rowH = 46;
  const todayIdx = Math.round((now.getTime() - min.getTime()) / dayMs);

  // Group consecutive days into month segments for the header's month row.
  const monthGroups: { key: string; label: string; startIdx: number; span: number }[] = [];
  days.forEach((d, i) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.key === key) last.span += 1;
    else monthGroups.push({ key, label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }), startIdx: i, span: 1 });
  });
  const statusFor = (t: Task) => statusMeta(t.status);

  // Default horizontal scroll = the current week, leftmost — restored from
  // the module-level value if the user already scrolled this session
  // (persists across switching to Board/List/Calendar and back).
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasData = dated.length > 0;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasData) return;
    if (timelineScrollLeft !== null) {
      el.scrollLeft = timelineScrollLeft;
      return;
    }
    const mondayOffset = (new Date().getDay() + 6) % 7; // days since this week's Monday
    const weekStartIdx = Math.max(0, todayIdx - mondayOffset);
    const initial = weekStartIdx * dayW;
    el.scrollLeft = initial;
    timelineScrollLeft = initial;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasData]);

  if (dated.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--surface-card)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-lg)" }}>
        No dated tasks to place on the timeline yet.
      </div>
    );
  }

  // Group rows by project so it's clear which project each bar belongs to.
  const projectMeta = (pid: string | null) => {
    const p = pid ? projects.find((pr) => pr.id === pid) : null;
    return { name: p?.name ?? "Chores", color: p?.color ?? "#8796AF" };
  };
  const groupMap = new Map<string, Task[]>();
  for (const t of dated) {
    const key = t.projectId || "inbox";
    (groupMap.get(key) ?? groupMap.set(key, []).get(key)!).push(t);
  }
  const groupDue = (key: string) => {
    const p = key !== "inbox" ? projects.find((pr) => pr.id === key) : null;
    return p?.due ?? "9999-99";
  };
  const groups = [...groupMap.entries()]
    .map(([key, items]) => {
      const done = items.filter((t) => t.completed).length;
      return { key, items, meta: projectMeta(key === "inbox" ? null : key), pct: items.length ? done / items.length : 0, due: groupDue(key) };
    })
    .sort((a, b) => {
      if (sortKey === "due") return a.due.localeCompare(b.due) || a.meta.name.localeCompare(b.meta.name);
      if (sortKey === "progress") return b.pct - a.pct || a.meta.name.localeCompare(b.meta.name);
      return a.meta.name.localeCompare(b.meta.name); // name / client
    });

  // Frozen (sticky) so the task name stays visible while scrolling through days.
  // zIndex 3 keeps it above the day-grid's task bars (2) and the today marker (1).
  const stickyLabelCell: React.CSSProperties = { position: "sticky", left: 0, zIndex: 3, background: "var(--surface-card)" };

  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
      {/* Wraps only the scrolling table (not the legend below) so the resize
          handle, positioned relative to this non-scrolling wrapper rather than
          the horizontally-scrolling content, stays aligned with the frozen
          Task column instead of scrolling away with the days. */}
      <div style={{ position: "relative" }}>
        <div ref={scrollRef} onScroll={(e) => { timelineScrollLeft = e.currentTarget.scrollLeft; }} style={{ overflowX: "auto" }}>
          <div style={{ minWidth: `max(100%, ${labelW + spanDays * dayW}px)`, position: "relative" }}>
          <div style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-soft)" }}>
              <div style={{ ...stickyLabelCell, width: labelW, flexShrink: 0, borderRight: "1px solid var(--border-soft)" }} />
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${spanDays}, minmax(${dayW}px, 1fr))`, flex: 1, minWidth: 0 }}>
                {monthGroups.map((g) => (
                  <div
                    key={g.key}
                    style={{
                      gridColumn: `${g.startIdx + 1} / span ${g.span}`,
                      padding: "6px 10px", borderLeft: g.startIdx > 0 ? "1px solid var(--border-soft)" : "none",
                      fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 800,
                      color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}
                  >
                    {g.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex" }}>
              <div style={{ ...stickyLabelCell, width: labelW, flexShrink: 0, padding: "10px 16px", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", borderRight: "1px solid var(--border-soft)" }}>Task</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${spanDays}, minmax(${dayW}px, 1fr))`, flex: 1, minWidth: 0 }}>
                {days.map((d, i) => {
                  const isToday = i === todayIdx;
                  const weekend = [0, 6].includes(d.getDay());
                  return (
                    <div key={i} style={{ minWidth: dayW, textAlign: "center", padding: "7px 0", background: weekend ? "var(--surface-page)" : "transparent" }}>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700, color: isToday ? "var(--primary-500)" : "var(--text-tertiary)", textTransform: "uppercase" }}>
                        {d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                      </div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--primary-500)" : "var(--text-secondary)" }}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            {todayIdx >= 0 && todayIdx < spanDays && (
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `calc(${labelW}px + ((100% - ${labelW}px) / ${spanDays}) * ${todayIdx + 0.5})`, width: 2, background: "color-mix(in srgb, var(--primary-500) 55%, transparent)", zIndex: 1, pointerEvents: "none" }} />
            )}
            {groups.map((g, gi) => (
              <Fragment key={g.key}>
                <div style={{ display: "flex", alignItems: "center", height: 32, background: "var(--surface-sunken)", borderBottom: "1px solid var(--border-soft)", borderTop: gi > 0 ? "1px solid var(--border-soft)" : "none" }}>
                  <button onClick={() => toggleCollapse(g.key)} aria-expanded={!collapsed.has(g.key)} title={collapsed.has(g.key) ? "Expand project" : "Collapse project"} style={{ position: "sticky", left: 0, display: "inline-flex", alignItems: "center", gap: 8, padding: "0 16px", height: "100%", zIndex: 3, border: "none", background: "var(--surface-sunken)", cursor: "pointer" }}>
                    <Icon name="ArrowDownProperty1Linear" size={14} style={{ color: "var(--text-tertiary)", transform: collapsed.has(g.key) ? "rotate(-90deg)" : "none", transition: "transform .18s", flexShrink: 0 }} />
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: g.meta.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>{g.meta.name}</span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)" }}>{g.items.length}</span>
                  </button>
                </div>
                {!collapsed.has(g.key) && g.items.map((t) => {
                  const s = startOf(t), e = endOf(t);
                  const startIndex = Math.round((s.getTime() - min.getTime()) / dayMs);
                  const duration = Math.round((e.getTime() - s.getTime()) / dayMs) + 1;
                  const status = statusFor(t);
                  const col = status.dot;
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", height: rowH, borderBottom: "1px solid var(--border-soft)" }}>
                      <div onClick={() => onOpen(t)} title="Open task" style={{ ...stickyLabelCell, width: labelW, flexShrink: 0, padding: "0 16px", borderRight: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: 7, height: "100%", cursor: "pointer" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, flexShrink: 0 }} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: t.completed ? "line-through" : "none", flex: 1, minWidth: 0 }}>{t.title}</span>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 700, color: col, background: `color-mix(in srgb, ${col} 12%, white)`, borderRadius: "var(--radius-full)", padding: "2px 6px", flexShrink: 0 }}>{status.title}</span>
                      </div>
                      <div style={{ position: "relative", height: "100%", flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: `repeat(${spanDays}, minmax(${dayW}px, 1fr))`, alignItems: "center" }}>
                        <div
                          onClick={(e) => { e.stopPropagation(); onOpen(t); }}
                          title={`${t.title} · ${dueLabel(t.endsAt)}`}
                          style={{
                            gridColumn: `${startIndex + 1} / span ${duration}`, height: 23,
                            margin: "0 3px", minWidth: 40, position: "relative", zIndex: 2,
                            borderRadius: "var(--radius-full)", cursor: "pointer",
                            background: `color-mix(in srgb, ${col} 20%, white)`,
                            border: `1.5px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: 6, paddingRight: 6, gap: 4, overflow: "hidden",
                          }}
                        >
                          {t.completed && <Icon name="TickCircleProperty1Bold" size={13} style={{ color: col, flexShrink: 0 }} />}
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 700, color: `color-mix(in srgb, ${col} 72%, black)`, whiteSpace: "nowrap" }}>
                            {status.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
          </div>
        </div>
        {/* drag handle to resize the label column — positioned relative to this
            non-scrolling wrapper (not the scrolled content) so it stays aligned
            with the frozen Task column regardless of horizontal scroll */}
        <div
          onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); dragRef.current = { startX: e.clientX, startW: labelW }; }}
          title="Drag to resize"
          style={{
            position: "absolute", top: 0, bottom: 0, left: labelW - 12, width: 24, cursor: "col-resize", zIndex: 20,
            touchAction: "none", display: "flex", justifyContent: "center",
          }}
          onMouseEnter={(e) => { (e.currentTarget.firstChild as HTMLElement).style.background = "var(--primary-500)"; }}
          onMouseLeave={(e) => { (e.currentTarget.firstChild as HTMLElement).style.background = "var(--border-strong)"; }}
        >
          <span style={{ width: 2, height: "100%", background: "var(--border-strong)", pointerEvents: "none" }} />
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "11px 16px", borderTop: "1px solid var(--border-soft)", background: "var(--surface-page)" }}>
        {PF_STATUS.map((s) => (
          <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.dot }} /> {s.title}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════ CALENDAR (month) ══════════ */
const calBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 34, height: 34, borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-strong)", background: "var(--surface-card)",
  color: "var(--text-secondary)", cursor: "pointer", flexShrink: 0,
};

export function CalendarView({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  const base = new Date();
  const [month, setMonth] = useState(() => new Date(base.getFullYear(), base.getMonth(), 1));
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const [selected, setSelected] = useState(() => iso(base));

  const y = month.getFullYear(), m = month.getMonth();
  const startDow = (new Date(y, m, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayIso = iso(base);
  const dueIso = (t: Task) => (t.endsAt ? t.endsAt.slice(0, 10) : null);
  const tasksOn = (d: Date) => tasks.filter((t) => dueIso(t) === iso(d));
  const selTasks = tasks.filter((t) => dueIso(t) === selected).sort((a, b) => Number(a.completed) - Number(b.completed));
  const statusFor = (t: Task) => statusMeta(t.status);
  const shift = (delta: number) => setMonth(new Date(y, m + delta, 1));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border-soft)" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h3>
          <span style={{ flex: 1 }} />
          <button onClick={() => shift(-1)} style={calBtn} aria-label="Previous month"><Icon name="ArrowLeftProperty1Linear" size={16} /></button>
          <button onClick={() => setMonth(new Date(base.getFullYear(), base.getMonth(), 1))} style={{ ...calBtn, width: "auto", padding: "0 12px", fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700 }}>Today</button>
          <button onClick={() => shift(1)} style={calBtn} aria-label="Next month"><Icon name="ArrowRightProperty1Linear" size={16} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid var(--border-soft)" }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
            <div key={w} style={{ padding: "9px 0", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-tertiary)" }}>{w}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} style={{ minHeight: 160, borderRight: i % 7 !== 6 ? "1px solid var(--border-soft)" : "none", borderBottom: "1px solid var(--border-soft)", background: "var(--surface-page)" }} />;
            const di = iso(d);
            const list = tasksOn(d);
            const isToday = di === todayIso;
            const isSel = di === selected;
            const weekend = [0, 6].includes(d.getDay());
            return (
              <div
                key={i}
                onClick={() => setSelected(di)}
                style={{
                  minHeight: 160, padding: 7, cursor: "pointer",
                  borderRight: i % 7 !== 6 ? "1px solid var(--border-soft)" : "none",
                  borderBottom: "1px solid var(--border-soft)",
                  background: isSel ? "color-mix(in srgb, var(--primary-500) 8%, white)" : weekend ? "var(--surface-page)" : "var(--surface-card)",
                  boxShadow: isSel ? "inset 0 0 0 1.5px var(--primary-500)" : "none",
                  transition: "background .12s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 5 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 22, height: 22, padding: "0 5px", borderRadius: "var(--radius-full)",
                    fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: isToday ? 800 : 600,
                    background: isToday ? "var(--primary-500)" : "transparent",
                    color: isToday ? "#fff" : "var(--text-secondary)",
                  }}>{d.getDate()}</span>
                </div>
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 120, overflowY: "auto" }}
                >
                  {list.map((t) => {
                    const status = statusFor(t);
                    return (
                      <div
                        key={t.id}
                        title={`Open ${t.title} · ${status.title}`}
                        onClick={() => onOpen(t)}
                        style={{ display: "flex", alignItems: "flex-start", gap: 5, minHeight: 38, height: 38, flexShrink: 0, padding: "3px 6px", borderRadius: "var(--radius-sm)", background: `color-mix(in srgb, ${status.dot} 13%, white)`, overflow: "hidden", cursor: "pointer" }}
                      >
                        <span style={{ width: 5, height: 5, marginTop: 5, borderRadius: "50%", flexShrink: 0, background: status.dot }} />
                        <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 600, lineHeight: 1.15, color: "var(--text-primary)", whiteSpace: "normal", overflow: "hidden", overflowWrap: "anywhere", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</span>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 9.5, fontWeight: 700, lineHeight: 1.1, color: status.dot, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{status.title}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, margin: "-4px 2px 0" }}>
        {PF_STATUS.map((s) => (
          <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.dot }} /> {s.title}
          </span>
        ))}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 2px 10px" }}>
          <Icon name="CalendarProperty1Bold" size={16} style={{ color: "var(--primary-500)" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            {parseDay(selected)!.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)" }}>
            {selTasks.length} task{selTasks.length === 1 ? "" : "s"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {selTasks.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)", fontSize: 13.5, background: "var(--surface-card)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-lg)" }}>
              Nothing due this day.
            </div>
          ) : (
            selTasks.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </div>
      </div>
    </div>
  );
}
