import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import { circle } from '@turf/turf';
import type { Feature, Geometry } from 'geojson';
import type { MapMouseEvent } from 'maplibre-gl';
import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import useMapboxDraw, { type ActiveFeatureType } from '../hooks/useMapboxDraw';
import RadiusDialog from '../RadiusDialog';

type FeatureType = ActiveFeatureType;

type DrawingConfig<T = unknown> = {
    featureType: FeatureType;
    entities: T[];
    selectedEntityId?: string | null;
    getEntityId: (entity: T) => string;
    getEntityGeometry: (entity: T) => Geometry | undefined;
    shouldRenderEntity: (entity: T) => boolean;
    onCreate: (geometry: Geometry) => void;
    onUpdate: (id: string, geometry: Geometry) => void;
    onSelect?: (id: string | null) => void;
};

type DrawingContextValue = {
    mapRef: RefObject<MapRef | null>;
    drawRef: RefObject<MapboxDraw | null>;
    mapReady: boolean;
    drawReady: boolean;
    scenarioId: string | undefined;

    setDrawingConfig: <T>(config: DrawingConfig<T> | null) => void;
    drawingSyncComplete: boolean;

    drawingMode: 'circle' | 'polygon' | 'line' | null;
    startDrawing: (mode: 'circle' | 'polygon' | 'line') => void;
};

const DrawingContext = createContext<DrawingContextValue | null>(null);

type DrawingProviderProps = {
    children: ReactNode;
    mapRef: RefObject<MapRef | null>;
    mapReady: boolean;
    scenarioId: string | undefined;
};

