import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CollaboratorRole } from "@/hooks/use-access";

export type CollaboratorStatus = "pending" | "active" | "revoked";

export type Collaborator = {
  id: string;
  projectId: string;
  invitedEmail: string;
  userId: string | null;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  invitedAt: number;
  acceptedAt: number | null;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToCollaborator(r: any): Collaborator {
  return {
    id: r.id,
    projectId: r.project_id,
    invitedEmail: r.invited_email,
    userId: r.user_id,
    role: r.role,
    status: r.status,
    invitedAt: r.invited_at ? new Date(r.invited_at).getTime() : Date.now(),
    acceptedAt: r.accepted_at ? new Date(r.accepted_at).getTime() : null,
  };
}

/**
 * Owner-side management of who has view+comment access to a project.
 * Pass a projectId to scope to one project, or omit to see every
 * collaborator across every project the caller owns.
 */
export function useCollaborators(projectId?: string) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("project_collaborators")
      .select("*")
      .neq("status", "revoked")
      .order("invited_at", { ascending: true });
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    else setError(null);
    setCollaborators((data ?? []).map(rowToCollaborator));
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const invite = useCallback(
    async (pid: string, email: string, role: CollaboratorRole = "client") => {
      const trimmed = email.trim();
      if (!trimmed) return null;
      setError(null);
      const { data, error: err } = await supabase.rpc("invite_collaborator", {
        p_project_id: pid,
        p_email: trimmed,
        p_role: role,
      });
      if (err) {
        setError(err.message);
        return null;
      }
      await reload();
      return data ? rowToCollaborator(data) : null;
    },
    [reload]
  );

  const revoke = useCallback(async (id: string) => {
    setError(null);
    const { error: err } = await supabase.rpc("revoke_collaborator", { p_collaborator_id: id });
    if (err) {
      setError(err.message);
      return;
    }
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { collaborators, loading, error, invite, revoke, reload };
}
