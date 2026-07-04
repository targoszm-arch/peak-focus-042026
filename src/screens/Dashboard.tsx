import { useMemo, useState } from "react";
import { Card, StatCard, Icon, Checkbox, Badge, Button } from "@/ds";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useTime, fmtClock, fmtDuration } from "@/hooks/use-time";
import { bucket, label as dueLabel } from "@/lib/pfdate";
import { TaskEditModal } from "@/components/pf/modals";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WIDGET_ORDER_KEY = "pf.dashboard.widgetOrder.v1";
const PRIORITY_TONE: Record<string, "danger" | "primary" | "neutral"> = {
  high: "danger",
  medium: "primary",
  low: "neutral",
  none: "neutral",
};

function TimeTracker({ tasks }: { tasks: Task[] }) {
  const { running, start, stop, durationOf, stats, now } = useTime();
  const [desc, setDesc] = useState("");
  const [taskId, setTaskId] = useState("");

  const openTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const runningTask = running?.taskId ? tasks.find((t) => t.id === running.taskId) : null;
  const runningLabel = runningTask?.title || running?.description || "Untitled focus";

  const max = Math.max(1, ...stats.perDay);
  const deltaPct =
    stats.prevWeek > 0 ? Math.round(((stats.week - stats.prevWeek) / stats.prevWeek) * 100) : null;

  const doStart = () => {
    const task = openTasks.find((t) => t.id === taskId);
    start({ description: task ? task.title : desc.trim(), taskId: task?.id ?? null });
    setDesc("");
    setTaskId("");
  };

  return (
    <Card padding={22}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Time tracker</h3>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          padding: 16,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface-sunken)",
        }}
      >
        {running ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 180 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Badge tone="accent" dot>
                  Currently tracking
                </Badge>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--status-success)", fontWeight: 600 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--status-success)" }} /> Live
                </span>
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                {runningLabel}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {fmtClock(durationOf(running))}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                started {new Date(running.startedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </div>
            </div>
            <Button variant="secondary" size="md" onClick={() => stop()} leadingIcon={<Icon name="TimerProperty1Bold" size={16} />}>
              Stop timer
            </Button>
          </>
        ) : (
          <>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              style={{
                flex: "1 1 180px",
                minWidth: 160,
                height: 40,
                padding: "0 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-soft)",
                background: "var(--surface-card)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
              }}
            >
              <option value="">Link a task (optional)</option>
              {openTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") doStart();
              }}
              disabled={!!taskId}
              placeholder={taskId ? "Using the linked task's title" : "Or describe what you're working on"}
              style={{
                flex: "1 1 180px",
                minWidth: 180,
                height: 40,
                padding: "0 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-soft)",
                background: taskId ? "var(--surface-sunken)" : "var(--surface-card)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <Button
              variant="primary"
              size="md"
              onClick={doStart}
              leadingIcon={<Icon name="TimerProperty1Bold" size={16} />}
            >
              Start timer
            </Button>
          </>
        )}
        {/* keep `now` referenced so the live clock re-renders */}
        <span style={{ display: "none" }}>{now}</span>
      </div>

      {/* weekly bars */}
      <div style={{ marginTop: 18, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, height: 120 }}>
        {stats.perDay.map((ms, i) => {
          const h = Math.round((ms / max) * 96);
          const isToday = ((new Date().getDay() + 6) % 7) === i;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                title={fmtDuration(ms)}
                style={{
                  width: "100%",
                  maxWidth: 34,
                  height: Math.max(4, h),
                  borderRadius: "var(--radius-sm)",
                  background: isToday ? "var(--primary-500)" : "var(--primary-100)",
                }}
              />
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{WEEK[i]}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Tracked this week</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
            {fmtDuration(stats.week)}
          </div>
        </div>
        <div style={{ borderLeft: "1px solid var(--border-soft)", paddingLeft: 16 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Today</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
            {fmtDuration(stats.today)}
          </div>
        </div>
        {deltaPct != null && (
          <div style={{ borderLeft: "1px solid var(--border-soft)", paddingLeft: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>vs last week</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: deltaPct >= 0 ? "var(--status-success)" : "var(--status-danger)" }}>
              {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(deltaPct)}%
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function UrgentTasks({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: string) => void }) {
  const [editTask, setEditTask] = useState<Task | null>(null);
  const urgent = tasks
    .filter((t) => !t.completed && ["overdue", "today"].includes(bucket(t.endsAt)))
    .slice(0, 6);
  return (
    <Card padding={20}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Urgent tasks</h3>
        <Badge tone={urgent.length ? "danger" : "success"}>{urgent.length || "0"} to clear</Badge>
      </div>
      {urgent.length === 0 ? (
        <div style={{ padding: "24px 8px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
          Nothing urgent — you&apos;re on top of it.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {urgent.map((t) => {
            const overdue = bucket(t.endsAt) === "overdue";
            return (
              <div
                key={t.id}
                onClick={() => setEditTask(t)}
                title="Open task"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-soft)",
                  cursor: "pointer",
                  transition: "border-color .15s, box-shadow .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-soft)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <span onClick={(e) => e.stopPropagation()} className="inline-flex">
                  <Checkbox checked={t.completed} onChange={() => onToggle(t.id)} />
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.title}
                </span>
                {t.priority !== "none" && (
                  <span className="pf-hide-narrow">
                    <Badge tone={PRIORITY_TONE[t.priority]} dot>
                      {t.priority}
                    </Badge>
                  </span>
                )}
                <span style={{ fontSize: 12, fontWeight: 600, color: overdue ? "var(--red-500)" : "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                  {dueLabel(t.endsAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {editTask && <TaskEditModal task={editTask} onClose={() => setEditTask(null)} />}
    </Card>
  );
}

export default function Dashboard() {
  const { rootTasks: tasks, toggleTask, stats } = useTasks();
  const { projects } = useProjects();

  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const activeProjects = useMemo(() => projects.filter((p) => p.status === "active").length, [projects]);
  const dueToday = tasks.filter((t) => !t.completed && bucket(t.endsAt) === "today").length;

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });

  // Which widget sits in the left (wide) vs right slot of the grid below —
  // persisted locally so the dashboard stays customized. Reordering is via
  // swap buttons rather than drag: native HTML5 drag-and-drop has no touch
  // support on iOS Safari, so a drag handle would silently not work there.
  const [widgetOrder, setWidgetOrder] = useState<["time" | "urgent", "time" | "urgent"]>(() => {
    try {
      const saved = localStorage.getItem(WIDGET_ORDER_KEY);
      if (saved === "urgent,time") return ["urgent", "time"];
    } catch { /* ignore */ }
    return ["time", "urgent"];
  });
  const swapWidgets = () => {
    setWidgetOrder(([a, b]) => {
      const next: ["time" | "urgent", "time" | "urgent"] = [b, a];
      try { localStorage.setItem(WIDGET_ORDER_KEY, next.join(",")); } catch { /* ignore */ }
      return next;
    });
  };
  const widgets = { time: <TimeTracker tasks={tasks} />, urgent: <UrgentTasks tasks={tasks} onToggle={toggleTask} /> };

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Dashboard</h1>
        <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{dateStr}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginTop: 22 }}>
        <StatCard icon={<Icon name="TaskSquareProperty1Bold" size={20} />} label="Due today" value={dueToday} iconTone="primary" />
        <StatCard icon={<Icon name="TickCircleProperty1Bold" size={20} />} label="Completion rate" value={`${completionRate}%`} iconTone="success" />
        <StatCard icon={<Icon name="FolderProperty1Bold" size={20} />} label="Active projects" value={activeProjects} iconTone="accent" />
        <StatCard icon={<Icon name="TaskSquareProperty1Bold" size={20} />} label="Open tasks" value={stats.remaining} iconTone="primary" />
      </div>

      <button
        onClick={swapWidgets}
        title="Swap widget positions"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16,
          height: 30, padding: "0 10px", borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-soft)", background: "var(--surface-card)",
          color: "var(--text-secondary)", cursor: "pointer",
          fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
        }}
      >
        <Icon name="ArrowLeftProperty1Linear" size={13} /><Icon name="ArrowRightProperty1Linear" size={13} /> Swap widgets
      </button>

      <div
        className="pf-2col"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)", gap: 16, marginTop: 10, alignItems: "start" }}
      >
        {widgets[widgetOrder[0]]}
        {widgets[widgetOrder[1]]}
      </div>
    </div>
  );
}
