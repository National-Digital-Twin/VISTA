import FloodAreas from "./FloodAreas/FloodAreas";
import featureFlags from "@/config/feature-flags";

export default function FloodAreaToolbarTool() {
  if (featureFlags.uiNext) {
    return null;
  }
  return <FloodAreas />;
}
