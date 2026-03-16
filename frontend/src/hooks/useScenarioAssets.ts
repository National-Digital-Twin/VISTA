// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useQuery } from '@tanstack/react-query';
import { fetchScenarioAssets } from '@/api/scenario-assets';

export type UseScenarioAssetsOptions = {
    scenarioId: string | undefined;
    focusAreaId?: string | null;
    iconMap?: Map<string, string>;
};

export const useScenarioAssets = ({ scenarioId, focusAreaId, iconMap }: UseScenarioAssetsOptions) => {
    const query = useQuery({
        queryKey: ['scenarioAssets', scenarioId, focusAreaId ?? 'all'],
        queryFn: () => fetchScenarioAssets({ scenarioId: scenarioId!, focusAreaId, iconMap }),
        enabled: !!scenarioId,
        staleTime: 0,
        refetchOnMount: 'always',
    });

    return {
        assets: query.data ?? [],
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        hasError: query.isError,
        error: query.error,
    };
};
