import { useMemo, useState } from "react";
import { Card, StatCard, Icon, Checkbox, Badge, Button } from "@/ds";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useTime, fmtClock, fmtDuration } from "@/hooks/use-time";
import { bucket, label as dueLabel } from "@/lib/pfdate";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRIORITY_TONE: Record<string, "danger" | "primary" | "neutral"> = {
  high: "danger",
  medium: "primary",
  low: "neutral",
  none: "neutral",
};

function TimeTracker() {
  const { running, start, stop, durationOf, stats, now } = useTime();
  const [desc, setDesc] = useState("");

  const max = Math.max(1, ...stats.perDay);
  const deltaPct =
    stats.prevWeek > 0 ? Math.round(((stats.week - stats.prevWeek) / stats.prevWeek) * 100) : null;

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
                {running.description || "Untitled focus"}
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
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && desc.trim()) {
                  start({ description: desc.trim() });
                  setDesc("");
                }
              }}
              placeholder="What are you working on?"
              style={{
                flex: 1,
                minWidth: 180,
                height: 40,
                padding: "0 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-soft)",
                background: "var(--surface-card)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                start({ description: desc.trim() });
                setDesc("");
              }}
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-soft)",
                }}
              >
                <Checkbox checked={t.completed} onChange={() => onToggle(t.id)} />
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
    </Card>
  );
}

export default function Dashboard() {
  const { tasks, toggleTask, stats } = useTasks();
  const { projects } = useProjects();

  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const activeProjects = useMemo(() => projects.filter((p) => p.status === "active").length, [projects]);
  const dueToday = tasks.filter((t) => !t.completed && bucket(t.endsAt) === "today").length;

  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });

  return (
    <div className="pf-page" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px 56px" }}>
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

      <div
        className="pf-2col"
        style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)", gap: 16, marginTop: 16, alignItems: "start" }}
      >
        <TimeTracker />
        <UrgentTasks tasks={tasks} onToggle={toggleTask} />
      </div>
    </div>
  );
}
