import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCustomColumns, type CustomColumnOption } from "@/hooks/use-custom-columns";
import { ActionTypes, Constants, DataTypes } from "@/components/pf/table/utils";
import type { TableColumn } from "@/components/pf/table/Table";

/** Loads/writes the `custom_fields` jsonb column for a set of rows, keyed by row id. */
function useCustomFieldValues(table: "tasks" | "projects", ids: string[]) {
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>({});
  const idsKey = ids.join(",");

  useEffect(() => {
    if (!ids.length) return;
    let cancelled = false;
    supabase
      .from(table)
      .select("id, custom_fields")
      .in("id", ids)
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, Record<string, unknown>> = {};
        for (const r of (data ?? []) as { id: string; custom_fields: Record<string, unknown> }[]) {
          map[r.id] = r.custom_fields ?? {};
        }
        setValues(map);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, idsKey]);

  const setValue = useCallback(
    (rowId: string, columnId: string, value: unknown) => {
      setValues((prev) => {
        const next = { ...(prev[rowId] ?? {}), [columnId]: value };
        void supabase.from(table).update({ custom_fields: next }).eq("id", rowId);
        return { ...prev, [rowId]: next };
      });
    },
    [table]
  );

  return { values, setValue };
}

/**
 * Bridges the ported editable-react-table (src/components/pf/table/) to
 * real Supabase persistence. The table component itself is stateless data
 * in, actions out — this hook owns the column schema (fixed + user-defined
 * custom columns) and turns every dispatched action into a real write.
 *
 * Row edits are grouped-table aware: the caller renders one Table instance
 * per status/bucket group, so `makeDispatch(groupRows)` closes over that
 * group's own row list to resolve react-table's positional rowIndex back
 * to a real row id — there's no shared in-memory row array to keep in sync.
 */
export function useEditableTable({
  scope,
  fixedColumns,
  rowIds,
  onEditFixedField,
  onAddRow,
}: {
  scope: "tasks" | "projects";
  fixedColumns: TableColumn[];
  rowIds: string[];
  onEditFixedField: (rowId: string, accessor: string, value: unknown) => void;
  onAddRow?: () => void;
}) {
  const { columns: customCols, loading, addColumn, renameColumn, setColumnType, addOption, deleteColumn } = useCustomColumns(scope);
  const { values: customValues, setValue: setCustomValue } = useCustomFieldValues(scope, rowIds);
  const customColumnIds = useMemo(() => new Set(customCols.map((c) => c.id)), [customCols]);
  // The column just added via "+" gets its header menu auto-opened once (see
  // Table's `created` prop) so "text vs select" isn't a silent no-op — this
  // clears back to null once the user dismisses that menu.
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  const columns: TableColumn[] = useMemo(() => {
    const custom: TableColumn[] = customCols.map((c) => ({
      id: c.id,
      label: c.label,
      accessor: c.id,
      dataType: c.dataType,
      options: c.options,
      created: c.id === justCreatedId,
    }));
    return [
      ...fixedColumns,
      ...custom,
      { id: Constants.ADD_COLUMN_ID, label: "+", accessor: Constants.ADD_COLUMN_ID, dataType: "null", disableResizing: true, disableSortBy: true, width: 40 },
    ];
  }, [fixedColumns, customCols, justCreatedId]);

  /** custom_fields values for one row, spread into its display object under each custom column's id. */
  const getRowExtra = useCallback((rowId: string) => customValues[rowId] ?? {}, [customValues]);

  const dispatchColumnAction = useCallback(
    (action: Record<string, unknown>) => {
      switch (action.type) {
        case ActionTypes.ADD_OPTION_TO_COLUMN: {
          const columnId = action.columnId as string;
          if (!customColumnIds.has(columnId)) return; // fixed enum columns keep a locked option set
          void addOption(columnId, { label: action.option as string, backgroundColor: action.backgroundColor as string } satisfies CustomColumnOption);
          return;
        }
        case ActionTypes.UPDATE_COLUMN_TYPE: {
          const columnId = action.columnId as string;
          if (!customColumnIds.has(columnId)) return;
          void setColumnType(columnId, action.dataType as "text" | "number" | "select");
          return;
        }
        case ActionTypes.UPDATE_COLUMN_HEADER: {
          const columnId = action.columnId as string;
          if (!customColumnIds.has(columnId)) return;
          void renameColumn(columnId, action.label as string);
          return;
        }
        case ActionTypes.ADD_COLUMN_TO_LEFT:
        case ActionTypes.ADD_COLUMN_TO_RIGHT:
          // Simplification: new custom columns are always appended at the
          // end rather than spliced next to the column that was clicked —
          // exact ordering among custom columns isn't load-bearing here.
          void addColumn(customCols.length).then((col) => {
            if (col) setJustCreatedId(col.id);
          });
          return;
        case ActionTypes.DISMISS_CREATED: {
          const columnId = action.columnId as string;
          setJustCreatedId((prev) => (prev === columnId ? null : prev));
          return;
        }
        case ActionTypes.DELETE_COLUMN: {
          const columnId = action.columnId as string;
          if (!customColumnIds.has(columnId)) return; // fixed columns can't be deleted
          void deleteColumn(columnId);
          return;
        }
        default:
          return;
      }
    },
    [customColumnIds, addOption, setColumnType, renameColumn, addColumn, deleteColumn, customCols.length]
  );

  const makeDispatch = useCallback(
    (groupRows: { id: string }[], onAddRowForGroup?: () => void) => (action: Record<string, unknown>) => {
      if (action.type === ActionTypes.UPDATE_CELL) {
        const row = groupRows[action.rowIndex as number];
        if (!row) return;
        const columnId = action.columnId as string;
        if (customColumnIds.has(columnId)) setCustomValue(row.id, columnId, action.value);
        else onEditFixedField(row.id, columnId, action.value);
        return;
      }
      if (action.type === ActionTypes.ADD_ROW) {
        (onAddRowForGroup ?? onAddRow)?.();
        return;
      }
      dispatchColumnAction(action);
    },
    [customColumnIds, setCustomValue, onEditFixedField, onAddRow, dispatchColumnAction]
  );

  return { columns, loading, getRowExtra, makeDispatch };
}

export { DataTypes };
