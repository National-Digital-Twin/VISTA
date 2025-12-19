import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import useAssetFilterMutations from './useAssetFilterMutations';
import { toggleAssetTypeVisibility, clearAllAssetTypeVisibility } from '@/api/scenario-asset-types';
import { updateFocusArea } from '@/api/focus-areas';
import { putAssetScoreFilter, deleteAssetScoreFilter } from '@/api/asset-score-filters';

vi.mock('@/api/scenario-asset-types', () => ({
    toggleAssetTypeVisibility: vi.fn(),
    clearAllAssetTypeVisibility: vi.fn(),
}));

vi.mock('@/api/focus-areas', () => ({
    updateFocusArea: vi.fn(),
}));

vi.mock('@/api/asset-score-filters', () => ({
    putAssetScoreFilter: vi.fn(),
    deleteAssetScoreFilter: vi.fn(),
}));

const mockedToggleAssetTypeVisibility = vi.mocked(toggleAssetTypeVisibility);
const mockedClearAllAssetTypeVisibility = vi.mocked(clearAllAssetTypeVisibility);
const mockedUpdateFocusArea = vi.mocked(updateFocusArea);
const mockedPutAssetScoreFilter = vi.mocked(putAssetScoreFilter);
const mockedDeleteAssetScoreFilter = vi.mocked(deleteAssetScoreFilter);

function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
}

function createWrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe('useAssetFilterMutations', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = createQueryClient();
        vi.clearAllMocks();
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('toggleVisibility', () => {
        it('calls toggleAssetTypeVisibility with correct parameters', async () => {
            mockedToggleAssetTypeVisibility.mockResolvedValue({
                assetTypeId: 'asset-1',
                focusAreaId: 'fa-1',
                isActive: true,
            });

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.toggleVisibility({ assetTypeId: 'asset-1', isActive: true });
            });

            await waitFor(() => {
                expect(mockedToggleAssetTypeVisibility).toHaveBeenCalledWith('scenario-123', {
                    assetTypeId: 'asset-1',
                    focusAreaId: 'fa-1',
                    isActive: true,
                });
            });
        });

        it('invalidates scenarioAssetTypes and scenarioAssets on success', async () => {
            mockedToggleAssetTypeVisibility.mockResolvedValue({
                assetTypeId: 'asset-1',
                focusAreaId: 'fa-1',
                isActive: true,
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.toggleVisibility({ assetTypeId: 'asset-1', isActive: true });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssetTypes', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('calls onError when mutation fails', async () => {
            mockedToggleAssetTypeVisibility.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.toggleVisibility({ assetTypeId: 'asset-1', isActive: true });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to update asset type visibility');
            });
        });
    });

    describe('clearAll', () => {
        it('calls clearAllAssetTypeVisibility with correct parameters', async () => {
            mockedClearAllAssetTypeVisibility.mockResolvedValue(undefined);

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.clearAll();
            });

            await waitFor(() => {
                expect(mockedClearAllAssetTypeVisibility).toHaveBeenCalledWith('scenario-123', 'fa-1');
            });
        });

        it('calls onError when mutation fails', async () => {
            mockedClearAllAssetTypeVisibility.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.clearAll();
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to clear asset type visibility');
            });
        });
    });

    describe('updateFilterMode', () => {
        it('calls updateFocusArea with correct parameters', async () => {
            mockedUpdateFocusArea.mockResolvedValue({
                id: 'fa-1',
                name: 'Focus Area',
                geometry: null,
                filterMode: 'by_score_only',
                isActive: true,
                isSystem: false,
            });

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.updateFilterMode({ focusAreaId: 'fa-1', filterMode: 'by_score_only' });
            });

            await waitFor(() => {
                expect(mockedUpdateFocusArea).toHaveBeenCalledWith('scenario-123', 'fa-1', { filterMode: 'by_score_only' });
            });
        });

        it('invalidates focusAreas and scenarioAssets on success', async () => {
            mockedUpdateFocusArea.mockResolvedValue({
                id: 'fa-1',
                name: 'Focus Area',
                geometry: null,
                filterMode: 'by_score_only',
                isActive: true,
                isSystem: false,
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.updateFilterMode({ focusAreaId: 'fa-1', filterMode: 'by_score_only' });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['focusAreas', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('calls onError when mutation fails', async () => {
            mockedUpdateFocusArea.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.updateFilterMode({ focusAreaId: 'fa-1', filterMode: 'by_score_only' });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to update filter mode');
            });
        });
    });

    describe('applyScoreFilter', () => {
        it('calls putAssetScoreFilter with correct parameters', async () => {
            mockedPutAssetScoreFilter.mockResolvedValue({
                id: 'filter-1',
                focusAreaId: 'fa-1',
                assetTypeId: 'asset-1',
                criticalityValues: [1, 2, 3],
                exposureValues: [1, 2, 3],
                redundancyValues: [1, 2, 3],
                dependencyMin: '0',
                dependencyMax: '3',
            });

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            const filter = {
                criticalityValues: [1, 2, 3],
                exposureValues: [1, 2, 3],
                redundancyValues: [1, 2, 3],
                dependencyMin: '0',
                dependencyMax: '3',
            };

            act(() => {
                result.current.applyScoreFilter({ focusAreaId: 'fa-1', assetTypeId: 'asset-1', filter });
            });

            await waitFor(() => {
                expect(mockedPutAssetScoreFilter).toHaveBeenCalledWith('scenario-123', {
                    focusAreaId: 'fa-1',
                    assetTypeId: 'asset-1',
                    ...filter,
                });
            });
        });

        it('invalidates scenarioAssetTypes when in by_asset_type mode', async () => {
            mockedPutAssetScoreFilter.mockResolvedValue({
                id: 'filter-1',
                focusAreaId: 'fa-1',
                assetTypeId: 'asset-1',
                criticalityValues: [1, 2, 3],
                exposureValues: [1, 2, 3],
                redundancyValues: [1, 2, 3],
                dependencyMin: '0',
                dependencyMax: '3',
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.applyScoreFilter({
                    focusAreaId: 'fa-1',
                    assetTypeId: 'asset-1',
                    filter: { criticalityValues: [1, 2, 3], exposureValues: [1, 2, 3], redundancyValues: [1, 2, 3], dependencyMin: '0', dependencyMax: '3' },
                });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assetScoreFilters', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssetTypes', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('does not invalidate scenarioAssetTypes when in by_score_only mode', async () => {
            mockedPutAssetScoreFilter.mockResolvedValue({
                id: 'filter-1',
                focusAreaId: 'fa-1',
                assetTypeId: null,
                criticalityValues: [1, 2, 3],
                exposureValues: [1, 2, 3],
                redundancyValues: [1, 2, 3],
                dependencyMin: '0',
                dependencyMax: '3',
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_score_only',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.applyScoreFilter({
                    focusAreaId: 'fa-1',
                    assetTypeId: null,
                    filter: { criticalityValues: [1, 2, 3], exposureValues: [1, 2, 3], redundancyValues: [1, 2, 3], dependencyMin: '0', dependencyMax: '3' },
                });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assetScoreFilters', 'scenario-123'] });
                expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['scenarioAssetTypes', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('calls onError when mutation fails', async () => {
            mockedPutAssetScoreFilter.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.applyScoreFilter({
                    focusAreaId: 'fa-1',
                    assetTypeId: 'asset-1',
                    filter: { criticalityValues: [1, 2, 3], exposureValues: [1, 2, 3], redundancyValues: [1, 2, 3], dependencyMin: '0', dependencyMax: '3' },
                });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to save score filter');
            });
        });
    });

    describe('deleteScoreFilter', () => {
        it('calls deleteAssetScoreFilter with correct parameters', async () => {
            mockedDeleteAssetScoreFilter.mockResolvedValue(undefined);

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.deleteScoreFilter({ focusAreaId: 'fa-1', assetTypeId: 'asset-1' });
            });

            await waitFor(() => {
                expect(mockedDeleteAssetScoreFilter).toHaveBeenCalledWith('scenario-123', 'fa-1', 'asset-1');
            });
        });

        it('calls onError when mutation fails', async () => {
            mockedDeleteAssetScoreFilter.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.deleteScoreFilter({ focusAreaId: 'fa-1', assetTypeId: 'asset-1' });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to delete score filter');
            });
        });
    });

    describe('isMutating', () => {
        it('is false initially', () => {
            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            expect(result.current.isMutating).toBe(false);
        });

        it('is true while visibility mutation is pending', async () => {
            let resolveVisibility: () => void;
            mockedToggleAssetTypeVisibility.mockImplementation(
                () =>
                    new Promise((resolve) => {
                        resolveVisibility = () => resolve({ assetTypeId: 'asset-1', focusAreaId: 'fa-1', isActive: true });
                    }),
            );

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.toggleVisibility({ assetTypeId: 'asset-1', isActive: true });
            });

            await waitFor(() => {
                expect(result.current.isMutating).toBe(true);
            });

            act(() => {
                resolveVisibility!();
            });

            await waitFor(() => {
                expect(result.current.isMutating).toBe(false);
            });
        });

        it('is true while clearAll mutation is pending', async () => {
            let resolveClearAll: () => void;
            mockedClearAllAssetTypeVisibility.mockImplementation(
                () =>
                    new Promise((resolve) => {
                        resolveClearAll = () => resolve(undefined);
                    }),
            );

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.clearAll();
            });

            await waitFor(() => {
                expect(result.current.isMutating).toBe(true);
            });

            act(() => {
                resolveClearAll!();
            });

            await waitFor(() => {
                expect(result.current.isMutating).toBe(false);
            });
        });
    });

    describe('isFilterModePending', () => {
        it('is false initially', () => {
            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            expect(result.current.isFilterModePending).toBe(false);
        });

        it('is true while filter mode mutation is pending', async () => {
            let resolveFilterMode: () => void;
            mockedUpdateFocusArea.mockImplementation(
                () =>
                    new Promise((resolve) => {
                        resolveFilterMode = () =>
                            resolve({
                                id: 'fa-1',
                                name: 'Focus Area',
                                geometry: null,
                                filterMode: 'by_score_only',
                                isActive: true,
                                isSystem: false,
                            });
                    }),
            );

            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.updateFilterMode({ focusAreaId: 'fa-1', filterMode: 'by_score_only' });
            });

            await waitFor(() => {
                expect(result.current.isFilterModePending).toBe(true);
            });

            act(() => {
                resolveFilterMode!();
            });

            await waitFor(() => {
                expect(result.current.isFilterModePending).toBe(false);
            });
        });
    });
});
