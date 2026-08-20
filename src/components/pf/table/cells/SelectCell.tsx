import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import Badge from "../Badge";
import { PlusIcon } from "../img/icons";
import { ActionTypes } from "../utils";

export type SelectOption = { label: string; backgroundColor: string };

// A fixed pastel palette (same HSL recipe the old randomColor() used) so a
// new tag's color is a deliberate pick, not a random one — spaced evenly
// around the hue wheel so adjacent swatches stay visually distinct.
const TAG_COLORS = [0, 25, 45, 90, 160, 200, 230, 265, 300, 330].map((h) => `hsl(${h}, 85%, 88%)`);

export default function SelectCell({
  initialValue,
  options,
  columnId,
  rowIndex,
  dataDispatch,
  readOnly,
  lockedOptions,
}: {
  initialValue: unknown;
  options: SelectOption[];
  columnId: string;
  rowIndex: number;
  dataDispatch: (action: Record<string, unknown>) => void;
  readOnly?: boolean;
  /** Fixed enum columns (priority/status) can't grow new options from the cell UI. */
  lockedOptions?: boolean;
}) {
  const [selectRef, setSelectRef] = useState<HTMLElement | null>(null);
  const [selectPop, setSelectPop] = useState<HTMLElement | null>(null);
  const [showSelect, setShowSelect] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addSelectRef, setAddSelectRef] = useState<HTMLInputElement | null>(null);
  // Rotates through the palette by option count so a fresh "add tag" row
  // rarely pre-selects a color already in use, while still starting the
  // user off with something rather than an empty swatch row.
  const [pickedColor, setPickedColor] = useState(TAG_COLORS[options.length % TAG_COLORS.length]);
  const { styles, attributes } = usePopper(selectRef, selectPop, { placement: "bottom-start", strategy: "fixed" });
  const [value, setValue] = useState({ value: initialValue, update: false });

  useEffect(() => {
    setValue({ value: initialValue, update: false });
  }, [initialValue]);

  useEffect(() => {
    if (value.update) {
      dataDispatch({ type: ActionTypes.UPDATE_CELL, columnId, rowIndex, value: value.value });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.update, columnId, rowIndex]);

  useEffect(() => {
    if (addSelectRef && showAdd) {
      addSelectRef.focus();
      setPickedColor(TAG_COLORS[options.length % TAG_COLORS.length]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSelectRef, showAdd]);

  const getColor = () => {
    const match = options.find((o) => o.label === value.value);
    return match?.backgroundColor || "var(--surface-sunken)";
  };

  const commitNewOption = (raw: string) => {
    if (raw !== "") {
      dataDispatch({ type: ActionTypes.ADD_OPTION_TO_COLUMN, option: raw, backgroundColor: pickedColor, columnId });
    }
    setShowAdd(false);
  };

  return (
    <>
      <div
        ref={setSelectRef}
        className="pf-tbl-cell-padding pf-tbl-flex pf-tbl-items-center pf-tbl-flex-1"
        style={{ cursor: readOnly ? "default" : "pointer" }}
        onClick={() => !readOnly && setShowSelect(true)}
      >
        {value.value != null && value.value !== "" && <Badge value={String(value.value)} backgroundColor={getColor()} />}
      </div>
      {showSelect && <div className="pf-tbl-overlay" onClick={() => setShowSelect(false)} />}
      {showSelect &&
        createPortal(
          <div
            ref={setSelectPop}
            className="pf-tbl-popper pf-tbl-shadow"
            {...attributes.popper}
            style={{ ...styles.popper, zIndex: 40, minWidth: 200, maxWidth: 320, maxHeight: 400, padding: 10, overflow: "auto" }}
          >
            <div className="pf-tbl-flex pf-tbl-flex-wrap" style={{ marginTop: -6 }}>
              {options.map((option) => (
                <div key={option.label} className="pf-tbl-cursor-pointer" style={{ marginRight: 6, marginTop: 6 }} onClick={() => { setValue({ value: option.label, update: true }); setShowSelect(false); }}>
                  <Badge value={option.label} backgroundColor={option.backgroundColor} />
                </div>
              ))}
              {!readOnly && !lockedOptions && showAdd && (
                <div style={{ marginRight: 6, marginTop: 6, background: "var(--surface-sunken)", borderRadius: "var(--radius-sm)", width: 150, padding: "6px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 5 }}>
                    {TAG_COLORS.map((color) => (
                      <div
                        key={color}
                        title="Tag color"
                        // mousedown (not click) so picking a swatch doesn't
                        // blur the text input first and commit early.
                        onMouseDown={(e) => { e.preventDefault(); setPickedColor(color); }}
                        style={{
                          width: 16, height: 16, borderRadius: "50%", background: color, cursor: "pointer",
                          boxShadow: pickedColor === color ? "0 0 0 2px var(--surface-sunken), 0 0 0 3.5px var(--primary-500)" : "none",
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    className="pf-tbl-option-input"
                    ref={setAddSelectRef}
                    onBlur={(e) => commitNewOption(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitNewOption((e.target as HTMLInputElement).value); }}
                  />
                </div>
              )}
              {!readOnly && !lockedOptions && (
                <div className="pf-tbl-cursor-pointer" style={{ marginRight: 6, marginTop: 6 }} onClick={() => setShowAdd(true)}>
                  <Badge value={<PlusIcon size={13} />} backgroundColor="var(--surface-sunken)" />
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
