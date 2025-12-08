import { useCallback, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import Map from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';

import 'maplibre-gl/dist/maplibre-gl.css';
import './mapbox-draw-maplibre.css';

import { DEFAULT_VIEW_STATE, DEFAULT_MAP_STYLE, MAP_STYLES, MAP_VIEW_BOUNDS, type MapStyleKey } from './constants';
import MapControls from './MapControls';
import MapPanels from './MapPanels';
import AssetLayers from './AssetLayers';
import ExposureLayers from './ExposureLayers';
import useMapboxDraw from './hooks/useMapboxDraw';
import useFocusAreas from './hooks/useFocusAreas';
import { usePreloadAssetIcons } from './hooks/usePreloadAssetIcons';
import { useAssetTypeIcons } from '@/hooks/useAssetTypeIcons';
import { useActiveScenario } from '@/hooks/useActiveScenario';
import { useScenarioAssets } from '@/hooks/useScenarioAssets';
import { fetchAssetCategories } from '@/api/asset-categories';
import { fetchExposureLayers } from '@/api/exposure-layers';
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
    const [selectedElement, setSelectedElement] = useState<Asset | null>(null);
    const [previousPanelView, setPreviousPanelView] = useState<string | null>('focus-area');
    const [mapWideVisible, setMapWideVisible] = useState(true);

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

    const { assets } = useScenarioAssets({
        scenarioId,
        excludeMapWide: !mapWideVisible,
        iconMap,
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
                    mapStyle={mapStyle}
                    maxBounds={MAP_VIEW_BOUNDS}
                    style={{ width: '100%', height: '100%' }}
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
