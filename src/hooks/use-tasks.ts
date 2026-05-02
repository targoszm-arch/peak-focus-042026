import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type Priority = "high" | "medium" | "low" | "none";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  projectId: string; // INBOX_ID or a project id
  priority: Priority;
};

export type Project = {
  id: string;
  name: string;
  color: string;
  createdAt: number;
};

export const INBOX_ID = "inbox";

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

const TASKS_KEY = "pf.tasks";
const PROJECTS_KEY = "pf.projects.v1";
const MIGRATED_FLAG = "pf.migrated.v1";

type DBTask = {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  project_id: string | null;
  created_at: string;
};
type DBProject = { id: string; name: string; color: string; created_at: string };

function dbToTask(row: DBTask): Task {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: new Date(row.created_at).getTime(),
    projectId: row.project_id ?? INBOX_ID,
    priority: row.priority,
  };
}

function dbToProject(row: DBProject): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: new Date(row.created_at).getTime(),
  };
}

async function migrateLocalStorageOnce(userId: string) {
  if (localStorage.getItem(MIGRATED_FLAG)) return;
  try {
    const localProjects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    const localTasks = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    const idMap: Record<string, string> = {};

    if (Array.isArray(localProjects) && localProjects.length) {
      const rows = localProjects.map((p: any) => ({
        user_id: userId,
        name: p.name,
        color: p.color ?? "#3b82f6",
      }));
      const { data, error } = await supabase
        .from("projects")
        .insert(rows)
        .select("id, name");
      if (!error && data) {
        for (let i = 0; i < localProjects.length; i++) {
          idMap[localProjects[i].id] = data[i]?.id ?? "";
        }
      }
    }

    if (Array.isArray(localTasks) && localTasks.length) {
      const rows = localTasks.map((t: any) => ({
        user_id: userId,
        title: t.title,
        completed: !!t.completed,
        priority: ["high", "medium", "low", "none"].includes(t.priority)
          ? t.priority
          : "none",
        project_id: idMap[t.projectId] ?? null,
      }));
      await supabase.from("tasks").insert(rows);
    }
  } catch (e) {
    console.warn("[tasks] migration failed", e);
  }
  localStorage.setItem(MIGRATED_FLAG, "1");
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const reload = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setProjects([]);
      return;
    }
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);
    setTasks((t ?? []).map(dbToTask));
    setProjects((p ?? []).map(dbToProject));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    migrateLocalStorageOnce(user.id).then(reload);
  }, [user, reload]);

  const addTask = useCallback(
    async (title: string, projectId: string = INBOX_ID, priority: Priority = "none") => {
      if (!user) return;
      const t = title.trim();
      if (!t) return;
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: t,
          priority,
          project_id: projectId === INBOX_ID ? null : projectId,
        })
        .select("*")
        .single();
      if (!error && data) {
        setTasks((prev) => [dbToTask(data as DBTask), ...prev]);
      }
    },
    [user]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
      await supabase
        .from("tasks")
        .update({ completed: !target.completed })
        .eq("id", id);
    },
    [tasks]
  );

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  }, []);

  const updateTask = useCallback(async (id: string, title: string) => {
    const t = title.trim();
    if (!t) return;
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, title: t } : task)));
    await supabase.from("tasks").update({ title: t }).eq("id", id);
  }, []);

  const moveTask = useCallback(async (id: string, projectId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, projectId } : t))
    );
    await supabase
      .from("tasks")
      .update({ project_id: projectId === INBOX_ID ? null : projectId })
      .eq("id", id);
  }, []);

  const setTaskPriority = useCallback(async (id: string, priority: Priority) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, priority } : t)));
    await supabase.from("tasks").update({ priority }).eq("id", id);
  }, []);

  const clearCompleted = useCallback(
    async (projectId?: string) => {
      if (!user) return;
      let q = supabase.from("tasks").delete().eq("user_id", user.id).eq("completed", true);
      if (projectId) {
        q = projectId === INBOX_ID ? q.is("project_id", null) : q.eq("project_id", projectId);
      }
      await q;
      setTasks((prev) =>
        prev.filter((t) => !t.completed || (projectId && t.projectId !== projectId))
      );
    },
    [user]
  );

  const addProject = useCallback(
    async (name: string) => {
      if (!user) return;
      const n = name.trim();
      if (!n) return;
      const color = pickColor(projects);
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, name: n, color })
        .select("*")
        .single();
      if (!error && data) {
        setProjects((prev) => [...prev, dbToProject(data as DBProject)]);
      }
    },
    [user, projects]
  );

  const renameProject = useCallback(async (id: string, name: string) => {
    const n = name.trim();
    if (!n) return;
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: n } : p)));
    await supabase.from("projects").update({ name: n }).eq("id", id);
  }, []);

  const removeProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) =>
      prev.map((t) => (t.projectId === id ? { ...t, projectId: INBOX_ID } : t))
    );
    // FK is ON DELETE SET NULL so tasks survive
    await supabase.from("projects").delete().eq("id", id);
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
