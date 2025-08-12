import { useCallback, useEffect, useMemo, useState } from "react";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = "pf.tasks";

function readFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data as Task[];
  } catch (e) {
    // ignore
  }
  return [];
}

function writeToStorage(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    // ignore
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(readFromStorage());
  }, []);

  useEffect(() => {
    writeToStorage(tasks);
  }, [tasks]);

  const addTask = useCallback((title: string) => {
    const t = title.trim();
    if (!t) return;
    const id = (globalThis as any)?.crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTasks((prev) => [{ id, title: t, completed: false, createdAt: Date.now() }, ...prev]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const updateTask = useCallback((id: string, title: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, title: title.trim() } : task)));
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  }, []);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((t) => t.completed).length,
      remaining: tasks.filter((t) => !t.completed).length,
    }),
    [tasks]
  );

  return { tasks, addTask, toggleTask, removeTask, updateTask, clearCompleted, stats };
}
