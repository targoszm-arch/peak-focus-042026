import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type CollaboratorRole = "client" | "team";

/**
 * Distinguishes the workspace owner from an invited collaborator.
 *
 * A collaborator is anyone with an active grant in project_collaborators who
 * doesn't own any project themselves — the owner never has grants, so this
 * needs no separate "account type" flag. `isOwner` is null while loading so
 * callers can hold rendering the shell instead of flashing the wrong nav.
 */
function useAccessState() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [grantedProjectIds, setGrantedProjectIds] = useState<string[]>([]);
  const [role, setRole] = useState<CollaboratorRole | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setIsOwner(null);
      setGrantedProjectIds([]);
      setRole(null);
      return;
    }
    setLoading(true);
    const [{ count: owned }, { data: grants }] = await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("project_collaborators").select("project_id, role").eq("user_id", user.id).eq("status", "active"),
    ]);
    const collaborator = !owned && !!grants?.length;
    setIsOwner(!collaborator);
    setGrantedProjectIds((grants ?? []).map((g) => g.project_id as string));
    setRole((grants?.[0]?.role as CollaboratorRole | undefined) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { loading, isOwner, grantedProjectIds, role, reload };
}

type AccessValue = ReturnType<typeof useAccessState>;
const AccessContext = createContext<AccessValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const value = useAccessState();
  return createElement(AccessContext.Provider, { value }, children);
}

export function useAccess(): AccessValue {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used within AccessProvider");
  return ctx;
}
