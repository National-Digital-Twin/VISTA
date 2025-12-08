import { useCallback, useMemo, useEffect, memo, useState } from 'react';
import { Layer, Source, Marker, useMap } from 'react-map-gl/maplibre';
import type { Feature } from 'geojson';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isIconPreloaded } from './hooks/usePreloadAssetIcons';
import AssetTooltip from './panels/AssetTooltip';
import { findElement } from '@/utils';
import { createPointFeature, createLinearFeature } from '@/utils/assetUtils';
import type { Asset } from '@/api/assets-by-type';
import type { AssetCategory } from '@/api/asset-categories';

const SOURCE_ID = 'map-v2-asset-source';
const LINE_SOURCE_ID = 'map-v2-asset-line-source';
const LAYER_ID = 'map-v2-asset-layer';
const LINE_LAYER_ID = 'map-v2-asset-line-layer';
const CIRCLE_RADIUS = 12;
const SELECTED_STROKE_COLOR = '#FFFD04';
const SELECTED_STROKE_WIDTH = 2;
const DEFAULT_BACKGROUND_COLOR = '#000000';
const MARKER_BORDER_COLOR = '#FFFD04';
const DEFAULT_LINE_COLOR = '#00AA00';
const DEFAULT_LINE_WIDTH = 3;

export type AssetLayersProps = {
    assets: Asset[];
    selectedElements?: Asset[];
    onElementClick?: (elements: Asset[]) => void;
    mapReady?: boolean;
    assetCategories?: AssetCategory[];
};

const AssetLayers = ({ assets, selectedElements = [], onElementClick, mapReady, assetCategories }: AssetLayersProps) => {
    const mapContext = useMap();
    const mapInstance = mapContext?.['map-v2'] || mapContext?.default || null;

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
            const backgroundColor = asset?.styles?.backgroundColor || DEFAULT_BACKGROUND_COLOR;
            const isSelected = selectedElementIds.has(id);

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    backgroundColor,
                    circleStrokeColor: isSelected ? SELECTED_STROKE_COLOR : backgroundColor,
                    circleStrokeWidth: isSelected ? SELECTED_STROKE_WIDTH : 0,
                },
            };
        });

        return { type: 'FeatureCollection' as const, features: enhancedFeatures };
    }, [pointFeatures, assetMap, selectedElementIds]);

    const handleMapClick = useCallback(
        (event: { lngLat: { lng: number; lat: number }; point: { x: number; y: number } }) => {
            if (!mapInstance || !onElementClick) {
                return;
            }

            const map = mapInstance.getMap();
            const featuresAtPoint = map.queryRenderedFeatures([event.point.x, event.point.y], {
                layers: [LAYER_ID, LINE_LAYER_ID],
            });

            if (featuresAtPoint.length === 0) {
                return;
            }

            const clickedFeature = featuresAtPoint[0] as Feature;
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
        [mapInstance, onElementClick, assets],
    );

    useEffect(() => {
        if (!mapInstance || !mapReady) {
            return;
        }

        const map = mapInstance.getMap();
        map.on('click', LAYER_ID, handleMapClick);
        map.on('click', LINE_LAYER_ID, handleMapClick);

        return () => {
            map.off('click', LAYER_ID, handleMapClick);
            map.off('click', LINE_LAYER_ID, handleMapClick);
        };
    }, [mapInstance, mapReady, handleMapClick]);

    if (!mapReady || (pointFeatures.length === 0 && linearFeatures.length === 0)) {
        return null;
    }

    return (
        <>
            {pointFeatures.length > 0 && (
                <Source id={SOURCE_ID} type="geojson" data={featureCollection} generateId>
                    <Layer
                        id={LAYER_ID}
                        type="circle"
                        paint={{
                            'circle-radius': CIRCLE_RADIUS,
                            'circle-color': ['get', 'backgroundColor'],
                            'circle-stroke-color': ['get', 'circleStrokeColor'],
                            'circle-stroke-width': ['get', 'circleStrokeWidth'],
                        }}
                    />
                    {pointFeatures.map((feature) => {
                        const id = feature.properties?.id;
                        if (!id) {
                            return null;
                        }

                        const asset = assetMap.get(id);
                        const iconStyles = asset?.styles;

                        return (
                            <AssetMarker
                                key={id}
                                feature={feature}
                                isSelected={selectedElementIds.has(id)}
                                iconStyles={iconStyles}
                                asset={asset}
                                onElementClick={onElementClick}
                                assetCategories={assetCategories}
                            />
                        );
                    })}
                </Source>
            )}
            {linearFeatures.length > 0 && (
                <Source id={LINE_SOURCE_ID} type="geojson" data={lineFeatureCollection} generateId>
                    <Layer
                        id={LINE_LAYER_ID}
                        type="line"
                        paint={{
                            'line-color': ['get', 'lineColor'],
                            'line-width': ['get', 'lineWidth'],
                        }}
                    />
                </Source>
            )}
        </>
    );
};

