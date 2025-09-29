import useSharedStore, { State } from '@/hooks/useSharedStore';
import DrawnPolygonProvider from '@/tools/DrawnPolygons/DrawnPolygonProvider';
import MapboxDraw, { DrawCreateEvent, DrawCustomMode, DrawDeleteEvent, DrawModeChangeEvent, DrawUpdateEvent } from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { circle as turf_circle, distance as turf_distance } from '@turf/turf';
import type { Feature } from 'geojson';
import RectangleMode from 'mapbox-gl-draw-rectangle-mode';
import { MapMouseEvent, Marker } from 'maplibre-gl';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useControl, useMap } from 'react-map-gl/maplibre';
import { useShallow } from 'zustand/react/shallow';
import './maplibre-gl-draw.css';
import './maplibre-gl-map.css';
import RadiusDialog from './RadiusDialog';
import { drawStyles, radiusLabelStyles } from './theme';
import { CircleMode, DirectMode, DragCircleMode, SimpleSelectMode } from '@/vendor/mapbox-gl-draw-circle';
import DynamicProximityProvider from '@/tools/DynamicProximity/DynamicProximityProvider';
interface DrawingModeContextValue {
    readonly draw: MapboxDraw;
    readonly isMapLoaded: boolean;
    readonly showRadiusDialog: (onConfirm: (radius: number) => void) => void;
}
const DrawingModeContext = createContext<DrawingModeContextValue | null>(null);

const modes = {
    ...MapboxDraw.modes,
    draw_rectangle: RectangleMode,
    draw_circle: CircleMode,
    drag_circle: DragCircleMode,
    direct_select: DirectMode,
    simple_select: SimpleSelectMode,
} as Record<string, DrawCustomMode>;

export function DrawingModeContextProvider({ children }: { readonly children: React.ReactNode }) {
    const { paralogMap: map } = useMap();
    if (!map) {
        throw new Error('DrawingModeContextProvider must be used within a ParalogMap component');
    }

    const [isMapLoaded, setIsMapLoaded] = useState(map.loaded());
    const [isRadiusDialogOpen, setIsRadiusDialogOpen] = useState(false);
    const [radiusDialogData, setRadiusDialogData] = useState<{
        onConfirm: (radius: number) => void;
    } | null>(null);

    const draw = useControl(
        () =>
            new (MapboxDraw as any)({
                userProperties: true,
                displayControlsDefault: false,
                modes,
                styles: drawStyles,
            }),
    );

    useEffect(() => {
        const handleLoadChange = () => setIsMapLoaded(true);
        map.on('load', handleLoadChange);
        return () => {
            map.off('load', handleLoadChange);
            setIsMapLoaded(false);
        };
    }, [map]);

    const showRadiusDialog = useCallback((onConfirm: (radius: number) => void) => {
        setRadiusDialogData({ onConfirm });
        setIsRadiusDialogOpen(true);
    }, []);

    const handleRadiusConfirm = useCallback(
        (radius: number) => {
            if (radiusDialogData) {
                radiusDialogData.onConfirm(radius);
            }
            setIsRadiusDialogOpen(false);
            setRadiusDialogData(null);
        },
        [radiusDialogData],
    );

    const handleRadiusDialogClose = useCallback(() => {
        setIsRadiusDialogOpen(false);
        setRadiusDialogData(null);
    }, []);

    const contextValue = useMemo(() => ({ draw, isMapLoaded, showRadiusDialog }), [draw, isMapLoaded, showRadiusDialog]);

    return (
        <DrawingModeContext.Provider value={contextValue}>
            <DrawnPolygonProvider>
                <DynamicProximityProvider>{children}</DynamicProximityProvider>
            </DrawnPolygonProvider>
            <RadiusDialog open={isRadiusDialogOpen} onClose={handleRadiusDialogClose} onConfirm={handleRadiusConfirm} />
        </DrawingModeContext.Provider>
    );
}
interface DrawShapeCallbacks {
    onDrawingStart?: () => void;
    onDrawingEnd?: () => void;

    onAddFeatures: (features: Feature[]) => void;
    onUpdateFeatures: (features: Feature[]) => void;
    onDeleteFeatures: (features: NonNullable<Feature['id']>[]) => void;
}

type UseDrawShapeOptions =
    | {
          drawingMode: 'draw_polygon' | 'draw_rectangle' | 'drag_circle';
          options?: never;
      }
    | { drawingMode: 'draw_circle'; options?: { initialRadiusInKm?: number } };

