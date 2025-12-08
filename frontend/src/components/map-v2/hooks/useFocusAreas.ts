import { useEffect, useRef, useState, type RefObject } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Feature, Geometry } from 'geojson';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import type { MapRef } from 'react-map-gl/maplibre';
import { fetchFocusAreas, createFocusArea, updateFocusArea, type FocusArea } from '@/api/focus-areas';

type UseFocusAreasOptions = {
    scenarioId: string | undefined;
    mapRef: RefObject<MapRef | null>;
    drawRef: RefObject<MapboxDraw | null>;
    mapReady: boolean;
};

const useFocusAreas = ({ scenarioId, mapRef, drawRef, mapReady }: UseFocusAreasOptions) => {
    const queryClient = useQueryClient();
    const loadedFocusAreaIdsRef = useRef<Set<string>>(new Set());
    const focusAreasRef = useRef<FocusArea[] | undefined>(undefined);
    const [isDrawing, setIsDrawing] = useState(false);

    const { data: focusAreas } = useQuery({
        queryKey: ['focusAreas', scenarioId],
        queryFn: () => fetchFocusAreas(scenarioId!),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    // Keep focusAreasRef in sync with query data for use in event handlers
    useEffect(() => {
        focusAreasRef.current = focusAreas;
    }, [focusAreas]);

    // Clear loaded IDs when scenario changes
    useEffect(() => {
        loadedFocusAreaIdsRef.current.clear();
    }, [scenarioId]);

    const createFocusAreaMutation = useMutation({
        mutationFn: (geometry: Geometry) => createFocusArea(scenarioId!, { geometry, isActive: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['focusAreas', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
        },
    });

    const updateFocusAreaMutation = useMutation({
        mutationFn: ({ focusAreaId, geometry }: { focusAreaId: string; geometry: Geometry }) => updateFocusArea(scenarioId!, focusAreaId, { geometry }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['focusAreas', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
        },
    });

    // Store mutation functions in refs for stable references in event handlers
    const createMutateRef = useRef(createFocusAreaMutation.mutate);
    const updateMutateRef = useRef(updateFocusAreaMutation.mutate);
    useEffect(() => {
        createMutateRef.current = createFocusAreaMutation.mutate;
        updateMutateRef.current = updateFocusAreaMutation.mutate;
    }, [createFocusAreaMutation.mutate, updateFocusAreaMutation.mutate]);

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
            setIsDrawing(false);

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
                setIsDrawing(false);
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
                            geometry: feature.geometry,
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
        setIsDrawing(true);
    };

    return {
        isDrawing,
        startDrawing,
    };
};

export default useFocusAreas;
