import { useMemo, useState } from "react";
import { Card, Badge, Icon } from "@/ds";
import QuickAdd from "@/components/pf/QuickAdd";
import { TaskCardGrid } from "@/components/pf/ProjectViews";
import { TaskEditModal } from "@/components/pf/modals";
import { useTasks, type Task } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
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
  const { projects } = useProjects();
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [query, setQuery] = useState("");

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return rootTasks;
    return rootTasks.filter(
      (t) => t.title.toLowerCase().includes(q) || (projectById.get(t.projectId)?.name ?? "").toLowerCase().includes(q)
    );
  }, [rootTasks, q, projectById]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const g of GROUPS) map[g.key] = [];
    for (const t of filtered) {
      if (t.completed) map.done.push(t);
      else map[bucket(t.endsAt)].push(t);
    }
    return map;
  }, [filtered]);

  const noResults = q && !GROUPS.some((g) => grouped[g.key].length > 0);

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Tasks</h1>
        <Badge tone="neutral">
          {stats.remaining} open · {stats.completed} done
        </Badge>
      </div>

      <QuickAdd placeholder="Add a task…  (press Enter to save)" />

      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 42, marginTop: 16, padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)" }}>
        <Icon name="SearchNormalProperty1Linear" size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks or projects" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-primary)" }} />
      </div>

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
        {noResults && (
          <div style={{ padding: "18px 4px", textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            No tasks match this search.
          </div>
        )}
      </div>

      {editTask && <TaskEditModal task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  );
}
