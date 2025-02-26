import VulnerablePeopleControls from "./VulnerablePeopleControls";
import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function VulnerablePeopleLayerControl() {
  return (
    <ComplexLayerControl title="Vulnerable People">
      <div className="menu">
        <VulnerablePeopleControls />
      </div>
    </ComplexLayerControl>
  );
}
