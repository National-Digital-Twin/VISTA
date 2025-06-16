import { faDrawPolygon } from "@fortawesome/free-solid-svg-icons";
import DrawnPolygonMenuBody from "./DrawnPolygonMenuBody";
import ToolbarDropdown from "@/components/ToolbarDropdown";

function DrawnPolygons() {
  return (
    <ToolbarDropdown icon={faDrawPolygon} title="Flood Polygons">
      <DrawnPolygonMenuBody />
    </ToolbarDropdown>
  );
}

export default function DrawnPolygonToolbarTool() {
  return <DrawnPolygons />;
}
