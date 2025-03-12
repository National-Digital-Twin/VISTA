import VulnerablePeopleControls from "./VulnerablePeopleControls";
import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function VulnerablePeopleLayerControl() {
  return (
    <ComplexLayerControl title="Vulnerable People">
      <VulnerablePeopleControls />
    </ComplexLayerControl>
  );
}
