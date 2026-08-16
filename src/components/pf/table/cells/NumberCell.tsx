import { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";
import { ActionTypes } from "../utils";

export default function NumberCell({
  initialValue,
  columnId,
  rowIndex,
  dataDispatch,
  readOnly,
}: {
  initialValue: unknown;
  columnId: string;
  rowIndex: number;
  dataDispatch: (action: Record<string, unknown>) => void;
  readOnly?: boolean;
}) {
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

  return (
    <ContentEditable
      html={(value.value !== null && value.value !== undefined && value.value.toString()) || ""}
      disabled={readOnly}
      onChange={(e) => setValue({ value: e.target.value, update: false })}
      onBlur={() => setValue((old) => ({ value: old.value, update: true }))}
      className="pf-tbl-data-input"
      style={{ textAlign: "right" }}
    />
  );
}
