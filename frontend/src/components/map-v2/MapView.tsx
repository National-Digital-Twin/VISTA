import { useCallback, useMemo, useRef, useState, useEffect, type ComponentProps } from 'react';
import { Box } from '@mui/material';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import type { MapMouseEvent } from 'maplibre-gl';
import Map, { Layer } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';

import 'maplibre-gl/dist/maplibre-gl.css';
import './mapbox-draw-maplibre.css';

import { bbox, booleanPointInPolygon, point } from '@turf/turf';
import { DEFAULT_VIEW_STATE, DEFAULT_MAP_STYLE, MAP_STYLES, MAP_VIEW_BOUNDS, BELOW_ASSET_LAYER_ID, type MapStyleKey } from './constants';
import MapControls from './MapControls';
import MapPanels from './MapPanels';
import AssetLayers, { ASSET_SYMBOL_LAYER_ID } from './AssetLayers';
import ExposureLayers from './ExposureLayers';
import UtilitiesLayers from './UtilitiesLayers';
import ConstraintLayers from './ConstraintLayers';
import ResourceLayers from './ResourceLayers';
import FocusAreaMask from './FocusAreaMask';
import FocusAreaOutline from './FocusAreaOutline';
import InactiveFocusAreas from './InactiveFocusAreas';
import ActiveFocusAreas from './ActiveFocusAreas';
import ConnectedAssetsLayer from './ConnectedAssetsLayer';
import MapLoadingOverlay from './MapLoadingOverlay';
import { DrawingProvider, useDrawingContext } from './context/DrawingContext';
import { useRouteContext } from './context/RouteContext';
import { usePreloadAssetIcons } from './hooks/usePreloadAssetIcons';
import type { SearchSelection } from './controls/SearchControl';
import { transformMapRequest } from '@/utils/mapRequest';
import { useAssetTypeIcons } from '@/hooks/useAssetTypeIcons';
import { useActiveScenario } from '@/hooks/useActiveScenario';
import { useScenarioAssets } from '@/hooks/useScenarioAssets';
import { useMultipleFocusAreaAssets } from '@/hooks/useMultipleFocusAreaAssets';
import { fetchAssetCategories } from '@/api/asset-categories';
import { fetchAssetDetails } from '@/api/asset-details';
import { fetchFocusAreas } from '@/api/focus-areas';
import { fetchExposureLayers } from '@/api/exposure-layers';
import { fetchConstraintInterventions } from '@/api/constraint-interventions';
import { fetchResourceInterventions } from '@/api/resources';
import type { Asset } from '@/api/assets-by-type';
import type { AssetDetailsResponse } from '@/api/asset-details';
import { parseGeometryWithLocation } from '@/api/geometry-parser';

const ASSET_LAYER_IDS = [ASSET_SYMBOL_LAYER_ID, `${ASSET_SYMBOL_LAYER_ID}-selected`, 'map-v2-asset-line-layer'] as const;

type DrawingAwareAssetLayersProps = Omit<ComponentProps<typeof AssetLayers>, 'interactionDisabled'>;

const DrawingAwareAssetLayers = (props: DrawingAwareAssetLayersProps) => {
    const { drawingMode } = useDrawingContext();
    const { positionSelectionMode } = useRouteContext();
    const interactionDisabled = drawingMode !== null || positionSelectionMode !== null;

    return <AssetLayers {...props} interactionDisabled={interactionDisabled} />;
};

