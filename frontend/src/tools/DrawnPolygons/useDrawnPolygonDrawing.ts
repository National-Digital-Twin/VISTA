import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDrawingMode } from '@/context/DrawingMode';
import { usePolygonToolbarStore } from '@/tools/Polygons/useStore';
import useSharedStore from '@/hooks/useSharedStore';

export function useDrawnPolygonDrawing() {
    const { setActiveDrawingMode } = usePolygonToolbarStore();

    const drawingModeCallbacks = useSharedStore(
        useShallow((state) => ({
            onAddFeatures: state.addDrawnAreaFeatures,
            onUpdateFeatures: state.updateDrawnAreaFeatures,
            onDeleteFeatures: state.deleteDrawnAreaFeatures,
        })),
    );

    const { startDrawing, features } = useDrawingMode(
        (state) => state.drawnAreaFeatures.filter((feature) => feature.id && state.selectedDrawnAreaFeatureIds[feature.id]),
        {
            onDrawingEnd: () => {
                setActiveDrawingMode(null);
            },
            ...drawingModeCallbacks,
        },
    );

    const startCircleDrawing = useCallback(() => {
        setActiveDrawingMode('drag_circle');
        startDrawing({ drawingMode: 'drag_circle' });
    }, [startDrawing, setActiveDrawingMode]);

    const startPolygonDrawing = useCallback(() => {
        setActiveDrawingMode('draw_polygon');
        startDrawing({ drawingMode: 'draw_polygon' });
    }, [startDrawing, setActiveDrawingMode]);

    return {
        features,
        startCircleDrawing,
        startPolygonDrawing,
    };
}
