import ComplexLayerControl from "@/components/ComplexLayerControl";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function SandbagLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  return (
    <ComplexLayerControl title="Sandbags">
      <SimpleLayerControl
        layerName="sandbag"
        title="Sandbags"
        searchQuery={searchQuery}
      />
    </ComplexLayerControl>
  );
}
