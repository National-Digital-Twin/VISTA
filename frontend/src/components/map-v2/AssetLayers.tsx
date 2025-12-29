import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';
import type { Feature } from 'geojson';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { findIconDefinition as faIconLookup, type IconName } from '@fortawesome/fontawesome-svg-core';

import AssetTooltip from './panels/AssetTooltip';
import { findElement } from '@/utils';
import { createPointFeature, createLinearFeature } from '@/utils/assetUtils';
import type { Asset } from '@/api/assets-by-type';
import type { AssetCategory } from '@/api/asset-categories';

const SOURCE_ID = 'map-v2-asset-source';
const LINE_SOURCE_ID = 'map-v2-asset-line-source';
export const ASSET_SYMBOL_LAYER_ID = 'map-v2-asset-symbol-layer';
const ASSET_SELECTION_RING_LAYER_ID = 'map-v2-asset-selection-ring-layer';
const LINE_LAYER_ID = 'map-v2-asset-line-layer';

const CIRCLE_RADIUS = 14;
const BORDER_WIDTH = 3;
const SELECTION_OUTLINE_WIDTH = 4;
const ICON_SIZE = 14;
const FALLBACK_FONT_SIZE = 12;
const SPRITE_PADDING = 2;
const SELECTED_STROKE_COLOR = '#1976d2';
const SELECTED_STROKE_WIDTH = 3;
const DEFAULT_BACKGROUND_COLOR = '#000000';
const MARKER_BORDER_COLOR = '#FFFD04';
const DEFAULT_LINE_COLOR = '#00AA00';
const DEFAULT_LINE_WIDTH = 3;

const SYMBOL_LAYER_LAYOUT = {
    'icon-image': ['get', 'markerId'] as ['get', string],
    'icon-size': 1,
    'icon-allow-overlap': true,
    'icon-keep-upright': true,
    'icon-pitch-alignment': 'viewport' as const,
    'icon-rotation-alignment': 'viewport' as const,
    'icon-padding': 2,
    'icon-optional': false,
    'symbol-placement': 'point' as const,
};

type MarkerStyle = {
    iconName: string;
    iconFallbackText: string;
    backgroundColor: string;
};

async function generateMarkerSprite(style: MarkerStyle): Promise<HTMLCanvasElement> {
    const totalRadius = CIRCLE_RADIUS + BORDER_WIDTH;
    const size = (totalRadius + SPRITE_PADDING) * 2;
    const center = size / 2;

    let iconSvg = '';
    if (style.iconName) {
        const iconDef = faIconLookup({ prefix: 'fas', iconName: style.iconName as IconName });
        if (iconDef?.icon) {
            const [width, height, , , pathData] = iconDef.icon;
            const iconScale = ICON_SIZE / Math.max(width, height);
            const offsetX = center - (width * iconScale) / 2;
            const offsetY = center - (height * iconScale) / 2;
            const path = Array.isArray(pathData) ? pathData[0] : pathData;
            iconSvg = `<g transform="translate(${offsetX},${offsetY}) scale(${iconScale})"><path d="${path}" fill="#ffffff"/></g>`;
        }
    }

    if (!iconSvg) {
        iconSvg = `<text x="${center}" y="${center}" font-family="sans-serif" font-size="${FALLBACK_FONT_SIZE}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${style.iconFallbackText.substring(0, 2)}</text>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <circle cx="${center}" cy="${center}" r="${CIRCLE_RADIUS + BORDER_WIDTH}" fill="${MARKER_BORDER_COLOR}"/>
        <circle cx="${center}" cy="${center}" r="${CIRCLE_RADIUS}" fill="${style.backgroundColor}"/>
        ${iconSvg}
    </svg>`;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas 2d context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            resolve(canvas);
        };
        img.onerror = () => reject(new Error('Failed to load SVG image'));
        img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
    });
}

