import { useCallback, useMemo, useEffect, memo, useState } from 'react';
import { Layer, Source, Marker, useMap } from 'react-map-gl/maplibre';
import type { Feature } from 'geojson';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isIconPreloaded } from './hooks/usePreloadAssetIcons';
import AssetTooltip from './panels/AssetTooltip';
import { generatePointAssetFeatures } from '@/components/Map/map-utils';
import useFindIcon from '@/hooks/useFindIcon';
import { findElement } from '@/utils';
import type { Asset, Dependency, Element } from '@/models';

const SOURCE_ID = 'map-v2-asset-source';
const LAYER_ID = 'map-v2-asset-layer';
const CIRCLE_RADIUS = 12;
const SELECTED_STROKE_COLOR = '#FFFD04';
const SELECTED_STROKE_WIDTH = 2;
const DEFAULT_BACKGROUND_COLOR = '#000000';
const MARKER_BORDER_COLOR = '#FFFD04';

export interface AssetLayersProps {
    readonly assets: Asset[];
    readonly dependencies: Dependency[];
    readonly selectedAssetTypes: Record<string, boolean>;
    readonly selectedElements?: Element[];
    readonly onElementClick?: (elements: Element[]) => void;
    readonly mapReady?: boolean;
}

const AssetLayers = ({ assets, dependencies, selectedAssetTypes, selectedElements = [], onElementClick, mapReady }: AssetLayersProps) => {
    const mapContext = useMap();
    const mapInstance = mapContext?.['map-v2'] || mapContext?.default || null;

    const enabledTypesSet = useMemo(() => {
        return new Set(
            Object.entries(selectedAssetTypes)
                .filter(([, enabled]) => enabled)
                .map(([type]) => type),
        );
    }, [selectedAssetTypes]);

    const filteredAssets = useMemo(() => {
        return assets.filter((asset) => enabledTypesSet.has(asset.type));
    }, [assets, enabledTypesSet]);

    const selectedElementUris = useMemo(() => {
        return new Set(selectedElements.map((el) => el.uri));
    }, [selectedElements]);

    const assetMap = useMemo(() => {
        const map = new Map<string, Asset>();
        filteredAssets.forEach((asset) => {
            map.set(asset.uri, asset);
        });
        return map;
    }, [filteredAssets]);

    const features = useMemo(() => {
        return generatePointAssetFeatures(filteredAssets, dependencies, selectedElements);
    }, [filteredAssets, dependencies, selectedElements]);

    const pointFeatures = useMemo(() => {
        const points = features.filter((feature) => feature.geometry.type === 'Point');
        const seenUris = new Set<string>();
        return points.filter((feature) => {
            const uri = feature.properties?.uri;
            if (!uri) {
                return true;
            }
            if (seenUris.has(uri)) {
                return false;
            }
            seenUris.add(uri);
            return true;
        });
    }, [features]);

    const featureCollection = useMemo(() => {
        const enhancedFeatures = pointFeatures.map((feature) => {
            const uri = feature.properties?.uri || '';
            const asset = assetMap.get(uri);
            const backgroundColor = asset?.styles?.backgroundColor || DEFAULT_BACKGROUND_COLOR;
            const isSelected = selectedElementUris.has(uri);

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
    }, [pointFeatures, assetMap, selectedElementUris]);

    const handleMapClick = useCallback(
        (event: { lngLat: { lng: number; lat: number }; point: { x: number; y: number } }) => {
            if (!mapInstance || !onElementClick) {
                return;
            }

            const map = mapInstance.getMap();
            const featuresAtPoint = map.queryRenderedFeatures([event.point.x, event.point.y], {
                layers: [LAYER_ID],
            });

            if (featuresAtPoint.length === 0) {
                return;
            }

            const clickedFeature = featuresAtPoint[0] as Feature;
            const clickedUri = clickedFeature.properties?.uri;
            if (!clickedUri) {
                return;
            }

            const connectedDependencies = features.filter((feature) => {
                if (feature.geometry.type !== 'LineString') {
                    return false;
                }
                const dependent = feature.properties?.dependent;
                const provider = feature.properties?.provider;
                return dependent === clickedUri || provider === clickedUri;
            });

            const connectedAssetUris = new Set<string>();
            connectedDependencies.forEach((feature) => {
                const dependent = feature.properties?.dependent;
                const provider = feature.properties?.provider;
                if (dependent === clickedUri && provider) {
                    connectedAssetUris.add(provider);
                } else if (provider === clickedUri && dependent) {
                    connectedAssetUris.add(dependent);
                }
            });

            const connectedAssets = features.filter((feature) => {
                const uri = feature.properties?.uri;
                return uri && connectedAssetUris.has(uri);
            });

            const allFeatures = [clickedFeature, ...connectedAssets, ...connectedDependencies];
            const elements = allFeatures
                .map((feature) => findElement([...filteredAssets, ...dependencies], feature.properties?.uri))
                .filter((element): element is Element => element !== undefined);

            if (elements.length > 0) {
                onElementClick(elements);
            }
        },
        [mapInstance, onElementClick, features, filteredAssets, dependencies],
    );

    useEffect(() => {
        if (!mapInstance || !mapReady) {
            return;
        }

        const map = mapInstance.getMap();
        map.on('click', LAYER_ID, handleMapClick);

        return () => {
            map.off('click', LAYER_ID, handleMapClick);
        };
    }, [mapInstance, mapReady, handleMapClick]);

    if (!mapReady || pointFeatures.length === 0) {
        return null;
    }

    return (
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
                const uri = feature.properties?.uri;
                if (!uri) {
                    return null;
                }

                const asset = assetMap.get(uri);
                const iconStyles = asset?.styles;

                return <AssetMarker key={uri} feature={feature} isSelected={selectedElementUris.has(uri)} iconStyles={iconStyles} asset={asset} />;
            })}
        </Source>
    );
};

