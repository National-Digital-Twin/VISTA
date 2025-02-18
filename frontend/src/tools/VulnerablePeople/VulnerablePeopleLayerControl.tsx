import { faPersonWalkingWithCane } from "@fortawesome/free-solid-svg-icons";
import VulnerablePeopleControls from "./VulnerablePeopleControls";
import ComplexLayerControl from "@/components/ComplexLayerControl";

export default function VulnerablePeopleLayerControl() {
  return (
    <ComplexLayerControl
      icon={faPersonWalkingWithCane}
      title="Vulnerable People"
    >
      <div className="menu">
        <VulnerablePeopleControls />
      </div>
    </ComplexLayerControl>
  );
}
