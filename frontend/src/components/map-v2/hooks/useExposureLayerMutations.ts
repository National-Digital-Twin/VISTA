import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Geometry } from 'geojson';
import {
    createExposureLayer,
    updateExposureLayer,
    deleteExposureLayer,
    bulkToggleExposureLayerVisibility,
    type UpdateExposureLayerRequest,
} from '@/api/exposure-layers';

type UseExposureLayerMutationsOptions = {
    readonly scenarioId: string | undefined;
    readonly focusAreaId: string | undefined | null;
    readonly typeId: string | undefined;
    readonly onError?: (message: string) => void;
};

const useExposureLayerMutations = ({ scenarioId, focusAreaId, typeId, onError }: UseExposureLayerMutationsOptions) => {
    const queryClient = useQueryClient();

    const invalidateExposureLayers = () => {
        queryClient.invalidateQueries({ queryKey: ['exposureLayers', scenarioId] });
        queryClient.invalidateQueries({ queryKey: ['asset-score', scenarioId] });
        queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
    };

    const createMutation = useMutation({
        mutationFn: (geometry: Geometry) => {
            if (!scenarioId || !typeId) {
                return Promise.reject(new Error('Missing required parameters'));
            }
            return createExposureLayer(scenarioId, {
                typeId,
                geometry,
                focusAreaId: focusAreaId ?? undefined,
            });
        },
        onSuccess: invalidateExposureLayers,
        onError: () => onError?.('Failed to create exposure layer'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ exposureLayerId, data }: { exposureLayerId: string; data: UpdateExposureLayerRequest }) => {
            if (!scenarioId) {
                return Promise.reject(new Error('Missing required parameters'));
            }
            return updateExposureLayer(scenarioId, exposureLayerId, data);
        },
        onSuccess: invalidateExposureLayers,
        onError: () => onError?.('Failed to update exposure layer'),
    });

    const deleteMutation = useMutation({
        mutationFn: (exposureLayerId: string) => {
            if (!scenarioId) {
                return Promise.reject(new Error('Missing required parameters'));
            }
            return deleteExposureLayer(scenarioId, exposureLayerId);
        },
        onSuccess: invalidateExposureLayers,
        onError: () => onError?.('Failed to delete exposure layer'),
    });

    const bulkToggleMutation = useMutation({
        mutationFn: ({ typeId, isActive }: { typeId: string; isActive: boolean }) => {
            if (!scenarioId || !focusAreaId) {
                return Promise.reject(new Error('Missing required parameters'));
            }
            return bulkToggleExposureLayerVisibility(scenarioId, {
                focusAreaId,
                typeId,
                isActive,
            });
        },
        onSuccess: invalidateExposureLayers,
        onError: () => onError?.('Failed to toggle exposure layers'),
    });

    return {
        createExposureLayer: createMutation.mutate,
        updateExposureLayer: updateMutation.mutate,
        deleteExposureLayer: deleteMutation.mutate,
        bulkToggleExposureLayers: bulkToggleMutation.mutate,
        isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || bulkToggleMutation.isPending,
    };
};

export default useExposureLayerMutations;
