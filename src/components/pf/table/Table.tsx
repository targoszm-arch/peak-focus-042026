/* eslint-disable @typescript-eslint/no-explicit-any -- react-table v7's plugin-hook generics
   (useBlockLayout + useResizeColumns + useSortBy composed) aren't expressible without a large
   bespoke type-augmentation file; the rest of this component is fully typed. */
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useTable, useBlockLayout, useFilters, useResizeColumns, useSortBy } from "react-table";
import { FixedSizeList } from "react-window";
import Cell from "./cells/Cell";
import Header from "./header/Header";
import { PlusIcon } from "./img/icons";
import { ActionTypes } from "./utils";
import scrollbarWidth from "./scrollbarWidth";
import "./table.css";

// Ported from https://codesandbox.io/p/sandbox/editable-react-table-gchwp
// (editable-react-table, MIT license) — react-table v7 block-layout table
// with resizable/sortable columns and inline-editable cells. Persistence
// is entirely the caller's job: every edit/add/delete flows out through
// `dispatch`, which the caller (see use-editable-table.ts) turns into real
// Supabase writes; this component itself holds no server state.

const defaultColumn = {
  minWidth: 60,
  width: 160,
  maxWidth: 480,
  Cell,
  Header,
  sortType: "alphanumericFalsyLast",
};

export type TableColumn = {
  id: string;
  label: string;
  accessor: string;
  dataType: string;
  options?: { label: string; backgroundColor: string }[];
  fixed?: boolean;
  readOnly?: boolean;
  lockedOptions?: boolean;
  align?: "right";
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  disableResizing?: boolean;
  disableSortBy?: boolean;
  /** True for exactly one render right after this column was added, so its
   *  header menu can auto-open (see use-editable-table.ts's DISMISS_CREATED). */
  created?: boolean;
};

export default function Table({
  columns,
  data,
  dispatch: dataDispatch,
  skipReset,
  showAddRow = true,
  rowHeight = 40,
  maxHeight = 480,
  onRowAction,
  fillColumnId,
}: {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  dispatch: (action: Record<string, unknown>) => void;
  skipReset?: boolean;
  showAddRow?: boolean;
  rowHeight?: number;
  maxHeight?: number;
  onRowAction?: (rowIndex: number) => void;
  /** Column id that should absorb any leftover width so the table fills its container instead of leaving a gap. */
  fillColumnId?: string;
}) {
  // useBlockLayout renders every column at a fixed pixel width, so "fill the
  // container" means measuring available space ourselves and stretching one
  // column (the id/name column, by convention) to take up the remainder.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effectiveColumns = useMemo(() => {
    if (!fillColumnId || !containerWidth) return columns;
    const fillCol = columns.find((c) => c.id === fillColumnId);
    if (!fillCol) return columns;
    const othersWidth = columns.filter((c) => c.id !== fillColumnId).reduce((sum, c) => sum + (c.width ?? defaultColumn.width), 0);
    // Reserve room for FixedSizeList's own vertical scrollbar (added back
    // onto its `width` prop below) so a full group doesn't force an
    // unwanted horizontal scrollbar on top of it.
    const fillWidth = Math.max(
      fillCol.minWidth ?? fillCol.width ?? defaultColumn.minWidth,
      containerWidth - othersWidth - scrollbarWidth() - 2
    );
    // Override maxWidth too — otherwise defaultColumn's 480 cap (sized for
    // a normal fixed column) clamps the fill column well short of the
    // container on wide screens.
    return columns.map((c) => (c.id === fillColumnId ? { ...c, width: fillWidth, maxWidth: Math.max(fillWidth, c.maxWidth ?? 0) } : c));
  }, [columns, containerWidth, fillColumnId]);

  // Select columns get a multi-value membership filter, driven by the
  // "Filter by value" checklist in HeaderMenu. Other data types aren't
  // filterable yet — react-table just leaves `filter` unset for them.
  const filterableColumns = useMemo(
    () => effectiveColumns.map((c) => (c.dataType === "select" ? { ...c, filter: "selectMulti" } : c)),
    [effectiveColumns]
  );

  const filterTypes = useMemo(
    () => ({
      selectMulti(rows: any[], columnIds: string[], filterValue: string[]) {
        if (!filterValue || filterValue.length === 0) return rows;
        return rows.filter((row) => columnIds.some((id) => filterValue.includes(row.values[id])));
      },
    }),
    []
  );

  const sortTypes = useMemo(
    () => ({
      alphanumericFalsyLast(rowA: any, rowB: any, columnId: string, desc: boolean) {
        const a = rowA.values[columnId];
        const b = rowB.values[columnId];
        if (!a && !b) return 0;
        if (!a) return desc ? -1 : 1;
        if (!b) return desc ? 1 : -1;
        return isNaN(a) ? String(a).localeCompare(String(b)) : a - b;
      },
    }),
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, totalColumnsWidth, setSortBy } = useTable(
    {
      columns: filterableColumns as any,
      data: data as any,
      defaultColumn: defaultColumn as any,
      // react-table forwards unrecognized top-level options straight onto
      // the table instance, which is what lets Header/Cell (rendered via
      // column.render(...)) receive dataDispatch as a prop without us
      // threading it through manually.
      dataDispatch,
      onRowAction,
      autoResetSortBy: !skipReset,
      autoResetFilters: !skipReset,
      autoResetRowState: !skipReset,
      sortTypes,
      filterTypes,
    } as any,
    useFilters,
    useBlockLayout,
    useResizeColumns,
    useSortBy
  ) as any;

  function isTableResizing() {
    for (const headerGroup of headerGroups) {
      for (const column of headerGroup.headers) {
        if (column.isResizing) return true;
      }
    }
    return false;
  }

  const listHeight = Math.min(maxHeight, Math.max(rows.length, 1) * rowHeight);

  return (
    <div ref={wrapperRef} style={{ maxWidth: "100%", overflow: "auto" }}>
      <div {...getTableProps()} className={clsx("pf-tbl-table", isTableResizing() && "pf-tbl-noselect")}>
        <div>
          {headerGroups.map((headerGroup: any) => {
            const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              <div {...headerGroupProps} className="pf-tbl-tr" key={headerGroupKey}>
                {headerGroup.headers.map((column: any) => (
                  <span key={column.id}>{column.render("Header", { setSortBy })}</span>
                ))}
              </div>
            );
          })}
        </div>
        <div {...getTableBodyProps()}>
          {rows.length > 0 && (
            <FixedSizeList height={listHeight} itemCount={rows.length} itemSize={rowHeight} width={totalColumnsWidth + scrollbarWidth()}>
              {({ index, style }: { index: number; style: React.CSSProperties }) => {
                const row = rows[index];
                prepareRow(row);
                return (
                  <div {...row.getRowProps({ style })} className="pf-tbl-tr">
                    {row.cells.map((cell: any) => {
                      const { key: cellKey, ...cellProps } = cell.getCellProps();
                      return (
                        <div {...cellProps} className="pf-tbl-td" key={cellKey}>
                          {cell.render("Cell")}
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            </FixedSizeList>
          )}
          {showAddRow && (
            <div className="pf-tbl-add-row" onClick={() => dataDispatch({ type: ActionTypes.ADD_ROW })}>
              <span className="pf-tbl-icon-margin" style={{ display: "inline-flex" }}><PlusIcon size={14} /></span>
              New
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
