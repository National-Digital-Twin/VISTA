// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Asset } from '@/api/assets-by-type';
import { fetchScenarioAssets } from '@/api/scenario-assets';

export type UseMultipleFocusAreaAssetsOptions = {
    scenarioId: string | undefined;
    focusAreaIds: string[];
    iconMap?: Map<string, string>;
};

export const useMultipleFocusAreaAssets = ({ scenarioId, focusAreaIds, iconMap }: UseMultipleFocusAreaAssetsOptions) => {
    const queries = useQueries({
        queries: focusAreaIds.map((focusAreaId) => ({
            queryKey: ['scenarioAssets', scenarioId, focusAreaId],
            queryFn: () => fetchScenarioAssets({ scenarioId: scenarioId!, focusAreaId, iconMap }),
            enabled: !!scenarioId && focusAreaIds.length > 0,
            staleTime: 0,
            refetchOnMount: true,
        })),
    });

    const assets = useMemo(() => {
        const allAssets: Asset[] = [];
        const seenAssetIds = new Set<string>();

        for (const query of queries) {
            if (query.data) {
                for (const asset of query.data) {
                    if (!seenAssetIds.has(asset.id)) {
                        seenAssetIds.add(asset.id);
                        allAssets.push(asset);
                    }
                }
            }
        }

        return allAssets;
    }, [queries]);

    const isLoading = queries.some((query) => query.isLoading);
    const isFetching = queries.some((query) => query.isFetching);
    const hasError = queries.some((query) => query.isError);
    const errors = queries.filter((query) => query.isError).map((query) => query.error);

    return {
        assets,
        isLoading,
        isFetching,
        hasError,
        errors,
    };
};
