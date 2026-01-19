import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Geometry } from 'geojson';

import useFocusAreaMutations from './useFocusAreaMutations';
import { createFocusArea, updateFocusArea, deleteFocusArea, type FocusArea } from '@/api/focus-areas';

vi.mock('@/api/focus-areas', () => ({
    createFocusArea: vi.fn(),
    updateFocusArea: vi.fn(),
    deleteFocusArea: vi.fn(),
}));

const mockedCreateFocusArea = vi.mocked(createFocusArea);
const mockedUpdateFocusArea = vi.mocked(updateFocusArea);
const mockedDeleteFocusArea = vi.mocked(deleteFocusArea);

const mockGeometry: Geometry = {
    type: 'Polygon',
    coordinates: [
        [
            [-1.4, 50.67],
            [-1.4, 50.68],
            [-1.39, 50.68],
            [-1.39, 50.67],
            [-1.4, 50.67],
        ],
    ],
};

const createMockFocusArea = (overrides?: Partial<FocusArea>): FocusArea => ({
    id: 'focus-area-1',
    name: 'Test Focus Area',
    geometry: mockGeometry,
    filterMode: 'by_asset_type',
    isActive: true,
    isSystem: false,
    ...overrides,
});

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

describe('useFocusAreaMutations', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = createQueryClient();
        vi.clearAllMocks();
    });

    afterEach(() => {
        queryClient.clear();
    });

    it('createFocusArea calls API with geometry and isActive true', async () => {
        const newFocusArea = createMockFocusArea({ id: 'new-fa' });
        mockedCreateFocusArea.mockResolvedValue(newFocusArea);

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.createFocusArea(mockGeometry);
        });

        await waitFor(() => {
            expect(mockedCreateFocusArea).toHaveBeenCalledWith('scenario-123', {
                geometry: mockGeometry,
                isActive: true,
            });
        });
    });

    it('createFocusArea invalidates focusAreas and scenarioAssets queries on success', async () => {
        mockedCreateFocusArea.mockResolvedValue(createMockFocusArea());
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.createFocusArea(mockGeometry);
        });

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['focusAreas', 'scenario-123'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
        });
    });

    it('createFocusArea calls onError callback when mutation fails', async () => {
        mockedCreateFocusArea.mockRejectedValue(new Error('API Error'));
        const onError = vi.fn();

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123', onError }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.createFocusArea(mockGeometry);
        });

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith('Failed to create focus area');
        });
    });

    it('updateFocusArea calls API with focusAreaId and data', async () => {
        const updatedFocusArea = createMockFocusArea({ name: 'Updated Name' });
        mockedUpdateFocusArea.mockResolvedValue(updatedFocusArea);

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.updateFocusArea({ focusAreaId: 'fa-1', data: { name: 'Updated Name' } });
        });

        await waitFor(() => {
            expect(mockedUpdateFocusArea).toHaveBeenCalledWith('scenario-123', 'fa-1', { name: 'Updated Name' });
        });
    });

    it('updateFocusArea invalidates focusAreas and scenarioAssets on name update', async () => {
        mockedUpdateFocusArea.mockResolvedValue(createMockFocusArea());
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.updateFocusArea({ focusAreaId: 'fa-1', data: { name: 'New Name' } });
        });

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['focusAreas', 'scenario-123'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
        });

        expect(invalidateSpy).not.toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['scenarioAssetTypes', 'scenario-123', 'fa-1'] }));
    });

    it('updateFocusArea also invalidates scenarioAssetTypes and exposureLayers when geometry changes', async () => {
        mockedUpdateFocusArea.mockResolvedValue(createMockFocusArea());
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        const newGeometry: Geometry = {
            type: 'Polygon',
            coordinates: [
                [
                    [-1.5, 50.7],
                    [-1.5, 50.8],
                    [-1.4, 50.8],
                    [-1.4, 50.7],
                    [-1.5, 50.7],
                ],
            ],
        };

        act(() => {
            result.current.updateFocusArea({ focusAreaId: 'fa-1', data: { geometry: newGeometry } });
        });

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['focusAreas', 'scenario-123'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssetTypes', 'scenario-123', 'fa-1'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['exposureLayers', 'scenario-123', 'fa-1'] });
        });
    });

    it('updateFocusArea calls onError callback when mutation fails', async () => {
        mockedUpdateFocusArea.mockRejectedValue(new Error('API Error'));
        const onError = vi.fn();

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123', onError }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.updateFocusArea({ focusAreaId: 'fa-1', data: { name: 'New Name' } });
        });

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith('Failed to update focus area');
        });
    });

    it('deleteFocusArea calls API with focusAreaId', async () => {
        mockedDeleteFocusArea.mockResolvedValue();

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.deleteFocusArea('fa-1');
        });

        await waitFor(() => {
            expect(mockedDeleteFocusArea).toHaveBeenCalledWith('scenario-123', 'fa-1');
        });
    });

    it('deleteFocusArea invalidates list queries and all exposure layer queries on success', async () => {
        mockedDeleteFocusArea.mockResolvedValue();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.deleteFocusArea('fa-1');
        });

        await waitFor(() => {
            // List queries are invalidated to refresh the list
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['focusAreas', 'scenario-123'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            // All exposure layer queries are invalidated (since active focus areas changed)
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['exposureLayers', 'scenario-123'] });
        });
    });

    it('deleteFocusArea calls onError callback when mutation fails', async () => {
        mockedDeleteFocusArea.mockRejectedValue(new Error('API Error'));
        const onError = vi.fn();

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123', onError }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.deleteFocusArea('fa-1');
        });

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith('Failed to delete focus area');
        });
    });

    it('isMutating is false initially', () => {
        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        expect(result.current.isMutating).toBe(false);
    });

    it('isMutating is true while create mutation is pending', async () => {
        let resolveCreate: (value: FocusArea) => void;
        mockedCreateFocusArea.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveCreate = resolve;
                }),
        );

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.createFocusArea(mockGeometry);
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(true);
        });

        act(() => {
            resolveCreate(createMockFocusArea());
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(false);
        });
    });

    it('isMutating is true while update mutation is pending', async () => {
        let resolveUpdate: (value: FocusArea) => void;
        mockedUpdateFocusArea.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveUpdate = resolve;
                }),
        );

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.updateFocusArea({ focusAreaId: 'fa-1', data: { name: 'New Name' } });
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(true);
        });

        act(() => {
            resolveUpdate(createMockFocusArea());
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(false);
        });
    });

    it('isMutating is true while delete mutation is pending', async () => {
        let resolveDelete: () => void;
        mockedDeleteFocusArea.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveDelete = resolve;
                }),
        );

        const { result } = renderHook(() => useFocusAreaMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.deleteFocusArea('fa-1');
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(true);
        });

        act(() => {
            resolveDelete();
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(false);
        });
    });
});
