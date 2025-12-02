import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchAssetsByType } from '@/api/assets-by-type';
import type { Asset } from '@/models';

export interface UseAssetsByTypeOptions {
    readonly selectedAssetTypeIds: string[];
    readonly iconMap?: Map<string, string>;
}

export const useAssetsByType = ({ selectedAssetTypeIds, iconMap }: UseAssetsByTypeOptions) => {
    const queries = useQueries({
        queries: selectedAssetTypeIds.map((typeId) => ({
            queryKey: ['assetsByType', typeId],
            queryFn: () => fetchAssetsByType(typeId, iconMap),
            staleTime: 5 * 60 * 1000,
        })),
    });

    const assets = useMemo(() => {
        const allAssets: Asset[] = [];
        queries.forEach((query) => {
            if (query.data) {
                allAssets.push(...query.data);
            }
        });
        return allAssets;
    }, [queries]);

    const emptyResults = useMemo(() => {
        const empty: string[] = [];
        queries.forEach((query, index) => {
            if (query.data?.length === 0 && !query.isLoading && !query.isError) {
                empty.push(selectedAssetTypeIds[index]);
            }
        });
        return empty;
    }, [queries, selectedAssetTypeIds]);

    const isLoading = queries.some((query) => query.isLoading);
    const hasError = queries.some((query) => query.isError);
    const errors = queries.filter((query) => query.isError).map((query) => query.error);

    return {
        assets,
        isLoading,
        hasError,
        errors,
        emptyResults,
    };
};
