import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { MapMouseEvent } from 'maplibre-gl';
import Map, { Marker } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';

import 'maplibre-gl/dist/maplibre-gl.css';
import './mapbox-draw-maplibre.css';

import { bbox, booleanPointInPolygon, point } from '@turf/turf';
import { DEFAULT_VIEW_STATE, DEFAULT_MAP_STYLE, MAP_STYLES, MAP_VIEW_BOUNDS, type MapStyleKey } from './constants';
import MapControls from './MapControls';
import MapPanels from './MapPanels';
import AssetLayers from './AssetLayers';
import ExposureLayers from './ExposureLayers';
import UtilitiesLayers from './UtilitiesLayers';
import FocusAreaMask from './FocusAreaMask';
import FocusAreaOutline from './FocusAreaOutline';
import RadiusDialog from './RadiusDialog';
import useMapboxDraw from './hooks/useMapboxDraw';
import useFocusAreas from './hooks/useFocusAreas';
import { usePreloadAssetIcons } from './hooks/usePreloadAssetIcons';
import { useAssetTypeIcons } from '@/hooks/useAssetTypeIcons';
import { useActiveScenario } from '@/hooks/useActiveScenario';
import { useScenarioAssets } from '@/hooks/useScenarioAssets';
import { fetchAssetCategories } from '@/api/asset-categories';
import { useRoadRouteLazyQuery, type RoadRouteInputParams } from '@/api/utilities';
import type { Asset } from '@/api/assets-by-type';

