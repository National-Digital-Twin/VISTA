// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchAssetsByType, type Asset } from '@/api/assets-by-type';

export type UseAssetsByTypeOptions = {
    selectedAssetTypeIds: string[];
    iconMap?: Map<string, string>;
};

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