type AssetMarkerProps = {
    feature: Feature;
    isSelected: boolean;
    iconStyles?: Asset['styles'];
    asset: Asset | undefined;
    onElementClick?: (elements: Asset[]) => void;
    assetCategories?: AssetCategory[];
};

const AssetMarker = memo(({ feature, isSelected, iconStyles: providedIconStyles, asset, onElementClick, assetCategories }: AssetMarkerProps) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const iconStyles = providedIconStyles || asset?.styles;

    const coordinates = feature.geometry.type === 'Point' ? feature.geometry.coordinates : null;
    if (!coordinates || coordinates.length < 2) {
        return null;
    }

    const [longitude, latitude] = coordinates;

    const backgroundColor = iconStyles?.backgroundColor || DEFAULT_BACKGROUND_COLOR;
    const color = iconStyles?.color || '#ffffff';
    const faIcon = iconStyles?.faIcon || '';
    const iconFallbackText = iconStyles?.iconFallbackText || '?';

    const fontAwesomeIconName = faIcon ? faIcon.split(' ').pop()?.replace('fa-', '') || null : null;
    const hasAvailableFontAwesomeIcon = fontAwesomeIconName ? isIconPreloaded(fontAwesomeIconName) : false;

    const iconElement =
        hasAvailableFontAwesomeIcon && fontAwesomeIconName ? (
            <FontAwesomeIcon icon={['fas', fontAwesomeIconName] as never} style={{ fontSize: '12px' }} />
        ) : (
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{iconFallbackText}</span>
        );

    const ariaLabel = asset?.name || 'Asset marker';

    return (
        <Marker longitude={longitude} latitude={latitude} style={{ cursor: 'pointer', zIndex: showTooltip ? 100 : 1 }}>
            <button
                type="button"
                aria-label={ariaLabel}
                style={{
                    position: 'relative',
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (asset && onElementClick) {
                        onElementClick([asset]);
                    }
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (asset && onElementClick) {
                            onElementClick([asset]);
                        }
                    }
                }}
            >
                {showTooltip && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '8px',
                            zIndex: 1000,
                            pointerEvents: 'none',
                        }}
                    >
                        {asset && <AssetTooltip element={asset} assetCategories={assetCategories} />}
                    </div>
                )}
                <div
                    style={{
                        backgroundColor,
                        color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        borderWidth: isSelected ? '3px' : '2px',
                        borderStyle: 'solid',
                        borderColor: isSelected ? SELECTED_STROKE_COLOR : MARKER_BORDER_COLOR,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '1px',
                        aspectRatio: '1',
                        padding: '5px',
                        boxShadow: isSelected
                            ? '0 0 10px rgba(255, 253, 4, 0.8), 0 0 20px rgba(255, 253, 4, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2)'
                            : '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    {iconElement}
                </div>
            </button>
        </Marker>
    );
});

export default AssetLayers;
