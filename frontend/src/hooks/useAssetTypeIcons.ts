import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchAssetCategories } from '@/api/asset-categories';

export const useAssetTypeIcons = () => {
    const { data: assetCategories } = useQuery({
        queryKey: ['assetCategories'],
        queryFn: fetchAssetCategories,
        staleTime: 5 * 60 * 1000,
    });

    const iconMap = useMemo(() => {
        const map = new Map<string, string>();
        if (!assetCategories) {
            return map;
        }

        for (const category of assetCategories) {
            for (const subCategory of category.subCategories) {
                for (const assetType of subCategory.assetTypes) {
                    if (assetType.icon) {
                        map.set(assetType.id, assetType.icon);
                    }
                }
            }
        }

        return map;
    }, [assetCategories]);

    return iconMap;
};
