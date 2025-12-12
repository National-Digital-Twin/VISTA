import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Feature } from 'geojson';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { MapRef } from 'react-map-gl/maplibre';
import { circle } from '@turf/turf';
import useFocusAreaMutations from './useFocusAreaMutations';
import { fetchFocusAreas, type FocusArea } from '@/api/focus-areas';

type UseFocusAreasOptions = {
    scenarioId: string | undefined;
    mapRef: RefObject<MapRef | null>;
    drawRef: RefObject<MapboxDraw | null>;
    mapReady: boolean;
};

const useFocusAreas = ({ scenarioId, mapRef, drawRef, mapReady }: UseFocusAreasOptions) => {
    const loadedFocusAreaIdsRef = useRef<Set<string>>(new Set());
    const focusAreasRef = useRef<FocusArea[] | undefined>(undefined);
    const [drawingMode, setDrawingMode] = useState<'circle' | 'polygon' | null>(null);

    const { data: focusAreas } = useQuery({
        queryKey: ['focusAreas', scenarioId],
        queryFn: () => fetchFocusAreas(scenarioId!),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const { createFocusArea: createFocusAreaMutate, updateFocusArea: updateFocusAreaMutate } = useFocusAreaMutations({ scenarioId });

    // Keep focusAreasRef in sync with query data for use in event handlers
    useEffect(() => {
        focusAreasRef.current = focusAreas;
    }, [focusAreas]);

    // Clear loaded IDs when scenario changes
    useEffect(() => {
        loadedFocusAreaIdsRef.current.clear();
    }, [scenarioId]);

    // Store mutation functions in refs for stable references in event handlers
    const createMutateRef = useRef(createFocusAreaMutate);
    const updateMutateRef = useRef(updateFocusAreaMutate);
    useEffect(() => {
        createMutateRef.current = createFocusAreaMutate;
        updateMutateRef.current = updateFocusAreaMutate;
    }, [createFocusAreaMutate, updateFocusAreaMutate]);

    // Sync active focus areas to MapboxDraw
    useEffect(() => {
        if (!mapReady || !drawRef.current || !focusAreas) {
            return;
        }

        const draw = drawRef.current;
        const activeFocusAreaIds = new Set<string>();

        for (const focusArea of focusAreas) {
            if (!focusArea.isActive) {
                continue;
            }

            activeFocusAreaIds.add(focusArea.id);

            if (!loadedFocusAreaIdsRef.current.has(focusArea.id)) {
                const feature: Feature = {
                    type: 'Feature',
                    id: focusArea.id,
                    properties: {
                        name: focusArea.name,
                        isActive: focusArea.isActive,
                    },
                    geometry: focusArea.geometry,
                };
                draw.add(feature);
                loadedFocusAreaIdsRef.current.add(focusArea.id);
            }
        }

        const idsToRemove: string[] = [];
        loadedFocusAreaIdsRef.current.forEach((id) => {
            if (!activeFocusAreaIds.has(id)) {
                idsToRemove.push(id);
            }
        });

        for (const id of idsToRemove) {
            try {
                draw.delete(id);
            } catch {
                // Feature may already be deleted
            }
            loadedFocusAreaIdsRef.current.delete(id);
        }
    }, [mapReady, drawRef, focusAreas]);

    // Handle draw events
    useEffect(() => {
        if (!mapReady || !mapRef.current || !drawRef.current) {
            return;
        }

        const map = mapRef.current.getMap();

        const handleDrawCreate = (event: { features: Feature[] }) => {
            setDrawingMode(null);

            if (!scenarioId || event.features.length === 0) {
                return;
            }

            const feature = event.features[0];
            if (feature.geometry) {
                const tempId = feature.id ? String(feature.id) : `temp-${Date.now()}`;
                loadedFocusAreaIdsRef.current.add(tempId);
                createMutateRef.current(feature.geometry);
            }
        };

        const handleModeChange = () => {
            const currentMode = drawRef.current?.getMode();
            if (currentMode === 'simple_select') {
                setDrawingMode(null);
            }
        };

        const handleDrawUpdate = (event: { features: Feature[] }) => {
            const currentFocusAreas = focusAreasRef.current;
            if (!scenarioId || event.features.length === 0 || !currentFocusAreas) {
                return;
            }

            for (const feature of event.features) {
                const focusAreaId = feature.id;
                if (focusAreaId && feature.geometry && loadedFocusAreaIdsRef.current.has(String(focusAreaId))) {
                    const existingFocusArea = currentFocusAreas.find((fa) => fa.id === String(focusAreaId));
                    if (!existingFocusArea) {
                        continue;
                    }

                    const hasChanged = JSON.stringify(feature.geometry) !== JSON.stringify(existingFocusArea.geometry);
                    if (hasChanged) {
                        updateMutateRef.current({
                            focusAreaId: String(focusAreaId),
                            data: { geometry: feature.geometry },
                        });
                    }
                }
            }
        };

        map.on('draw.create', handleDrawCreate);
        map.on('draw.modechange', handleModeChange);
        map.on('draw.update', handleDrawUpdate);

        return () => {
            map.off('draw.create', handleDrawCreate);
            map.off('draw.modechange', handleModeChange);
            map.off('draw.update', handleDrawUpdate);
        };
    }, [mapReady, mapRef, drawRef, scenarioId]);

    const startDrawing = (mode: 'circle' | 'polygon') => {
        if (!drawRef.current) {
            return;
        }
        if (mode === 'circle') {
            drawRef.current.changeMode('drag_circle');
        } else {
            drawRef.current.changeMode('draw_polygon');
        }
        setDrawingMode(mode);
    };

    const createCircleAtPoint = useCallback(
        (center: [number, number], radiusKm: number) => {
            const circleFeature = circle(center, radiusKm, { units: 'kilometers' });

            if (drawRef.current) {
                drawRef.current.changeMode('simple_select');
            }

            createMutateRef.current(circleFeature.geometry);
            setDrawingMode(null);
        },
        [drawRef],
    );

    return {
        focusAreas,
        isDrawing: drawingMode !== null,
        drawingMode,
        startDrawing,
        createCircleAtPoint,
    };
};

export default useFocusAreas;