const MapView = () => {
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
    const [mapReady, setMapReady] = useState(false);
    const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>(DEFAULT_MAP_STYLE);
    const [mapStylePanelOpen, setMapStylePanelOpen] = useState(false);
    const [assetInfoPanelOpen, setAssetInfoPanelOpen] = useState(false);
    const [activePanelView, setActivePanelView] = useState<string | null>('focus-area');
    const [selectedElement, setSelectedElement] = useState<Asset | null>(null);
    const [selectedResourceLocationId, setSelectedResourceLocationId] = useState<string | null>(null);
    const [stockActionOpen, setStockActionOpen] = useState(false);
    const [previousPanelView, setPreviousPanelView] = useState<string | null>('focus-area');
    const [connectedAssets, setConnectedAssets] = useState<{
        dependents: Array<{ id: string; geom: string; type: { name: string } }>;
        providers: Array<{ id: string; geom: string; type: { name: string } }>;
    }>({ dependents: [], providers: [] });
    const [isSpritesGenerating, setIsSpritesGenerating] = useState(false);
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [showCpsIcons, setShowCpsIcons] = useState(false);

    const route = useRouteContext();

    const isInFocusAreaPanel = activePanelView === 'focus-area';
    const isInExposurePanel = activePanelView === 'exposure';
    const isInAssetsPanel = activePanelView === 'assets';
    const isInUtilitiesPanel = activePanelView === 'utilities';
    const isInConstraintsPanel = activePanelView === 'constraints';
    const isInMapWidePanel = activePanelView === 'utilities' || activePanelView === 'constraints';
    const shouldFilterByFocusArea = activePanelView === 'assets' || activePanelView === 'exposure';
    const shouldShowAllActiveFocusAreas = shouldFilterByFocusArea || isInMapWidePanel;

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

    const {
        data: constraintTypes,
        isFetching: isConstraintsFetching,
        isLoading: isConstraintsLoading,
        isError: isConstraintsError,
    } = useQuery({
        queryKey: ['constraintInterventions', scenarioId],
        queryFn: () => fetchConstraintInterventions(scenarioId ?? ''),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: resourceTypes,
        isFetching: isResourcesFetching,
        isLoading: isResourcesLoading,
        isError: isResourcesError,
    } = useQuery({
        queryKey: ['resourceInterventions', scenarioId],
        queryFn: () => fetchResourceInterventions(scenarioId ?? ''),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    const mapWideFocusArea = useMemo(() => {
        return focusAreas?.find((fa) => fa.isSystem);
    }, [focusAreas]);

    const effectiveSelectedFocusAreaId = useMemo(() => {
        if (isInMapWidePanel) {
            return null;
        }
        return selectedFocusAreaId;
    }, [isInMapWidePanel, selectedFocusAreaId]);

    const exposureLayersFocusAreaId = useMemo(() => {
        if (isInExposurePanel) {
            return effectiveSelectedFocusAreaId;
        }
        if (shouldShowAllActiveFocusAreas) {
            return null;
        }
        return effectiveSelectedFocusAreaId;
    }, [shouldShowAllActiveFocusAreas, effectiveSelectedFocusAreaId, isInExposurePanel]);

    const {
        data: exposureLayersData,
        isFetching: isExposureLayersFetching,
        isLoading: isExposureLayersLoading,
        isError: isExposureLayersError,
    } = useQuery({
        queryKey: ['exposureLayers', scenarioId, exposureLayersFocusAreaId],
        queryFn: () => fetchExposureLayers(scenarioId ?? '', exposureLayersFocusAreaId),
        enabled: !!scenarioId && (shouldShowAllActiveFocusAreas || !!effectiveSelectedFocusAreaId) && (isInExposurePanel || isInAssetsPanel),
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
        focusAreaId: shouldFilterByFocusArea && !shouldShowAllActiveFocusAreas ? effectiveSelectedFocusAreaId : undefined,
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

    const assets = useMemo(() => {
        if (!selectedElement) {
            return allActiveAssets;
        }
        if (allActiveAssets.some((asset) => asset.id === selectedElement.id)) {
            return allActiveAssets;
        }
        return [selectedElement, ...allActiveAssets];
    }, [allActiveAssets, selectedElement]);
    const isAssetsFetching = shouldShowAllActiveFocusAreas ? multipleFocusAreaAssets.isFetching || mapWideAssets.isFetching : singleFocusAreaAssets.isFetching;

    const selectedAssetDetails = useQuery({
        enabled: !!selectedElement?.id,
        queryKey: ['asset-details', selectedElement?.id || ''],
        queryFn: () => fetchAssetDetails(selectedElement!.id),
    });

    usePreloadAssetIcons(assets);

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
        canvas.style.cursor = route.positionSelectionMode ? 'crosshair' : '';

        return () => {
            canvas.style.cursor = previousCursor;
        };
    }, [route.positionSelectionMode]);

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

    const transformRequest = useCallback(transformMapRequest, []);

    const handleViewChange = useCallback(
        (viewId: string | null) => {
            if (viewId !== 'inspector') {
                setSelectedElement(null);
            }
            if (viewId !== 'resources') {
                setSelectedResourceLocationId(null);
                setStockActionOpen(false);
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
                setSelectedResourceLocationId(null);
                setStockActionOpen(false);
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

            if (route.positionSelectionMode === 'start') {
                route.setStart({ lat: event.lngLat.lat, lng: event.lngLat.lng });
                // if we don't have an end yet shortcut to end selection mode
                route.setPositionSelectionMode(route.end ? null : 'end');
                return;
            }

            if (route.positionSelectionMode === 'end') {
                route.setEnd({ lat: event.lngLat.lat, lng: event.lngLat.lng });
                route.setPositionSelectionMode(null);
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
                } catch { /* empty */ }
            }

            setSelectedResourceLocationId(null);
            setStockActionOpen(false);

            if (activePanelView === 'inspector') {
                setSelectedElement(null);
                setConnectedAssets({ dependents: [], providers: [] });
                setActivePanelView(previousPanelView || 'focus-area');
            }
        },
        [route, activePanelView, previousPanelView, mapReady],
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

    const handleResourceLocationClick = useCallback(
        (locationId: string) => {
            setSelectedElement(null);
            setConnectedAssets({ dependents: [], providers: [] });
            setSelectedResourceLocationId(locationId);
            if (activePanelView !== 'resources') {
                setPreviousPanelView(activePanelView);
                setActivePanelView('resources');
            }
        },
        [activePanelView],
    );

    const handleResourceLocationDoubleClick = useCallback(
        (locationId: string) => {
            setSelectedElement(null);
            setConnectedAssets({ dependents: [], providers: [] });
            setSelectedResourceLocationId(locationId);
            setStockActionOpen(true);
            if (activePanelView !== 'resources') {
                setPreviousPanelView(activePanelView);
                setActivePanelView('resources');
            }
        },
        [activePanelView],
    );

    const handleResourceLocationSelect = useCallback((locationId: string) => {
        setSelectedResourceLocationId(locationId);
    }, []);

    const handleStockActionClose = useCallback(() => {
        setStockActionOpen(false);
    }, []);

    const buildSearchSelectedAsset = useCallback((assetDetails: AssetDetailsResponse): Asset => {
        const { lat, lng, geometry } = parseGeometryWithLocation(assetDetails.geom);
        const icon = iconMap.get(assetDetails.type.id);
        const iconName = icon?.replace('fa-', '');
        return {
            id: assetDetails.id,
            type: assetDetails.type.id,
            name: assetDetails.name,
            lat,
            lng,
            geometry,
            dependent: {
                count: assetDetails.dependents.length,
                criticalitySum: 0,
            },
            styles: {
                classUri: assetDetails.type.id,
                color: '#DDDDDD',
                backgroundColor: '#121212',
                faIcon: icon,
                iconFallbackText: iconName || '?',
                alt: assetDetails.type.name,
            },
            elementType: 'asset',
        };
    }, [iconMap]);

    const handleSearchResultSelect = useCallback((result: SearchSelection) => {
        const map = mapRef.current?.getMap();
        if (!map) {
            return;
        }

        if (result.kind === 'asset') {
            const asset = buildSearchSelectedAsset(result.asset);
            setSelectedResourceLocationId(null);
            setStockActionOpen(false);
            setConnectedAssets({ dependents: [], providers: [] });
            if (activePanelView !== 'inspector') {
                setPreviousPanelView(activePanelView);
            }
            setSelectedElement(asset);
            setActivePanelView('inspector');

            if (asset.geometry.type === 'Point' && asset.lng !== undefined && asset.lat !== undefined) {
                map.flyTo({
                    center: [asset.lng, asset.lat],
                    zoom: Math.max(viewState.zoom, 13),
                    duration: 1000,
                });
                return;
            }

            const geometryBounds = bbox({ type: 'Feature', geometry: asset.geometry, properties: {} });
            map.fitBounds(
                [
                    [geometryBounds[0], geometryBounds[1]],
                    [geometryBounds[2], geometryBounds[3]],
                ],
                {
                    padding: 80,
                    duration: 1000,
                    maxZoom: 16,
                },
            );
            return;
        }

        if (result.bounds) {
            map.fitBounds(result.bounds, {
                padding: 80,
                duration: 1000,
                maxZoom: 15,
            });
            return;
        }

        map.flyTo({
            center: [result.lng, result.lat],
            zoom: Math.max(viewState.zoom, 12),
            duration: 1000,
        });
    }, [activePanelView, buildSearchSelectedAsset, viewState.zoom]);

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
                    selectedFocusAreaId={effectiveSelectedFocusAreaId}
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
                    constraintTypes={constraintTypes}
                    isConstraintsLoading={isConstraintsLoading}
                    isConstraintsError={isConstraintsError}
                    resourceTypes={resourceTypes}
                    isResourcesLoading={isResourcesLoading}
                    isResourcesError={isResourcesError}
                    selectedResourceLocationId={selectedResourceLocationId}
                    stockActionOpen={stockActionOpen}
                    onResourceLocationSelect={handleResourceLocationSelect}
                    onStockActionClose={handleStockActionClose}
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
                            cursor: route.positionSelectionMode ? 'crosshair' : 'grab',
                        }}
                        onLoad={handleMapLoad}
                        transformRequest={transformRequest}
                        styleDiffing
                    >
                        {mapReady && (
                            <>
                                {shouldShowAllActiveFocusAreas && focusAreas && focusAreas.length > 0 && (
                                    <>
                                        <ActiveFocusAreas focusAreas={focusAreas} selectedFocusAreaId={effectiveSelectedFocusAreaId} showMask={false} />
                                        <InactiveFocusAreas focusAreas={focusAreas} selectedFocusAreaId={effectiveSelectedFocusAreaId} />
                                    </>
                                )}
                                {!shouldShowAllActiveFocusAreas && !isInFocusAreaPanel && effectiveSelectedFocusAreaId && (
                                    <FocusAreaMask geometry={focusAreas?.find((fa) => fa.id === effectiveSelectedFocusAreaId)?.geometry ?? null} />
                                )}
                                {isInFocusAreaPanel &&
                                    effectiveSelectedFocusAreaId &&
                                    (() => {
                                        const selectedFocusArea = focusAreas?.find((fa) => fa.id === effectiveSelectedFocusAreaId);
                                        if (selectedFocusArea && !selectedFocusArea.isActive && selectedFocusArea.geometry) {
                                            return <FocusAreaOutline geometry={selectedFocusArea.geometry} lineColor="#888888" />;
                                        }
                                        return null;
                                    })()}
                                <Layer id={BELOW_ASSET_LAYER_ID} type="background" paint={{ 'background-opacity': 0 }} />
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
                                    selectedFocusAreaId={effectiveSelectedFocusAreaId}
                                    mapReady={mapReady}
                                    isInFocusAreaPanel={isInFocusAreaPanel}
                                    excludeUserDefined={isInExposurePanel}
                                    shouldShowAllActiveFocusAreas={shouldShowAllActiveFocusAreas}
                                />

                                {(mapWideVisible || isInUtilitiesPanel) && <UtilitiesLayers mapReady={mapReady} />}
                                {mapWideVisible && !isInConstraintsPanel && <ConstraintLayers constraintTypes={constraintTypes} mapReady={mapReady} />}
                                {mapWideVisible && (
                                    <ResourceLayers
                                        resourceTypes={resourceTypes}
                                        mapReady={mapReady}
                                        onLocationClick={handleResourceLocationClick}
                                        onLocationDoubleClick={handleResourceLocationDoubleClick}
                                        selectedLocationId={selectedResourceLocationId ?? undefined}
                                    />
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
                        isConstraintsFetching={isConstraintsFetching}
                        isResourcesFetching={isResourcesFetching}
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
                        onSearchResultSelect={handleSearchResultSelect}
                    />
                </Box>
            </DrawingProvider>
        </Box>
    );
};

export default MapView;
