import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Box } from '@mui/material';
import Map, { Layer } from 'react-map-gl/maplibre';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { Geometry } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/components/map-v2/mapbox-draw-maplibre.css';

import DataroomMapControls from './DataroomMapControls';
import useMapDrawing from './useMapDrawing';
import LoadingOverlay from '@/components/LoadingOverlay';
import { DEFAULT_VIEW_STATE, DEFAULT_MAP_STYLE, MAP_STYLES, MAP_VIEW_BOUNDS, BELOW_ASSET_LAYER_ID } from '@/components/map-v2/constants';
import { transformMapRequest } from '@/utils/mapRequest';

type DataroomMapProps = {
    children?: ReactNode;
    height?: string | number;
    drawingEnabled?: boolean;
    onDrawComplete?: (geometry: Geometry) => void;
    onClearDrawnArea?: () => void;
    visibilityToggle?: {
        visible: boolean;
        onToggle: () => void;
        tooltip: string;
    };
    onDrawingChange?: (isDrawing: boolean) => void;
    isLoading?: boolean;
};

const DataroomMap = ({
    children,
    height = '100%',
    drawingEnabled = false,
    onDrawComplete,
    onClearDrawnArea,
    visibilityToggle,
    onDrawingChange,
    isLoading = false,
}: Readonly<DataroomMapProps>) => {
    const mapRef = useRef<MapRef | null>(null);
    const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
    const [mapReady, setMapReady] = useState(false);

    const { isDrawing, startDrawing, clearDrawing } = useMapDrawing({
        mapRef,
        mapReady,
        onDrawComplete,
    });

    useEffect(() => {
        onDrawingChange?.(isDrawing);
    }, [isDrawing, onDrawingChange]);

    const handleMove = useCallback((event: ViewStateChangeEvent) => {
        setViewState(event.viewState);
    }, []);

    const handleLoad = useCallback(() => {
        setMapReady(true);
    }, []);

    const handleDraw = useCallback(() => {
        clearDrawing();
        onClearDrawnArea?.();
        startDrawing();
    }, [clearDrawing, onClearDrawnArea, startDrawing]);

    return (
        <Box sx={{ position: 'relative', width: '100%', height }}>
            <Map
                ref={mapRef}
                {...viewState}
                onMove={handleMove}
                onLoad={handleLoad}
                mapStyle={MAP_STYLES[DEFAULT_MAP_STYLE]}
                maxBounds={MAP_VIEW_BOUNDS}
                transformRequest={transformMapRequest}
            >
                <Layer id={BELOW_ASSET_LAYER_ID} type="background" paint={{ 'background-opacity': 0 }} />
                {mapReady && children}
            </Map>

            <DataroomMapControls drawing={drawingEnabled ? { onDraw: handleDraw } : undefined} visibilityToggle={visibilityToggle} />
            <LoadingOverlay isLoading={isLoading} />
        </Box>
    );
};

export default DataroomMap;
