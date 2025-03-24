import { useShallow } from "zustand/react/shallow";
import { faTrashAlt, faDrawPolygon } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect } from "react";
import useStore from "./useStore";
import featureFlags from "@/config/feature-flags";
import useLayer from "@/hooks/useLayer";
import { useDrawingMode } from "@/context/DrawingMode";
import useSharedStore from "@/hooks/useSharedStore";
import MenuItemRow from "@/components/MenuItemRow";

export default function VulnerablePeopleControls({
  searchQuery = ""
}: {
  searchQuery?: string
}) {
  const { enabled, toggle } = useLayer("vulnerable-people");

  const drawingModeCallbacks = useSharedStore(
    useShallow((state) => ({
      onAddFeatures: state.addVulnerablePeopleFeatures,
      onUpdateFeatures: state.updateVulnerablePeopleFeatures,
      onDeleteFeatures: state.deleteVulnerablePeopleFeatures,
    })),
  );

  const features = useSharedStore(
    useShallow((state) => state.vulnerablePeopleFeatures),
  );

  const setSelected = useStore(
    (state) => state.setSelectedVulnerablePeopleItem,
  );

  const {
    startDrawing,
    features: [drawnFeature],
  } = useDrawingMode(
    (state) => (enabled ? state.vulnerablePeopleFeatures : []),
    drawingModeCallbacks,
  );

  const handleDrawRectangle = useCallback(() => {
    if (!enabled) {
      toggle();
    }
    startDrawing({ drawingMode: "draw_rectangle" });
  }, [startDrawing, enabled, toggle]);

  const handleDeleteArea = useCallback(() => {
    if (!drawnFeature) {
      return;
    }

    setSelected(null);

    drawingModeCallbacks.onDeleteFeatures([drawnFeature.id]);
  }, [drawnFeature, setSelected, drawingModeCallbacks]);

  useEffect(
    function turnOnLayerWhenUserDrawsArea() {
      if (!drawnFeature) {
        return;
      }
      if (enabled) {
        return;
      }

      toggle();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger when user adds or changes area
    [drawnFeature],
  );

  if (!featureFlags.vulnerablePeople) {
    return null;
  }

  const buttons = [];

  if (drawnFeature) {
    buttons.push({
      icon: faTrashAlt,
      name: "Delete Area",
      onClick: handleDeleteArea,
    });
  }

  if (!drawnFeature && features.length === 0) {
    buttons.push({
      icon: faDrawPolygon,
      name: "Draw Area",
      onClick: handleDrawRectangle,
    });
  }

  return (
    <MenuItemRow
      primaryText="Vulnerable People Polygon"
      checked={enabled}
      onChange={toggle}
      searchQuery={searchQuery}
      terms={["Vulnerable People", "polygon", "vulnerable"]}
      buttons={buttons}
    />
  );
}
