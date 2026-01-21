import { useCallback, useMemo, useRef, useState, useEffect, type ComponentProps } from 'react';
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
import AssetLayers, { ASSET_SYMBOL_LAYER_ID } from './AssetLayers';
import ExposureLayers from './ExposureLayers';
import UtilitiesLayers from './UtilitiesLayers';
import FocusAreaMask from './FocusAreaMask';
import FocusAreaOutline from './FocusAreaOutline';
import InactiveFocusAreas from './InactiveFocusAreas';
import ActiveFocusAreas from './ActiveFocusAreas';
import ConnectedAssetsLayer from './ConnectedAssetsLayer';
import MapLoadingOverlay from './MapLoadingOverlay';
import { DrawingProvider, useDrawingContext } from './context/DrawingContext';
import { usePreloadAssetIcons } from './hooks/usePreloadAssetIcons';
import { useAssetTypeIcons } from '@/hooks/useAssetTypeIcons';
import { useActiveScenario } from '@/hooks/useActiveScenario';
import { useScenarioAssets } from '@/hooks/useScenarioAssets';
import { useMultipleFocusAreaAssets } from '@/hooks/useMultipleFocusAreaAssets';
import { fetchAssetCategories } from '@/api/asset-categories';
import { fetchAssetDetails } from '@/api/asset-details';
import { fetchFocusAreas } from '@/api/focus-areas';
import { fetchExposureLayers } from '@/api/exposure-layers';
import { useRoadRouteLazyQuery, type RoadRouteInputParams } from '@/api/utilities';
import type { Asset } from '@/api/assets-by-type';

const ASSET_LAYER_IDS = [ASSET_SYMBOL_LAYER_ID, `${ASSET_SYMBOL_LAYER_ID}-selected`, 'map-v2-asset-line-layer'] as const;

type DrawingAwareAssetLayersProps = Omit<ComponentProps<typeof AssetLayers>, 'interactionDisabled'>;

