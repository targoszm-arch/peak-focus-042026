// Ported from https://codesandbox.io/p/sandbox/editable-react-table-gchwp
// (editable-react-table, MIT) — action/type constants for the table's
// dataDispatch reducer. makeData()/faker demo-data generation dropped;
// Peak Focus feeds it real rows via its own adapters.

export function shortId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

export function randomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 85%, 88%)`;
}

export const ActionTypes = Object.freeze({
  ADD_OPTION_TO_COLUMN: "add_option_to_column",
  ADD_ROW: "add_row",
  UPDATE_COLUMN_TYPE: "update_column_type",
  UPDATE_COLUMN_HEADER: "update_column_header",
  UPDATE_CELL: "update_cell",
  ADD_COLUMN_TO_LEFT: "add_column_to_left",
  ADD_COLUMN_TO_RIGHT: "add_column_to_right",
  DELETE_COLUMN: "delete_column",
  ENABLE_RESET: "enable_reset",
});

export const DataTypes = Object.freeze({
  NUMBER: "number",
  TEXT: "text",
  SELECT: "select",
});

export const Constants = Object.freeze({
  ADD_COLUMN_ID: "__add_column__",
});
