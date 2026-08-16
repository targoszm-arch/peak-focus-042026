import { DataTypes } from "../utils";
import TextCell from "./TextCell";
import NumberCell from "./NumberCell";
import SelectCell from "./SelectCell";
import { ArrowRightIcon } from "../img/icons";

export default function Cell({
  value,
  row,
  column,
  dataDispatch,
  onRowAction,
}: {
  value: unknown;
  row: { index: number };
  column: { id: string; dataType: string; options: { label: string; backgroundColor: string }[]; readOnly?: boolean; lockedOptions?: boolean; align?: "right" };
  dataDispatch: (action: Record<string, unknown>) => void;
  onRowAction?: (rowIndex: number) => void;
}) {
  switch (column.dataType) {
    case DataTypes.TEXT:
      return <TextCell initialValue={value} rowIndex={row.index} columnId={column.id} dataDispatch={dataDispatch} readOnly={column.readOnly} align={column.align} />;
    case DataTypes.NUMBER:
      return <NumberCell initialValue={value} rowIndex={row.index} columnId={column.id} dataDispatch={dataDispatch} readOnly={column.readOnly} />;
    case DataTypes.SELECT:
      return (
        <SelectCell
          initialValue={value}
          options={column.options}
          rowIndex={row.index}
          columnId={column.id}
          dataDispatch={dataDispatch}
          readOnly={column.readOnly}
          lockedOptions={column.lockedOptions}
        />
      );
    // Not one of the ported library's original cell types — a small addition
    // so a fixed column can open Peak Focus's own edit modal for fields the
    // flat table can't show (assignees, checklist, notes).
    case "action":
      return (
        <button
          type="button"
          title="Open"
          onClick={() => onRowAction?.(row.index)}
          className="pf-tbl-cursor-pointer"
          style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", color: "var(--text-tertiary)" }}
        >
          <ArrowRightIcon size={15} />
        </button>
      );
    default:
      return <span />;
  }
}
