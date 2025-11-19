import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import Map from 'react-map-gl/maplibre';
import { useSuspenseQuery } from '@tanstack/react-query';

import 'maplibre-gl/dist/maplibre-gl.css';

import { DEFAULT_VIEW_STATE, DEFAULT_MAP_STYLE, MAP_STYLES, MAP_VIEW_BOUNDS, type MapStyleKey } from './constants';
import MapControls from './MapControls';
import DrawingToolbar from './DrawingToolbar';
import MapPanels from './MapPanels';
import AssetLayers from './AssetLayers';
import useMapboxDraw from './hooks/useMapboxDraw';
import { usePreloadAssetIcons } from './hooks/usePreloadAssetIcons';
import { fetchAssessments } from '@/api/assessments';
import { useGroupedAssets } from '@/hooks';

const MapView = () => {
    const mapRef = useRef<MapRef>(null);
    const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
    const [mapReady, setMapReady] = useState(false);
    const [legendOpen, setLegendOpen] = useState(false);
    const [floodWarningsOpen, setFloodWarningsOpen] = useState(false);
    const [drawingToolbarOpen, setDrawingToolbarOpen] = useState(false);
    const [drawingMode, setDrawingMode] = useState<'circle' | 'polygon' | null>(null);
    const [primaryAssets, setPrimaryAssets] = useState(false);
    const [dependentAssets, setDependentAssets] = useState(false);
    const [mapStyleKey, setMapStyleKey] = useState<MapStyleKey>(DEFAULT_MAP_STYLE);
    const [mapStylePanelOpen, setMapStylePanelOpen] = useState(false);
    const [activePanelView, setActivePanelView] = useState<string | null>('scenario');
    const [selectedAssetTypes, setSelectedAssetTypes] = useState<Record<string, boolean>>({});

    const drawRef = useMapboxDraw(mapRef, mapReady);

    const mapStyle = useMemo(() => MAP_STYLES[mapStyleKey], [mapStyleKey]);

    const { isError: isErrorAssessments, data: assessmentsData } = useSuspenseQuery({
        queryKey: ['assessments'],
        queryFn: fetchAssessments,
    });

    const assessment = assessmentsData?.at(0)?.uri;

    const groupedAssetsResult = useGroupedAssets({
        assessment: assessment || undefined,
    });

    const assets = groupedAssetsResult.filteredAssets || [];
    const dependencies = 'dependencies' in groupedAssetsResult && Array.isArray(groupedAssetsResult.dependencies) ? groupedAssetsResult.dependencies : [];
    const isLoadingAssets = groupedAssetsResult.isLoadingAssets ?? false;

    usePreloadAssetIcons(isLoadingAssets ? [] : assets);

    const handleMove = useCallback((event: ViewStateChangeEvent) => {
        setViewState(event.viewState);
    }, []);

    const handleStyleChange = useCallback((newStyle: MapStyleKey) => {
        setMapStyleKey(newStyle);
    }, []);

    const toggleLegend = useCallback(() => {
        setLegendOpen((prev) => {
            if (!prev) {
                setMapStylePanelOpen(false);
                setFloodWarningsOpen(false);
            }
            return !prev;
        });
    }, []);

    const toggleMapStylePanel = useCallback(() => {
        setMapStylePanelOpen((prev) => {
            if (!prev) {
                setLegendOpen(false);
                setFloodWarningsOpen(false);
            }
            return !prev;
        });
    }, []);

    const toggleFloodWarnings = useCallback(() => {
        setFloodWarningsOpen((prev) => {
            if (!prev) {
                setLegendOpen(false);
                setMapStylePanelOpen(false);
            }
            return !prev;
        });
    }, []);

    const closePanels = useCallback(() => {
        setLegendOpen(false);
        setMapStylePanelOpen(false);
        setFloodWarningsOpen(false);
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
                onViewChange={setActivePanelView}
                selectedAssetTypes={selectedAssetTypes}
                onAssetTypeToggle={(assetType, enabled) => {
                    setSelectedAssetTypes((prev) => ({
                        ...prev,
                        [assetType]: enabled,
                    }));
                }}
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
                    {!isErrorAssessments && assessment && mapReady && (
                        <AssetLayers assets={assets} dependencies={dependencies} selectedAssetTypes={selectedAssetTypes} mapReady={mapReady} />
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
                    legendOpen={legendOpen}
                    onToggleLegend={toggleLegend}
                    floodWarningsOpen={floodWarningsOpen}
                    onToggleFloodWarnings={toggleFloodWarnings}
                    onClosePanels={closePanels}
                    isDrawing={drawingToolbarOpen}
                    onToggleDrawing={handleToggleDrawing}
                    mapStyleKey={mapStyleKey}
                    onMapStyleChange={handleStyleChange}
                    mapStylePanelOpen={mapStylePanelOpen}
                    onToggleMapStylePanel={toggleMapStylePanel}
                    viewState={viewState}
                />
            </Box>
        </Box>
    );
};

export default MapView;
