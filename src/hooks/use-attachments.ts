import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type Attachment = {
  id: string;
  taskId: string | null;
  projectId: string | null;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
};

const BUCKET = "attachments";
const MAX_BYTES = 25 * 1024 * 1024; // matches the bucket's file_size_limit

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToAttachment(r: any): Attachment {
  return {
    id: r.id,
    taskId: r.task_id,
    projectId: r.project_id,
    fileName: r.file_name,
    storagePath: r.storage_path,
    mimeType: r.mime_type ?? "",
    sizeBytes: r.size_bytes ?? 0,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Files attached to a single task or project. One owner id is required. */
export function useAttachments(owner: { taskId?: string; projectId?: string }) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ownerKey = owner.taskId ?? owner.projectId ?? null;

  const reload = useCallback(async () => {
    if (!user || !ownerKey) {
      setAttachments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase.from("attachments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    q = owner.taskId ? q.eq("task_id", owner.taskId) : q.eq("project_id", owner.projectId!);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    setAttachments((data ?? []).map(rowToAttachment));
    setLoading(false);
  }, [user, ownerKey, owner.taskId, owner.projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      if (!user || !ownerKey) return;
      setError(null);
      const list = Array.from(files);
      const oversized = list.find((f) => f.size > MAX_BYTES);
      if (oversized) {
        setError(`"${oversized.name}" is over the 25 MB limit`);
        return;
      }
      setUploading(true);
      try {
        for (const file of list) {
          const path = `${user.id}/${ownerKey}/${Date.now()}-${file.name}`;
          const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
          if (upErr) throw upErr;
          const { error: insErr } = await supabase.from("attachments").insert({
            user_id: user.id,
            task_id: owner.taskId ?? null,
            project_id: owner.projectId ?? null,
            file_name: file.name,
            storage_path: path,
            mime_type: file.type,
            size_bytes: file.size,
          });
          if (insErr) throw insErr;
        }
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [user, ownerKey, owner.taskId, owner.projectId, reload]
  );

  const download = useCallback(async (a: Attachment) => {
    const { data, error: err } = await supabase.storage.from(BUCKET).createSignedUrl(a.storagePath, 60);
    if (err || !data) {
      setError(err?.message ?? "Could not create download link");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }, []);

  const remove = useCallback(async (a: Attachment) => {
    setAttachments((prev) => prev.filter((x) => x.id !== a.id));
    await supabase.storage.from(BUCKET).remove([a.storagePath]);
    await supabase.from("attachments").delete().eq("id", a.id);
  }, []);

  return { attachments, loading, uploading, error, upload, download, remove };
}