export const useDrawingMode = <T extends Feature>(
    selector: (state: Omit<State, keyof { [K in keyof State as State[K] extends Function ? K : never]: any }>) => T[],
    { onDrawingStart, onDrawingEnd, onAddFeatures, onUpdateFeatures, onDeleteFeatures }: DrawShapeCallbacks,
) => {
    const context = useContext(DrawingModeContext);

    let map = null;
    try {
        const mapContext = useMap();
        map = mapContext?.paralogMap || null;
    } catch {
        map = null;
    }

    const { draw, isMapLoaded, showRadiusDialog } = context || { draw: null, isMapLoaded: false, showRadiusDialog: () => {} };

    const features = useSharedStore(useShallow(selector));

    const radiusMarkerRef = useRef<{
        line: any;
        label: Marker | null;
    }>({ line: null, label: null });

    const processDrawEvent = useCallback(
        (event: DrawUpdateEvent | DrawDeleteEvent, relevantFeatures: Feature[]) => {
            if (event.type === 'draw.update') {
                onUpdateFeatures(relevantFeatures);
            } else if (event.type === 'draw.delete') {
                const featureIds = relevantFeatures.map(({ id }) => id as string);
                onDeleteFeatures(featureIds);
            }
        },
        [onUpdateFeatures, onDeleteFeatures],
    );

    const handleDrawEvent = useCallback(
        (event: DrawUpdateEvent | DrawDeleteEvent) => {
            const relevantFeatures = event.features.filter((feature) => features.some((existing) => existing.id === feature.id));
            if (relevantFeatures.length) {
                processDrawEvent(event, relevantFeatures);
            }
        },
        [features, processDrawEvent],
    );

    const setCursor = useCallback(
        (cursor: string) => {
            if (map) {
                map.getCanvasContainer().style.cursor = cursor;
            }
        },
        [map],
    );

    const updateRadiusLabel = useCallback(
        (centerCoords: [number, number], edgeCoords: [number, number]) => {
            if (!map) {
                return;
            }

            const radiusKm = turf_distance(centerCoords, edgeCoords, {
                units: 'kilometers',
            });

            const latRadians = (centerCoords[1] * Math.PI) / 180;
            const kmPerDegreeLng = 111.32 * Math.cos(latRadians);
            const rightEdge: [number, number] = [centerCoords[0] + radiusKm / kmPerDegreeLng, centerCoords[1]];

            const radiusLine = {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [centerCoords, rightEdge],
                },
                properties: {},
            };

            const perpOffset = 0.001;
            const perpLine = {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [centerCoords[0], centerCoords[1] - perpOffset],
                        [centerCoords[0], centerCoords[1] + perpOffset],
                    ],
                },
                properties: {},
            };

            const mapLibre = (map as any).getMap();

            if (!mapLibre.getSource('radius-line-source')) {
                mapLibre.addSource('radius-line-source', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [radiusLine, perpLine] },
                });

                mapLibre.addLayer({
                    id: 'radius-line-layer',
                    source: 'radius-line-source',
                    type: 'line',
                    paint: {
                        'line-color': '#000000',
                        'line-width': 1,
                    },
                });
            } else {
                mapLibre.getSource('radius-line-source').setData({
                    type: 'FeatureCollection',
                    features: [radiusLine, perpLine],
                });
            }

            const radiusText = `${radiusKm.toFixed(1)}km`;
            const midpoint: [number, number] = [(centerCoords[0] + rightEdge[0]) / 2, (centerCoords[1] + rightEdge[1]) / 2];

            if (radiusMarkerRef.current.label) {
                radiusMarkerRef.current.label.setLngLat(midpoint);
                const element = radiusMarkerRef.current.label.getElement();
                element.textContent = radiusText;
            } else {
                const labelElement = document.createElement('div');
                Object.assign(labelElement.style, radiusLabelStyles);
                labelElement.textContent = radiusText;

                const newLabel = new Marker({
                    element: labelElement,
                    anchor: 'center',
                    offset: [0, -10],
                })
                    .setLngLat(midpoint)
                    .addTo(mapLibre);

                radiusMarkerRef.current.label = newLabel;
            }
        },
        [map],
    );

    const removeRadiusLabel = useCallback(() => {
        if (!map) {
            return;
        }

        const mapLibre = (map as any).getMap();

        if (mapLibre.getLayer('radius-line-layer')) {
            mapLibre.removeLayer('radius-line-layer');
        }
        if (mapLibre.getSource('radius-line-source')) {
            mapLibre.removeSource('radius-line-source');
        }

        if (radiusMarkerRef.current.label) {
            radiusMarkerRef.current.label.remove();
        }

        radiusMarkerRef.current = { line: null, label: null };
    }, [map]);

    const startDrawing = useCallback(
        ({ drawingMode, options }: UseDrawShapeOptions) => {
            if (!map || !draw) {
                return;
            }

            let isDragging = false;
            let dragCenter: [number, number] | null = null;

            const handleMouseMove = (e: MapMouseEvent) => {
                if (!isDragging || drawingMode !== 'drag_circle' || !dragCenter) {
                    return;
                }

                const edge: [number, number] = [e.lngLat.lng, e.lngLat.lat];
                updateRadiusLabel(dragCenter, edge);
            };

            const handleMouseDown = (e: MapMouseEvent) => {
                if (drawingMode === 'drag_circle') {
                    isDragging = true;
                    dragCenter = [e.lngLat.lng, e.lngLat.lat];
                    map.on('mousemove', handleMouseMove);
                }
            };

            const handleMouseUp = () => {
                isDragging = false;
                dragCenter = null;
                map.off('mousemove', handleMouseMove);
                removeRadiusLabel();
            };

            const removeMouseListeners = () => {
                map.off('mousemove', handleMouseMove);
                map.off('mousedown', handleMouseDown);
                map.off('mouseup', handleMouseUp);
            };

            const handleDrawCreate = (event: DrawCreateEvent) => {
                onAddFeatures(event.features);
                removeMouseListeners();
                setCursor('grab');
                onDrawingEnd?.();
                map.off('draw.create', handleDrawCreate);
                map.off('draw.modechange', handleModeChange);
                map.off('click', handleDragCircleClick);
            };

            const handleModeChange = (event: DrawModeChangeEvent) => {
                if (event.mode === 'simple_select') {
                    if (drawingMode === 'drag_circle') {
                        map.getMap().dragPan.enable();
                        setCursor('grab');
                    }
                    onDrawingEnd?.();
                }

                removeRadiusLabel();
                removeMouseListeners();
                map.off('draw.create', handleDrawCreate);
                map.off('draw.modechange', handleModeChange);
                map.off('click', handleDragCircleClick);
            };

            onDrawingStart?.();

            if (draw && typeof draw.changeMode === 'function') {
                draw.changeMode<string>(drawingMode, drawingMode === 'draw_circle' ? options : undefined);
            }

            if (drawingMode === 'drag_circle') {
                map.on('mousedown', handleMouseDown);
                map.on('mouseup', handleMouseUp);
            }

            const handleDragCircleClick = (e: MapMouseEvent) => {
                showRadiusDialog((radius: number) => {
                    const center = [e.lngLat.lng, e.lngLat.lat];
                    const circleFeature = turf_circle(center, radius, {
                        units: 'kilometers',
                    });

                    const feature = {
                        id: crypto.randomUUID(),
                        type: 'Feature' as const,
                        geometry: circleFeature.geometry,
                        properties: {
                            isCircle: true,
                            center: center,
                            radiusInKm: radius,
                            type: 'circle',
                        },
                    };

                    handleDrawCreate({
                        type: 'draw.create',
                        features: [feature],
                        target: e.target as any,
                    });

                    map.getMap().dragPan.enable();
                    setCursor('grab');

                    if (draw && typeof draw.changeMode === 'function') {
                        draw.changeMode('simple_select', { featureIds: [feature.id] });
                    }
                });
            };

            if (drawingMode === 'drag_circle') {
                map.on('click', handleDragCircleClick);
                setCursor('crosshair');
            }

            map.on('draw.delete', handleDrawEvent);
            map.on('draw.create', handleDrawCreate);
            map.on('draw.modechange', handleModeChange);
        },
        [
            draw,
            map,
            onDrawingStart,
            onDrawingEnd,
            onAddFeatures,
            handleDrawEvent,
            updateRadiusLabel,
            removeRadiusLabel,
            showRadiusDialog,
            setCursor,
        ],
    );

    useEffect(() => {
        if (!map) {
            return;
        }
        map.on('draw.update', handleDrawEvent);
        map.on('draw.delete', handleDrawEvent);
        return () => {
            if (map && typeof map.off === 'function') {
                try {
                    map.off('draw.update', handleDrawEvent);
                    map.off('draw.delete', handleDrawEvent);
                } catch (error) {
                    console.warn('Failed to cleanup map event listeners:', error);
                }
            }
        };
    }, [map, handleDrawEvent]);

    useEffect(() => {
        if (!isMapLoaded || !draw) {
            return;
        }
        if (draw && typeof draw.add === 'function') {
            try {
                features.forEach(draw.add);
            } catch (error) {
                console.warn('Failed to add draw features:', error);
            }
        }
        return () => {
            if (draw && typeof draw.delete === 'function') {
                try {
                    draw.delete(features.map(({ id }) => id as string));
                } catch (error) {
                    console.warn('Failed to cleanup draw features:', error);
                }
            }
        };
    }, [draw, features, isMapLoaded]);

    if (!context || !map) {
        return {
            features: [] as T[],
            startDrawing: () => {
                console.warn('Drawing mode not available - map context not found');
            },
        };
    }

    return { startDrawing, features };
};
