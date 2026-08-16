import { DataTypes } from "../utils";
import { HashIcon, TextIcon, MultiIcon } from "../img/icons";

export default function DataTypeIcon({ dataType }: { dataType: string }) {
  switch (dataType) {
    case DataTypes.NUMBER:
      return <HashIcon size={14} />;
    case DataTypes.TEXT:
      return <TextIcon size={14} />;
    case DataTypes.SELECT:
      return <MultiIcon size={14} />;
    default:
      return null;
  }
}
