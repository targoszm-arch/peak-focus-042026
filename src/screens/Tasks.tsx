import { useMemo, useState } from "react";
import { Card, Badge } from "@/ds";
import QuickAdd from "@/components/pf/QuickAdd";
import { TaskCardGrid } from "@/components/pf/ProjectViews";
import { TaskEditModal } from "@/components/pf/modals";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { bucket, type Bucket } from "@/lib/pfdate";

const GROUPS: { key: Bucket | "done"; title: string }[] = [
  { key: "overdue", title: "Overdue" },
  { key: "today", title: "Today" },
  { key: "tomorrow", title: "Tomorrow" },
  { key: "week", title: "This week" },
  { key: "later", title: "Later" },
  { key: "done", title: "Completed" },
];

export default function Tasks() {
  const { rootTasks, stats } = useTasks();
  const [editTask, setEditTask] = useState<Task | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const g of GROUPS) map[g.key] = [];
    for (const t of rootTasks) {
      if (t.completed) map.done.push(t);
      else map[bucket(t.endsAt)].push(t);
    }
    return map;
  }, [rootTasks]);

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Tasks</h1>
        <Badge tone="neutral">
          {stats.remaining} open · {stats.completed} done
        </Badge>
      </div>

      <QuickAdd placeholder="Add a task…  (press Enter to save)" />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {GROUPS.map((g) => {
          const items = grouped[g.key];
          if (!items.length) return null;
          return (
            <Card key={g.key} padding={18}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{g.title}</h3>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>{items.length}</span>
              </div>
              <TaskCardGrid tasks={items} onOpen={setEditTask} />
            </Card>
          );
        })}
        {rootTasks.length === 0 && (
          <div style={{ padding: "18px 4px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            No tasks yet — add your first above.
          </div>
        )}
      </div>

      {editTask && <TaskEditModal task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  );
}
