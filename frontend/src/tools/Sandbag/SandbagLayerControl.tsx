import { faMound } from "@fortawesome/free-solid-svg-icons";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function SandbagLayerControl({
  searchQuery,
}: LayerControlProps) {
  return (
    <SimpleLayerControl
      layerName="sandbag"
      icon={faMound}
      title="Sandbags"
      searchQuery={searchQuery}
    />
  );
}
