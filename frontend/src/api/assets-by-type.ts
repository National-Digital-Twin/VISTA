// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Geometry } from 'geojson';
import { parseGeometryWithLocation } from './geometry-parser';
import config from '@/config/app-config';

export type AssetIcon = {
    classUri: string;
    color: string;
    backgroundColor: string;
    iconFallbackText: string;
    alt: string;
    faIcon?: string;
};

export type AssetTypeResponse = {
    id: string;
    name: string;
    geom: string;
    type: {
        id: string;
        name: string;
    };
};

export type Asset = {
    id: string;
    type: string;
    name?: string;
    lat: number | undefined;
    lng: number | undefined;
    geometry: Geometry;
    dependent: {
        count?: number;
        criticalitySum: number;
    };
    description?: string;
    styles: AssetIcon;
    elementType: 'asset';
    state?: 'Live' | 'Static';
    classification?: string;
};

export const fetchAssetsByType = async (assetTypeId: string, iconMap?: Map<string, string>): Promise<Asset[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/assets/?asset_type=${encodeURIComponent(assetTypeId)}`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to retrieve assets for type ${assetTypeId}: ${response.statusText}`);
    }

    const data: AssetTypeResponse[] = await response.json();

    return data.map((item) => {
        const { lat, lng, geometry } = parseGeometryWithLocation(item.geom);
        const icon = iconMap?.get(item.type.id);
        const iconName = icon?.replace('fa-', '');

        const defaultIconStyles: AssetIcon = {
            classUri: item.type.id,
            color: '#DDDDDD',
            backgroundColor: '#121212',
            faIcon: icon,
            iconFallbackText: iconName || '?',
            alt: item.type.name,
        };

        return {
            id: item.id,
            type: item.type.id,
            name: item.name,
            lat,
            lng,
            geometry,
            dependent: {
                count: 0,
                criticalitySum: 0,
            },
            styles: defaultIconStyles,
            elementType: 'asset' as const,
        };
    });
};
