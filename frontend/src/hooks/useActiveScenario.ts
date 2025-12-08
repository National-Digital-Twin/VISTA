import { useQuery } from '@tanstack/react-query';
import { fetchScenarios, type Scenario } from '@/api/scenarios';

export const useActiveScenario = () => {
    return useQuery<Scenario[], Error, Scenario | undefined>({
        queryKey: ['scenarios'],
        queryFn: fetchScenarios,
        staleTime: 5 * 60 * 1000,
        select: (scenarios) => scenarios.find((s) => s.isActive),
    });
};
