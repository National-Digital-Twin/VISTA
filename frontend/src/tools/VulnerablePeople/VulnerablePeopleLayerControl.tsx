import VulnerablePeopleControls from "./VulnerablePeopleControls";
import ComplexLayerControl from "@/components/ComplexLayerControl";
import type { LayerControlProps } from "@/tools/Tool";

export default function VulnerablePeopleLayerControl({
  searchQuery,
}: Readonly<LayerControlProps>) {
  if (
    searchQuery &&
    !(
      "Vulnerable People".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "vulnerable".toLowerCase().includes(searchQuery.toLowerCase()) ||
      "people".toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) {
    return null;
  }

  return (
    <ComplexLayerControl title="Vulnerable People">
      {(updateSelectedCount) => (
        <VulnerablePeopleControls updateSelectedCount={updateSelectedCount} />
      )}
    </ComplexLayerControl>
  );
}
