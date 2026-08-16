import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type CustomColumnDataType = "text" | "number" | "select";
export type CustomColumnOption = { label: string; backgroundColor: string };

export type CustomColumn = {
  id: string;
  scope: "tasks" | "projects";
  label: string;
  dataType: CustomColumnDataType;
  options: CustomColumnOption[];
  position: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToColumn(r: any): CustomColumn {
  return {
    id: r.id,
    scope: r.scope,
    label: r.label,
    dataType: r.data_type,
    options: r.options ?? [],
    position: r.position ?? 0,
  };
}

/**
 * User-defined extra columns for the Tasks/Projects editable table views.
 * Definitions live in `custom_columns`; each row's values for them live in
 * that row's own `custom_fields` jsonb column (updated separately, see
 * use-editable-table.ts — this hook only manages the column schema).
 */
export function useCustomColumns(scope: "tasks" | "projects") {
  const { user } = useAuth();
  const [columns, setColumns] = useState<CustomColumn[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setColumns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("custom_columns")
      .select("*")
      .eq("scope", scope)
      .order("position", { ascending: true });
    setColumns((data ?? []).map(rowToColumn));
    setLoading(false);
  }, [user, scope]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addColumn = useCallback(
    async (position: number, label = "Column") => {
      if (!user) return null;
      const { data } = await supabase
        .from("custom_columns")
        .insert({ owner_id: user.id, scope, label, data_type: "text", options: [], position })
        .select("*")
        .single();
      if (data) {
        const col = rowToColumn(data);
        setColumns((prev) => [...prev, col].sort((a, b) => a.position - b.position));
        return col;
      }
      return null;
    },
    [user, scope]
  );

  const renameColumn = useCallback(async (id: string, label: string) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
    await supabase.from("custom_columns").update({ label }).eq("id", id);
  }, []);

  const setColumnType = useCallback(async (id: string, dataType: CustomColumnDataType, options?: CustomColumnOption[]) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, dataType, ...(options ? { options } : {}) } : c)));
    const patch: Record<string, unknown> = { data_type: dataType };
    if (options) patch.options = options;
    await supabase.from("custom_columns").update(patch).eq("id", id);
  }, []);

  const addOption = useCallback(async (id: string, option: CustomColumnOption) => {
    let nextOptions: CustomColumnOption[] = [];
    setColumns((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        nextOptions = [...c.options, option];
        return { ...c, options: nextOptions };
      })
    );
    await supabase.from("custom_columns").update({ options: nextOptions }).eq("id", id);
  }, []);

  const deleteColumn = useCallback(async (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("custom_columns").delete().eq("id", id);
  }, []);

  return { columns, loading, addColumn, renameColumn, setColumnType, addOption, deleteColumn, reload };
}
