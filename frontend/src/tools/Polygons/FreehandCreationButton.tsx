import { useCallback } from "react";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import { useDrawingMode } from "@/context/DrawingMode";
import useSharedStore from "@/hooks/useSharedStore";
import { useShallow } from "zustand/react/shallow";

export const TOOL_NAME = "Polygon controls";

export function FreehandCreationButton() {
  const drawingModeCallbacks = useSharedStore(
    useShallow((state) => ({
      features: state.floodAreaFeatures,
      selectedFeatureIds: state.selectedFloodAreaFeatureIds,
      selected: state.selectedFloodAreas,
      setSelected: state.setSelectedFloodAreas,
      toggleFeature: state.toggleFloodAreaFeature,
      setFeatures: state.setFloodAreaFeatures,
      onAddFeatures: state.addFloodAreaFeatures,
      onUpdateFeatures: state.updateFloodAreaFeatures,
      onDeleteFeatures: state.deleteFloodAreaFeatures,
    })),
  );

  const { startDrawing } = useDrawingMode(
    (state) =>
      state.floodAreaFeatures.filter(
        (feature) => state.selectedFloodAreaFeatureIds[feature.id],
      ),
    drawingModeCallbacks,
  );

  const drawCircle = useCallback(() => {
    startDrawing({ drawingMode: "draw_polygon" });
  }, [startDrawing]);

  return (
    <ToolbarButton
      title="Draw freehand"
      onClick={drawCircle}
      svgSrc="icons/draw_shape.svg"
    />
  );
}