const DrawingAwareAssetLayers = (props: DrawingAwareAssetLayersProps) => {
    const { drawingMode } = useDrawingContext();
    return <AssetLayers {...props} interactionDisabled={drawingMode !== null} />;
};

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
    const [isSpritesGenerating, setIsSpritesGenerating] = useState(false);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [showCpsIcons, setShowCpsIcons] = useState(false);

    const isInFocusAreaPanel = activePanelView === 'focus-area';
    const isInExposurePanel = activePanelView === 'exposure';
    const isInAssetsPanel = activePanelView === 'assets';
    const shouldFilterByFocusArea = activePanelView === 'assets' || activePanelView === 'exposure';
    const shouldShowAllActiveFocusAreas = shouldFilterByFocusArea;

    const { data: activeScenario } = useActiveScenario();
    const scenarioId = activeScenario?.id;
    const iconMap = useAssetTypeIcons();

    const [selectedFocusAreaId, setSelectedFocusAreaId] = useState<string | null>(null);

    const {
        data: focusAreas,
        isFetching: isFocusAreasFetching,
        isLoading: isFocusAreasLoading,
        isError: isFocusAreasError,
    } = useQuery({
        queryKey: ['focusAreas', scenarioId],
        queryFn: () => fetchFocusAreas(scenarioId ?? ''),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const exposureLayersFocusAreaId = useMemo(() => {
        if (shouldShowAllActiveFocusAreas) {
            return null;
        }
        return selectedFocusAreaId;
    }, [shouldShowAllActiveFocusAreas, selectedFocusAreaId]);

    const {
        data: exposureLayersData,
        isFetching: isExposureLayersFetching,
        isLoading: isExposureLayersLoading,
        isError: isExposureLayersError,
    } = useQuery({
        queryKey: ['exposureLayers', scenarioId, exposureLayersFocusAreaId],
        queryFn: () => fetchExposureLayers(scenarioId ?? '', exposureLayersFocusAreaId),
        enabled: !!scenarioId && (shouldShowAllActiveFocusAreas || !!selectedFocusAreaId) && (isInExposurePanel || isInAssetsPanel),
        staleTime: 0,
        refetchOnMount: true,
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

    const activeFocusAreaIds = useMemo(() => {
        if (!shouldShowAllActiveFocusAreas || !focusAreas) {
            return [];
        }
        return focusAreas.filter((fa) => fa.isActive && fa.geometry !== null).map((fa) => fa.id);
    }, [shouldShowAllActiveFocusAreas, focusAreas]);

    const focusAreaIdsForAssets = useMemo(() => {
        if (!isInAssetsPanel || !focusAreas) {
            return activeFocusAreaIds;
        }
        return focusAreas.filter((fa) => fa.isActive && fa.geometry !== null).map((fa) => fa.id);
    }, [isInAssetsPanel, focusAreas, activeFocusAreaIds]);

    const mapWideFocusArea = useMemo(() => {
        return focusAreas?.find((fa) => fa.isSystem);
    }, [focusAreas]);

    const isMapWideActive = mapWideFocusArea?.isActive ?? true;
    const mapWideVisible = isMapWideActive;

    const multipleFocusAreaAssets = useMultipleFocusAreaAssets({
        scenarioId,
        focusAreaIds: focusAreaIdsForAssets,
        iconMap,
    });

    const mapWideAssets = useScenarioAssets({
        scenarioId,
        focusAreaId: shouldShowAllActiveFocusAreas && isMapWideActive && mapWideFocusArea ? mapWideFocusArea.id : undefined,
        iconMap,
    });

    const singleFocusAreaAssets = useScenarioAssets({
        scenarioId,
        focusAreaId: shouldFilterByFocusArea && !shouldShowAllActiveFocusAreas ? selectedFocusAreaId : undefined,
        iconMap,
    });

    const allActiveAssets = useMemo(() => {
        if (!shouldShowAllActiveFocusAreas) {
            return singleFocusAreaAssets.assets;
        }

        const combinedAssets: Asset[] = [];
        const seenAssetIds = new Set<string>();

        for (const asset of multipleFocusAreaAssets.assets) {
            if (!seenAssetIds.has(asset.id)) {
                seenAssetIds.add(asset.id);
                combinedAssets.push(asset);
            }
        }

        if (isMapWideActive) {
            for (const asset of mapWideAssets.assets) {
                if (!seenAssetIds.has(asset.id)) {
                    seenAssetIds.add(asset.id);
                    combinedAssets.push(asset);
                }
            }
        }

        return combinedAssets;
    }, [shouldShowAllActiveFocusAreas, multipleFocusAreaAssets.assets, mapWideAssets.assets, isMapWideActive, singleFocusAreaAssets.assets]);

    const assets = allActiveAssets;
    const isAssetsFetching = shouldShowAllActiveFocusAreas ? multipleFocusAreaAssets.isFetching || mapWideAssets.isFetching : singleFocusAreaAssets.isFetching;

    const selectedAssetDetails = useQuery({
        enabled: !!selectedElement?.id,
        queryKey: ['asset-details', selectedElement?.id || ''],
        queryFn: () => fetchAssetDetails(selectedElement!.id),
    });

    usePreloadAssetIcons(assets);

    const mergedUtilities = useMemo(() => {
        if (!isRoadRouteEnabled || !roadRouteStart || !roadRouteEnd || !mapWideVisible) {
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
    }, [roadRouteQueryData, isRoadRouteEnabled, roadRouteStart, roadRouteEnd, mapWideVisible]);

    const handleMove = useCallback((event: ViewStateChangeEvent) => {
        setViewState(event.viewState);
    }, []);

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
        canvas.style.cursor = positionSelectionMode ? 'crosshair' : '';

        return () => {
            canvas.style.cursor = previousCursor;
        };
    }, [positionSelectionMode]);

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
            if (viewId !== 'inspector') {
                setSelectedElement(null);
            }
            if (viewId && viewId !== activePanelView) {
                setPreviousPanelView(activePanelView);
            }
            setActivePanelView(viewId);
        },
        [activePanelView],
    );

    const handleBackFromInspector = useCallback(() => {
        setSelectedElement(null);
        setConnectedAssets({ dependents: [], providers: [] });
        if (previousPanelView && previousPanelView !== 'inspector') {
            setActivePanelView(previousPanelView);
        }
    }, [previousPanelView]);

    const handleElementClick = useCallback(
        (elements: Asset[]) => {
            if (elements.length > 0) {
                if (activePanelView === 'inspector') {
                    setPreviousPanelView('inspector');
                    setSelectedElement(elements[0]);
                } else {
                    setPreviousPanelView(activePanelView);
                    setSelectedElement(elements[0]);
                    setActivePanelView('inspector');
                }
            }
        },
        [activePanelView],
    );

    const handleMapClick = useCallback(
        (event: MapMouseEvent) => {
            if (!mapReady || !event.point) {
                return;
            }

            if (positionSelectionMode === 'start') {
                setRoadRouteStart({ lat: event.lngLat.lat, lng: event.lngLat.lng });
                setPositionSelectionMode(null);
                return;
            }

            if (positionSelectionMode === 'end') {
                setRoadRouteEnd({ lat: event.lngLat.lat, lng: event.lngLat.lng });
                setPositionSelectionMode(null);
                return;
            }

            const map = mapRef.current?.getMap();
            if (!map) {
                return;
            }

            const existingLayerIds = ASSET_LAYER_IDS.filter((layerId) => {
                try {
                    return map.getLayer(layerId) !== undefined;
                } catch {
                    return false;
                }
            });

            if (existingLayerIds.length > 0) {
                try {
                    const clickedFeatures = map.queryRenderedFeatures(event.point, {
                        layers: existingLayerIds,
                    });

                    if (clickedFeatures.length > 0) {
                        return;
                    }
                } catch {
                    // eslint-disable-next-line no-empty
                }
            }

            if (activePanelView === 'inspector') {
                setSelectedElement(null);
                setConnectedAssets({ dependents: [], providers: [] });
                setActivePanelView(previousPanelView || 'focus-area');
            }
        },
        [positionSelectionMode, activePanelView, previousPanelView, mapReady],
    );

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
            <DrawingProvider mapRef={mapRef} mapReady={mapReady} scenarioId={scenarioId}>
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
                    onBackFromInspector={handleBackFromInspector}
                    scenarioId={scenarioId}
                    onFocusAreaSelect={handleFocusAreaSelect}
                    onConnectedAssetsVisibilityChange={handleConnectedAssetsVisibilityChange}
                    focusAreas={focusAreas}
                    isFocusAreasLoading={isFocusAreasLoading}
                    isFocusAreasError={isFocusAreasError}
                    exposureLayersData={exposureLayersData}
                    isExposureLayersLoading={isExposureLayersLoading}
                    isExposureLayersError={isExposureLayersError}
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
                        style={{
                            width: '100%',
                            height: '100%',
                            cursor: positionSelectionMode ? 'crosshair' : 'grab',
                        }}
                        onLoad={handleMapLoad}
                        transformRequest={transformRequest}
                        styleDiffing
                    >
                        {mapReady && (
                            <>
                                {shouldShowAllActiveFocusAreas && focusAreas && focusAreas.length > 0 && (
                                    <>
                                        <ActiveFocusAreas focusAreas={focusAreas} selectedFocusAreaId={selectedFocusAreaId} showMask={false} />
                                        <InactiveFocusAreas focusAreas={focusAreas} selectedFocusAreaId={selectedFocusAreaId} />
                                    </>
                                )}
                                {!shouldShowAllActiveFocusAreas && !isInFocusAreaPanel && selectedFocusAreaId && (
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
                                <DrawingAwareAssetLayers
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
                                    excludeUserDefined={isInExposurePanel}
                                />
                                <UtilitiesLayers utilities={mergedUtilities} selectedUtilityIds={selectedUtilityIds} mapReady={mapReady} />
                                {mapWideVisible && roadRouteStart && (
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
                                {mapWideVisible && roadRouteEnd && (
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

                    <MapLoadingOverlay
                        isAssetsFetching={isAssetsFetching}
                        isSpritesGenerating={isSpritesGenerating}
                        isFocusAreasFetching={isFocusAreasFetching}
                        isExposureLayersFetching={isExposureLayersFetching}
                    />

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
            </DrawingProvider>
        </Box>
    );
};

export default MapView;
