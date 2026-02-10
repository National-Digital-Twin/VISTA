import type { Feature, FeatureCollection, Point } from 'geojson';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';
import ResourceTooltip from './panels/ResourceTooltip';
import useSpriteRegistration from './hooks/useSpriteRegistration';
import { STOCK_LEVEL_COLORS, getStockLevel } from '@/utils/stockLevels';
import type { StockLevel } from '@/utils/stockLevels';
import type { ResourceLocation, ResourceType } from '@/api/resources';

const SOURCE_ID = 'resource-locations-source';
const SYMBOL_LAYER_ID = 'resource-locations-symbol-layer';

const SQUARE_SIZE = 36;
const BORDER_WIDTH = 3;
const DARK_BG = '#1a1a2e';
const SELECTION_BORDER = 3;
const ICON_SIZE = SQUARE_SIZE / 2;

const SANDBAG_WIDTH = 52;
const SANDBAG_HEIGHT = 46;

type MarkerStyle = {
    stockLevel: StockLevel;
    isSelected: boolean;
};

const MARKER_STYLES = new Map<string, MarkerStyle>(
    (['low', 'medium', 'high'] as StockLevel[]).flatMap((stockLevel) =>
        [false, true].map((isSelected) => [`resource-${stockLevel}${isSelected ? '-selected' : ''}`, { stockLevel, isSelected }] as const),
    ),
);

const sandbag = (x: number, y: number, w: number, h: number): string => {
    const r = 3;
    return `M${x + r},${y}H${x + w - r}A${r},${r},0,0,1,${x + w},${y + r}V${y + h - r}A${r},${r},0,0,1,${x + w - r},${y + h}H${x + r}A${r},${r},0,0,1,${x},${y + h - r}V${y + r}A${r},${r},0,0,1,${x + r},${y}Z`;
};

const SANDBAG_PATH = [
    sandbag(0, 0, 16, 10),
    sandbag(18, 0, 16, 10),
    sandbag(36, 0, 16, 10),
    sandbag(0, 12, 7, 10),
    sandbag(9, 12, 16, 10),
    sandbag(27, 12, 16, 10),
    sandbag(45, 12, 7, 10),
    sandbag(0, 24, 16, 10),
    sandbag(18, 24, 16, 10),
    sandbag(36, 24, 16, 10),
    sandbag(0, 36, 7, 10),
    sandbag(9, 36, 16, 10),
    sandbag(27, 36, 16, 10),
    sandbag(45, 36, 7, 10),
].join(' ');

interface ResourceLayersProps {
    resourceTypes?: ResourceType[];
    mapReady: boolean;
    onLocationClick?: (locationId: string) => void;
    onLocationDoubleClick?: (locationId: string) => void;
    selectedLocationId?: string;
}

const createSandbagIcon = (centerX: number, centerY: number, iconSize: number): string => {
    const scale = iconSize / Math.max(SANDBAG_WIDTH, SANDBAG_HEIGHT);
    const offsetX = centerX - (SANDBAG_WIDTH * scale) / 2;
    const offsetY = centerY - (SANDBAG_HEIGHT * scale) / 2;
    return `<g transform="translate(${offsetX},${offsetY}) scale(${scale})"><path d="${SANDBAG_PATH}" fill="#ffffff"/></g>`;
};

