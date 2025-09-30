import React, { createContext, useContext, useMemo } from 'react';
import { useDrawnPolygonDrawing } from './useDrawnPolygonDrawing';

interface DrawnPolygonDrawingContextValue {
    startCircleDrawing: () => void;
    startPolygonDrawing: () => void;
}

const DrawnPolygonDrawingContext = createContext<DrawnPolygonDrawingContextValue | null>(null);

export function useDrawnPolygonDrawingContext() {
    const context = useContext(DrawnPolygonDrawingContext);
    if (!context) {
        throw new Error('useDrawnPolygonDrawingContext must be used within DrawnPolygonProvider');
    }
    return context;
}

export default function DrawnPolygonProvider({ children }: { readonly children: React.ReactNode }) {
    const { startCircleDrawing, startPolygonDrawing } = useDrawnPolygonDrawing();

    const contextValue = useMemo(() => ({ startCircleDrawing, startPolygonDrawing }), [startCircleDrawing, startPolygonDrawing]);

    return <DrawnPolygonDrawingContext.Provider value={contextValue}>{children}</DrawnPolygonDrawingContext.Provider>;
}
