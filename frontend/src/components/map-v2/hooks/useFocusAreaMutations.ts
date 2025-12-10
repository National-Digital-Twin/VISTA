import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Geometry } from 'geojson';
import { createFocusArea, updateFocusArea, deleteFocusArea, type UpdateFocusAreaRequest } from '@/api/focus-areas';

type UseFocusAreaMutationsOptions = {
    readonly scenarioId: string | undefined;
    readonly onError?: (message: string) => void;
};

const useFocusAreaMutations = ({ scenarioId, onError }: UseFocusAreaMutationsOptions) => {
    const queryClient = useQueryClient();

    const invalidateFocusAreaList = () => {
        queryClient.invalidateQueries({ queryKey: ['focusAreas', scenarioId] });
        queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
    };

    const invalidateAssetTypesForFocusArea = (focusAreaId: string) => {
        queryClient.invalidateQueries({ queryKey: ['scenarioAssetTypes', scenarioId, focusAreaId] });
    };

    const createMutation = useMutation({
        mutationFn: (geometry: Geometry) => createFocusArea(scenarioId!, { geometry, isActive: true }),
        onSuccess: invalidateFocusAreaList,
        onError: () => onError?.('Failed to create focus area'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ focusAreaId, data }: { focusAreaId: string; data: UpdateFocusAreaRequest }) => updateFocusArea(scenarioId!, focusAreaId, data),
        onSuccess: (_data, variables) => {
            invalidateFocusAreaList();
            if (variables.data.geometry !== undefined) {
                invalidateAssetTypesForFocusArea(variables.focusAreaId);
            }
        },
        onError: () => onError?.('Failed to update focus area'),
    });

    const deleteMutation = useMutation({
        mutationFn: (focusAreaId: string) => deleteFocusArea(scenarioId!, focusAreaId),
        onSuccess: (_data, focusAreaId) => {
            invalidateFocusAreaList();
            invalidateAssetTypesForFocusArea(focusAreaId);
        },
        onError: () => onError?.('Failed to delete focus area'),
    });

    return {
        createFocusArea: createMutation.mutate,
        updateFocusArea: updateMutation.mutate,
        deleteFocusArea: deleteMutation.mutate,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    };
};

export default useFocusAreaMutations;
