import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useMultipleFocusAreaAssets } from './useMultipleFocusAreaAssets';
import { fetchScenarioAssets } from '@/api/scenario-assets';
import type { Asset } from '@/api/assets-by-type';

vi.mock('@/api/scenario-assets');

const createWrapper = (queryClient: QueryClient) => {
    return ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const createMockAsset = (id: string, name: string): Asset => ({
    id,
    type: 'asset-type-1',
    name,
    lat: 50.67,
    lng: -1.4,
    geometry: {
        type: 'Point',
        coordinates: [-1.4, 50.67],
    },
    dependent: {
        criticalitySum: 0,
    },
    styles: {
        classUri: 'asset-type-1',
        color: '#DDDDDD',
        backgroundColor: '#121212',
        iconFallbackText: '?',
        alt: 'Asset',
    },
    elementType: 'asset',
});

describe('useMultipleFocusAreaAssets', () => {
    let queryClient: QueryClient;
    const mockFetchScenarioAssets = vi.mocked(fetchScenarioAssets);

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        vi.clearAllMocks();
    });

    it('returns empty assets array when focusAreaIds is empty', () => {
        const { result } = renderHook(() => useMultipleFocusAreaAssets({ scenarioId: 'scenario-1', focusAreaIds: [] }), {
            wrapper: createWrapper(queryClient),
        });

        expect(result.current.assets).toEqual([]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isFetching).toBe(false);
        expect(result.current.hasError).toBe(false);
        expect(mockFetchScenarioAssets).not.toHaveBeenCalled();
    });

    it('does not fetch when scenarioId is undefined', () => {
        const { result } = renderHook(() => useMultipleFocusAreaAssets({ scenarioId: undefined, focusAreaIds: ['fa-1'] }), {
            wrapper: createWrapper(queryClient),
        });

        expect(result.current.assets).toEqual([]);
        expect(mockFetchScenarioAssets).not.toHaveBeenCalled();
    });

    it('fetches assets for a single focus area', async () => {
        const mockAssets = [createMockAsset('asset-1', 'Asset 1')];
        mockFetchScenarioAssets.mockResolvedValue(mockAssets);

        const { result } = renderHook(() => useMultipleFocusAreaAssets({ scenarioId: 'scenario-1', focusAreaIds: ['fa-1'] }), {
            wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
            expect(result.current.assets).toHaveLength(1);
        });

        expect(result.current.assets[0].id).toBe('asset-1');
        expect(mockFetchScenarioAssets).toHaveBeenCalledWith({ scenarioId: 'scenario-1', focusAreaId: 'fa-1', iconMap: undefined });
    });

    it('fetches assets for multiple focus areas', async () => {
        const mockAssets1 = [createMockAsset('asset-1', 'Asset 1')];
        const mockAssets2 = [createMockAsset('asset-2', 'Asset 2')];
        mockFetchScenarioAssets.mockResolvedValueOnce(mockAssets1).mockResolvedValueOnce(mockAssets2);

        const { result } = renderHook(() => useMultipleFocusAreaAssets({ scenarioId: 'scenario-1', focusAreaIds: ['fa-1', 'fa-2'] }), {
            wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
            expect(result.current.assets).toHaveLength(2);
        });

        expect(result.current.assets.map((a) => a.id)).toEqual(['asset-1', 'asset-2']);
        expect(mockFetchScenarioAssets).toHaveBeenCalledTimes(2);
        expect(mockFetchScenarioAssets).toHaveBeenCalledWith({ scenarioId: 'scenario-1', focusAreaId: 'fa-1', iconMap: undefined });
        expect(mockFetchScenarioAssets).toHaveBeenCalledWith({ scenarioId: 'scenario-1', focusAreaId: 'fa-2', iconMap: undefined });
    });

    it('deduplicates assets with the same id', async () => {
        const mockAssets1 = [createMockAsset('asset-1', 'Asset 1'), createMockAsset('asset-2', 'Asset 2')];
        const mockAssets2 = [createMockAsset('asset-2', 'Asset 2'), createMockAsset('asset-3', 'Asset 3')];
        mockFetchScenarioAssets.mockResolvedValueOnce(mockAssets1).mockResolvedValueOnce(mockAssets2);

        const { result } = renderHook(() => useMultipleFocusAreaAssets({ scenarioId: 'scenario-1', focusAreaIds: ['fa-1', 'fa-2'] }), {
            wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
            expect(result.current.assets).toHaveLength(3);
        });

        const assetIds = result.current.assets.map((a) => a.id);
        expect(assetIds).toEqual(['asset-1', 'asset-2', 'asset-3']);
        expect(assetIds.filter((id) => id === 'asset-2')).toHaveLength(1);
    });

    it('passes iconMap to fetchScenarioAssets', async () => {
        const iconMap = new Map<string, string>();
        iconMap.set('asset-type-1', 'fa-hospital');
        const mockAssets = [createMockAsset('asset-1', 'Asset 1')];
        mockFetchScenarioAssets.mockResolvedValue(mockAssets);

        const { result } = renderHook(() => useMultipleFocusAreaAssets({ scenarioId: 'scenario-1', focusAreaIds: ['fa-1'], iconMap }), {
            wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
            expect(result.current.assets).toHaveLength(1);
        });

        expect(mockFetchScenarioAssets).toHaveBeenCalledWith({ scenarioId: 'scenario-1', focusAreaId: 'fa-1', iconMap });
    });

    it('reports loading state correctly', async () => {
        let resolvePromise: (value: Asset[]) => void;
        const pendingPromise = new Promise<Asset[]>((resolve) => {
            resolvePromise = resolve;
        });
        mockFetchScenarioAssets.mockReturnValue(pendingPromise);

        const { result } = renderHook(() => useMultipleFocusAreaAssets({ scenarioId: 'scenario-1', focusAreaIds: ['fa-1'] }), {
            wrapper: createWrapper(queryClient),
        });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.isFetching).toBe(true);

        resolvePromise!([createMockAsset('asset-1', 'Asset 1')]);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isFetching).toBe(false);
    });

    it('reports error state correctly', async () => {
        const error = new Error('Failed to fetch');
        mockFetchScenarioAssets.mockRejectedValue(error);

        const { result } = renderHook(() => useMultipleFocusAreaAssets({ scenarioId: 'scenario-1', focusAreaIds: ['fa-1'] }), {
            wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
            expect(result.current.hasError).toBe(true);
        });

        expect(result.current.errors).toHaveLength(1);
        expect(result.current.errors[0]).toBe(error);
    });

    it('handles partial errors when fetching multiple focus areas', async () => {
        const error = new Error('Failed to fetch');
        const mockAssets = [createMockAsset('asset-1', 'Asset 1')];
        mockFetchScenarioAssets.mockResolvedValueOnce(mockAssets).mockRejectedValueOnce(error);

        const { result } = renderHook(() => useMultipleFocusAreaAssets({ scenarioId: 'scenario-1', focusAreaIds: ['fa-1', 'fa-2'] }), {
            wrapper: createWrapper(queryClient),
        });

        await waitFor(() => {
            expect(result.current.hasError).toBe(true);
        });

        expect(result.current.assets).toHaveLength(1);
        expect(result.current.assets[0].id).toBe('asset-1');
        expect(result.current.errors).toHaveLength(1);
    });
});
