import type { CSSProperties } from "react";
import { ActionTypes, DataTypes, shortId } from "../utils";
import DataTypeIcon from "./DataTypeIcon";

const label = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export default function TypesMenu({
  popperStyle,
  popperAttrs,
  popperRef,
  dataDispatch,
  setShowTypeMenu,
  onClose,
  columnId,
}: {
  popperStyle: CSSProperties;
  popperAttrs: Record<string, unknown>;
  popperRef: (el: HTMLElement | null) => void;
  dataDispatch: (action: Record<string, unknown>) => void;
  setShowTypeMenu: (v: boolean) => void;
  onClose: () => void;
  columnId: string;
}) {
  const types = [DataTypes.SELECT, DataTypes.TEXT, DataTypes.NUMBER];

  return (
    <div
      ref={popperRef}
      className="pf-tbl-shadow pf-tbl-list-padding"
      onMouseEnter={() => setShowTypeMenu(true)}
      onMouseLeave={() => setShowTypeMenu(false)}
      {...popperAttrs}
      style={{ ...popperStyle, width: 190, background: "var(--surface-card)", borderRadius: "var(--radius-md)", zIndex: 41 }}
    >
      {types.map((type) => (
        <button
          key={shortId()}
          type="button"
          className="pf-tbl-sort-button"
          onClick={() => { dataDispatch({ type: ActionTypes.UPDATE_COLUMN_TYPE, columnId, dataType: type }); onClose(); }}
        >
          <span className="pf-tbl-icon-margin"><DataTypeIcon dataType={type} /></span>
          {label(type)}
        </button>
      ))}
    </div>
  );
}
