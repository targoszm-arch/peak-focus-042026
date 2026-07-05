import { useMemo, useState } from "react";
import { Card, Badge, Icon } from "@/ds";
import QuickAdd from "@/components/pf/QuickAdd";
import { TaskCardGrid } from "@/components/pf/ProjectViews";
import { TaskEditModal } from "@/components/pf/modals";
import { useTasks, INBOX_ID, type Task, type Priority, type TaskStatus } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { bucket, type Bucket } from "@/lib/pfdate";

const GROUPS: { key: Bucket | "done"; title: string }[] = [
  { key: "overdue", title: "Overdue" },
  { key: "today", title: "Today" },
  { key: "tomorrow", title: "Tomorrow" },
  { key: "week", title: "This week" },
  { key: "later", title: "Later" },
  { key: "done", title: "Completed" },
];

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2, none: 3 };
const selectWrap: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 10px 0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)", flexShrink: 0,
};
const selectStyle: React.CSSProperties = {
  border: "none", outline: "none", background: "transparent",
  fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer",
};

export default function Tasks() {
  const { rootTasks, stats } = useTasks();
  const { projects } = useProjects();
  const { clients } = useClients();
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [query, setQuery] = useState("");

  const load = (k: string, d = "") => { try { return localStorage.getItem(k) || d; } catch { return d; } };
  const save = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
  const [clientF, setClientF] = useState(() => load("pf.tasks.client"));
  const [projectF, setProjectF] = useState(() => load("pf.tasks.project"));
  const [statusF, setStatusF] = useState(() => load("pf.tasks.status"));
  const [priorityF, setPriorityF] = useState(() => load("pf.tasks.priority"));
  const [sortKey, setSortKey] = useState(() => load("pf.tasks.sort", "due"));

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const q = query.trim().toLowerCase();

  const clientOf = (t: Task) => {
    const p = projectById.get(t.projectId);
    return p?.clientId ?? null;
  };

  const filtered = useMemo(() => {
    return rootTasks.filter((t) => {
      if (q && !(t.title.toLowerCase().includes(q) || (projectById.get(t.projectId)?.name ?? "").toLowerCase().includes(q))) return false;
      if (clientF) { const cid = clientOf(t); if (clientF === "__none" ? !!cid : cid !== clientF) return false; }
      if (projectF) { const pid = t.projectId === INBOX_ID ? "__none" : t.projectId; if (pid !== projectF) return false; }
      if (statusF && t.status !== statusF) return false;
      if (priorityF && t.priority !== priorityF) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootTasks, q, projectById, clientF, projectF, statusF, priorityF]);

  const cmp = useMemo(() => {
    return (a: Task, b: Task) => {
      if (sortKey === "priority") return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.title.localeCompare(b.title);
      if (sortKey === "name") return a.title.localeCompare(b.title);
      if (sortKey === "created") return b.createdAt - a.createdAt;
      return (a.endsAt ?? "9999-99").localeCompare(b.endsAt ?? "9999-99") || a.title.localeCompare(b.title); // due
    };
  }, [sortKey]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const g of GROUPS) map[g.key] = [];
    for (const t of filtered) {
      if (t.completed) map.done.push(t);
      else map[bucket(t.endsAt)].push(t);
    }
    for (const k of Object.keys(map)) map[k].sort(cmp);
    return map;
  }, [filtered, cmp]);

  const anyFilter = !!(clientF || projectF || statusF || priorityF);
  const noResults = (q || anyFilter) && !GROUPS.some((g) => grouped[g.key].length > 0);

  return (
    <div className="pf-page" style={{ width: "100%", maxWidth: "none", margin: 0, boxSizing: "border-box", padding: "28px 32px 56px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Tasks</h1>
        <Badge tone="neutral">{stats.remaining} open · {stats.completed} done</Badge>
      </div>

      <QuickAdd placeholder="Add a task…  (press Enter to save)" />

      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 42, marginTop: 16, padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-soft)", background: "var(--surface-card)" }}>
        <Icon name="SearchNormalProperty1Linear" size={17} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks or projects" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-primary)" }} />
      </div>

      {/* filters + sort */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <div style={{ ...selectWrap, background: clientF ? "color-mix(in srgb, var(--primary-500) 8%, white)" : "var(--surface-card)" }}>
          <Icon name="CategoryProperty1Linear" size={15} style={{ color: clientF ? "var(--primary-500)" : "var(--text-tertiary)" }} />
          <select value={clientF} onChange={(e) => { setClientF(e.target.value); save("pf.tasks.client", e.target.value); }} aria-label="Filter by client" style={selectStyle}>
            <option value="">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__none">No client</option>
          </select>
        </div>
        <div style={{ ...selectWrap, background: projectF ? "color-mix(in srgb, var(--primary-500) 8%, white)" : "var(--surface-card)" }}>
          <Icon name="FolderProperty1Linear" size={15} style={{ color: projectF ? "var(--primary-500)" : "var(--text-tertiary)" }} />
          <select value={projectF} onChange={(e) => { setProjectF(e.target.value); save("pf.tasks.project", e.target.value); }} aria-label="Filter by project" style={selectStyle}>
            <option value="">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="__none">Chores (no project)</option>
          </select>
        </div>
        <div style={{ ...selectWrap, background: statusF ? "color-mix(in srgb, var(--primary-500) 8%, white)" : "var(--surface-card)" }}>
          <Icon name="Element3Property1Linear" size={15} style={{ color: statusF ? "var(--primary-500)" : "var(--text-tertiary)" }} />
          <select value={statusF} onChange={(e) => { setStatusF(e.target.value); save("pf.tasks.status", e.target.value); }} aria-label="Filter by status" style={selectStyle}>
            <option value="">All statuses</option>
            {(["todo", "progress", "review", "done"] as TaskStatus[]).map((s) => (
              <option key={s} value={s}>{s === "todo" ? "To do" : s === "progress" ? "In progress" : s === "review" ? "In review" : "Done"}</option>
            ))}
          </select>
        </div>
        <div style={{ ...selectWrap, background: priorityF ? "color-mix(in srgb, var(--primary-500) 8%, white)" : "var(--surface-card)" }}>
          <Icon name="FlagProperty1Bold" size={15} style={{ color: priorityF ? "var(--primary-500)" : "var(--text-tertiary)" }} />
          <select value={priorityF} onChange={(e) => { setPriorityF(e.target.value); save("pf.tasks.priority", e.target.value); }} aria-label="Filter by priority" style={selectStyle}>
            <option value="">Any priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </select>
        </div>
        <div style={selectWrap}>
          <Icon name="ArrowDownProperty1Linear" size={15} style={{ color: "var(--text-tertiary)" }} />
          <select value={sortKey} onChange={(e) => { setSortKey(e.target.value); save("pf.tasks.sort", e.target.value); }} aria-label="Sort tasks" style={selectStyle}>
            <option value="due">Sort: Due date</option>
            <option value="priority">Sort: Priority</option>
            <option value="name">Sort: Name</option>
            <option value="created">Sort: Newest</option>
          </select>
        </div>
        {anyFilter && (
          <button
            onClick={() => { setClientF(""); setProjectF(""); setStatusF(""); setPriorityF(""); ["client", "project", "status", "priority"].forEach((k) => save("pf.tasks." + k, "")); }}
            style={{ ...selectWrap, cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, gap: 6 }}
          >
            <Icon name="CloseCircleProperty1Linear" size={15} /> Clear
          </button>
        )}
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
            No tasks match these filters.
          </div>
        )}
      </div>

      {editTask && <TaskEditModal task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  );
}
