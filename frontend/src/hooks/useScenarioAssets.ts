import { useQuery } from '@tanstack/react-query';
import { fetchScenarioAssets } from '@/api/scenario-assets';

export type UseScenarioAssetsOptions = {
    scenarioId: string | undefined;
    iconMap?: Map<string, string>;
};

export const useScenarioAssets = ({ scenarioId, iconMap }: UseScenarioAssetsOptions) => {
    const query = useQuery({
        queryKey: ['scenarioAssets', scenarioId],
        queryFn: () => fetchScenarioAssets({ scenarioId: scenarioId!, iconMap }),
        enabled: !!scenarioId,
        staleTime: 5 * 60 * 1000,
    });

    return {
        assets: query.data ?? [],
        isLoading: query.isLoading,
        hasError: query.isError,
        error: query.error,
    };
};
