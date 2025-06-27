import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import { useDrawingMode } from "@/context/DrawingMode";
import useSharedStore from "@/hooks/useSharedStore";

export const TOOL_NAME = "Polygon controls";

export function CircleCreationButton() {
  const drawingModeCallbacks = useSharedStore(
    useShallow((state) => ({
      onAddFeatures: state.addFloodAreaFeatures,
      onUpdateFeatures: state.updateFloodAreaFeatures,
      onDeleteFeatures: state.deleteFloodAreaFeatures,
    })),
  );

  const [isDrawing, setIsDrawing] = useState(false);
  const { startDrawing } = useDrawingMode((state) => state.floodAreaFeatures, {
    onDrawingStart: () => {
      setIsDrawing(true);
    },
    onDrawingEnd: () => {
      setIsDrawing(false);
    },
    ...drawingModeCallbacks,
  });

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
      active={isDrawing}
    />
  );
}
