import MapStyleButton from "./MapStyleButton";
import MapSettingsButton from "./MapSettingsButton";
import ClearMapLayersButton from "./ClearMapLayersButton";

export const TOOL_NAME = "Map settings menus";

export function SideButtons() {
  return (
    <>
      <MapStyleButton />
      <ClearMapLayersButton />
      <MapSettingsButton />
    </>
  );
}
