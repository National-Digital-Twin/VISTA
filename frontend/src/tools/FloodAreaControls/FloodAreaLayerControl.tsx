import { faDrawPolygon } from "@fortawesome/free-solid-svg-icons";

import FloodAreasMenuBody from "./FloodAreas/FloodAreasMenuBody";
import type { LayerControlProps } from "@/tools/Tool";

import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function FloodAreaLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <ComplexLayerControl
      icon={faDrawPolygon}
      title="Flood Polygons"
      autoShowHide
    >
      <div className="menu menu-lg">
        <FloodAreasMenuBody searchQuery={searchQuery} />
      </div>
    </ComplexLayerControl>
  );
}
