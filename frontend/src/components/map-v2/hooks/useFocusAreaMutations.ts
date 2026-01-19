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

    const invalidateQueriesForFocusArea = (focusAreaId: string) => {
        queryClient.invalidateQueries({ queryKey: ['scenarioAssetTypes', scenarioId, focusAreaId] });
        queryClient.invalidateQueries({ queryKey: ['exposureLayers', scenarioId, focusAreaId] });
    };

    const invalidateAllExposureLayers = () => {
        // Invalidate all exposure layer queries for this scenario (including the null focus area query)
        queryClient.invalidateQueries({ queryKey: ['exposureLayers', scenarioId] });
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
            // If geometry changed, invalidate specific focus area queries
            if (variables.data.geometry !== undefined) {
                invalidateQueriesForFocusArea(variables.focusAreaId);
            }
            // If isActive changed, invalidate all exposure layers (affects which layers show in focus area panel)
            if (variables.data.isActive !== undefined) {
                invalidateAllExposureLayers();
            }
        },
        onError: () => onError?.('Failed to update focus area'),
    });

    const deleteMutation = useMutation({
        mutationFn: (focusAreaId: string) => deleteFocusArea(scenarioId!, focusAreaId),
        onSuccess: () => {
            invalidateFocusAreaList();
            // Invalidate all exposure layer queries since active focus areas have changed
            invalidateAllExposureLayers();
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
