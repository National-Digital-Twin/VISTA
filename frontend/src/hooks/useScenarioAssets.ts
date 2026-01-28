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
