import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import Map, { Marker } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';

import 'maplibre-gl/dist/maplibre-gl.css';
import './mapbox-draw-maplibre.css';

import { DEFAULT_VIEW_STATE, DEFAULT_MAP_STYLE, MAP_STYLES, MAP_VIEW_BOUNDS, type MapStyleKey } from './constants';
import MapControls from './MapControls';
import MapPanels from './MapPanels';
import AssetLayers from './AssetLayers';
import ExposureLayers from './ExposureLayers';
import UtilitiesLayers from './UtilitiesLayers';
import useMapboxDraw from './hooks/useMapboxDraw';
import useFocusAreas from './hooks/useFocusAreas';
import { usePreloadAssetIcons } from './hooks/usePreloadAssetIcons';
import { useAssetTypeIcons } from '@/hooks/useAssetTypeIcons';
import { useActiveScenario } from '@/hooks/useActiveScenario';
import { useScenarioAssets } from '@/hooks/useScenarioAssets';
import { fetchAssetCategories } from '@/api/asset-categories';
import { fetchExposureLayers } from '@/api/exposure-layers';
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
    const [selectedAssetTypes, setSelectedAssetTypes] = useState<Record<string, boolean>>({});
    const [selectedExposureLayerIds, setSelectedExposureLayerIds] = useState<Record<string, boolean>>({});
    const [selectedUtilityIds, setSelectedUtilityIds] = useState<Record<string, boolean>>({});
    const [selectedElement, setSelectedElement] = useState<Asset | null>(null);
    const [previousPanelView, setPreviousPanelView] = useState<string | null>('focus-area');
    const [mapWideVisible, setMapWideVisible] = useState(true);
    const [roadRouteStart, setRoadRouteStart] = useState<{ lat: number; lng: number } | null>(null);
    const [roadRouteEnd, setRoadRouteEnd] = useState<{ lat: number; lng: number } | null>(null);
    const [roadRouteVehicle, setRoadRouteVehicle] = useState<RoadRouteInputParams['vehicle']>('Car');
    const [positionSelectionMode, setPositionSelectionMode] = useState<'start' | 'end' | null>(null);

    const drawRef = useMapboxDraw(mapRef, mapReady);
    const { data: activeScenario } = useActiveScenario();
    const scenarioId = activeScenario?.id;
    const iconMap = useAssetTypeIcons();

    const { isDrawing, startDrawing } = useFocusAreas({
        scenarioId,
        mapRef,
        drawRef,
        mapReady,
    });

    const mapStyle = useMemo(() => MAP_STYLES[mapStyleKey], [mapStyleKey]);

    const { data: assetCategories } = useQuery({
        queryKey: ['assetCategories'],
        queryFn: fetchAssetCategories,
        staleTime: 5 * 60 * 1000,
    });

    const { data: exposureLayers } = useQuery({
        queryKey: ['exposureLayers'],
        queryFn: fetchExposureLayers,
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
                fetchPolicy: 'network-only',
            });
        }
    }, [roadRouteStart, roadRouteEnd, roadRouteVehicle, isRoadRouteEnabled, getRoadRoute]);

    const { assets } = useScenarioAssets({
        scenarioId,
        excludeMapWide: !mapWideVisible,
        iconMap,
    });

    usePreloadAssetIcons(assets);

    const mergedUtilities = useMemo(() => {
        if (!isRoadRouteEnabled || !roadRouteStart || !roadRouteEnd) {
            return { type: 'FeatureCollection', features: [] };
        }

        const routeGeojson = roadRouteQueryData?.roadRoute?.routeGeojson;
        if (!routeGeojson?.features) {
            return { type: 'FeatureCollection', features: [] };
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
            type: 'FeatureCollection',
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
        canvas.style.cursor = positionSelectionMode ? 'crosshair' : '';

        return () => {
            canvas.style.cursor = previousCursor;
        };
    }, [positionSelectionMode]);

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

    const handleMapWideVisibleChange = useCallback((visible: boolean) => {
        setMapWideVisible(visible);
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
                setPreviousPanelView(activePanelView);
                setSelectedElement(elements[0]);
                setActivePanelView('asset-details');
            }
        },
        [activePanelView],
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
                selectedAssetTypes={selectedAssetTypes}
                onAssetTypeToggle={(assetType, enabled) => {
                    setSelectedAssetTypes((prev) => ({
                        ...prev,
                        [assetType]: enabled,
                    }));
                }}
                selectedExposureLayerIds={selectedExposureLayerIds}
                onExposureLayerToggle={(layerId, enabled) => {
                    setSelectedExposureLayerIds((prev) => ({
                        ...prev,
                        [layerId]: enabled,
                    }));
                }}
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
                roadRouteData={roadRouteQueryData?.roadRoute}
                onRoadRouteVehicleChange={setRoadRouteVehicle}
                onRequestPositionSelection={setPositionSelectionMode}
                selectedElement={selectedElement}
                onBackFromAssetDetails={handleBackFromAssetDetails}
                scenarioId={scenarioId}
                mapWideVisible={mapWideVisible}
                onMapWideVisibleChange={handleMapWideVisibleChange}
                isDrawing={isDrawing}
                onStartDrawing={startDrawing}
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
                    style={{ width: '100%', height: '100%', cursor: positionSelectionMode ? 'crosshair' : 'grab' }}
                    onLoad={handleMapLoad}
                    transformRequest={transformRequest}
                    styleDiffing
                >
                    {mapReady && (
                        <>
                            <AssetLayers
                                assets={assets}
                                selectedElements={selectedElement ? [selectedElement] : []}
                                onElementClick={handleElementClick}
                                mapReady={mapReady}
                                assetCategories={assetCategories}
                            />
                            {exposureLayers && (
                                <ExposureLayers
                                    exposureLayers={exposureLayers.featureCollection}
                                    selectedExposureLayerIds={selectedExposureLayerIds}
                                    mapReady={mapReady}
                                />
                            )}
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
        </Box>
    );
};

export default MapView;
