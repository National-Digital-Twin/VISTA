import { useCallback } from 'react';
import { usePolygonToolbarStore } from './useStore';
import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';
import { useDrawnPolygonDrawingContext } from '@/tools/DrawnPolygons/DrawnPolygonProvider';

export function FreehandCreationButton() {
    const { startPolygonDrawing } = useDrawnPolygonDrawingContext();
    const { activeDrawingMode } = usePolygonToolbarStore();

    const isDrawing = activeDrawingMode === 'draw_polygon';
    const isDisabled = activeDrawingMode !== null && !isDrawing;

    const drawPolygon = useCallback(() => {
        if (isDrawing) {
            return;
        }
        startPolygonDrawing();
    }, [startPolygonDrawing, isDrawing]);

    return (
        <ToolbarButton title="Draw freehand" onClick={drawPolygon} svgSrc="icons/draw_shape.svg" active={isDrawing} disabled={isDisabled} hasNoMarginBottom />
    );
}
