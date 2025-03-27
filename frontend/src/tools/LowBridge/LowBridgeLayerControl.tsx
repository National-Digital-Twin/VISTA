import ComplexLayerControl from "@/components/ComplexLayerControl";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function LowBridgeLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  if (
    searchQuery &&
    !(
      "Bridges".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "Low bridges".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "bridge".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "low".toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) {
    return null;
  }

  return (
    <ComplexLayerControl title="Bridges">
      {(updateSelectedCount) => (
        <SimpleLayerControl
          layerName="low-bridges"
          title="Low bridges"
          searchQuery={searchQuery}
          updateSelectedCount={updateSelectedCount}
        />
      )}
    </ComplexLayerControl>
  );
}
