import { useEffect, useState } from "react";
import { usePopper } from "react-popper";
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, TrashIcon } from "../img/icons";
import TypesMenu from "./TypesMenu";
import { ActionTypes, DataTypes, shortId } from "../utils";
import DataTypeIcon from "./DataTypeIcon";
import Badge from "../Badge";

export type SelectOption = { label: string; backgroundColor: string };

export default function HeaderMenu({
  label,
  dataType,
  columnId,
  fixed,
  options,
  filterValue,
  setFilter,
  setSortBy,
  popperStyle,
  popperAttrs,
  popperRef,
  dataDispatch,
  setShowHeaderMenu,
}: {
  label: string;
  dataType: string;
  columnId: string;
  fixed?: boolean;
  options?: SelectOption[];
  filterValue?: string[];
  setFilter?: (value: string[] | undefined) => void;
  setSortBy: (v: { id: string; desc: boolean }[]) => void;
  popperStyle: React.CSSProperties;
  popperAttrs: Record<string, unknown>;
  popperRef: (el: HTMLElement | null) => void;
  dataDispatch: (action: Record<string, unknown>) => void;
  setShowHeaderMenu: (v: boolean) => void;
}) {
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
  const [header, setHeader] = useState(label);
  const [typeRef, setTypeRef] = useState<HTMLElement | null>(null);
  const [typePopRef, setTypePopRef] = useState<HTMLElement | null>(null);
  const typePopper = usePopper(typeRef, typePopRef, { placement: "right", strategy: "fixed" });
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  useEffect(() => setHeader(label), [label]);
  useEffect(() => {
    if (inputRef && !fixed) {
      inputRef.focus();
      inputRef.select();
    }
  }, [inputRef, fixed]);

  const commitLabel = () => {
    if (!fixed) dataDispatch({ type: ActionTypes.UPDATE_COLUMN_HEADER, columnId, label: header });
  };

  const canFilter = dataType === DataTypes.SELECT && !!options?.length && !!setFilter;
  const toggleFilterValue = (optionLabel: string) => {
    if (!setFilter) return;
    const current = filterValue ?? [];
    const next = current.includes(optionLabel) ? current.filter((v) => v !== optionLabel) : [...current, optionLabel];
    setFilter(next.length ? next : undefined);
  };

  const buttons = [
    {
      onClick: () => { commitLabel(); setSortBy([{ id: columnId, desc: false }]); setShowHeaderMenu(false); },
      icon: <ArrowUpIcon size={14} />,
      label: "Sort ascending",
    },
    {
      onClick: () => { commitLabel(); setSortBy([{ id: columnId, desc: true }]); setShowHeaderMenu(false); },
      icon: <ArrowDownIcon size={14} />,
      label: "Sort descending",
    },
    {
      onClick: () => { commitLabel(); dataDispatch({ type: ActionTypes.ADD_COLUMN_TO_LEFT, columnId, focus: false }); setShowHeaderMenu(false); },
      icon: <ArrowLeftIcon size={14} />,
      label: "Insert column left",
    },
    {
      onClick: () => { commitLabel(); dataDispatch({ type: ActionTypes.ADD_COLUMN_TO_RIGHT, columnId, focus: false }); setShowHeaderMenu(false); },
      icon: <ArrowRightIcon size={14} />,
      label: "Insert column right",
    },
    ...(fixed
      ? []
      : [
          {
            onClick: () => { dataDispatch({ type: ActionTypes.DELETE_COLUMN, columnId }); setShowHeaderMenu(false); },
            icon: <TrashIcon size={14} />,
            label: "Delete column",
          },
        ]),
  ];

  return (
    <div ref={popperRef} style={{ ...popperStyle, zIndex: 41 }} {...popperAttrs}>
      <div className="pf-tbl-shadow" style={{ width: 230, background: "var(--surface-card)", borderRadius: "var(--radius-md)" }}>
        <div style={{ padding: "10px 10px 6px" }}>
          <div style={{ marginBottom: 10 }}>
            <input
              className="pf-tbl-form-input pf-tbl-fullwidth"
              ref={setInputRef}
              type="text"
              value={header}
              readOnly={fixed}
              onChange={(e) => setHeader(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => { if (e.key === "Enter") { commitLabel(); setShowHeaderMenu(false); } }}
            />
          </div>
          {!fixed && <span className="pf-tbl-fw-600 pf-tbl-fs-75 pf-tbl-uppercase" style={{ color: "var(--text-tertiary)" }}>Property type</span>}
        </div>
        {!fixed && (
          <div className="pf-tbl-list-padding">
            <button
              type="button"
              className="pf-tbl-sort-button"
              onMouseEnter={() => setShowTypeMenu(true)}
              onMouseLeave={() => setShowTypeMenu(false)}
              ref={setTypeRef}
            >
              <span className="pf-tbl-icon-margin"><DataTypeIcon dataType={dataType} /></span>
              <span className="pf-tbl-capitalize">{dataType}</span>
            </button>
            {showTypeMenu && (
              <TypesMenu
                popperStyle={typePopper.styles.popper}
                popperAttrs={typePopper.attributes.popper ?? {}}
                popperRef={setTypePopRef}
                onClose={() => { setShowTypeMenu(false); setShowHeaderMenu(false); }}
                setShowTypeMenu={setShowTypeMenu}
                columnId={columnId}
                dataDispatch={dataDispatch}
              />
            )}
          </div>
        )}
        {canFilter && (
          <>
            <div style={{ borderTop: "1px solid var(--border-soft)" }} />
            <div style={{ padding: "8px 10px 4px" }}>
              <span className="pf-tbl-fw-600 pf-tbl-fs-75 pf-tbl-uppercase" style={{ color: "var(--text-tertiary)" }}>Filter by value</span>
            </div>
            <div style={{ padding: "2px 10px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {options!.map((o) => {
                const active = !!filterValue?.includes(o.label);
                return (
                  <div
                    key={o.label}
                    className="pf-tbl-cursor-pointer"
                    onClick={() => toggleFilterValue(o.label)}
                    style={{ opacity: filterValue?.length && !active ? 0.4 : 1, boxShadow: active ? "0 0 0 1.5px var(--primary-500)" : "none", borderRadius: "var(--radius-sm)" }}
                  >
                    <Badge value={o.label} backgroundColor={o.backgroundColor} />
                  </div>
                );
              })}
            </div>
            {!!filterValue?.length && (
              <div style={{ padding: "0 10px 8px" }}>
                <button
                  type="button"
                  onClick={() => setFilter!(undefined)}
                  style={{ background: "transparent", border: "none", padding: 0, color: "var(--primary-500)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                >
                  Clear filter
                </button>
              </div>
            )}
          </>
        )}
        <div style={{ borderTop: "1px solid var(--border-soft)" }} />
        <div className="pf-tbl-list-padding">
          {buttons.map((button) => (
            <button key={shortId()} type="button" className="pf-tbl-sort-button" onMouseDown={button.onClick}>
              <span className="pf-tbl-icon-margin">{button.icon}</span>
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
