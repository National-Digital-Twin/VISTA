import type { Geometry } from 'geojson';

import type { Asset } from './assets-by-type';
import { getLocationFromGeometry } from './geometry-parser';
import config from '@/config/app-config';
import type { FoundIcon } from '@/hooks/useFindIcon';

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
    excludeMapWide?: boolean;
    iconMap?: Map<string, string>;
};

export const fetchScenarioAssets = async ({ scenarioId, excludeMapWide, iconMap }: FetchScenarioAssetsOptions): Promise<Asset[]> => {
    const params = new URLSearchParams();
    if (excludeMapWide) {
        params.set('exclude_map_wide', 'true');
    }

    const query = params.size ? `?${params}` : '';
    const url = `${config.services.apiBaseUrl}/scenarios/${scenarioId}/assets/${query}`;

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

        const defaultIconStyles: FoundIcon = {
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
