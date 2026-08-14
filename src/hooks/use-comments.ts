import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type Comment = {
  id: string;
  projectId: string;
  taskId: string | null;
  authorId: string;
  body: string;
  mentions: string[];
  createdAt: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToComment(r: any): Comment {
  return {
    id: r.id,
    projectId: r.project_id,
    taskId: r.task_id,
    authorId: r.author_id,
    body: r.body,
    mentions: r.mentions ?? [],
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}

/**
 * A comment thread — project-level when `taskId` is omitted, or a single
 * task's thread when it's given. Visible to the project owner and any
 * active collaborator on that project (enforced by RLS); postable by the
 * same set.
 */
export function useComments(projectId: string | undefined, taskId?: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!projectId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase.from("comments").select("*").eq("project_id", projectId).order("created_at", { ascending: true });
    q = taskId ? q.eq("task_id", taskId) : q.is("task_id", null);
    const { data } = await q;
    setComments((data ?? []).map(rowToComment));
    setLoading(false);
  }, [projectId, taskId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(
    async (body: string, mentions: string[] = []) => {
      const text = body.trim();
      if (!user || !projectId || !text) return;
      const { data, error } = await supabase
        .from("comments")
        .insert({ project_id: projectId, task_id: taskId ?? null, author_id: user.id, body: text, mentions })
        .select("*")
        .single();
      if (!error && data) setComments((prev) => [...prev, rowToComment(data)]);
    },
    [user, projectId, taskId]
  );

  const remove = useCallback(async (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("comments").delete().eq("id", id);
  }, []);

  return { comments, loading, add, remove, reload };
}
