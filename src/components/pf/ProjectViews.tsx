import { useRef, useState } from "react";
import { Icon, AvatarGroup } from "@/ds";
import { useTasks, type Task, type TaskStatus } from "@/hooks/use-tasks";
import { usePeople } from "@/hooks/use-people";
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

/* ── shared card used by the board ── */
function PFTaskCard({ task, onOpen, dragging }: { task: Task; onOpen: (t: Task) => void; dragging: boolean }) {
  const { checklistStats, assigneesByTask } = useTasks();
  const { people } = usePeople();
  const overdue = bucket(task.endsAt) === "overdue" && !task.completed;
  const sub = checklistStats(task.id);
  const subPct = sub.total ? Math.round((sub.done / sub.total) * 100) : 0;
  const assignees = (assigneesByTask[task.id] ?? [])
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as { name: string }[];
  const prTone = task.priority === "none" ? "--neutral-400" : PRIORITY_TOKEN[task.priority];

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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: "var(--text-primary)", textDecoration: task.completed ? "line-through" : "none", flex: 1, minWidth: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {task.title}
        </span>
        {task.priority !== "none" && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: `var(${prTone})`, flexShrink: 0 }}>
            <Icon name="FlagProperty1Bold" size={12} /> {PRIORITY_LABEL[task.priority]}
          </span>
        )}
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 600, color: overdue ? "var(--red-500)" : "var(--text-tertiary)" }}>
          <Icon name="CalendarProperty1Linear" size={12} /> {dueLabel(task.endsAt)}
        </span>
        <span style={{ flex: 1 }} />
        {assignees.length > 0 && <AvatarGroup users={assignees.map((a) => ({ name: a.name }))} size={22} max={3} />}
      </div>
    </div>
  );
}

/* ══════════ BOARD (kanban) ══════════ */
export function KanbanView({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  const { updateTaskFields } = useTasks();
  const [over, setOver] = useState<TaskStatus | null>(null);
  const dragId = useRef<string | null>(null);

  return (
    <div className="pf-hscroll" style={{ overflowX: "auto", paddingBottom: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${PF_STATUS.length}, minmax(230px, 1fr))`, gap: 14, minWidth: 0 }}>
        {PF_STATUS.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
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
export function TimelineView({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  const dated = tasks.filter((t) => t.endsAt);
  if (dated.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--surface-card)", border: "1px dashed var(--border-strong)", borderRadius: "var(--radius-lg)" }}>
        No dated tasks to place on the timeline yet.
      </div>
    );
  }
  const startOf = (t: Task) => startOfDay(parseDay(t.startsAt || t.endsAt)!);
  const endOf = (t: Task) => startOfDay(parseDay(t.endsAt)!);
  let min = startOf(dated[0]);
  let max = endOf(dated[0]);
  dated.forEach((t) => {
    const s = startOf(t), e = endOf(t);
    if (s < min) min = s;
    if (e > max) max = e;
  });
  min = new Date(min.getTime() - dayMs);
  max = new Date(max.getTime() + dayMs);
  const spanDays = Math.round((max.getTime() - min.getTime()) / dayMs) + 1;
  const days = Array.from({ length: spanDays }, (_, i) => new Date(min.getTime() + i * dayMs));
  const dayW = 46, labelW = 200, rowH = 46;
  const todayIdx = Math.round((startOfDay(new Date()).getTime() - min.getTime()) / dayMs);
  const statusColor = (t: Task) => PF_STATUS.find((s) => s.id === t.status)?.dot ?? "var(--primary-500)";

  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-soft)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: labelW + spanDays * dayW }}>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ width: labelW, flexShrink: 0, padding: "10px 16px", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-tertiary)", borderRight: "1px solid var(--border-soft)" }}>Task</div>
            <div style={{ display: "flex" }}>
              {days.map((d, i) => {
                const isToday = i === todayIdx;
                const weekend = [0, 6].includes(d.getDay());
                return (
                  <div key={i} style={{ width: dayW, flexShrink: 0, textAlign: "center", padding: "7px 0", background: weekend ? "var(--surface-page)" : "transparent" }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700, color: isToday ? "var(--primary-500)" : "var(--text-tertiary)", textTransform: "uppercase" }}>
                      {d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--primary-500)" : "var(--text-secondary)" }}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            {todayIdx >= 0 && todayIdx < spanDays && (
              <div style={{ position: "absolute", top: 0, bottom: 0, left: labelW + todayIdx * dayW + dayW / 2, width: 2, background: "color-mix(in srgb, var(--primary-500) 55%, transparent)", zIndex: 1, pointerEvents: "none" }} />
            )}
            {dated.map((t) => {
              const s = startOf(t), e = endOf(t);
              const left = Math.round((s.getTime() - min.getTime()) / dayMs) * dayW;
              const width = (Math.round((e.getTime() - s.getTime()) / dayMs) + 1) * dayW;
              const col = statusColor(t);
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", height: rowH, borderBottom: "1px solid var(--border-soft)" }}>
                  <div style={{ width: labelW, flexShrink: 0, padding: "0 16px", borderRight: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: 7, height: "100%" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</span>
                  </div>
                  <div style={{ position: "relative", height: "100%", flex: 1 }}>
                    <div
                      onClick={() => onOpen(t)}
                      title={`${t.title} · ${dueLabel(t.endsAt)}`}
                      style={{
                        position: "absolute", top: "50%", transform: "translateY(-50%)",
                        left: left + 5, width: Math.max(width - 10, 24), height: 22,
                        borderRadius: "var(--radius-full)", cursor: "pointer",
                        background: `color-mix(in srgb, ${col} 20%, white)`,
                        border: `1.5px solid ${col}`, display: "flex", alignItems: "center", paddingLeft: 8, gap: 5, overflow: "hidden",
                      }}
                    >
                      {t.completed && <Icon name="TickCircleProperty1Bold" size={13} style={{ color: col, flexShrink: 0 }} />}
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 700, color: `color-mix(in srgb, ${col} 72%, black)`, whiteSpace: "nowrap" }}>
                        {parseDay(t.endsAt)!.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

export function CalendarView({ tasks }: { tasks: Task[] }) {
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
  const statusColor = (t: Task) => PF_STATUS.find((s) => s.id === t.status)?.dot ?? "var(--primary-500)";
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
            if (!d) return <div key={i} style={{ minHeight: 96, borderRight: i % 7 !== 6 ? "1px solid var(--border-soft)" : "none", borderBottom: "1px solid var(--border-soft)", background: "var(--surface-page)" }} />;
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
                  minHeight: 96, padding: 7, cursor: "pointer",
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
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {list.slice(0, 3).map((t) => (
                    <div key={t.id} title={t.title} style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 6px", borderRadius: "var(--radius-sm)", background: `color-mix(in srgb, ${statusColor(t)} 13%, white)`, overflow: "hidden" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: statusColor(t) }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</span>
                    </div>
                  ))}
                  {list.length > 3 && <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, fontWeight: 700, color: "var(--text-tertiary)", paddingLeft: 6 }}>+{list.length - 3} more</span>}
                </div>
              </div>
            );
          })}
        </div>
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
