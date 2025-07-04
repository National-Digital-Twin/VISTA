import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { usePolygonToolbarStore } from "./useStore";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import { useDrawingMode } from "@/context/DrawingMode";
import useSharedStore from "@/hooks/useSharedStore";

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

  const { setActiveDrawingMode, activeDrawingMode } = usePolygonToolbarStore();
  const isDrawing = activeDrawingMode === "draw_polygon";
  const isDisabled = activeDrawingMode !== null && !isDrawing;

  const { startDrawing } = useDrawingMode(
    (state) =>
      state.floodAreaFeatures.filter(
        (feature) =>
          feature.id && state.selectedFloodAreaFeatureIds[feature.id],
      ),
    {
      onDrawingStart: () => {
        setActiveDrawingMode("draw_polygon");
      },
      onDrawingEnd: () => {
        setActiveDrawingMode(null);
      },
      ...drawingModeCallbacks,
    },
  );

  const drawPolygon = useCallback(() => {
    if (isDrawing) {
      return;
    }
    startDrawing({ drawingMode: "draw_polygon" });
  }, [startDrawing, isDrawing]);

  return (
    <ToolbarButton
      title="Draw freehand"
      onClick={drawPolygon}
      svgSrc="icons/draw_shape.svg"
      active={isDrawing}
      disabled={isDisabled}
    />
  );
}