interface AssetMarkerProps {
    readonly feature: Feature;
    readonly isSelected: boolean;
    readonly iconStyles?: Asset['styles'];
    readonly asset: Asset | undefined;
}

const AssetMarker = memo(({ feature, isSelected, iconStyles: providedIconStyles, asset }: AssetMarkerProps) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const featureType = feature.properties?.type;
    const fallbackIconStyles = useFindIcon(featureType || '');
    const iconStyles = providedIconStyles || fallbackIconStyles;

    const coordinates = feature.geometry.type === 'Point' ? feature.geometry.coordinates : null;
    if (!coordinates || coordinates.length < 2) {
        return null;
    }

    const [longitude, latitude] = coordinates;

    const backgroundColor = iconStyles.backgroundColor || DEFAULT_BACKGROUND_COLOR;
    const color = iconStyles.color || '#ffffff';
    const faIcon = iconStyles.faIcon || '';
    const iconFallbackText = iconStyles.iconFallbackText || '';

    const fontAwesomeIconName = faIcon.split(' ').pop()?.replace('fa-', '') || null;
    const hasAvailableFontAwesomeIcon = fontAwesomeIconName ? isIconPreloaded(fontAwesomeIconName) : false;

    const iconElement =
        hasAvailableFontAwesomeIcon && fontAwesomeIconName ? (
            <FontAwesomeIcon icon={['fas', fontAwesomeIconName] as never} style={{ fontSize: '12px' }} />
        ) : (
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{iconFallbackText}</span>
        );

    return (
        <Marker longitude={longitude} latitude={latitude} style={{ cursor: 'pointer', zIndex: showTooltip ? 100 : 1 }}>
            <div
                style={{
                    position: 'relative',
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
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
                        {asset && <AssetTooltip element={asset} />}
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
            </div>
        </Marker>
    );
});

export default AssetLayers;
