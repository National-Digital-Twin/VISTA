import { useCallback } from 'react';
import { usePolygonToolbarStore } from './useStore';
import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';
import { useDrawnPolygonDrawingContext } from '@/tools/DrawnPolygons/DrawnPolygonProvider';

export function CircleCreationButton() {
    const { startCircleDrawing } = useDrawnPolygonDrawingContext();
    const { activeDrawingMode } = usePolygonToolbarStore();

    const isDrawing = activeDrawingMode === 'drag_circle';
    const isDisabled = activeDrawingMode !== null && !isDrawing;

    const drawCircle = useCallback(() => {
        if (isDrawing) {
            return;
        }
        startCircleDrawing();
    }, [startCircleDrawing, isDrawing]);

    return <ToolbarButton title="Draw circle" onClick={drawCircle} svgSrc="icons/draw_circle.svg" active={isDrawing} disabled={isDisabled} />;
}
