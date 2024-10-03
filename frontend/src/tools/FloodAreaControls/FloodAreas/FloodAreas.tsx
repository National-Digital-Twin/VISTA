import { faDrawPolygon } from "@fortawesome/free-solid-svg-icons";

import FloodAreasMenuBody from "./FloodAreasMenuBody";

import ToolbarDropdown from "@/components/ToolbarDropdown";

export default function FloodAreas() {
  return (
    <ToolbarDropdown icon={faDrawPolygon} title="Flood Polygons" large>
      <FloodAreasMenuBody />
    </ToolbarDropdown>
  );
}
