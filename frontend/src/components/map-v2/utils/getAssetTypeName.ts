import type { AssetCategory } from '@/api/asset-categories';

export const getAssetTypeName = (typeId: string, assetCategories?: AssetCategory[]): string | null => {
    if (!assetCategories) {
        return null;
    }
    for (const category of assetCategories) {
        for (const subCategory of category.subCategories) {
            const assetType = subCategory.assetTypes.find((at) => at.id === typeId);
            if (assetType) {
                return assetType.name;
            }
        }
    }
    return null;
};
