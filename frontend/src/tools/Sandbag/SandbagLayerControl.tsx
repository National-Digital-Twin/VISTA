import ComplexLayerControl from "@/components/ComplexLayerControl";
import SimpleLayerControl from "@/components/SimpleLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function SandbagLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  if (
    searchQuery &&
    !(
      "Sandbags".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "sandbag".toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) {
    return null;
  }

  return (
    <ComplexLayerControl title="Sandbags">
      {(updateSelectedCount) => (
        <SimpleLayerControl
          layerName="sandbag"
          title="Sandbags"
          searchQuery={searchQuery}
          updateSelectedCount={updateSelectedCount}
        />
      )}
    </ComplexLayerControl>
  );
}