export const DrawingProvider = ({ children, mapRef, mapReady, scenarioId }: DrawingProviderProps) => {
    const [drawingMode, setDrawingMode] = useState<'circle' | 'polygon' | 'line' | null>(null);
    const [drawReady, setDrawReady] = useState(false);
    const [pendingCircle, setPendingCircle] = useState<{ center: [number, number] } | null>(null);

    const [drawingConfig, setDrawingConfig] = useState<DrawingConfig | null>(null);
    const [drawingSyncComplete, setDrawingSyncComplete] = useState(true);

    const loadedEntityIdsRef = useRef<Set<string>>(new Set());

    const handleDrawReady = useCallback((ready: boolean) => {
        setDrawReady(ready);
    }, []);

    const activeFeatureType = drawingConfig?.featureType ?? null;
    const drawRef = useMapboxDraw({ mapRef, isReady: mapReady, activeFeatureType, onDrawReady: handleDrawReady });

    const prevEntitiesRef = useRef<unknown[] | null>(null);

    const updateDrawingConfig = useCallback(
        <T,>(config: DrawingConfig<T> | null) => {
            if (drawRef.current && drawingMode !== null) {
                try {
                    drawRef.current.changeMode('simple_select', { featureIds: [] });
                } catch {
                    void 0;
                }
            }
            setDrawingMode(null);
            setPendingCircle(null);
            if (config?.entities) {
                const entitiesChanged = config.entities !== prevEntitiesRef.current;
                if (entitiesChanged) {
                    setDrawingSyncComplete(false);
                }
                prevEntitiesRef.current = config.entities;
            }
            setDrawingConfig(config as DrawingConfig | null);
        },
        [drawRef, drawingMode],
    );

    useEffect(() => {
        if (!drawReady || !drawRef.current) {
            return;
        }

        const draw = drawRef.current;

        if (!drawingConfig) {
            loadedEntityIdsRef.current.forEach((id) => {
                try {
                    draw.delete(id);
                } catch {
                    void 0;
                }
            });
            loadedEntityIdsRef.current.clear();
            setDrawingSyncComplete(true);
            return;
        }

        const { entities, getEntityId, getEntityGeometry, shouldRenderEntity, featureType } = drawingConfig;

        if (!entities) {
            setDrawingSyncComplete(true);
            return;
        }

        const desiredIds = new Set<string>();
        let changedAny = false;

        for (const entity of entities) {
            if (!shouldRenderEntity(entity)) {
                continue;
            }

            const geometry = getEntityGeometry(entity);
            if (!geometry) {
                continue;
            }

            const id = getEntityId(entity);
            desiredIds.add(id);

            if (!loadedEntityIdsRef.current.has(id)) {
                const feature: Feature = {
                    type: 'Feature',
                    id,
                    properties: {
                        featureType,
                    },
                    geometry,
                };
                draw.add(feature);
                loadedEntityIdsRef.current.add(id);
                changedAny = true;
            }
        }

        loadedEntityIdsRef.current.forEach((id) => {
            if (!desiredIds.has(id)) {
                try {
                    draw.delete(id);
                } catch {
                    void 0;
                }
                loadedEntityIdsRef.current.delete(id);
                changedAny = true;
            }
        });

        if (changedAny) {
            const frameId = requestAnimationFrame(() => {
                setDrawingSyncComplete(true);
            });

            return () => {
                cancelAnimationFrame(frameId);
            };
        } else {
            setDrawingSyncComplete(true);
        }
    }, [drawReady, drawRef, drawingConfig, mapRef]);

    useEffect(() => {
        if (!drawReady || !drawRef.current || !drawingConfig?.selectedEntityId || drawingMode) {
            return;
        }

        const draw = drawRef.current;
        const selectedId = drawingConfig.selectedEntityId;

        if (loadedEntityIdsRef.current.has(selectedId)) {
            const currentSelected = draw.getSelectedIds();
            if (currentSelected.length !== 1 || currentSelected[0] !== selectedId) {
                draw.changeMode('simple_select', { featureIds: [selectedId] });
            }
        }
    }, [drawReady, drawRef, drawingConfig?.selectedEntityId, drawingMode]);

    useEffect(() => {
        if (!drawReady || !mapRef.current || !drawRef.current || !drawingConfig) {
            return;
        }

        const map = mapRef.current.getMap();
        const draw = drawRef.current;
        const { onCreate, onUpdate, onSelect, getEntityId, getEntityGeometry, entities } = drawingConfig;

        const handleDrawCreate = (event: { features: Feature[] }) => {
            if (!scenarioId || event.features.length === 0) {
                return;
            }

            const feature = event.features[0];
            if (feature.geometry) {
                const tempId = feature.id ? String(feature.id) : `temp-${Date.now()}`;
                loadedEntityIdsRef.current.add(tempId);
                onCreate(feature.geometry as Geometry);
            }
        };

        const handleDrawUpdate = (event: { features: Feature[] }) => {
            if (!scenarioId || event.features.length === 0 || !entities) {
                return;
            }

            for (const feature of event.features) {
                const entityId = feature.id;
                if (entityId && feature.geometry && loadedEntityIdsRef.current.has(String(entityId))) {
                    const existingEntity = entities.find((e) => getEntityId(e) === String(entityId));
                    if (!existingEntity) {
                        continue;
                    }

                    const existingGeometry = getEntityGeometry(existingEntity);
                    const hasChanged = JSON.stringify(feature.geometry) !== JSON.stringify(existingGeometry);
                    if (hasChanged) {
                        onUpdate(String(entityId), feature.geometry as Geometry);
                    }
                }
            }
        };

        const handleSelectionChange = (event: { features: Feature[] }) => {
            if (!onSelect) {
                return;
            }

            if (event.features.length > 0) {
                const selectedFeature = event.features[0];
                const entityId = selectedFeature.id;
                if (entityId && loadedEntityIdsRef.current.has(String(entityId))) {
                    onSelect(String(entityId));
                }
            } else {
                const currentMode = draw.getMode();
                const isInDrawingMode = currentMode !== 'simple_select' && currentMode !== 'direct_select';
                if (!isInDrawingMode) {
                    onSelect(null);
                }
            }
        };

        map.on('draw.create', handleDrawCreate);
        map.on('draw.update', handleDrawUpdate);
        map.on('draw.selectionchange', handleSelectionChange);

        return () => {
            map.off('draw.create', handleDrawCreate);
            map.off('draw.update', handleDrawUpdate);
            map.off('draw.selectionchange', handleSelectionChange);
        };
    }, [drawReady, mapRef, drawRef, scenarioId, drawingConfig]);

    const startDrawing = useCallback(
        (mode: 'circle' | 'polygon' | 'line') => {
            if (!drawRef.current) {
                return;
            }
            if (mode === 'circle') {
                drawRef.current.changeMode('drag_circle');
            } else if (mode === 'line') {
                drawRef.current.changeMode('draw_line_string');
            } else {
                drawRef.current.changeMode('draw_polygon');
            }
            setDrawingMode(mode);
        },
        [drawRef],
    );

    const createCircleAtPoint = useCallback(
        (center: [number, number], radiusKm: number) => {
            const circleFeature = circle(center, radiusKm, { units: 'kilometers' });
            if (drawRef.current) {
                drawRef.current.changeMode('simple_select');
            }
            const map = mapRef.current?.getMap();
            if (map) {
                map.fire('draw.create', { features: [circleFeature] });
            }
            setDrawingMode(null);
        },
        [drawRef, mapRef],
    );

    useEffect(() => {
        if (!mapReady || drawingMode !== 'circle' || !drawingConfig) {
            return;
        }

        const map = mapRef.current?.getMap();
        if (!map) {
            return;
        }

        const handleClick = (e: MapMouseEvent) => {
            setPendingCircle({ center: [e.lngLat.lng, e.lngLat.lat] });
        };

        map.on('click', handleClick);

        return () => {
            map.off('click', handleClick);
        };
    }, [mapReady, drawingMode, drawingConfig, mapRef]);

    useEffect(() => {
        const canvas = mapRef.current?.getMap()?.getCanvas();
        if (!canvas) {
            return;
        }

        if (drawingMode === 'circle') {
            const previousCursor = canvas.style.cursor;
            canvas.style.cursor = 'crosshair';

            return () => {
                canvas.style.cursor = previousCursor;
            };
        }
    }, [drawingMode, mapRef]);

    useEffect(() => {
        if (!mapReady || !drawingMode) {
            return;
        }

        const map = mapRef.current?.getMap();
        if (!map) {
            return;
        }

        const handleModeChange = (e: { mode: string }) => {
            if (e.mode === 'simple_select') {
                setDrawingMode(null);
            }
        };

        map.on('draw.modechange', handleModeChange);

        return () => {
            map.off('draw.modechange', handleModeChange);
        };
    }, [mapReady, drawingMode, mapRef]);

    useEffect(() => {
        if (!drawingMode) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (drawRef.current) {
                    drawRef.current.changeMode('simple_select');
                }
                setDrawingMode(null);
                setPendingCircle(null);
            }
        };

        globalThis.addEventListener('keydown', handleKeyDown);

        return () => {
            globalThis.removeEventListener('keydown', handleKeyDown);
        };
    }, [drawingMode, drawRef]);

    const handleRadiusConfirm = useCallback(
        (radiusKm: number) => {
            if (pendingCircle) {
                createCircleAtPoint(pendingCircle.center, radiusKm);
            }
            setPendingCircle(null);
        },
        [pendingCircle, createCircleAtPoint],
    );

    const handleDialogClose = useCallback(() => {
        setPendingCircle(null);
        setDrawingMode(null);
    }, []);

    const contextValue = useMemo(
        (): DrawingContextValue => ({
            mapRef,
            drawRef,
            mapReady,
            drawReady,
            scenarioId,
            setDrawingConfig: updateDrawingConfig,
            drawingSyncComplete,
            drawingMode,
            startDrawing,
        }),
        [mapRef, drawRef, mapReady, drawReady, scenarioId, updateDrawingConfig, drawingSyncComplete, drawingMode, startDrawing],
    );

    return (
        <DrawingContext.Provider value={contextValue}>
            {children}
            <RadiusDialog open={!!pendingCircle} onClose={handleDialogClose} onConfirm={handleRadiusConfirm} />
        </DrawingContext.Provider>
    );
};

export const useDrawingContext = (): DrawingContextValue => {
    const context = useContext(DrawingContext);
    if (!context) {
        throw new Error('useDrawingContext must be used within a DrawingProvider');
    }
    return context;
};

export type { DrawingConfig, FeatureType };

export default DrawingContext;
