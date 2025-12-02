import { createApiEndpoint, fetchOptions } from './utils';
import { parseGeometryWithLocation } from './geometry-parser';
import Asset from '@/models/Asset';
import type { FoundIcon } from '@/hooks/useFindIcon';

export interface AssetTypeResponse {
    readonly id: string;
    readonly name: string;
    readonly geom: string;
    readonly type: {
        readonly id: string;
        readonly name: string;
    };
}

export const fetchAssetsByType = async (assetTypeId: string, iconMap?: Map<string, string>): Promise<Asset[]> => {
    try {
        const response = await fetch(`${createApiEndpoint('assets/')}?asset_type=${encodeURIComponent(assetTypeId)}`, fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to retrieve assets for type ${assetTypeId}: ${response.statusText}`);
        }

        const data: AssetTypeResponse[] = await response.json();

        return data.map((item) => {
            const { lat, lng, geometry } = parseGeometryWithLocation(item.geom);
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

            return new Asset({
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
                secondaryCategory: item.type.name,
            });
        });
    } catch (error) {
        console.error(`Error fetching assets for type ${assetTypeId}:`, error);
        throw error;
    }
};
