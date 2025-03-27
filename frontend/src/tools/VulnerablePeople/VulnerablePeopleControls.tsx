import { useShallow } from "zustand/react/shallow";
import { faTrashAlt, faDrawPolygon } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useRef } from "react";
import useStore from "./useStore";
import featureFlags from "@/config/feature-flags";
import useLayer from "@/hooks/useLayer";
import { useDrawingMode } from "@/context/DrawingMode";
import useSharedStore from "@/hooks/useSharedStore";
import MenuItemRow from "@/components/MenuItemRow";

export default function VulnerablePeopleControls({
  searchQuery = "",
  updateSelectedCount,
}: Readonly<{
  searchQuery?: string;
  updateSelectedCount?: (isSelected: boolean) => void;
}>) {
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

  // Track whether the component has mounted to prevent double increment
  const hasMounted = useRef(false);

  // Notify parent about the initial state when the component mounts
  useEffect(() => {
    if (updateSelectedCount && !hasMounted.current) {
      updateSelectedCount(enabled); // Notify parent about the initial state
      hasMounted.current = true; // Mark as mounted
    }
  }, [enabled, updateSelectedCount]);

  // Automatically enable the layer when a feature is drawn
  useEffect(() => {
    if (!drawnFeature) {
      return;
    }
    if (enabled) {
      return;
    }

    toggle();
  }, [drawnFeature, enabled, toggle]);

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

  const handleToggle = () => {
    toggle(); // Toggle the layer state
    if (updateSelectedCount) {
      updateSelectedCount(!enabled); // Notify parent about the new state
    }
  };

  return (
    <MenuItemRow
      primaryText="Vulnerable People Polygon"
      checked={enabled}
      onChange={handleToggle}
      searchQuery={searchQuery}
      terms={["Vulnerable People", "polygon", "vulnerable"]}
      buttons={buttons}
    />
  );
}
