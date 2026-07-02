import { useMemo } from "react";
import { Card, StatCard, Icon, Checkbox, Badge } from "@/ds";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { useHabits } from "@/hooks/use-habits";
import { bucket, label as dueLabel } from "@/lib/pfdate";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const PRIORITY_TONE: Record<string, "danger" | "primary" | "neutral"> = {
  high: "danger",
  medium: "primary",
  low: "neutral",
  none: "neutral",
};

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const overdue = !task.completed && bucket(task.endsAt) === "overdue";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        background: "var(--surface-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-soft)",
        opacity: task.completed ? 0.6 : 1,
      }}
    >
      <Checkbox checked={task.completed} onChange={() => onToggle(task.id)} />
      <span
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
        }}
      >
        {task.title}
      </span>
      {task.priority !== "none" && (
        <span className="pf-hide-narrow">
          <Badge tone={PRIORITY_TONE[task.priority]} dot>
            {task.priority}
          </Badge>
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
          color: overdue ? "var(--red-500)" : "var(--text-tertiary)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <Icon name="CalendarProperty1Linear" size={13} /> {dueLabel(task.endsAt)}
      </span>
    </div>
  );
}

export default function Today() {
  const { user } = useAuth();
  const { tasks, toggleTask, stats } = useTasks();
  const { habits, todayEntry, toggleHabit, currentStreak, weeklyCounts } = useHabits();

  const name =
    (user?.user_metadata?.full_name as string)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const { todays, overdueCount, completedToday } = useMemo(() => {
    const todays = tasks.filter(
      (t) => !t.completed && ["today", "overdue"].includes(bucket(t.endsAt))
    );
    const overdueCount = tasks.filter((t) => !t.completed && bucket(t.endsAt) === "overdue").length;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const completedToday = tasks.filter(
      (t) => t.completed && t.completedAt && t.completedAt >= startOfToday.getTime()
    ).length;
    return { todays, overdueCount, completedToday };
  }, [tasks]);

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pf-page" style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px 56px" }}>
      {/* greeting */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>
            {greeting()}, {name} <span style={{ fontFamily: "var(--font-sans)" }}>👋</span>
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
            {dateStr} — {todays.length === 0 ? "nothing due today, enjoy the summit." : `${todays.length} ${todays.length === 1 ? "task" : "tasks"} to climb today.`}
          </p>
        </div>
      </div>

      {/* stat row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 16,
          marginTop: 22,
        }}
      >
        <StatCard icon={<Icon name="TaskSquareProperty1Bold" size={20} />} label="Due today" value={todays.length} iconTone="primary" />
        <StatCard icon={<Icon name="FlagProperty1Bold" size={20} />} label="Overdue" value={overdueCount} iconTone="accent" />
        <StatCard icon={<Icon name="TickCircleProperty1Bold" size={20} />} label="Completed today" value={completedToday} iconTone="success" />
        <StatCard icon={<Icon name="StarProperty1Bold" size={20} />} label="Habit streak" value={currentStreak} iconTone="primary" />
      </div>

      {/* two-column: tasks + habits */}
      <div
        className="pf-2col"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
          gap: 16,
          marginTop: 16,
          alignItems: "start",
        }}
      >
        <Card padding={20}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Today&apos;s tasks</h3>
            <Badge tone="neutral">
              {stats.remaining} open
            </Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todays.length === 0 && (
              <div
                style={{
                  padding: "28px 12px",
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                  fontSize: 14,
                }}
              >
                All clear for today. Press <b>N</b> to add a task.
              </div>
            )}
            {todays.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={toggleTask} />
            ))}
          </div>
        </Card>

        <Card padding={20}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Habits</h3>
            <Badge tone="primary">{currentStreak}d streak</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {habits.length === 0 && (
              <div style={{ padding: "20px 8px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
                No habits yet.
              </div>
            )}
            {habits.map((h) => {
              const done = !!todayEntry.habits[h.key];
              const count = weeklyCounts[h.key] ?? 0;
              return (
                <button
                  key={h.id}
                  onClick={() => toggleHabit(h.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-soft)",
                    background: done ? "var(--primary-50)" : "var(--surface-card)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{h.emoji}</span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily: "var(--font-sans)",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {h.label}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>
                    {count}/{h.weeklyTarget}
                  </span>
                  <span style={{ color: done ? "var(--primary-500)" : "var(--border-strong)", display: "inline-flex" }}>
                    <Icon name="TickCircleProperty1Bold" size={20} />
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