export type AssetLayersProps = {
    assets: Asset[];
    selectedElements?: Asset[];
    onElementClick?: (elements: Asset[]) => void;
    mapReady?: boolean;
    assetCategories?: AssetCategory[];
    onGeneratingChange?: (isGenerating: boolean) => void;
    showCpsIcons?: boolean;
};

const AssetLayers = ({
    assets,
    selectedElements = [],
    onElementClick,
    mapReady,
    assetCategories,
    onGeneratingChange,
    showCpsIcons = false,
}: AssetLayersProps) => {
    const mapContext = useMap();
    const mapInstance = mapContext?.['map-v2'] || mapContext?.default || null;
    const addedIconsRef = useRef<Set<string>>(new Set());

    const [hoveredAsset, setHoveredAsset] = useState<Asset | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

    const selectedElementIds = useMemo(() => {
        return new Set(selectedElements.map((el) => el.id));
    }, [selectedElements]);

    const assetMap = useMemo(() => {
        const map = new Map<string, Asset>();
        assets.forEach((asset) => {
            map.set(asset.id, asset);
        });
        return map;
    }, [assets]);

    const uniqueMarkerStyles = useMemo(() => {
        const styles = new Map<string, MarkerStyle>();

        if (showCpsIcons) {
            const markerId = 'cps-marker';
            styles.set(markerId, { iconName: '', iconFallbackText: 'C', backgroundColor: '#000000' });
        } else {
            assetMap.forEach((asset) => {
                const faIcon = asset.styles?.faIcon || '';
                const iconName = faIcon ? faIcon.split(' ').pop()?.replace('fa-', '') || '' : '';
                const iconFallbackText = asset.styles?.iconFallbackText || '?';
                const backgroundColor = asset.styles?.backgroundColor || DEFAULT_BACKGROUND_COLOR;
                const markerId = `marker-${iconName || iconFallbackText}-${backgroundColor.replace('#', '')}`;

                if (!styles.has(markerId)) {
                    styles.set(markerId, { iconName, iconFallbackText, backgroundColor });
                }
            });
        }
        return styles;
    }, [assetMap, showCpsIcons]);

    const pointFeaturesData = useMemo(() => {
        return assets.map((asset) => createPointFeature(asset)).filter((feature): feature is Feature => feature !== null);
    }, [assets]);

    const linearFeatures = useMemo(() => {
        return assets
            .filter((asset) => asset.geometry && (asset.geometry.type === 'LineString' || asset.geometry.type === 'MultiLineString'))
            .map((asset) => createLinearFeature(asset, selectedElements))
            .filter((feature): feature is Feature => feature !== null);
    }, [assets, selectedElements]);

    const pointFeatures = useMemo(() => {
        const linearAssetIds = new Set(
            assets.filter((asset) => asset.geometry.type === 'LineString' || asset.geometry.type === 'MultiLineString').map((asset) => asset.id),
        );

        const points = pointFeaturesData.filter((feature) => {
            if (feature.geometry.type !== 'Point') {
                return false;
            }
            const id = feature.properties?.id;
            if (id && linearAssetIds.has(id)) {
                return false;
            }
            return true;
        });

        const seenIds = new Set<string>();
        return points.filter((feature) => {
            const id = feature.properties?.id;
            if (!id) {
                return true;
            }
            if (seenIds.has(id)) {
                return false;
            }
            seenIds.add(id);
            return true;
        });
    }, [pointFeaturesData, assets]);

    const lineFeatureCollection = useMemo(() => {
        const enhancedFeatures = linearFeatures.map((feature) => {
            const id = feature.properties?.id || '';
            const isSelected = selectedElementIds.has(id);

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    lineColor: DEFAULT_LINE_COLOR,
                    lineWidth: isSelected ? SELECTED_STROKE_WIDTH + 1 : feature.properties?.lineWidth || DEFAULT_LINE_WIDTH,
                },
            };
        });

        return { type: 'FeatureCollection' as const, features: enhancedFeatures };
    }, [linearFeatures, selectedElementIds]);

    const featureCollection = useMemo(() => {
        const enhancedFeatures = pointFeatures.map((feature) => {
            const id = feature.properties?.id || '';
            const asset = assetMap.get(id);
            const isSelected = selectedElementIds.has(id);

            if (showCpsIcons) {
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        backgroundColor: '#000000',
                        isSelected,
                        markerId: 'cps-marker',
                    },
                };
            }

            const backgroundColor = asset?.styles?.backgroundColor || DEFAULT_BACKGROUND_COLOR;
            const faIcon = asset?.styles?.faIcon || '';
            const iconFallbackText = asset?.styles?.iconFallbackText || '?';

            const iconName = faIcon ? faIcon.split(' ').pop()?.replace('fa-', '') || '' : '';
            const markerId = `marker-${iconName || iconFallbackText}-${backgroundColor.replace('#', '')}`;

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    backgroundColor,
                    isSelected,
                    markerId,
                    iconName,
                    iconFallbackText,
                },
            };
        });

        return { type: 'FeatureCollection' as const, features: enhancedFeatures };
    }, [pointFeatures, assetMap, selectedElementIds, showCpsIcons]);

    useEffect(() => {
        if (!mapInstance || !mapReady) {
            return;
        }

        const map = mapInstance.getMap();

        const generateSprites = async () => {
            const spritesToGenerate: { markerId: string; style: MarkerStyle }[] = [];

            uniqueMarkerStyles.forEach((style, markerId) => {
                if (addedIconsRef.current.has(markerId) || map.hasImage(markerId)) {
                    return;
                }
                spritesToGenerate.push({ markerId, style });
            });

            if (spritesToGenerate.length > 0) {
                onGeneratingChange?.(true);
            }

            await Promise.all(
                spritesToGenerate.map(async ({ markerId, style }) => {
                    try {
                        const canvas = await generateMarkerSprite(style);
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            return;
                        }

                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        if (!map.hasImage(markerId)) {
                            map.addImage(markerId, { width: canvas.width, height: canvas.height, data: imageData.data }, { pixelRatio: 1 });
                            addedIconsRef.current.add(markerId);
                        }
                    } catch (error) {
                        console.error(`Failed to generate marker sprite for ${markerId}`, error);
                    }
                }),
            );

            onGeneratingChange?.(false);
        };

        generateSprites();
    }, [mapInstance, mapReady, uniqueMarkerStyles, onGeneratingChange]);

    const handleMapClick = useCallback(
        (event: MapLayerMouseEvent) => {
            if (!onElementClick) {
                return;
            }

            const clickedFeature = event.features?.[0];
            if (!clickedFeature) {
                return;
            }

            const clickedId = clickedFeature.properties?.id;
            if (!clickedId) {
                return;
            }

            const clickedAsset = findElement(assets, clickedId);
            if (!clickedAsset) {
                return;
            }

            onElementClick([clickedAsset]);
        },
        [onElementClick, assets],
    );

    const handleMouseMove = useCallback(
        (event: MapLayerMouseEvent) => {
            if (!mapInstance) {
                return;
            }

            const map = mapInstance.getMap();
            map.getCanvas().style.cursor = 'pointer';

            const features = event.features;
            if (!features || features.length === 0) {
                setHoveredAsset(null);
                setTooltipPosition(null);
                return;
            }

            const feature = features[0];
            const assetId = feature.properties?.id;
            if (!assetId) {
                setHoveredAsset(null);
                setTooltipPosition(null);
                return;
            }

            const asset = assetMap.get(assetId);
            if (asset) {
                setHoveredAsset(asset);
                setTooltipPosition({ x: event.point.x, y: event.point.y });
            }
        },
        [mapInstance, assetMap],
    );

    const handleMouseLeave = useCallback(() => {
        if (!mapInstance) {
            return;
        }

        const map = mapInstance.getMap();
        map.getCanvas().style.cursor = '';
        setHoveredAsset(null);
        setTooltipPosition(null);
    }, [mapInstance]);

    useEffect(() => {
        if (!mapInstance || !mapReady) {
            return;
        }

        const map = mapInstance.getMap();
        const layerIds = [ASSET_SYMBOL_LAYER_ID, `${ASSET_SYMBOL_LAYER_ID}-selected`, LINE_LAYER_ID];

        layerIds.forEach((layerId) => {
            map.on('click', layerId, handleMapClick);
        });

        return () => {
            layerIds.forEach((layerId) => {
                map.off('click', layerId, handleMapClick);
            });
        };
    }, [mapInstance, mapReady, handleMapClick]);

    useEffect(() => {
        if (!mapInstance || !mapReady) {
            return;
        }

        const map = mapInstance.getMap();
        const layerIds = [ASSET_SYMBOL_LAYER_ID, `${ASSET_SYMBOL_LAYER_ID}-selected`];

        layerIds.forEach((layerId) => {
            map.on('mousemove', layerId, handleMouseMove);
            map.on('mouseleave', layerId, handleMouseLeave);
        });

        return () => {
            layerIds.forEach((layerId) => {
                map.off('mousemove', layerId, handleMouseMove);
                map.off('mouseleave', layerId, handleMouseLeave);
            });
        };
    }, [mapInstance, mapReady, handleMouseMove, handleMouseLeave]);

    useEffect(() => {
        if (!mapInstance || !mapReady) {
            return;
        }

        const hideTooltip = () => {
            setHoveredAsset(null);
            setTooltipPosition(null);
        };

        const map = mapInstance.getMap();
        map.on('move', hideTooltip);

        return () => {
            map.off('move', hideTooltip);
        };
    }, [mapInstance, mapReady]);

    if (!mapReady || (pointFeatures.length === 0 && linearFeatures.length === 0)) {
        return null;
    }

    return (
        <>
            {pointFeatures.length > 0 && (
                <Source id={SOURCE_ID} type="geojson" data={featureCollection} generateId>
                    <Layer id={ASSET_SYMBOL_LAYER_ID} type="symbol" filter={['!=', ['get', 'isSelected'], true]} layout={SYMBOL_LAYER_LAYOUT} />
                    <Layer
                        id={ASSET_SELECTION_RING_LAYER_ID}
                        type="circle"
                        filter={['==', ['get', 'isSelected'], true]}
                        paint={{
                            'circle-radius': CIRCLE_RADIUS + BORDER_WIDTH + SELECTION_OUTLINE_WIDTH,
                            'circle-color': SELECTED_STROKE_COLOR,
                        }}
                    />
                    <Layer id={`${ASSET_SYMBOL_LAYER_ID}-selected`} type="symbol" filter={['==', ['get', 'isSelected'], true]} layout={SYMBOL_LAYER_LAYOUT} />
                </Source>
            )}
            {linearFeatures.length > 0 && (
                <Source id={LINE_SOURCE_ID} type="geojson" data={lineFeatureCollection} generateId>
                    <Layer
                        id={LINE_LAYER_ID}
                        type="line"
                        beforeId={pointFeatures.length > 0 ? ASSET_SYMBOL_LAYER_ID : undefined}
                        paint={{
                            'line-color': ['get', 'lineColor'],
                            'line-width': ['get', 'lineWidth'],
                        }}
                    />
                </Source>
            )}
            {hoveredAsset && tooltipPosition && (
                <div
                    style={{
                        position: 'absolute',
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translate(-50%, -100%)',
                        marginTop: -22,
                        zIndex: 1000,
                        pointerEvents: 'none',
                    }}
                >
                    <AssetTooltip element={hoveredAsset} assetCategories={assetCategories} />
                </div>
            )}
        </>
    );
};

export default AssetLayers;
