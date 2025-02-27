import { RoadRouteMenuBody } from "./RoadRouteMenuBody";
import type { LayerControlProps } from "@/tools/Tool";

import ComplexLayerControl from "@/components/ComplexLayerControl";
import featureFlags from "@/config/feature-flags";

export default function RoadRouteLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  if (!featureFlags.routing) {
    return null;
  }

  return (
    <ComplexLayerControl title="Road Route">
      <div className="menu menu-lg">
        <RoadRouteMenuBody searchQuery={searchQuery} />
      </div>
    </ComplexLayerControl>
  );
}
