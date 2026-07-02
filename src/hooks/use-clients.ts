import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type ClientHealth = "Healthy" | "Watch" | "At risk";

export type Client = {
  id: string;
  name: string;
  color: string;
  website: string;
  contactName: string;
  contactRole: string;
  email: string;
  location: string;
  stage: string;
  health: ClientHealth;
  arr: number;
  renewal: string | null;
  createdAt: number;
};

export type NewClient = Partial<Omit<Client, "id" | "createdAt">> & { name: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToClient(r: any): Client {
  return {
    id: r.id,
    name: r.name,
    color: r.color ?? "#266DF0",
    website: r.website ?? "",
    contactName: r.contact_name ?? "",
    contactRole: r.contact_role ?? "",
    email: r.email ?? "",
    location: r.location ?? "",
    stage: r.stage ?? "Active",
    health: (r.health ?? "Healthy") as ClientHealth,
    arr: r.arr ?? 0,
    renewal: r.renewal ?? null,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}

function toRow(c: NewClient) {
  return {
    name: c.name?.trim(),
    color: c.color,
    website: c.website,
    contact_name: c.contactName,
    contact_role: c.contactRole,
    email: c.email,
    location: c.location,
    stage: c.stage,
    health: c.health,
    arr: c.arr,
    renewal: c.renewal || null,
  };
}

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) console.warn("[clients]", error.message);
    setClients((data ?? []).map(rowToClient));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addClient = useCallback(
    async (c: NewClient) => {
      if (!user || !c.name?.trim()) return;
      const { data } = await supabase
        .from("clients")
        .insert({ user_id: user.id, ...toRow(c) })
        .select("*")
        .single();
      if (data) setClients((p) => [...p, rowToClient(data)]);
    },
    [user]
  );

  const updateClient = useCallback(async (id: string, patch: Partial<NewClient>) => {
    setClients((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const row = toRow({ name: "x", ...patch });
    delete (row as any).name;
    if (patch.name !== undefined) (row as any).name = patch.name.trim();
    await supabase.from("clients").update(row).eq("id", id);
  }, []);

  const removeClient = useCallback(async (id: string) => {
    setClients((p) => p.filter((c) => c.id !== id));
    await supabase.from("clients").delete().eq("id", id);
  }, []);

  return { clients, loading, addClient, updateClient, removeClient, reload };
}
