import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { JSONContent } from "@tiptap/react";

export const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

/** One Notion-style document per project — the Wiki card on the project page. */
export function useProjectWiki(projectId: string) {
  const [content, setContent] = useState<JSONContent>(EMPTY_DOC);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("project_wikis")
      .select("content")
      .eq("project_id", projectId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setContent((data?.content as JSONContent | undefined) ?? EMPTY_DOC);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Debounced autosave — upserts on project_id so the first edit creates the row.
  const save = useCallback(
    (next: JSONContent, ownerId: string) => {
      setContent(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        await supabase
          .from("project_wikis")
          .upsert({ project_id: projectId, owner_id: ownerId, content: next, updated_at: new Date().toISOString() }, { onConflict: "project_id" });
        setSaving(false);
      }, 800);
    },
    [projectId]
  );

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  return { content, loading, saving, save };
}
