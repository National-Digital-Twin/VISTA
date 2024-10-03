import { useShallow } from "zustand/react/shallow";
import { useCallback } from "react";
import useSharedStore from "@/hooks/useSharedStore";
import { useDrawingMode } from "@/context/DrawingMode";

export default function useDynamicProximity() {
  const drawingModeCallbacks = useSharedStore(
    useShallow((state) => ({
      onAddFeatures: state.addDynamicProximityFeatures,
      onUpdateFeatures: state.updateDynamicProximityFeatures,
      onDeleteFeatures: state.deleteDynamicProximityFeatures,
    })),
  );

  const { startDrawing, features } = useDrawingMode(
    (state) => state.dynamicProximityFeatures,
    drawingModeCallbacks,
  );

  const startDrawingWithRange = useCallback(
    (radiusKm: number) => {
      startDrawing({
        drawingMode: "draw_circle",
        options: { initialRadiusInKm: radiusKm },
      });
    },
    [startDrawing],
  );

  return { startDrawingWithRange, features };
}
