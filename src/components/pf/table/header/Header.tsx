import { useEffect, useState } from "react";
import { usePopper } from "react-popper";
import { ActionTypes, Constants } from "../utils";
import AddColumnHeader from "./AddColumnHeader";
import DataTypeIcon from "./DataTypeIcon";
import HeaderMenu, { type SelectOption } from "./HeaderMenu";

type HeaderColumn = {
  id: string;
  created?: boolean;
  label: string;
  dataType: string;
  fixed?: boolean;
  options?: SelectOption[];
  // Only present on columns react-table has attached the filters plugin's
  // API to — in practice every column here, but kept optional to match the
  // rest of this ported react-table surface.
  filterValue?: string[];
  setFilter?: (value: string[] | undefined) => void;
  // react-table only attaches this to columns that can actually resize —
  // it's absent (not a no-op function) on any column with disableResizing.
  getResizerProps?: () => Record<string, unknown>;
  getHeaderProps: () => Record<string, unknown>;
};

export default function Header({
  column,
  setSortBy,
  dataDispatch,
}: {
  column: HeaderColumn;
  setSortBy: (v: { id: string; desc: boolean }[]) => void;
  dataDispatch: (action: Record<string, unknown>) => void;
}) {
  const { id, created, label, dataType, fixed, options, filterValue, setFilter, getResizerProps, getHeaderProps } = column;
  const [showHeaderMenu, setShowHeaderMenu] = useState(created || false);
  const [anchorRef, setAnchorRef] = useState<HTMLElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLElement | null>(null);
  const popper = usePopper(anchorRef, popperRef, { placement: "bottom-start", strategy: "absolute" });

  useEffect(() => {
    if (created) setShowHeaderMenu(true);
  }, [created]);

  // A brand-new column auto-opens its menu (above) so "text vs select" isn't
  // hidden; once the user dismisses it, tell the reducer so it doesn't keep
  // popping back open (e.g. after switching table views and back).
  const closeMenu = (next: boolean) => {
    setShowHeaderMenu(next);
    if (!next && created) dataDispatch({ type: ActionTypes.DISMISS_CREATED, columnId: id });
  };

  if (id === Constants.ADD_COLUMN_ID) {
    return <AddColumnHeader dataDispatch={dataDispatch} getHeaderProps={getHeaderProps} />;
  }

  const { key: headerCellKey, ...headerCellProps } = getHeaderProps();
  const hasActiveFilter = !!filterValue?.length;

  return (
    <>
      <div {...headerCellProps} key={headerCellKey as React.Key} className="pf-tbl-th pf-tbl-noselect pf-tbl-inline-block">
        <div className="pf-tbl-th-content" onClick={() => setShowHeaderMenu(true)} ref={setAnchorRef}>
          <span className="pf-tbl-icon-margin" style={{ display: "inline-flex" }}><DataTypeIcon dataType={dataType} /></span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
          {hasActiveFilter && (
            <span
              title={`Filtered: ${filterValue!.join(", ")}`}
              style={{ marginLeft: 6, width: 6, height: 6, borderRadius: "50%", background: "var(--primary-500)", flexShrink: 0 }}
            />
          )}
        </div>
        {getResizerProps && <div {...getResizerProps()} className="pf-tbl-resizer" />}
      </div>
      {showHeaderMenu && <div className="pf-tbl-overlay" onClick={() => closeMenu(false)} />}
      {showHeaderMenu && (
        <HeaderMenu
          label={label}
          dataType={dataType}
          fixed={fixed}
          options={options}
          filterValue={filterValue}
          setFilter={setFilter}
          popperStyle={popper.styles.popper}
          popperAttrs={popper.attributes.popper ?? {}}
          popperRef={setPopperRef}
          dataDispatch={dataDispatch}
          setSortBy={setSortBy}
          columnId={id}
          setShowHeaderMenu={closeMenu}
        />
      )}
    </>
  );
}
