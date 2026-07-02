import { useMemo } from "react";
import { Card, Icon, Checkbox, Badge } from "@/ds";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { bucket, label as dueLabel, type Bucket } from "@/lib/pfdate";

const GROUPS: { key: Bucket | "done"; title: string }[] = [
  { key: "overdue", title: "Overdue" },
  { key: "today", title: "Today" },
  { key: "tomorrow", title: "Tomorrow" },
  { key: "week", title: "This week" },
  { key: "later", title: "Later" },
  { key: "done", title: "Completed" },
];

const PRIORITY_TONE: Record<string, "danger" | "primary" | "neutral"> = {
  high: "danger",
  medium: "primary",
  low: "neutral",
  none: "neutral",
};

function Row({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
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

export default function Tasks() {
  const { tasks, toggleTask, stats } = useTasks();

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const g of GROUPS) map[g.key] = [];
    for (const t of tasks) {
      if (t.completed) map.done.push(t);
      else map[bucket(t.endsAt)].push(t);
    }
    return map;
  }, [tasks]);

  return (
    <div className="pf-page" style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Tasks</h1>
        <Badge tone="neutral">{stats.remaining} open · {stats.completed} done</Badge>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
        {GROUPS.map((g) => {
          const items = grouped[g.key];
          if (!items.length) return null;
          return (
            <Card key={g.key} padding={18}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{g.title}</h3>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((t) => (
                  <Row key={t.id} task={t} onToggle={toggleTask} />
                ))}
              </div>
            </Card>
          );
        })}
        {tasks.length === 0 && (
          <Card padding={28} style={{ textAlign: "center", color: "var(--text-tertiary)" }}>
            No tasks yet. Press <b>N</b> to add your first.
          </Card>
        )}
      </div>
    </div>
  );
}
