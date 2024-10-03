import { faTable } from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "usehooks-ts";
import AssetTable from "./AssetTable";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";

export default function AssetTableSideButton() {
  const { value: showTable, toggle: toggleTable } = useBoolean(false);

  return (
    <div className="relative">
      <ToolbarButton title="Asset Table" onClick={toggleTable} icon={faTable} />
      {showTable && (
        <div className="absolute right-12 bottom-0 card max-w-[80vw] max-h-[80vh]">
          <AssetTable />
        </div>
      )}
    </div>
  );
}
