// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { withdrawStock, restockLocation, toggleResourceTypeVisibility } from '@/api/resources';

type UseResourceMutationsOptions = {
    readonly scenarioId: string | undefined;
    readonly onError?: (message: string) => void;
};

const useResourceMutations = ({ scenarioId, onError }: UseResourceMutationsOptions) => {
    const queryClient = useQueryClient();

    const invalidateResourceQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['resourceInterventions', scenarioId] });
        queryClient.invalidateQueries({ queryKey: ['resourceInterventionLocation', scenarioId] });
    };

    const withdrawMutation = useMutation({
        mutationFn: ({ locationId, quantity }: { locationId: string; quantity: number }) => withdrawStock(scenarioId!, locationId, quantity),
        onSuccess: invalidateResourceQueries,
        onError: () => onError?.('Failed to withdraw stock'),
    });

    const restockMutation = useMutation({
        mutationFn: ({ locationId, quantity }: { locationId: string; quantity: number }) => restockLocation(scenarioId!, locationId, quantity),
        onSuccess: invalidateResourceQueries,
        onError: () => onError?.('Failed to restock location'),
    });

    const toggleVisibilityMutation = useMutation({
        mutationFn: ({ resourceTypeId, isActive }: { resourceTypeId: string; isActive: boolean }) =>
            toggleResourceTypeVisibility(scenarioId!, resourceTypeId, isActive),
        onSuccess: invalidateResourceQueries,
        onError: () => onError?.('Failed to toggle visibility'),
    });

    return {
        withdrawStock: withdrawMutation.mutate,
        restockLocation: restockMutation.mutate,
        toggleVisibility: toggleVisibilityMutation.mutate,
        isMutating: withdrawMutation.isPending || restockMutation.isPending || toggleVisibilityMutation.isPending,
    };
};

export default useResourceMutations;
