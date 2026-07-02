import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type ProjectStatus = "active" | "on_hold" | "done" | "archived";

export type ProjectFull = {
  id: string;
  name: string;
  color: string;
  clientId: string | null;
  due: string | null;
  status: ProjectStatus;
  createdAt: number;
};

export type NewProject = Partial<Omit<ProjectFull, "id" | "createdAt">> & { name: string };

const COLORS = ["#266DF0", "#F1613C", "#2A9E75", "#E6A609", "#8b5cf6", "#ec4899", "#14b8a6"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToProject(r: any): ProjectFull {
  return {
    id: r.id,
    name: r.name,
    color: r.color ?? "#266DF0",
    clientId: r.client_id ?? null,
    due: r.due ?? null,
    status: (r.status ?? "active") as ProjectStatus,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectFull[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) console.warn("[projects]", error.message);
    setProjects((data ?? []).map(rowToProject));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addProject = useCallback(
    async (p: NewProject) => {
      if (!user || !p.name?.trim()) return;
      const color = p.color ?? COLORS[projects.length % COLORS.length];
      const { data } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: p.name.trim(),
          color,
          client_id: p.clientId ?? null,
          due: p.due ?? null,
          status: p.status ?? "active",
        })
        .select("*")
        .single();
      if (data) setProjects((prev) => [...prev, rowToProject(data)]);
    },
    [user, projects.length]
  );

  const updateProject = useCallback(async (id: string, patch: Partial<NewProject>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const row: any = {};
    if (patch.name !== undefined) row.name = patch.name.trim();
    if (patch.color !== undefined) row.color = patch.color;
    if (patch.clientId !== undefined) row.client_id = patch.clientId;
    if (patch.due !== undefined) row.due = patch.due;
    if (patch.status !== undefined) row.status = patch.status;
    await supabase.from("projects").update(row).eq("id", id);
  }, []);

  const removeProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("projects").delete().eq("id", id);
  }, []);

  return { projects, loading, addProject, updateProject, removeProject, reload };
}
