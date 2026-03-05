// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

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
