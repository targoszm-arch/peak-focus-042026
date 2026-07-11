import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type ProjectLink = {
  id: string;
  projectId: string;
  url: string;
  title: string;
  createdAt: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToLink(r: any): ProjectLink {
  return {
    id: r.id,
    projectId: r.project_id,
    url: r.url,
    title: r.title ?? "",
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}

/** Bookmarked URLs on a single project, newest first. */
export function useProjectLinks(projectId?: string) {
  const { user } = useAuth();
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user || !projectId) {
      setLinks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from("project_links")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    setLinks((data ?? []).map(rowToLink));
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(
    async (rawUrl: string, title?: string) => {
      if (!user || !projectId) return;
      setError(null);
      const url = /^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`;
      const { data: row, error: err } = await supabase
        .from("project_links")
        .insert({ user_id: user.id, project_id: projectId, url, title: (title ?? "").trim() })
        .select("*")
        .single();
      if (err) {
        setError(err.message);
        return;
      }
      if (row) setLinks((prev) => [rowToLink(row), ...prev]);
    },
    [user, projectId]
  );

  const remove = useCallback(async (link: ProjectLink) => {
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    await supabase.from("project_links").delete().eq("id", link.id);
  }, []);

  return { links, loading, error, add, remove, reload };
}
