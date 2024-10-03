import { faRoute } from "@fortawesome/free-solid-svg-icons";
import { RoadRouteMenuBody } from "./RoadRouteMenuBody";
import type { LayerControlProps } from "@/tools/Tool";

import ComplexLayerControl from "@/components/ComplexLayerControl";
import featureFlags from "@/config/feature-flags";

export default function RoadRouteLayerControl({
  searchQuery,
}: LayerControlProps) {
  if (!featureFlags.routing) {
    return null;
  }

  return (
    <ComplexLayerControl icon={faRoute} title="Road Route">
      <div className="menu menu-lg">
        <RoadRouteMenuBody searchQuery={searchQuery} />
      </div>
    </ComplexLayerControl>
  );
}