async function generateResourceMarkerSprite(style: MarkerStyle): Promise<HTMLCanvasElement> {
    const size = style.isSelected ? SQUARE_SIZE + SELECTION_BORDER * 2 : SQUARE_SIZE;
    const stockColor = STOCK_LEVEL_COLORS[style.stockLevel];
    const center = size / 2;

    let layers: string;
    if (style.isSelected) {
        const stockInset = SELECTION_BORDER;
        const stockSize = size - SELECTION_BORDER * 2;
        const darkInset = SELECTION_BORDER + BORDER_WIDTH;
        const darkSize = size - (SELECTION_BORDER + BORDER_WIDTH) * 2;
        layers = `
            <rect x="0" y="0" width="${size}" height="${size}" rx="10" fill="#3b82f6"/>
            <rect x="${stockInset}" y="${stockInset}" width="${stockSize}" height="${stockSize}" rx="8" fill="${stockColor}"/>
            <rect x="${darkInset}" y="${darkInset}" width="${darkSize}" height="${darkSize}" rx="6" fill="${DARK_BG}"/>
            ${createSandbagIcon(center, center, ICON_SIZE)}`;
    } else {
        const darkInset = BORDER_WIDTH;
        const darkSize = size - BORDER_WIDTH * 2;
        layers = `
            <rect x="0" y="0" width="${size}" height="${size}" rx="8" fill="${stockColor}"/>
            <rect x="${darkInset}" y="${darkInset}" width="${darkSize}" height="${darkSize}" rx="6" fill="${DARK_BG}"/>
            ${createSandbagIcon(center, center, ICON_SIZE)}`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${layers}</svg>`;

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

const getFeatureId = (event: MapLayerMouseEvent): string | null => event.features?.[0]?.properties?.id ?? null;

function createLocationFeature(location: ResourceLocation, type: ResourceType, selectedLocationId?: string): Feature<Point> {
    const [lng, lat] = location.geometry.coordinates;
    const stockLevel = getStockLevel(location.currentStock, location.maxCapacity);
    const isSelected = selectedLocationId === location.id;
    const markerId = `resource-${stockLevel}${isSelected ? '-selected' : ''}`;

    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [lng, lat],
        },
        properties: {
            id: location.id,
            name: location.name,
            currentStock: location.currentStock,
            maxCapacity: location.maxCapacity,
            typeName: type.name,
            unit: type.unit,
            markerId,
        },
    };
}

const ResourceLayers = ({ resourceTypes, mapReady, onLocationClick, onLocationDoubleClick, selectedLocationId }: ResourceLayersProps) => {
    const mapContext = useMap();
    const mapInstance = mapContext?.['map-v2'] || mapContext?.default || null;

    useSpriteRegistration(mapReady, MARKER_STYLES, generateResourceMarkerSprite);

    const visibleLocations = useMemo(() => {
        if (!resourceTypes) {
            return [];
        }

        return resourceTypes.filter((type) => type.isActive).flatMap((type) => type.locations.map((loc) => ({ location: loc, type })));
    }, [resourceTypes]);

    const featureCollection: FeatureCollection<Point> = useMemo(
        () => ({
            type: 'FeatureCollection',
            features: visibleLocations.map(({ location, type }) => createLocationFeature(location, type, selectedLocationId)),
        }),
        [visibleLocations, selectedLocationId],
    );

    const [hoveredFeature, setHoveredFeature] = useState<Record<string, string | number> | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

    const handleMouseMove = useCallback(
        (event: MapLayerMouseEvent) => {
            if (!mapInstance) {
                return;
            }
            mapInstance.getMap().getCanvas().style.cursor = 'pointer';

            const feature = event.features?.[0];
            if (feature?.properties) {
                setHoveredFeature(feature.properties as Record<string, string | number>);
                setTooltipPosition({ x: event.point.x, y: event.point.y });
            } else {
                setHoveredFeature(null);
                setTooltipPosition(null);
            }
        },
        [mapInstance],
    );

    const handleMouseLeave = useCallback(() => {
        if (!mapInstance) {
            return;
        }
        mapInstance.getMap().getCanvas().style.cursor = '';
        setHoveredFeature(null);
        setTooltipPosition(null);
    }, [mapInstance]);

    useEffect(() => {
        if (!mapInstance || !mapReady) {
            return;
        }

        const map = mapInstance.getMap();

        const handleClick = onLocationClick
            ? (event: MapLayerMouseEvent) => {
                  const locationId = getFeatureId(event);
                  if (locationId) {
                      onLocationClick(locationId);
                  }
              }
            : null;

        const handleDblClick = onLocationDoubleClick
            ? (event: MapLayerMouseEvent) => {
                  const locationId = getFeatureId(event);
                  if (locationId) {
                      event.preventDefault();
                      onLocationDoubleClick(locationId);
                  }
              }
            : null;

        if (handleClick) {
            map.on('click', SYMBOL_LAYER_ID, handleClick);
        }
        if (handleDblClick) {
            map.on('dblclick', SYMBOL_LAYER_ID, handleDblClick);
        }
        map.on('mousemove', SYMBOL_LAYER_ID, handleMouseMove);
        map.on('mouseleave', SYMBOL_LAYER_ID, handleMouseLeave);

        return () => {
            if (handleClick) {
                map.off('click', SYMBOL_LAYER_ID, handleClick);
            }
            if (handleDblClick) {
                map.off('dblclick', SYMBOL_LAYER_ID, handleDblClick);
            }
            map.off('mousemove', SYMBOL_LAYER_ID, handleMouseMove);
            map.off('mouseleave', SYMBOL_LAYER_ID, handleMouseLeave);
        };
    }, [mapInstance, mapReady, onLocationClick, onLocationDoubleClick, handleMouseMove, handleMouseLeave]);

    useEffect(() => {
        if (!mapInstance || !mapReady) {
            return;
        }

        const hideTooltip = () => {
            setHoveredFeature(null);
            setTooltipPosition(null);
        };

        const map = mapInstance.getMap();
        map.on('move', hideTooltip);

        return () => {
            map.off('move', hideTooltip);
        };
    }, [mapInstance, mapReady]);

    if (!mapReady || !featureCollection.features.length) {
        return null;
    }

    return (
        <>
            <Source id={SOURCE_ID} type="geojson" data={featureCollection}>
                <Layer
                    id={SYMBOL_LAYER_ID}
                    type="symbol"
                    layout={{
                        'icon-image': ['get', 'markerId'],
                        'icon-size': 1,
                        'icon-allow-overlap': true,
                        'icon-pitch-alignment': 'viewport',
                        'icon-rotation-alignment': 'viewport',
                    }}
                />
            </Source>
            {hoveredFeature && tooltipPosition && (
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
                    <ResourceTooltip
                        name={String(hoveredFeature.name)}
                        typeName={String(hoveredFeature.typeName)}
                        currentStock={Number(hoveredFeature.currentStock)}
                        maxCapacity={Number(hoveredFeature.maxCapacity)}
                        unit={String(hoveredFeature.unit)}
                    />
                </div>
            )}
        </>
    );
};

export default ResourceLayers;
