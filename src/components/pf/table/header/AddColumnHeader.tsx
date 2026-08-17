import { PlusIcon } from "../img/icons";
import { ActionTypes, Constants } from "../utils";

export default function AddColumnHeader({
  getHeaderProps,
  dataDispatch,
}: {
  getHeaderProps: () => Record<string, unknown>;
  dataDispatch: (action: Record<string, unknown>) => void;
}) {
  const { key, ...headerProps } = getHeaderProps();

  return (
    <div {...headerProps} key={key as React.Key} className="pf-tbl-th pf-tbl-noselect pf-tbl-inline-block">
      <div
        className="pf-tbl-th-content pf-tbl-flex pf-tbl-justify-center"
        onClick={() => dataDispatch({ type: ActionTypes.ADD_COLUMN_TO_LEFT, columnId: Constants.ADD_COLUMN_ID, focus: true })}
      >
        <PlusIcon size={14} />
      </div>
    </div>
  );
}
