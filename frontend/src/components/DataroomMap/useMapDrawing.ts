// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Geometry, Feature } from 'geojson';
import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import useMapboxDraw from '@/components/map-v2/hooks/useMapboxDraw';

type UseMapDrawingOptions = {
    mapRef: RefObject<MapRef | null>;
    mapReady: boolean;
    onDrawComplete?: (geometry: Geometry) => void;
};

const useMapDrawing = ({ mapRef, mapReady, onDrawComplete }: UseMapDrawingOptions) => {
    const [drawReady, setDrawReady] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    const handleDrawReady = useCallback((ready: boolean) => {
        setDrawReady(ready);
    }, []);

    const drawRef = useMapboxDraw({
        mapRef,
        isReady: mapReady,
        activeFeatureType: 'focus_area',
        onDrawReady: handleDrawReady,
    });

    useEffect(() => {
        if (!drawReady || !mapRef.current) {
            return;
        }

        const map = mapRef.current.getMap();
        if (!map) {
            return;
        }

        const handleDrawCreate = (event: { features: Feature[] }) => {
            if (event.features.length === 0) {
                return;
            }
            const feature = event.features[0];
            if (feature.geometry) {
                onDrawComplete?.(feature.geometry as Geometry);
            }
            setIsDrawing(false);
        };

        const handleDrawUpdate = (event: { features: Feature[] }) => {
            if (event.features.length === 0) {
                return;
            }
            const feature = event.features[0];
            if (feature.geometry) {
                onDrawComplete?.(feature.geometry as Geometry);
            }
        };

        const handleModeChange = (event: { mode: string }) => {
            if (event.mode === 'simple_select') {
                setIsDrawing(false);
            }
        };

        map.on('draw.create', handleDrawCreate);
        map.on('draw.update', handleDrawUpdate);
        map.on('draw.modechange', handleModeChange);

        return () => {
            map.off('draw.create', handleDrawCreate);
            map.off('draw.update', handleDrawUpdate);
            map.off('draw.modechange', handleModeChange);
        };
    }, [drawReady, mapRef, onDrawComplete]);

    useEffect(() => {
        if (!isDrawing) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (drawRef.current) {
                    drawRef.current.changeMode('simple_select');
                }
                setIsDrawing(false);
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);
        return () => globalThis.removeEventListener('keydown', handleKeyDown);
    }, [isDrawing, drawRef]);

    const startDrawing = useCallback(() => {
        if (!drawRef.current) {
            return;
        }
        drawRef.current.deleteAll();
        drawRef.current.changeMode('draw_polygon');
        setIsDrawing(true);
    }, [drawRef]);

    const clearDrawing = useCallback(() => {
        if (!drawRef.current) {
            return;
        }
        drawRef.current.deleteAll();
        drawRef.current.changeMode('simple_select');
        setIsDrawing(false);
    }, [drawRef]);

    return { drawRef, drawReady, isDrawing, startDrawing, clearDrawing };
};

export default useMapDrawing;
