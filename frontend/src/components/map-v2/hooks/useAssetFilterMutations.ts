import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateFocusArea } from '@/api/focus-areas';
import { toggleAssetTypeVisibility, clearAllAssetTypeVisibility } from '@/api/scenario-asset-types';
import { putAssetScoreFilter, deleteAssetScoreFilter, type ScoreFilterValues } from '@/api/asset-score-filters';

type FilterMode = 'by_asset_type' | 'by_score_only';

type UseAssetFilterMutationsOptions = {
    readonly scenarioId: string | undefined;
    readonly selectedFocusAreaId: string | null;
    readonly selectedFilterMode: FilterMode;
    readonly onError?: (message: string) => void;
};

const useAssetFilterMutations = ({ scenarioId, selectedFocusAreaId, selectedFilterMode, onError }: UseAssetFilterMutationsOptions) => {
    const queryClient = useQueryClient();

    const visibilityMutation = useMutation({
        mutationFn: (data: { assetTypeId: string; isActive: boolean }) => {
            if (!scenarioId) {
                return Promise.reject(new Error('No scenario selected'));
            }
            return toggleAssetTypeVisibility(scenarioId, {
                assetTypeId: data.assetTypeId,
                focusAreaId: selectedFocusAreaId,
                isActive: data.isActive,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scenarioAssetTypes', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
        },
        onError: () => onError?.('Failed to update asset type visibility'),
    });

    const clearAllMutation = useMutation({
        mutationFn: () => {
            if (!scenarioId) {
                return Promise.reject(new Error('No scenario selected'));
            }
            return clearAllAssetTypeVisibility(scenarioId, selectedFocusAreaId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scenarioAssetTypes', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['assetScoreFilters', scenarioId] });
        },
        onError: () => onError?.('Failed to clear asset type visibility'),
    });

    const filterModeMutation = useMutation({
        mutationFn: async (data: { focusAreaId: string; filterMode: FilterMode }) => {
            if (!scenarioId) {
                throw new Error('No scenario selected');
            }
            await updateFocusArea(scenarioId, data.focusAreaId, { filterMode: data.filterMode });
            await queryClient.invalidateQueries({ queryKey: ['focusAreas', scenarioId] });
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
        },
        onError: () => onError?.('Failed to update filter mode'),
    });

    const scoreFilterMutation = useMutation({
        mutationFn: (data: { focusAreaId: string | null; assetTypeId: string | null; filter: ScoreFilterValues }) => {
            if (!scenarioId) {
                return Promise.reject(new Error('No scenario selected'));
            }
            return putAssetScoreFilter(scenarioId, {
                focusAreaId: data.focusAreaId,
                assetTypeId: data.assetTypeId,
                ...data.filter,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assetScoreFilters', scenarioId] });
            if (selectedFilterMode === 'by_asset_type') {
                queryClient.invalidateQueries({ queryKey: ['scenarioAssetTypes', scenarioId] });
            }
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
        },
        onError: () => onError?.('Failed to save score filter'),
    });

    const deleteScoreFilterMutation = useMutation({
        mutationFn: (data: { focusAreaId: string | null; assetTypeId: string | null }) => {
            if (!scenarioId) {
                return Promise.reject(new Error('No scenario selected'));
            }
            return deleteAssetScoreFilter(scenarioId, data.focusAreaId, data.assetTypeId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assetScoreFilters', scenarioId] });
            if (selectedFilterMode === 'by_asset_type') {
                queryClient.invalidateQueries({ queryKey: ['scenarioAssetTypes', scenarioId] });
            }
            queryClient.invalidateQueries({ queryKey: ['scenarioAssets', scenarioId] });
        },
        onError: () => onError?.('Failed to delete score filter'),
    });

    return {
        toggleVisibility: visibilityMutation.mutate,
        clearAll: clearAllMutation.mutate,
        updateFilterMode: filterModeMutation.mutate,
        applyScoreFilter: scoreFilterMutation.mutate,
        deleteScoreFilter: deleteScoreFilterMutation.mutate,
        isFilterModePending: filterModeMutation.isPending,
        isMutating: [
            visibilityMutation.isPending,
            clearAllMutation.isPending,
            filterModeMutation.isPending,
            scoreFilterMutation.isPending,
            deleteScoreFilterMutation.isPending,
        ].some(Boolean),
    };
};

export default useAssetFilterMutations;
