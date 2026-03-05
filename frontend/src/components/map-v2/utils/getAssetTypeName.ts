// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

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
