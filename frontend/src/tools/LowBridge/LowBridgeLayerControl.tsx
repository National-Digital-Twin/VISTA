import ComplexLayerControl from "@/components/ComplexLayerControl";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function LowBridgeLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <ComplexLayerControl title="Bridges">
      <SimpleLayerControl
        layerName="low-bridges"
        title="Low bridges"
        searchQuery={searchQuery}
      />
    </ComplexLayerControl>
  );
}
