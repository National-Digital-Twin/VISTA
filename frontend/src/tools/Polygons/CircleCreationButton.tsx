import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { usePolygonToolbarStore } from "./useStore";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import { useDrawingMode } from "@/context/DrawingMode";
import useSharedStore from "@/hooks/useSharedStore";

export function CircleCreationButton() {
  const drawingModeCallbacks = useSharedStore(
    useShallow((state) => ({
      onAddFeatures: state.addFloodAreaFeatures,
      onUpdateFeatures: state.updateFloodAreaFeatures,
      onDeleteFeatures: state.deleteFloodAreaFeatures,
    })),
  );

  const { setActiveDrawingMode, activeDrawingMode } = usePolygonToolbarStore();
  const isDrawing = activeDrawingMode === "drag_circle";
  const isDisabled = activeDrawingMode !== null && !isDrawing;

  const { startDrawing } = useDrawingMode(
    (state) =>
      state.floodAreaFeatures.filter(
        (feature) =>
          feature.id && state.selectedFloodAreaFeatureIds[feature.id],
      ),
    {
      onDrawingStart: () => {
        setActiveDrawingMode("drag_circle");
      },
      onDrawingEnd: () => {
        setActiveDrawingMode(null);
      },
      ...drawingModeCallbacks,
    },
  );

  const drawCircle = useCallback(() => {
    if (isDrawing) {
      return;
    }
    startDrawing({
      drawingMode: "drag_circle",
    });
  }, [startDrawing, isDrawing]);

  return (
    <ToolbarButton
      title="Draw circle"
      onClick={drawCircle}
      svgSrc="icons/draw_circle.svg"
      active={isDrawing}
      disabled={isDisabled}
    />
  );
}
