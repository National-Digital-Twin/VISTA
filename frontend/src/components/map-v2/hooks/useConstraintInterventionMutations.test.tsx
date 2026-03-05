// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Geometry } from 'geojson';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useConstraintInterventionMutations from './useConstraintInterventionMutations';
import {
    createConstraintIntervention,
    updateConstraintIntervention,
    deleteConstraintIntervention,
    type ConstraintIntervention,
} from '@/api/constraint-interventions';

vi.mock('@/api/constraint-interventions', () => ({
    createConstraintIntervention: vi.fn(),
    updateConstraintIntervention: vi.fn(),
    deleteConstraintIntervention: vi.fn(),
}));

const mockedCreate = vi.mocked(createConstraintIntervention);
const mockedUpdate = vi.mocked(updateConstraintIntervention);
const mockedDelete = vi.mocked(deleteConstraintIntervention);

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

const createMockIntervention = (overrides?: Partial<ConstraintIntervention>): ConstraintIntervention => ({
    id: 'ci-1',
    name: 'Road block 1',
    geometry: mockGeometry,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
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

describe('useConstraintInterventionMutations', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = createQueryClient();
        vi.clearAllMocks();
    });

    afterEach(() => {
        queryClient.clear();
    });

    it('createConstraint calls API with typeId and geometry', async () => {
        mockedCreate.mockResolvedValue(createMockIntervention());

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.createConstraint({ typeId: 'type-1', geometry: mockGeometry });
        });

        await waitFor(() => {
            expect(mockedCreate).toHaveBeenCalledWith('scenario-123', {
                typeId: 'type-1',
                geometry: mockGeometry,
            });
        });
    });

    it('createConstraint invalidates constraintInterventions and roadRoute queries on success', async () => {
        mockedCreate.mockResolvedValue(createMockIntervention());
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.createConstraint({ typeId: 'type-1', geometry: mockGeometry });
        });

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['constraintInterventions', 'scenario-123'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['roadRoute', 'scenario-123'] });
        });
    });

    it('createConstraint calls onError callback when mutation fails', async () => {
        mockedCreate.mockRejectedValue(new Error('API Error'));
        const onError = vi.fn();

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123', onError }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.createConstraint({ typeId: 'type-1', geometry: mockGeometry });
        });

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith('Failed to create constraint');
        });
    });

    it('updateConstraint calls API with interventionId and data', async () => {
        mockedUpdate.mockResolvedValue(createMockIntervention({ name: 'Updated' }));

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.updateConstraint({ interventionId: 'ci-1', data: { name: 'Updated' } });
        });

        await waitFor(() => {
            expect(mockedUpdate).toHaveBeenCalledWith('scenario-123', 'ci-1', { name: 'Updated' });
        });
    });

    it('updateConstraint invalidates roadRoute only when geometry changes', async () => {
        mockedUpdate.mockResolvedValue(createMockIntervention());
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.updateConstraint({ interventionId: 'ci-1', data: { geometry: mockGeometry } });
        });

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['constraintInterventions', 'scenario-123'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['roadRoute', 'scenario-123'] });
        });
    });

    it('updateConstraint does not invalidate roadRoute on name change', async () => {
        mockedUpdate.mockResolvedValue(createMockIntervention({ name: 'New Name' }));
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.updateConstraint({ interventionId: 'ci-1', data: { name: 'New Name' } });
        });

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['constraintInterventions', 'scenario-123'] });
        });

        expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['roadRoute', 'scenario-123'] });
    });

    it('updateConstraint calls onError callback when mutation fails', async () => {
        mockedUpdate.mockRejectedValue(new Error('API Error'));
        const onError = vi.fn();

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123', onError }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.updateConstraint({ interventionId: 'ci-1', data: { name: 'New Name' } });
        });

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith('Failed to update constraint');
        });
    });

    it('deleteConstraint calls API with interventionId', async () => {
        mockedDelete.mockResolvedValue();

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.deleteConstraint('ci-1');
        });

        await waitFor(() => {
            expect(mockedDelete).toHaveBeenCalledWith('scenario-123', 'ci-1');
        });
    });

    it('deleteConstraint invalidates constraintInterventions and roadRoute queries on success', async () => {
        mockedDelete.mockResolvedValue();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.deleteConstraint('ci-1');
        });

        await waitFor(() => {
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['constraintInterventions', 'scenario-123'] });
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['roadRoute', 'scenario-123'] });
        });
    });

    it('deleteConstraint calls onError callback when mutation fails', async () => {
        mockedDelete.mockRejectedValue(new Error('API Error'));
        const onError = vi.fn();

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123', onError }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.deleteConstraint('ci-1');
        });

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith('Failed to delete constraint');
        });
    });

    it('isMutating is false initially', () => {
        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        expect(result.current.isMutating).toBe(false);
    });

    it('isMutating is true while create mutation is pending', async () => {
        let resolveCreate: (value: ConstraintIntervention) => void;
        mockedCreate.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveCreate = resolve;
                }),
        );

        const { result } = renderHook(() => useConstraintInterventionMutations({ scenarioId: 'scenario-123' }), {
            wrapper: createWrapper(queryClient),
        });

        act(() => {
            result.current.createConstraint({ typeId: 'type-1', geometry: mockGeometry });
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(true);
        });

        act(() => {
            resolveCreate!(createMockIntervention());
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(false);
        });
    });
});
