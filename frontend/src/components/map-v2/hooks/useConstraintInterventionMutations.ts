// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Geometry } from 'geojson';
import {
    createConstraintIntervention,
    updateConstraintIntervention,
    deleteConstraintIntervention,
    type UpdateConstraintInterventionRequest,
} from '@/api/constraint-interventions';

type UseConstraintInterventionMutationsOptions = {
    readonly scenarioId: string | undefined;
    readonly onError?: (message: string) => void;
};

const useConstraintInterventionMutations = ({ scenarioId, onError }: UseConstraintInterventionMutationsOptions) => {
    const queryClient = useQueryClient();

    const invalidateConstraintList = () => {
        queryClient.invalidateQueries({ queryKey: ['constraintInterventions', scenarioId] });
    };

    const invalidateRoutes = () => {
        queryClient.invalidateQueries({ queryKey: ['roadRoute', scenarioId] });
    };

    const createMutation = useMutation({
        mutationFn: ({ typeId, geometry }: { typeId: string; geometry: Geometry }) => createConstraintIntervention(scenarioId!, { typeId, geometry }),
        onSuccess: () => {
            invalidateConstraintList();
            invalidateRoutes();
        },
        onError: () => onError?.('Failed to create constraint'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ interventionId, data }: { interventionId: string; data: UpdateConstraintInterventionRequest }) =>
            updateConstraintIntervention(scenarioId!, interventionId, data),
        onSuccess: (_data, variables) => {
            invalidateConstraintList();
            if (variables.data.geometry !== undefined) {
                invalidateRoutes();
            }
        },
        onError: () => onError?.('Failed to update constraint'),
    });

    const deleteMutation = useMutation({
        mutationFn: (interventionId: string) => deleteConstraintIntervention(scenarioId!, interventionId),
        onSuccess: () => {
            invalidateConstraintList();
            invalidateRoutes();
        },
        onError: () => onError?.('Failed to delete constraint'),
    });

    return {
        createConstraint: createMutation.mutate,
        updateConstraint: updateMutation.mutate,
        deleteConstraint: deleteMutation.mutate,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
};

export default useConstraintInterventionMutations;
