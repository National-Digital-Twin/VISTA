// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Feature, Geometry, Position } from 'geojson';
import type { ElementLike } from './elementUtils';
import type { Asset } from '@/api/assets-by-type';

export function createPointFeature(asset: Asset): Feature | null {
    if (!asset.lat || !asset.lng) {
        return null;
    }

    return {
        type: 'Feature',
        properties: {
            id: asset.id,
            criticality: asset.dependent.criticalitySum,
            type: asset.type,
        },
        geometry: {
            type: 'Point',
            coordinates: [asset.lng, asset.lat],
        },
    };
}

export function getLinearGeometry(geometry: Geometry): Geometry {
    if (geometry.type === 'LineString') {
        return {
            type: 'LineString',
            coordinates: geometry.coordinates as Position[],
        };
    } else if (geometry.type === 'MultiLineString') {
        return {
            type: 'MultiLineString',
            coordinates: geometry.coordinates as Position[][],
        };
    } else {
        return geometry;
    }
}

export function createLinearFeature(asset: Asset, selectedElements: ElementLike[], criticalityColor?: string): Feature | null {
    const geometry = getLinearGeometry(asset.geometry);
    if (asset.geometry.type === 'MultiLineString' || asset.geometry.type === 'LineString') {
        const isSelected = selectedElements.some((selectedElement) => selectedElement.id === asset.id);

        return {
            type: 'Feature',
            properties: {
                id: asset.id,
                criticality: asset.dependent.criticalitySum,
                lineColor: criticalityColor || '#00AA00',
                lineWidth: isSelected ? 4 : 3,
                selected: isSelected,
            },
            geometry: geometry,
        };
    }
    return null;
}

export type AssetDetails = {
    title: string;
    criticality: number;
    type: string;
    desc?: string;
    criticalityColor?: string;
    id: string;
    elementType: 'asset';
};

export function formatAssetDetails(asset: Asset, assetInfo?: { name?: string; assetType?: string; desc?: string }, criticalityColor?: string): AssetDetails {
    const titleFromInfo = assetInfo?.name && assetInfo.name.trim() !== '' ? assetInfo.name : undefined;
    const titleFromAsset = asset.name && asset.name.trim() !== '' ? asset.name : undefined;
    const title = titleFromInfo ?? titleFromAsset ?? (asset.id ? String(asset.id) : 'Name unknown');

    return {
        title,
        criticality: asset.dependent.criticalitySum,
        type: assetInfo?.assetType ?? asset.type,
        desc: assetInfo?.desc ?? asset.description,
        criticalityColor,
        id: asset.id,
        elementType: asset.elementType,
    };
}
