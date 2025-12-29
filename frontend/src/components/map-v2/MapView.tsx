import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
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
import ConnectedAssetsLayer from './ConnectedAssetsLayer';
import useMapboxDraw from './hooks/useMapboxDraw';
import useFocusAreas from './hooks/useFocusAreas';
import { usePreloadAssetIcons } from './hooks/usePreloadAssetIcons';
import { useAssetTypeIcons } from '@/hooks/useAssetTypeIcons';
import { useActiveScenario } from '@/hooks/useActiveScenario';
import { useScenarioAssets } from '@/hooks/useScenarioAssets';
import { fetchAssetCategories } from '@/api/asset-categories';
import { fetchAssetDetails } from '@/api/asset-details';
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
    const [connectedAssets, setConnectedAssets] = useState<{
        dependents: Array<{ id: string; geom: string; type: { name: string } }>;
        providers: Array<{ id: string; geom: string; type: { name: string } }>;
    }>({ dependents: [], providers: [] });
    const [roadRouteStart, setRoadRouteStart] = useState<{ lat: number; lng: number } | null>(null);
    const [roadRouteEnd, setRoadRouteEnd] = useState<{ lat: number; lng: number } | null>(null);
    const [roadRouteVehicle, setRoadRouteVehicle] = useState<RoadRouteInputParams['vehicle']>('Car');
    const [positionSelectionMode, setPositionSelectionMode] = useState<'start' | 'end' | null>(null);
    const [pendingCircleCenter, setPendingCircleCenter] = useState<[number, number] | null>(null);
    const [radiusDialogOpen, setRadiusDialogOpen] = useState(false);
    const [isSpritesGenerating, setIsSpritesGenerating] = useState(false);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [showCpsIcons, setShowCpsIcons] = useState(false);

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

    useEffect(() => {
        if (!focusAreas) {
            if (selectedFocusAreaId) {
                setSelectedFocusAreaId(null);
            }
            return;
        }

        const selectionValid = selectedFocusAreaId && focusAreas.some((fa) => fa.id === selectedFocusAreaId);
        if (!selectionValid) {
            const mapWideFocusArea = focusAreas.find((fa) => fa.isSystem);
            setSelectedFocusAreaId(mapWideFocusArea?.id ?? null);
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
    const { assets, isFetching: isAssetsFetching } = useScenarioAssets({
        scenarioId,
        focusAreaId: shouldFilterByFocusArea ? selectedFocusAreaId : undefined,
        iconMap,
    });

    const selectedAssetDetails = useQuery({
        enabled: !!selectedElement?.id,
        queryKey: ['asset-details', selectedElement?.id || ''],
        queryFn: () => fetchAssetDetails(selectedElement!.id),
    });

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

    useEffect(() => {
        if (!mapReady || !isInFocusAreaPanel || !selectedFocusAreaId) {
            return;
        }

        const selectedFocusArea = focusAreas?.find((fa) => fa.id === selectedFocusAreaId);
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
            if (viewId === 'assets' && selectedElement) {
                setActivePanelView('asset-details');
            } else if (viewId !== 'asset-details' && viewId !== 'assets') {
                setSelectedElement(null);
                setActivePanelView(viewId);
            } else {
                setActivePanelView(viewId);
            }
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
        setConnectedAssets({ dependents: [], providers: [] });
        setActivePanelView(previousPanelView || 'focus-area');
    }, [previousPanelView]);

    const handleCloseAssetDetails = useCallback(() => {
        setConnectedAssets({ dependents: [], providers: [] });
        setActivePanelView(null);
    }, []);

    const handleConnectedAssetsVisibilityChange = useCallback(
        (
            visible: boolean,
            dependents: Array<{ id: string; geom: string; type: { name: string } }>,
            providers: Array<{ id: string; geom: string; type: { name: string } }>,
        ) => {
            if (visible) {
                setConnectedAssets({ dependents, providers });
            } else {
                setConnectedAssets({ dependents: [], providers: [] });
            }
        },
        [],
    );

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
                onCloseFromAssetDetails={handleCloseAssetDetails}
                scenarioId={scenarioId}
                isDrawing={isDrawing}
                onStartDrawing={startDrawing}
                onFocusAreaSelect={handleFocusAreaSelect}
                onConnectedAssetsVisibilityChange={handleConnectedAssetsVisibilityChange}
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
                                onGeneratingChange={setIsSpritesGenerating}
                                showCpsIcons={showCpsIcons}
                            />
                            {selectedElement && selectedAssetDetails.data && (
                                <ConnectedAssetsLayer
                                    selectedAsset={{
                                        id: selectedElement.id,
                                        lat: selectedElement.lat,
                                        lng: selectedElement.lng,
                                        geom: selectedAssetDetails.data.geom,
                                    }}
                                    dependents={connectedAssets.dependents}
                                    providers={connectedAssets.providers}
                                    mapReady={mapReady}
                                />
                            )}
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

                {showCoordinates && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            px: 2,
                            py: 0.5,
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            zIndex: 5,
                        }}
                    >
                        LAT, LNG {viewState.latitude.toFixed(11)}, {viewState.longitude.toFixed(11)}
                    </Box>
                )}

                {(isAssetsFetching || isSpritesGenerating) && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            zIndex: 10,
                        }}
                    >
                        <CircularProgress size={48} />
                    </Box>
                )}

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
                    showCoordinates={showCoordinates}
                    onShowCoordinatesChange={setShowCoordinates}
                    showCpsIcons={showCpsIcons}
                    onShowCpsIconsChange={setShowCpsIcons}
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
