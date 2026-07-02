import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type Priority = "high" | "medium" | "low" | "none";
export type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening" | "at_time";
export type Repeat = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
  projectId: string; // INBOX_ID or a project id
  priority: Priority;
  startsAt: string | null; // ISO
  endsAt: string | null; // ISO
  timeOfDay: TimeOfDay;
  repeat: Repeat;
  notes: string;
  parentId: string | null;
};

export type NewTaskInput = {
  title: string;
  projectId?: string;
  priority?: Priority;
  startsAt?: string | null;
  endsAt?: string | null;
  timeOfDay?: TimeOfDay;
  repeat?: Repeat;
  notes?: string;
  parentId?: string | null;
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
  completed_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  time_of_day: TimeOfDay | null;
  repeat: Repeat | null;
  notes: string | null;
  parent_id: string | null;
};
type DBProject = { id: string; name: string; color: string; created_at: string };

function dbToTask(row: DBTask): Task {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: new Date(row.created_at).getTime(),
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : null,
    projectId: row.project_id ?? INBOX_ID,
    priority: row.priority,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timeOfDay: row.time_of_day ?? "anytime",
    repeat: row.repeat ?? "none",
    notes: row.notes ?? "",
    parentId: row.parent_id,
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
        time_of_day: "anytime",
        repeat: "none",
        notes: "",
      }));
      await supabase.from("tasks").insert(rows);
    }
  } catch (e) {
    console.warn("[tasks] migration failed", e);
  }
  localStorage.setItem(MIGRATED_FLAG, "1");
}

function useTasksState() {
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
    async (
      titleOrInput: string | NewTaskInput,
      projectId: string = INBOX_ID,
      priority: Priority = "none"
    ) => {
      if (!user) return;
      const input: NewTaskInput =
        typeof titleOrInput === "string"
          ? { title: titleOrInput, projectId, priority }
          : titleOrInput;
      const t = input.title.trim();
      if (!t) return;
      const pid = input.projectId ?? INBOX_ID;
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: t,
          priority: input.priority ?? "none",
          project_id: pid === INBOX_ID ? null : pid,
          starts_at: input.startsAt ?? null,
          ends_at: input.endsAt ?? null,
          time_of_day: input.timeOfDay ?? "anytime",
          repeat: input.repeat ?? "none",
          notes: input.notes ?? "",
          parent_id: input.parentId ?? null,
        })
        .select("*")
        .single();
      if (!error && data) {
        setTasks((prev) => [dbToTask(data as DBTask), ...prev]);
      }
      return data ? (data as DBTask).id : undefined;
    },
    [user]
  );

  const updateTaskFields = useCallback(
    async (id: string, patch: Partial<NewTaskInput>) => {
      const dbPatch: Record<string, unknown> = {};
      const localPatch: Partial<Task> = {};
      if (patch.title !== undefined) {
        dbPatch.title = patch.title.trim();
        localPatch.title = patch.title.trim();
      }
      if (patch.priority !== undefined) {
        dbPatch.priority = patch.priority;
        localPatch.priority = patch.priority;
      }
      if (patch.projectId !== undefined) {
        dbPatch.project_id = patch.projectId === INBOX_ID ? null : patch.projectId;
        localPatch.projectId = patch.projectId;
      }
      if (patch.startsAt !== undefined) {
        dbPatch.starts_at = patch.startsAt;
        localPatch.startsAt = patch.startsAt;
      }
      if (patch.endsAt !== undefined) {
        dbPatch.ends_at = patch.endsAt;
        localPatch.endsAt = patch.endsAt;
      }
      if (patch.timeOfDay !== undefined) {
        dbPatch.time_of_day = patch.timeOfDay;
        localPatch.timeOfDay = patch.timeOfDay;
      }
      if (patch.repeat !== undefined) {
        dbPatch.repeat = patch.repeat;
        localPatch.repeat = patch.repeat;
      }
      if (patch.notes !== undefined) {
        dbPatch.notes = patch.notes;
        localPatch.notes = patch.notes;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...localPatch } : t))
      );
      await supabase.from("tasks").update(dbPatch).eq("id", id);
    },
    []
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;
      const next = !target.completed;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, completed: next, completedAt: next ? Date.now() : null }
            : t
        )
      );
      await supabase
        .from("tasks")
        .update({ completed: next })
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
    updateTaskFields,
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

type TasksValue = ReturnType<typeof useTasksState>;
const TasksContext = createContext<TasksValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const value = useTasksState();
  return createElement(TasksContext.Provider, { value }, children);
}

export function useTasks(): TasksValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
