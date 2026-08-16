import { useMemo } from "react";
import Table, { type TableColumn } from "@/components/pf/table/Table";
import type { Task } from "@/hooks/use-tasks";

/** One group's worth of tasks (e.g. "Today", "Overdue") as a real table row-per-task grid. */
export default function EditableTaskTable({
  tasks,
  columns,
  rowFields,
  getRowExtra,
  makeDispatch,
  onOpen,
  onAddRow,
  showAddRow,
}: {
  tasks: Task[];
  columns: TableColumn[];
  rowFields: (task: Task) => Record<string, unknown>;
  getRowExtra: (rowId: string) => Record<string, unknown>;
  makeDispatch: (groupRows: { id: string }[], onAddRowForGroup?: () => void) => (action: Record<string, unknown>) => void;
  onOpen: (task: Task) => void;
  onAddRow?: () => void;
  showAddRow?: boolean;
}) {
  const data = useMemo(
    () => tasks.map((t) => ({ id: t.id, open: "", ...rowFields(t), ...getRowExtra(t.id) })),
    [tasks, rowFields, getRowExtra]
  );
  const dispatch = useMemo(() => makeDispatch(tasks, onAddRow), [makeDispatch, tasks, onAddRow]);

  return (
    <Table
      columns={columns}
      data={data}
      dispatch={dispatch}
      showAddRow={showAddRow}
      onRowAction={(rowIndex) => { const t = tasks[rowIndex]; if (t) onOpen(t); }}
    />
  );
}