const MapView = () => {
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
    const [mapReady, setMapReady] = useState(false);
    const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>(DEFAULT_MAP_STYLE);
    const [mapStylePanelOpen, setMapStylePanelOpen] = useState(false);
    const [assetInfoPanelOpen, setAssetInfoPanelOpen] = useState(false);
    const [activePanelView, setActivePanelView] = useState<string | null>('focus-area');
    const [selectedUtilityIds, setSelectedUtilityIds] = useState<Record<string, boolean>>({});
    const [selectedElement, setSelectedElement] = useState<Asset | null>(null);
    const [previousPanelView, setPreviousPanelView] = useState<string | null>('focus-area');
    const [roadRouteStart, setRoadRouteStart] = useState<{ lat: number; lng: number } | null>(null);
    const [roadRouteEnd, setRoadRouteEnd] = useState<{ lat: number; lng: number } | null>(null);
    const [roadRouteVehicle, setRoadRouteVehicle] = useState<RoadRouteInputParams['vehicle']>('Car');
    const [positionSelectionMode, setPositionSelectionMode] = useState<'start' | 'end' | null>(null);
    const [pendingCircleCenter, setPendingCircleCenter] = useState<[number, number] | null>(null);
    const [radiusDialogOpen, setRadiusDialogOpen] = useState(false);

    const drawRef = useMapboxDraw(mapRef, mapReady);
    const { data: activeScenario } = useActiveScenario();
    const scenarioId = activeScenario?.id;
    const iconMap = useAssetTypeIcons();

    const isInFocusAreaPanel = activePanelView === 'focus-area';
    const [selectedFocusAreaId, setSelectedFocusAreaId] = useState<string | null>(null);

    const { focusAreas, isDrawing, drawingMode, startDrawing, createCircleAtPoint } = useFocusAreas({
        scenarioId,
        mapRef,
        drawRef,
        mapReady,
        isEditable: isInFocusAreaPanel,
        selectedFocusAreaId,
        onFocusAreaSelect: setSelectedFocusAreaId,
    });
    const handleFocusAreaSelect = useCallback(
        (focusAreaId: string | null) => {
            setSelectedFocusAreaId(focusAreaId);

            if (!mapReady) {
                return;
            }
            const map = mapRef.current?.getMap();
            if (!map) {
                return;
            }

            const focusArea = focusAreas?.find((fa) => fa.id === focusAreaId);
            if (focusArea?.geometry) {
                const bounds = bbox({ type: 'Feature', geometry: focusArea.geometry, properties: {} });
                map.fitBounds(
                    [
                        [bounds[0], bounds[1]],
                        [bounds[2], bounds[3]],
                    ],
                    { padding: 50, duration: 1000 },
                );
            } else {
                map.flyTo({
                    center: [DEFAULT_VIEW_STATE.longitude, DEFAULT_VIEW_STATE.latitude],
                    zoom: DEFAULT_VIEW_STATE.zoom,
                    duration: 1000,
                });
            }
        },
        [focusAreas, mapReady],
    );

    // Auto-select map-wide focus area when focusAreas loads and nothing is selected
    useEffect(() => {
        if (focusAreas && !selectedFocusAreaId) {
            const mapWideFocusArea = focusAreas.find((fa) => fa.isSystem);
            if (mapWideFocusArea) {
                setSelectedFocusAreaId(mapWideFocusArea.id);
            }
        }
    }, [focusAreas, selectedFocusAreaId]);

    const mapStyle = useMemo(() => MAP_STYLES[mapStyleKey], [mapStyleKey]);

    const { data: assetCategories } = useQuery({
        queryKey: ['assetCategories'],
        queryFn: fetchAssetCategories,
        staleTime: 5 * 60 * 1000,
    });

    const [getRoadRoute, { data: roadRouteQueryData, loading: roadRouteLoading, error: roadRouteError }] = useRoadRouteLazyQuery();

    const isRoadRouteEnabled = selectedUtilityIds['road-route'] ?? false;

    useEffect(() => {
        if (roadRouteStart && roadRouteEnd && isRoadRouteEnabled) {
            getRoadRoute({
                variables: {
                    startLat: roadRouteStart.lat,
                    startLon: roadRouteStart.lng,
                    endLat: roadRouteEnd.lat,
                    endLon: roadRouteEnd.lng,
                    vehicle: roadRouteVehicle,
                },
            });
        }
    }, [roadRouteStart, roadRouteEnd, roadRouteVehicle, isRoadRouteEnabled, getRoadRoute]);

    const shouldFilterByFocusArea = activePanelView === 'assets' || activePanelView === 'exposure';
    const { assets } = useScenarioAssets({
        scenarioId,
        focusAreaId: shouldFilterByFocusArea ? selectedFocusAreaId : undefined,
        iconMap,
    });

    // Get IDs of all active focus areas (including system/map-wide)
    const activeFocusAreaIds = useMemo(() => {
        if (!focusAreas) {
            return [];
        }
        return focusAreas.filter((fa) => fa.isActive).map((fa) => fa.id);
    }, [focusAreas]);

    usePreloadAssetIcons(assets);

    const mergedUtilities = useMemo(() => {
        if (!isRoadRouteEnabled || !roadRouteStart || !roadRouteEnd) {
            return { type: 'FeatureCollection' as const, features: [] };
        }

        const routeGeojson = roadRouteQueryData?.roadRoute?.routeGeojson;
        if (!routeGeojson?.features) {
            return { type: 'FeatureCollection' as const, features: [] };
        }

        const roadRouteFeatures = routeGeojson.features.map((feature) => ({
            ...feature,
            id: 'road-route',
            properties: {
                ...feature.properties,
                id: 'road-route',
            },
        }));

        return {
            type: 'FeatureCollection' as const,
            features: roadRouteFeatures,
        };
    }, [roadRouteQueryData, isRoadRouteEnabled, roadRouteStart, roadRouteEnd]);

    const handleMove = useCallback((event: ViewStateChangeEvent) => {
        setViewState(event.viewState);
    }, []);

    const handleMapClick = useCallback(
        (event: { lngLat: { lng: number; lat: number } }) => {
            if (positionSelectionMode === 'start') {
                setRoadRouteStart({ lat: event.lngLat.lat, lng: event.lngLat.lng });
                setPositionSelectionMode(null);
            } else if (positionSelectionMode === 'end') {
                setRoadRouteEnd({ lat: event.lngLat.lat, lng: event.lngLat.lng });
                setPositionSelectionMode(null);
            }
        },
        [positionSelectionMode],
    );

    const handleStyleChange = useCallback((newStyle: MapStyleKey) => {
        setMapStyleKey(newStyle);
    }, []);

    const toggleMapStylePanel = useCallback(() => {
        setMapStylePanelOpen((prev) => {
            if (!prev) {
                setAssetInfoPanelOpen(false);
            }
            return !prev;
        });
    }, []);

    const toggleAssetInfoPanel = useCallback(() => {
        setAssetInfoPanelOpen((prev) => {
            if (!prev) {
                setMapStylePanelOpen(false);
            }
            return !prev;
        });
    }, []);

    const closePanels = useCallback(() => {
        setMapStylePanelOpen(false);
        setAssetInfoPanelOpen(false);
    }, []);

    const handleMapLoad = useCallback(() => {
        setMapReady(true);
    }, []);

    useEffect(() => {
        const map = mapRef.current?.getMap?.();
        const canvas = map?.getCanvas?.();
        if (!canvas) {
            return;
        }

        const previousCursor = canvas.style.cursor;
        canvas.style.cursor = positionSelectionMode || drawingMode === 'circle' ? 'crosshair' : '';

        return () => {
            canvas.style.cursor = previousCursor;
        };
    }, [positionSelectionMode, drawingMode]);

    // Show radius dialog on click when drawing circles
    useEffect(() => {
        if (!mapReady || drawingMode !== 'circle') {
            return;
        }

        const map = mapRef.current?.getMap();
        if (!map) {
            return;
        }

        const handleClick = (e: MapMouseEvent) => {
            setPendingCircleCenter([e.lngLat.lng, e.lngLat.lat]);
            setRadiusDialogOpen(true);
        };

        map.on('click', handleClick);

        return () => {
            map.off('click', handleClick);
        };
    }, [mapReady, drawingMode]);

    // Handle clicks outside inactive focus areas to deselect them
    useEffect(() => {
        if (!mapReady || !isInFocusAreaPanel || !selectedFocusAreaId) {
            return;
        }

        const selectedFocusArea = focusAreas?.find((fa) => fa.id === selectedFocusAreaId);
        // Only handle clicks for inactive, non-system focus areas (active ones are handled by MapboxDraw)
        if (!selectedFocusArea || selectedFocusArea.isActive || selectedFocusArea.isSystem) {
            return;
        }

        const map = mapRef.current?.getMap();
        if (!map) {
            return;
        }

        const handleClickOutside = (e: MapMouseEvent) => {
            const clickPoint = point([e.lngLat.lng, e.lngLat.lat]);
            const geometry = selectedFocusArea.geometry;

            if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
                const isInside = booleanPointInPolygon(clickPoint, geometry);
                if (!isInside) {
                    // Click was outside - revert to map-wide
                    const mapWideFocusArea = focusAreas?.find((fa) => fa.isSystem);
                    if (mapWideFocusArea) {
                        setSelectedFocusAreaId(mapWideFocusArea.id);
                    }
                }
            }
        };

        map.on('click', handleClickOutside);

        return () => {
            map.off('click', handleClickOutside);
        };
    }, [mapReady, isInFocusAreaPanel, selectedFocusAreaId, focusAreas]);

    const transformRequest = useCallback((url: string) => {
        let transformedUrl = url;
        const headers: Record<string, string> = {};

        if (transformedUrl.includes('api.os.uk')) {
            const urlParts = transformedUrl.split('api.os.uk');
            const routeParams = urlParts.at(-1) ?? '';

            if (routeParams.startsWith('/')) {
                transformedUrl = `${globalThis.location.origin}/transparent-proxy/os/${routeParams.substring(1)}`;
            } else {
                transformedUrl = `${globalThis.location.origin}/transparent-proxy/os/${routeParams}`;
            }

            const fontMatch = /fonts\/(.*?)\//.exec(routeParams);
            if (fontMatch) {
                const requestedFont = fontMatch[1];
                const encodedRequestedFont = encodeURIComponent(requestedFont);

                transformedUrl += `&fonts=${encodedRequestedFont}`;
                transformedUrl = transformedUrl.replace(`/${requestedFont}/`, '/');
            }

            transformedUrl = transformedUrl.replace(/\?key=[^&]+&/, '?');
        }

        return { url: transformedUrl, headers };
    }, []);

    const handleViewChange = useCallback(
        (viewId: string | null) => {
            if (viewId !== 'asset-details' && selectedElement) {
                setSelectedElement(null);
            }
            setActivePanelView(viewId);
        },
        [selectedElement],
    );

    const handleElementClick = useCallback(
        (elements: Asset[]) => {
            if (elements.length > 0) {
                if (activePanelView === 'asset-details') {
                    setSelectedElement(elements[0]);
                    return;
                }
                if (activePanelView === 'assets') {
                    // clear the mask and reset the zoom to the default view
                    handleFocusAreaSelect(null);
                }
                setPreviousPanelView(activePanelView);
                setSelectedElement(elements[0]);
                setActivePanelView('asset-details');
            }
        },
        [activePanelView, handleFocusAreaSelect],
    );

    const handleBackFromAssetDetails = useCallback(() => {
        setSelectedElement(null);
        setActivePanelView(previousPanelView || 'scenario');
    }, [previousPanelView]);

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                bgcolor: 'background.default',
                display: 'flex',
            }}
        >
            <MapPanels
                activeView={activePanelView}
                onViewChange={handleViewChange}
                selectedFocusAreaId={selectedFocusAreaId}
                selectedUtilityIds={selectedUtilityIds}
                onUtilityToggle={(utilityId, enabled) => {
                    setSelectedUtilityIds((prev) => ({
                        ...prev,
                        [utilityId]: enabled,
                    }));
                    if (utilityId === 'road-route' && !enabled) {
                        setRoadRouteStart(null);
                        setRoadRouteEnd(null);
                        setRoadRouteVehicle('Car');
                        setPositionSelectionMode(null);
                    }
                }}
                roadRouteStart={roadRouteStart}
                roadRouteEnd={roadRouteEnd}
                roadRouteVehicle={roadRouteVehicle}
                roadRouteLoading={roadRouteLoading}
                roadRouteError={roadRouteError}
                roadRouteData={
                    roadRouteQueryData?.roadRoute
                        ? {
                              routeGeojson: {
                                  features: roadRouteQueryData.roadRoute.routeGeojson.features.map((f) => ({
                                      properties: f.properties || {},
                                  })),
                              },
                          }
                        : undefined
                }
                onRoadRouteVehicleChange={setRoadRouteVehicle}
                onRequestPositionSelection={setPositionSelectionMode}
                selectedElement={selectedElement}
                onBackFromAssetDetails={handleBackFromAssetDetails}
                scenarioId={scenarioId}
                isDrawing={isDrawing}
                onStartDrawing={startDrawing}
                onFocusAreaSelect={handleFocusAreaSelect}
            />

            <Box
                sx={{
                    flex: 1,
                    position: 'relative',
                    ml: activePanelView ? '500px' : '80px',
                    transition: 'marginLeft 0.2s ease-in-out',
                }}
            >
                <Map
                    id="map-v2"
                    ref={mapRef}
                    {...viewState}
                    onMove={handleMove}
                    onClick={handleMapClick}
                    mapStyle={mapStyle}
                    maxBounds={MAP_VIEW_BOUNDS}
                    style={{ width: '100%', height: '100%', cursor: positionSelectionMode || drawingMode === 'circle' ? 'crosshair' : 'grab' }}
                    onLoad={handleMapLoad}
                    transformRequest={transformRequest}
                    styleDiffing
                >
                    {mapReady && (
                        <>
                            {!isInFocusAreaPanel && selectedFocusAreaId && (
                                <FocusAreaMask geometry={focusAreas?.find((fa) => fa.id === selectedFocusAreaId)?.geometry ?? null} />
                            )}
                            {isInFocusAreaPanel &&
                                selectedFocusAreaId &&
                                (() => {
                                    const selectedFocusArea = focusAreas?.find((fa) => fa.id === selectedFocusAreaId);
                                    // Show gray outline for inactive focus areas in the Focus Area panel
                                    if (selectedFocusArea && !selectedFocusArea.isActive && selectedFocusArea.geometry) {
                                        return <FocusAreaOutline geometry={selectedFocusArea.geometry} lineColor="#888888" />;
                                    }
                                    return null;
                                })()}
                            <AssetLayers
                                assets={assets}
                                selectedElements={selectedElement ? [selectedElement] : []}
                                onElementClick={handleElementClick}
                                mapReady={mapReady}
                                assetCategories={assetCategories}
                            />
                            <ExposureLayers
                                scenarioId={scenarioId}
                                selectedFocusAreaId={selectedFocusAreaId}
                                mapReady={mapReady}
                                isInFocusAreaPanel={isInFocusAreaPanel}
                                activeFocusAreaIds={activeFocusAreaIds}
                            />
                            <UtilitiesLayers utilities={mergedUtilities} selectedUtilityIds={selectedUtilityIds} mapReady={mapReady} />
                            {roadRouteStart && (
                                <Marker longitude={roadRouteStart.lng} latitude={roadRouteStart.lat} anchor="bottom">
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            backgroundColor: '#4CAF50',
                                            border: '2px solid white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        S
                                    </Box>
                                </Marker>
                            )}
                            {roadRouteEnd && (
                                <Marker longitude={roadRouteEnd.lng} latitude={roadRouteEnd.lat} anchor="bottom">
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            backgroundColor: '#F44336',
                                            border: '2px solid white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        E
                                    </Box>
                                </Marker>
                            )}
                        </>
                    )}
                </Map>

                <MapControls
                    mapRef={mapRef}
                    onClosePanels={closePanels}
                    mapStyleKey={mapStyleKey}
                    onMapStyleChange={handleStyleChange}
                    mapStylePanelOpen={mapStylePanelOpen}
                    onToggleMapStylePanel={toggleMapStylePanel}
                    assetInfoPanelOpen={assetInfoPanelOpen}
                    onToggleAssetInfoPanel={toggleAssetInfoPanel}
                    assets={assets}
                    assetCategories={assetCategories}
                    viewState={viewState}
                />
            </Box>

            <RadiusDialog
                open={radiusDialogOpen}
                onClose={() => {
                    setRadiusDialogOpen(false);
                    setPendingCircleCenter(null);
                }}
                onConfirm={(radiusKm) => {
                    if (pendingCircleCenter) {
                        createCircleAtPoint(pendingCircleCenter, radiusKm);
                    }
                    setRadiusDialogOpen(false);
                    setPendingCircleCenter(null);
                }}
            />
        </Box>
    );
};

export default MapView;
