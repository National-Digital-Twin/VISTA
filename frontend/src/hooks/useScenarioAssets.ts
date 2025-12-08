import { useQuery } from '@tanstack/react-query';
import { fetchScenarioAssets } from '@/api/scenario-assets';

export type UseScenarioAssetsOptions = {
    scenarioId: string | undefined;
    excludeMapWide?: boolean;
    iconMap?: Map<string, string>;
};

export const useScenarioAssets = ({ scenarioId, excludeMapWide, iconMap }: UseScenarioAssetsOptions) => {
    const query = useQuery({
        queryKey: ['scenarioAssets', scenarioId, excludeMapWide],
        queryFn: () => fetchScenarioAssets({ scenarioId: scenarioId!, excludeMapWide, iconMap }),
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
