// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Geometry } from 'geojson';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useExposureLayerMutations from './useExposureLayerMutations';
import { createExposureLayer, updateExposureLayer, deleteExposureLayer, bulkToggleExposureLayerVisibility, type ExposureLayer } from '@/api/exposure-layers';

vi.mock('@/api/exposure-layers', () => ({
    createExposureLayer: vi.fn(),
    updateExposureLayer: vi.fn(),
    deleteExposureLayer: vi.fn(),
    bulkToggleExposureLayerVisibility: vi.fn(),
}));

const mockedCreateExposureLayer = vi.mocked(createExposureLayer);
const mockedUpdateExposureLayer = vi.mocked(updateExposureLayer);
const mockedDeleteExposureLayer = vi.mocked(deleteExposureLayer);
const mockedBulkToggleExposureLayerVisibility = vi.mocked(bulkToggleExposureLayerVisibility);

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

const createMockExposureLayer = (overrides?: Partial<ExposureLayer>): ExposureLayer => ({
    id: 'layer-1',
    name: 'Test Layer',
    geometry: mockGeometry,
    isActive: true,
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

describe('useExposureLayerMutations', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = createQueryClient();
        vi.clearAllMocks();
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('createExposureLayer', () => {
        it('calls API with geometry, typeId, and focusAreaId', async () => {
            const newLayer = createMockExposureLayer({ id: 'new-layer' });
            mockedCreateExposureLayer.mockResolvedValue(newLayer);

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.createExposureLayer(mockGeometry);
            });

            await waitFor(() => {
                expect(mockedCreateExposureLayer).toHaveBeenCalledWith('scenario-123', {
                    geometry: mockGeometry,
                    typeId: 'type-1',
                    focusAreaId: 'fa-1',
                });
            });
        });

        it('invalidates exposureLayers, asset-score, and scenarioAssets queries on success', async () => {
            mockedCreateExposureLayer.mockResolvedValue(createMockExposureLayer());
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.createExposureLayer(mockGeometry);
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['exposureLayers', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['asset-score', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('calls onError callback when mutation fails', async () => {
            mockedCreateExposureLayer.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.createExposureLayer(mockGeometry);
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to create exposure layer');
            });
        });

        it('rejects when scenarioId is undefined', async () => {
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: undefined,
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.createExposureLayer(mockGeometry);
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to create exposure layer');
            });

            expect(mockedCreateExposureLayer).not.toHaveBeenCalled();
        });

        it('rejects when typeId is undefined', async () => {
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: undefined,
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.createExposureLayer(mockGeometry);
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to create exposure layer');
            });

            expect(mockedCreateExposureLayer).not.toHaveBeenCalled();
        });
    });

    describe('updateExposureLayer', () => {
        it('calls API with exposureLayerId and data', async () => {
            const updatedLayer = createMockExposureLayer({ name: 'Updated Name' });
            mockedUpdateExposureLayer.mockResolvedValue(updatedLayer);

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.updateExposureLayer({ exposureLayerId: 'layer-1', data: { name: 'Updated Name' } });
            });

            await waitFor(() => {
                expect(mockedUpdateExposureLayer).toHaveBeenCalledWith('scenario-123', 'layer-1', { name: 'Updated Name' });
            });
        });

        it('invalidates queries on success', async () => {
            mockedUpdateExposureLayer.mockResolvedValue(createMockExposureLayer());
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.updateExposureLayer({ exposureLayerId: 'layer-1', data: { name: 'New Name' } });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['exposureLayers', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['asset-score', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('calls onError callback when mutation fails', async () => {
            mockedUpdateExposureLayer.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.updateExposureLayer({ exposureLayerId: 'layer-1', data: { name: 'New Name' } });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to update exposure layer');
            });
        });
    });

    describe('deleteExposureLayer', () => {
        it('calls API with exposureLayerId', async () => {
            mockedDeleteExposureLayer.mockResolvedValue();

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.deleteExposureLayer('layer-1');
            });

            await waitFor(() => {
                expect(mockedDeleteExposureLayer).toHaveBeenCalledWith('scenario-123', 'layer-1');
            });
        });

        it('invalidates queries on success', async () => {
            mockedDeleteExposureLayer.mockResolvedValue();
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.deleteExposureLayer('layer-1');
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['exposureLayers', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['asset-score', 'scenario-123'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['scenarioAssets', 'scenario-123'] });
            });
        });

        it('calls onError callback when mutation fails', async () => {
            mockedDeleteExposureLayer.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.deleteExposureLayer('layer-1');
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to delete exposure layer');
            });
        });
    });

    describe('bulkToggleExposureLayers', () => {
        it('calls API with typeId and isActive', async () => {
            mockedBulkToggleExposureLayerVisibility.mockResolvedValue();

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.bulkToggleExposureLayers({ typeId: 'flood-type', isActive: true });
            });

            await waitFor(() => {
                expect(mockedBulkToggleExposureLayerVisibility).toHaveBeenCalledWith('scenario-123', {
                    focusAreaId: 'fa-1',
                    typeId: 'flood-type',
                    isActive: true,
                });
            });
        });

        it('invalidates queries on success', async () => {
            mockedBulkToggleExposureLayerVisibility.mockResolvedValue();
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.bulkToggleExposureLayers({ typeId: 'flood-type', isActive: false });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['exposureLayers', 'scenario-123'] });
            });
        });

        it('calls onError callback when mutation fails', async () => {
            mockedBulkToggleExposureLayerVisibility.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: 'fa-1',
                        typeId: 'type-1',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.bulkToggleExposureLayers({ typeId: 'flood-type', isActive: true });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to toggle exposure layers');
            });
        });

        it('rejects when focusAreaId is null', async () => {
            const onError = vi.fn();

            const { result } = renderHook(
                () =>
                    useExposureLayerMutations({
                        scenarioId: 'scenario-123',
                        focusAreaId: null,
                        typeId: 'type-1',
                        onError,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.bulkToggleExposureLayers({ typeId: 'flood-type', isActive: true });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to toggle exposure layers');
            });

            expect(mockedBulkToggleExposureLayerVisibility).not.toHaveBeenCalled();
        });
    });

    it('isMutating is false initially', () => {
        const { result } = renderHook(
            () =>
                useExposureLayerMutations({
                    scenarioId: 'scenario-123',
                    focusAreaId: 'fa-1',
                    typeId: 'type-1',
                }),
            { wrapper: createWrapper(queryClient) },
        );

        expect(result.current.isMutating).toBe(false);
    });

    it('isMutating is true while create mutation is pending', async () => {
        let resolveCreate: (value: ExposureLayer) => void;
        mockedCreateExposureLayer.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveCreate = resolve;
                }),
        );

        const { result } = renderHook(
            () =>
                useExposureLayerMutations({
                    scenarioId: 'scenario-123',
                    focusAreaId: 'fa-1',
                    typeId: 'type-1',
                }),
            { wrapper: createWrapper(queryClient) },
        );

        act(() => {
            result.current.createExposureLayer(mockGeometry);
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(true);
        });

        act(() => {
            resolveCreate!(createMockExposureLayer());
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(false);
        });
    });

    it('isMutating is true while update mutation is pending', async () => {
        let resolveUpdate: (value: ExposureLayer) => void;
        mockedUpdateExposureLayer.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveUpdate = resolve;
                }),
        );

        const { result } = renderHook(
            () =>
                useExposureLayerMutations({
                    scenarioId: 'scenario-123',
                    focusAreaId: 'fa-1',
                    typeId: 'type-1',
                }),
            { wrapper: createWrapper(queryClient) },
        );

        act(() => {
            result.current.updateExposureLayer({ exposureLayerId: 'layer-1', data: { name: 'New Name' } });
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(true);
        });

        act(() => {
            resolveUpdate!(createMockExposureLayer());
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(false);
        });
    });

    it('isMutating is true while delete mutation is pending', async () => {
        let resolveDelete: () => void;
        mockedDeleteExposureLayer.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveDelete = resolve;
                }),
        );

        const { result } = renderHook(
            () =>
                useExposureLayerMutations({
                    scenarioId: 'scenario-123',
                    focusAreaId: 'fa-1',
                    typeId: 'type-1',
                }),
            { wrapper: createWrapper(queryClient) },
        );

        act(() => {
            result.current.deleteExposureLayer('layer-1');
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(true);
        });

        act(() => {
            resolveDelete!();
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(false);
        });
    });
});
