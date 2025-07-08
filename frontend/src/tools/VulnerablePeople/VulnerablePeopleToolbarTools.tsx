import VulnerablePeopleControls from "./VulnerablePeopleControls";
import featureFlags from "@/config/feature-flags";
import ToolbarDropdown from "@/components/ToolbarDropdown";

export default function VulnerablePeopleToolbarTools() {
  if (featureFlags.uiNext) {
    return null;
  }

  return (
    <ToolbarDropdown title="Vulnerable People">
      <VulnerablePeopleControls />
    </ToolbarDropdown>
  );
}
