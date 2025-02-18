import { faBridge } from "@fortawesome/free-solid-svg-icons";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function LowBridgeLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <SimpleLayerControl
      layerName="low-bridges"
      icon={faBridge}
      title="Low bridges"
      searchQuery={searchQuery}
    />
  );
}
