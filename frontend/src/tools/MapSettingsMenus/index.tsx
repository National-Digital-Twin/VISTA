import MapStyleButton from "./MapStyleButton";
import MapSettingsButton from "./MapSettingsButton";
import ClearMapLayersButton from "./ClearMapLayersButton";
import PolygonCreationButton from "./PolygonCreationButton";

export const TOOL_NAME = "Map settings menus";

export function SideButtons({ onClickFunc }) {
  return (
    <>
      <MapStyleButton />
      <ClearMapLayersButton />
      <PolygonCreationButton onClickFunc={onClickFunc} />
      <MapSettingsButton />
    </>
  );
}

export const SIDE_BUTTON_ORDER = 2;
