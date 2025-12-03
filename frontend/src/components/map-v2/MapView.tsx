import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import Map from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';

import 'maplibre-gl/dist/maplibre-gl.css';

import { DEFAULT_VIEW_STATE, DEFAULT_MAP_STYLE, MAP_STYLES, MAP_VIEW_BOUNDS, type MapStyleKey } from './constants';
import MapControls from './MapControls';
import DrawingToolbar from './DrawingToolbar';
import MapPanels from './MapPanels';
import AssetLayers from './AssetLayers';
import ExposureLayers from './ExposureLayers';
import useMapboxDraw from './hooks/useMapboxDraw';
import { usePreloadAssetIcons } from './hooks/usePreloadAssetIcons';
import { getAssetTypeName } from './utils/getAssetTypeName';
import { useAssetsByType } from '@/hooks/useAssetsByType';
import { useAssetTypeIcons } from '@/hooks/useAssetTypeIcons';
import { fetchAssetCategories } from '@/api/asset-categories';
import { fetchExposureLayers } from '@/api/exposure-layers';
import type { Element } from '@/models';

const MapView = () => {
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
    const [mapReady, setMapReady] = useState(false);
    const [drawingToolbarOpen, setDrawingToolbarOpen] = useState(false);
    const [drawingMode, setDrawingMode] = useState<'circle' | 'polygon' | null>(null);
    const [primaryAssets, setPrimaryAssets] = useState(false);
    const [dependentAssets, setDependentAssets] = useState(false);
    const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>(DEFAULT_MAP_STYLE);
    const [mapStylePanelOpen, setMapStylePanelOpen] = useState(false);
    const [assetInfoPanelOpen, setAssetInfoPanelOpen] = useState(false);
    const [activePanelView, setActivePanelView] = useState<string | null>('scenario');
    const [selectedAssetTypes, setSelectedAssetTypes] = useState<Record<string, boolean>>({});
    const [selectedExposureLayerIds, setSelectedExposureLayerIds] = useState<Record<string, boolean>>({});
    const [selectedElement, setSelectedElement] = useState<Element | null>(null);
    const [previousPanelView, setPreviousPanelView] = useState<string | null>('scenario');

    const drawRef = useMapboxDraw(mapRef, mapReady);

    const mapStyle = useMemo(() => MAP_STYLES[mapStyleKey], [mapStyleKey]);

    const selectedAssetTypeIds = useMemo(() => {
        return Object.entries(selectedAssetTypes)
            .filter(([, enabled]) => enabled)
            .map(([typeId]) => typeId);
    }, [selectedAssetTypes]);

    const iconMap = useAssetTypeIcons();
    const [emptyResultMessage, setEmptyResultMessage] = useState<string | null>(null);
    const previousSelectedAssetTypeIdsRef = useRef<Set<string>>(new Set());
    const previousEmptyResultsRef = useRef<Set<string>>(new Set());

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

    const { assets, emptyResults } = useAssetsByType({
        selectedAssetTypeIds,
        iconMap,
    });

    const findAssetTypeName = useCallback(
        (typeId: string): string | null => {
            return getAssetTypeName(typeId, assetCategories);
        },
        [assetCategories],
    );
    useEffect(() => {
        const currentSelectedSet = new Set(selectedAssetTypeIds);
        const previousSelectedSet = previousSelectedAssetTypeIdsRef.current;
        const currentEmptyResultsSet = new Set(emptyResults);
        const previousEmptyResultsSet = previousEmptyResultsRef.current;

        const newlyEnabledTypes = selectedAssetTypeIds.filter((typeId) => !previousSelectedSet.has(typeId));
        const newlyEnabledEmptyTypes = newlyEnabledTypes.filter((typeId) => emptyResults.includes(typeId));

        const newlyEmptyTypes = emptyResults.filter((typeId) => !previousEmptyResultsSet.has(typeId) && selectedAssetTypeIds.includes(typeId));

        const typesToNotify = [...newlyEnabledEmptyTypes, ...newlyEmptyTypes.filter((id) => !newlyEnabledEmptyTypes.includes(id))];

        if (typesToNotify.length > 0) {
            const assetTypeNames = typesToNotify.map(findAssetTypeName).filter((name): name is string => name !== null);

            if (assetTypeNames.length > 0) {
                const message =
                    assetTypeNames.length === 1 ? `No assets found for "${assetTypeNames[0]}"` : `No assets found for: ${assetTypeNames.join(', ')}`;
                setEmptyResultMessage(message);
            }
        }

        previousSelectedAssetTypeIdsRef.current = currentSelectedSet;
        previousEmptyResultsRef.current = currentEmptyResultsSet;
    }, [emptyResults, selectedAssetTypeIds, assetCategories, findAssetTypeName]);

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

    const handleToggleDrawing = useCallback(() => {
        setDrawingToolbarOpen((prev) => {
            if (prev) {
                if (drawRef.current) {
                    drawRef.current.changeMode('simple_select');
                }
                setDrawingMode(null);
            }
            return !prev;
        });
    }, [drawRef]);

    const handleDrawingModeChange = useCallback((mode: 'circle' | 'polygon' | null) => {
        setDrawingMode(mode);
    }, []);

    const handlePrimaryAssetsChange = useCallback((enabled: boolean) => {
        setPrimaryAssets(enabled);
    }, []);

    const handleDependentAssetsChange = useCallback((enabled: boolean) => {
        setDependentAssets(enabled);
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
        (elements: Element[]) => {
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

    useEffect(() => {
        if (!mapReady || !mapRef.current || !drawRef.current) {
            return;
        }

        const map = mapRef.current.getMap();

        const handleDrawComplete = () => {
            setDrawingMode(null);
        };

        const handleModeChange = () => {
            const currentMode = drawRef.current?.getMode();
            if (currentMode === 'simple_select') {
                setDrawingMode(null);
            }
        };

        map.on('draw.create', handleDrawComplete);
        map.on('draw.modechange', handleModeChange);

        return () => {
            map.off('draw.create', handleDrawComplete);
            map.off('draw.modechange', handleModeChange);
        };
    }, [mapReady, drawRef]);

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
                                selectedAssetTypes={selectedAssetTypes}
                                selectedElements={selectedElement ? [selectedElement] : []}
                                onElementClick={handleElementClick}
                                mapReady={mapReady}
                                assetCategories={assetCategories}
                            />
                            {exposureLayers && (
                                <ExposureLayers exposureLayers={exposureLayers} selectedExposureLayerIds={selectedExposureLayerIds} mapReady={mapReady} />
                            )}
                        </>
                    )}
                </Map>

                {drawingToolbarOpen && (
                    <DrawingToolbar
                        drawRef={drawRef}
                        drawingMode={drawingMode}
                        onDrawingModeChange={handleDrawingModeChange}
                        primaryAssets={primaryAssets}
                        onPrimaryAssetsChange={handlePrimaryAssetsChange}
                        dependentAssets={dependentAssets}
                        onDependentAssetsChange={handleDependentAssetsChange}
                    />
                )}

                <MapControls
                    mapRef={mapRef}
                    onClosePanels={closePanels}
                    isDrawing={drawingToolbarOpen}
                    onToggleDrawing={handleToggleDrawing}
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

            <Snackbar
                open={!!emptyResultMessage}
                autoHideDuration={4000}
                onClose={() => setEmptyResultMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="info" onClose={() => setEmptyResultMessage(null)}>
                    {emptyResultMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MapView;
