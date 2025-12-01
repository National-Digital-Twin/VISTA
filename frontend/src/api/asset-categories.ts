import { createNdtpPythonEndpoint, fetchOptions } from './utils';

export interface AssetType {
    readonly id: string;
    readonly name: string;
    readonly icon?: string;
}

export interface SubCategory {
    readonly id: string;
    readonly name: string;
    readonly assetTypes: AssetType[];
}

export interface AssetCategory {
    readonly id: string;
    readonly name: string;
    readonly subCategories: SubCategory[];
}

export const fetchAssetCategories = async (): Promise<AssetCategory[]> => {
    try {
        const response = await fetch(createNdtpPythonEndpoint('assetcategories/'), fetchOptions);

        if (!response.ok) {
            throw new Error(`Failed to retrieve asset categories: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching asset categories:', error);
        throw error;
    }
};
