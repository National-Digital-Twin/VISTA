import MapStyleButton from "./MapStyleButton";
import MapSettingsButton from "./MapSettingsButton";

export const TOOL_NAME = "Map settings menus";

export function SideButtons() {
  return (
    <>
      <MapStyleButton />
      <MapSettingsButton />
    </>
  );
}
