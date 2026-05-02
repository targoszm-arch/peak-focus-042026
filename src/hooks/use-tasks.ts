import { useCallback, useEffect, useMemo, useState } from "react";

export type Priority = "high" | "medium" | "low" | "none";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  projectId: string; // "inbox" or a project id
  priority: Priority;
};

export type Project = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
};

export const INBOX_ID = "inbox";

const TASKS_KEY = "pf.tasks";
const PROJECTS_KEY = "pf.projects.v1";

const PROJECT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function pickColor(existing: Project[]): string {
  return PROJECT_COLORS[existing.length % PROJECT_COLORS.length];
}

function genId(): string {
  return (globalThis as any)?.crypto?.randomUUID
    ? (globalThis as any).crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const PRIORITIES: Priority[] = ["high", "medium", "low", "none"];

function normalizePriority(p: unknown): Priority {
  return typeof p === "string" && (PRIORITIES as string[]).includes(p)
    ? (p as Priority)
    : "none";
}

function migrateTasks(raw: any[]): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => ({
    id: String(t.id ?? genId()),
    title: String(t.title ?? ""),
    completed: !!t.completed,
    createdAt: Number(t.createdAt ?? Date.now()),
    projectId: typeof t.projectId === "string" && t.projectId ? t.projectId : INBOX_ID,
    priority: normalizePriority(t.priority),
  }));
}

export function useTasks() {
  const [hydrated, setHydrated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setTasks(migrateTasks(readJSON<any[]>(TASKS_KEY, [])));
    setProjects(readJSON<Project[]>(PROJECTS_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeJSON(TASKS_KEY, tasks);
  }, [tasks, hydrated]);

  useEffect(() => {
    if (hydrated) writeJSON(PROJECTS_KEY, projects);
  }, [projects, hydrated]);

  const addTask = useCallback(
    (title: string, projectId: string = INBOX_ID, priority: Priority = "none") => {
      const t = title.trim();
      if (!t) return;
      setTasks((prev) => [
        {
          id: genId(),
          title: t,
          completed: false,
          createdAt: Date.now(),
          projectId,
          priority,
        },
        ...prev,
      ]);
    },
    []
  );

  const setTaskPriority = useCallback((id: string, priority: Priority) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, priority } : task))
    );
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const updateTask = useCallback((id: string, title: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, title: title.trim() } : task))
    );
  }, []);

  const moveTask = useCallback((id: string, projectId: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, projectId } : task))
    );
  }, []);

  const clearCompleted = useCallback((projectId?: string) => {
    setTasks((prev) =>
      prev.filter((t) => !t.completed || (projectId && t.projectId !== projectId))
    );
  }, []);

  const addProject = useCallback((name: string) => {
    const n = name.trim();
    if (!n) return;
    setProjects((prev) => [
      ...prev,
      { id: genId(), name: n, color: pickColor(prev), createdAt: Date.now() },
    ]);
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    const n = name.trim();
    if (!n) return;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: n } : p)));
  }, []);

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) =>
      prev.map((t) => (t.projectId === id ? { ...t, projectId: INBOX_ID } : t))
    );
  }, []);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
      remaining: tasks.filter((t) => !t.completed).length,
    }),
    [tasks]
  );

  const projectStats = useMemo(() => {
    const map: Record<string, { total: number; completed: number; remaining: number }> = {};
    const ensure = (id: string) => {
      if (!map[id]) map[id] = { total: 0, completed: 0, remaining: 0 };
      return map[id];
    };
    ensure(INBOX_ID);
    for (const p of projects) ensure(p.id);
    for (const t of tasks) {
      const s = ensure(t.projectId);
      s.total += 1;
      if (t.completed) s.completed += 1;
      else s.remaining += 1;
    }
    return map;
  }, [tasks, projects]);

  return {
    tasks,
    projects,
    addTask,
    toggleTask,
    removeTask,
    updateTask,
    moveTask,
    setTaskPriority,
    clearCompleted,
    addProject,
    renameProject,
    removeProject,
    stats,
    projectStats,
  };
}
