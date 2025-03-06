import FloodAreasMenuBody from "./FloodAreas/FloodAreasMenuBody";
import type { LayerControlProps } from "@/tools/Tool";

import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function FloodAreaLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <ComplexLayerControl title="Flood Polygons" autoShowHide>
      <FloodAreasMenuBody searchQuery={searchQuery} />
    </ComplexLayerControl>
  );
}
