import { useShallow } from "zustand/react/shallow";
import { faTrashAlt, faDrawPolygon } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect } from "react";
import useStore from "./useStore";
import featureFlags from "@/config/feature-flags";
import useLayer from "@/hooks/useLayer";
import { useDrawingMode } from "@/context/DrawingMode";
import useSharedStore from "@/hooks/useSharedStore";

export default function VulnerablePeopleControls() {
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

  return (
    <>
      {features.length ? (
        <button className="menu-item" role="menuitem" onClick={toggle}>
          {enabled ? "Hide" : "Show"} Vulnerable People
        </button>
      ) : null}
      {drawnFeature ? (
        <button
          className="menu-item text-red-500"
          role="menuitem"
          onClick={handleDeleteArea}
        >
          <FontAwesomeIcon icon={faTrashAlt} className="mr-2" /> Delete Area
        </button>
      ) : !features.length ? (
        <button
          className="menu-item"
          role="menuitem"
          onClick={handleDrawRectangle}
        >
          <FontAwesomeIcon icon={faDrawPolygon} className="mr-2" /> Draw Area
        </button>
      ) : null}
    </>
  );
}
