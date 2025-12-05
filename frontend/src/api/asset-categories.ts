import config from '@/config/app-config';

export type AssetType = {
    id: string;
    name: string;
    icon?: string;
};

export type SubCategory = {
    id: string;
    name: string;
    assetTypes: AssetType[];
};

export type AssetCategory = {
    id: string;
    name: string;
    subCategories: SubCategory[];
};

export const fetchAssetCategories = async (): Promise<AssetCategory[]> => {
    const response = await fetch(`${config.services.apiBaseUrl}/assetcategories/`, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Failed to retrieve asset categories: ${response.statusText}`);
    }

    return await response.json();
};
