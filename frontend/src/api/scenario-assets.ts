// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Geometry } from 'geojson';
import type { Asset, AssetIcon } from './assets-by-type';
import { getLocationFromGeometry } from './geometry-parser';
import config from '@/config/app-config';

type ScenarioAssetResponse = {
    id: string;
    name: string;
    geometry: Geometry;
    type: {
        id: string;
        name: string;
    };
};

export type FetchScenarioAssetsOptions = {
    scenarioId: string;
    focusAreaId?: string | null;
    iconMap?: Map<string, string>;
};

export const fetchScenarioAssets = async ({ scenarioId, focusAreaId, iconMap }: FetchScenarioAssetsOptions): Promise<Asset[]> => {
    let url = `${config.services.apiBaseUrl}/scenarios/${scenarioId}/assets/`;
    if (focusAreaId) {
        url += `?focus_area_id=${encodeURIComponent(focusAreaId)}`;
    }

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch scenario assets: ${response.statusText}`);
    }

    const data: ScenarioAssetResponse[] = await response.json();

    return data.map((item) => {
        const location = getLocationFromGeometry(item.geometry);
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
            lat: location?.lat,
            lng: location?.lng,
            geometry: item.geometry,
            dependent: {
                count: 0,
                criticalitySum: 0,
            },
            styles: defaultIconStyles,
            elementType: 'asset' as const,
        };
    });
};
