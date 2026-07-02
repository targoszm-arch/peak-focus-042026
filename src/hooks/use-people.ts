import { useCallback, useEffect, useState } from "react";
import { createContext, createElement, useContext, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type TeamRole = "Admin" | "User" | "Viewer";

export type Person = {
  id: string;
  name: string;
  role: string;
  email: string;
  teamRole: TeamRole;
  color: string;
  createdAt: number;
};

export type NewPerson = Partial<Omit<Person, "id" | "createdAt">> & { name: string };

const COLORS = ["#266DF0", "#F1613C", "#2A9E75", "#E6A609", "#8b5cf6", "#ec4899"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToPerson(r: any): Person {
  return {
    id: r.id,
    name: r.name,
    role: r.role ?? "",
    email: r.email ?? "",
    teamRole: (r.team_role ?? "User") as TeamRole,
    color: r.color ?? "#266DF0",
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}

function usePeopleState() {
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setPeople([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) console.warn("[people]", error.message);
    setPeople((data ?? []).map(rowToPerson));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addPerson = useCallback(
    async (p: NewPerson) => {
      if (!user || !p.name?.trim()) return;
      const color = p.color ?? COLORS[people.length % COLORS.length];
      const { data } = await supabase
        .from("people")
        .insert({
          user_id: user.id,
          name: p.name.trim(),
          role: p.role ?? "",
          email: p.email ?? "",
          team_role: p.teamRole ?? "User",
          color,
        })
        .select("*")
        .single();
      if (data) setPeople((prev) => [...prev, rowToPerson(data)]);
    },
    [user, people.length]
  );

  const updatePerson = useCallback(async (id: string, patch: Partial<NewPerson>) => {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const row: any = {};
    if (patch.name !== undefined) row.name = patch.name.trim();
    if (patch.role !== undefined) row.role = patch.role;
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.teamRole !== undefined) row.team_role = patch.teamRole;
    if (patch.color !== undefined) row.color = patch.color;
    await supabase.from("people").update(row).eq("id", id);
  }, []);

  const removePerson = useCallback(async (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("people").delete().eq("id", id);
  }, []);

  return { people, loading, addPerson, updatePerson, removePerson, reload };
}

type PeopleValue = ReturnType<typeof usePeopleState>;
const PeopleContext = createContext<PeopleValue | null>(null);

export function PeopleProvider({ children }: { children: ReactNode }) {
  const value = usePeopleState();
  return createElement(PeopleContext.Provider, { value }, children);
}

export function usePeople(): PeopleValue {
  const ctx = useContext(PeopleContext);
  if (!ctx) throw new Error("usePeople must be used within PeopleProvider");
  return ctx;
}
