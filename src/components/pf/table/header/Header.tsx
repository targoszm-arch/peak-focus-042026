import { useEffect, useState } from "react";
import { usePopper } from "react-popper";
import { Constants } from "../utils";
import AddColumnHeader from "./AddColumnHeader";
import DataTypeIcon from "./DataTypeIcon";
import HeaderMenu from "./HeaderMenu";

type HeaderColumn = {
  id: string;
  created?: boolean;
  label: string;
  dataType: string;
  fixed?: boolean;
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
  const { id, created, label, dataType, fixed, getResizerProps, getHeaderProps } = column;
  const [showHeaderMenu, setShowHeaderMenu] = useState(created || false);
  const [anchorRef, setAnchorRef] = useState<HTMLElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLElement | null>(null);
  const popper = usePopper(anchorRef, popperRef, { placement: "bottom-start", strategy: "absolute" });

  useEffect(() => {
    if (created) setShowHeaderMenu(true);
  }, [created]);

  if (id === Constants.ADD_COLUMN_ID) {
    return <AddColumnHeader dataDispatch={dataDispatch} getHeaderProps={getHeaderProps} />;
  }

  const { key: headerCellKey, ...headerCellProps } = getHeaderProps();

  return (
    <>
      <div {...headerCellProps} key={headerCellKey as React.Key} className="pf-tbl-th pf-tbl-noselect pf-tbl-inline-block">
        <div className="pf-tbl-th-content" onClick={() => setShowHeaderMenu(true)} ref={setAnchorRef}>
          <span className="pf-tbl-icon-margin" style={{ display: "inline-flex" }}><DataTypeIcon dataType={dataType} /></span>
          {label}
        </div>
        {getResizerProps && <div {...getResizerProps()} className="pf-tbl-resizer" />}
      </div>
      {showHeaderMenu && <div className="pf-tbl-overlay" onClick={() => setShowHeaderMenu(false)} />}
      {showHeaderMenu && (
        <HeaderMenu
          label={label}
          dataType={dataType}
          fixed={fixed}
          popperStyle={popper.styles.popper}
          popperAttrs={popper.attributes.popper ?? {}}
          popperRef={setPopperRef}
          dataDispatch={dataDispatch}
          setSortBy={setSortBy}
          columnId={id}
          setShowHeaderMenu={setShowHeaderMenu}
        />
      )}
    </>
  );
}
