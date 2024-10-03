import { RoadRouteMenuBody } from "./RoadRouteMenuBody";
import featureFlags from "@/config/feature-flags";
import ToolbarDropdown from "@/components/ToolbarDropdown";

export default function ToolbarTools() {
  if (featureFlags.uiNext) {
    return null;
  }

  return (
    <ToolbarDropdown title="Road Route">
      <RoadRouteMenuBody />
    </ToolbarDropdown>
  );
}
