import Box from "@mui/material/Box";
import { useCallback } from "react";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import { useDrawingMode } from "@/context/DrawingMode";
import useSharedStore from "@/hooks/useSharedStore";
import { useShallow } from "zustand/react/shallow";

export const TOOL_NAME = "Polygon controls";

export function CircleCreationButton() {
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

  const { startDrawing, features } = useDrawingMode(
    (state) => state.dynamicProximityFeatures,
    drawingModeCallbacks,
  );

  const drawCircle = useCallback(() => {
    startDrawing({
      drawingMode: "drag_circle",
    });
  }, [startDrawing]);

  return (
    <ToolbarButton
      title="Draw circle"
      onClick={drawCircle}
      svgSrc="icons/draw_circle.svg"
    />
  );
}
