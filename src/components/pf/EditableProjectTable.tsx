import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Table, { type TableColumn } from "@/components/pf/table/Table";
import type { ProjectFull } from "@/hooks/use-projects";

/** One section's worth of projects (Favourites/My Projects/Finished) as a real table. */
export default function EditableProjectTable({
  projects,
  columns,
  rowFields,
  getRowExtra,
  makeDispatch,
  onAddRow,
  showAddRow,
}: {
  projects: ProjectFull[];
  columns: TableColumn[];
  rowFields: (project: ProjectFull) => Record<string, unknown>;
  getRowExtra: (rowId: string) => Record<string, unknown>;
  makeDispatch: (groupRows: { id: string }[], onAddRowForGroup?: () => void) => (action: Record<string, unknown>) => void;
  onAddRow?: () => void;
  showAddRow?: boolean;
}) {
  const navigate = useNavigate();
  const data = useMemo(
    () => projects.map((p) => ({ id: p.id, open: "", ...rowFields(p), ...getRowExtra(p.id) })),
    [projects, rowFields, getRowExtra]
  );
  const dispatch = useMemo(() => makeDispatch(projects, onAddRow), [makeDispatch, projects, onAddRow]);

  return (
    <Table
      columns={columns}
      data={data}
      dispatch={dispatch}
      showAddRow={showAddRow}
      onRowAction={(rowIndex) => { const p = projects[rowIndex]; if (p) navigate(`/projects/${p.id}`); }}
    />
  );
}
