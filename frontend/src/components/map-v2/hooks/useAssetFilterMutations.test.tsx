import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import useAssetFilterMutations from './useAssetFilterMutations';
import { toggleAssetTypeVisibility, clearAllAssetTypeVisibility, bulkToggleAssetTypeVisibility } from '@/api/scenario-asset-types';
import { updateFocusArea } from '@/api/focus-areas';
import { putAssetScoreFilter, deleteAssetScoreFilter } from '@/api/asset-score-filters';

vi.mock('@/api/scenario-asset-types', () => ({
    toggleAssetTypeVisibility: vi.fn(),
    clearAllAssetTypeVisibility: vi.fn(),
    bulkToggleAssetTypeVisibility: vi.fn(),
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
const mockedBulkToggleAssetTypeVisibility = vi.mocked(bulkToggleAssetTypeVisibility);
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

function createDeferredPromise<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
        resolve = r;
    });
    return { promise, resolve };
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

        it('rejects when scenarioId is missing', async () => {
            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: undefined,
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await act(async () => {
                try {
                    result.current.toggleVisibility({ assetTypeId: 'asset-1', isActive: true });
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                }
            });

            expect(mockedToggleAssetTypeVisibility).not.toHaveBeenCalled();
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

        it('rejects when scenarioId is missing', async () => {
            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: undefined,
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await act(async () => {
                try {
                    result.current.clearAll();
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                }
            });

            expect(mockedClearAllAssetTypeVisibility).not.toHaveBeenCalled();
        });
    });

    describe('bulkToggleVisibility', () => {
        it('calls bulkToggleAssetTypeVisibility with correct parameters', async () => {
            mockedBulkToggleAssetTypeVisibility.mockResolvedValue({
                subCategoryId: 'subcat-1',
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
                result.current.bulkToggleVisibility({ subCategoryId: 'subcat-1', isActive: true });
            });

            await waitFor(() => {
                expect(mockedBulkToggleAssetTypeVisibility).toHaveBeenCalledWith('scenario-123', {
                    subCategoryId: 'subcat-1',
                    focusAreaId: 'fa-1',
                    isActive: true,
                });
            });
        });

        it('invalidates scenarioAssetTypes and scenarioAssets on success', async () => {
            mockedBulkToggleAssetTypeVisibility.mockResolvedValue({
                subCategoryId: 'subcat-1',
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
                result.current.bulkToggleVisibility({ subCategoryId: 'subcat-1', isActive: true });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssetTypes', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('calls onError when mutation fails', async () => {
            mockedBulkToggleAssetTypeVisibility.mockRejectedValue(new Error('API Error'));
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
                result.current.bulkToggleVisibility({ subCategoryId: 'subcat-1', isActive: true });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to update subcategory visibility');
            });
        });

        it('rejects when scenarioId is missing', async () => {
            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: undefined,
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await act(async () => {
                try {
                    result.current.bulkToggleVisibility({ subCategoryId: 'subcat-1', isActive: true });
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                }
            });

            expect(mockedBulkToggleAssetTypeVisibility).not.toHaveBeenCalled();
        });

        it('rejects when selectedFocusAreaId is missing', async () => {
            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: 'scenario-123',
                        selectedFocusAreaId: null,
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await act(async () => {
                try {
                    result.current.bulkToggleVisibility({ subCategoryId: 'subcat-1', isActive: true });
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                }
            });

            expect(mockedBulkToggleAssetTypeVisibility).not.toHaveBeenCalled();
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

        it('throws error when scenarioId is missing', async () => {
            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: undefined,
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await act(async () => {
                try {
                    result.current.updateFilterMode({ focusAreaId: 'fa-1', filterMode: 'by_score_only' });
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect((error as Error).message).toBe('No scenario selected');
                }
            });

            expect(mockedUpdateFocusArea).not.toHaveBeenCalled();
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

        it('rejects when scenarioId is missing', async () => {
            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: undefined,
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await act(async () => {
                try {
                    result.current.applyScoreFilter({
                        focusAreaId: 'fa-1',
                        assetTypeId: 'asset-1',
                        filter: {
                            criticalityValues: [1, 2, 3],
                            exposureValues: [1, 2, 3],
                            redundancyValues: [1, 2, 3],
                            dependencyMin: '0',
                            dependencyMax: '3',
                        },
                    });
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                }
            });

            expect(mockedPutAssetScoreFilter).not.toHaveBeenCalled();
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

        it('invalidates scenarioAssetTypes when in by_asset_type mode', async () => {
            mockedDeleteAssetScoreFilter.mockResolvedValue(undefined);
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
                result.current.deleteScoreFilter({ focusAreaId: 'fa-1', assetTypeId: 'asset-1' });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assetScoreFilters', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssetTypes', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('does not invalidate scenarioAssetTypes when in by_score_only mode', async () => {
            mockedDeleteAssetScoreFilter.mockResolvedValue(undefined);
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
                result.current.deleteScoreFilter({ focusAreaId: 'fa-1', assetTypeId: 'asset-1' });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['assetScoreFilters', 'scenario-123'] });
                expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['scenarioAssetTypes', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('rejects when scenarioId is missing', async () => {
            const { result } = renderHook(
                () =>
                    useAssetFilterMutations({
                        scenarioId: undefined,
                        selectedFocusAreaId: 'fa-1',
                        selectedFilterMode: 'by_asset_type',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await act(async () => {
                try {
                    result.current.deleteScoreFilter({ focusAreaId: 'fa-1', assetTypeId: 'asset-1' });
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                }
            });

            expect(mockedDeleteAssetScoreFilter).not.toHaveBeenCalled();
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
            const deferred = createDeferredPromise<{ assetTypeId: string; focusAreaId: string; isActive: boolean }>();
            mockedToggleAssetTypeVisibility.mockReturnValue(deferred.promise);

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
                deferred.resolve({ assetTypeId: 'asset-1', focusAreaId: 'fa-1', isActive: true });
            });

            await waitFor(() => {
                expect(result.current.isMutating).toBe(false);
            });
        });

        it('is true while clearAll mutation is pending', async () => {
            const deferred = createDeferredPromise<void>();
            mockedClearAllAssetTypeVisibility.mockReturnValue(deferred.promise);

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
                deferred.resolve();
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
            const mockResponse = {
                id: 'fa-1',
                name: 'Focus Area',
                geometry: null,
                filterMode: 'by_score_only' as const,
                isActive: true,
                isSystem: false,
            };
            const deferred = createDeferredPromise<typeof mockResponse>();
            mockedUpdateFocusArea.mockReturnValue(deferred.promise);

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
                deferred.resolve(mockResponse);
            });

            await waitFor(() => {
                expect(result.current.isFilterModePending).toBe(false);
            });
        });
    });
});
