import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import useResourceMutations from './useResourceMutations';
import { withdrawStock, restockLocation, toggleResourceTypeVisibility } from '@/api/resources';

vi.mock('@/api/resources', () => ({
    withdrawStock: vi.fn(),
    restockLocation: vi.fn(),
    toggleResourceTypeVisibility: vi.fn(),
}));

const mockedWithdrawStock = vi.mocked(withdrawStock);
const mockedRestockLocation = vi.mocked(restockLocation);
const mockedToggleResourceTypeVisibility = vi.mocked(toggleResourceTypeVisibility);

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

describe('useResourceMutations', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = createQueryClient();
        vi.clearAllMocks();
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('withdrawStock', () => {
        it('calls API with locationId and quantity', async () => {
            mockedWithdrawStock.mockResolvedValue({
                id: 'loc-1',
                currentStock: 40,
                maxCapacity: 100,
                action: 'withdraw',
                quantity: 10,
            });

            const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1' }), { wrapper: createWrapper(queryClient) });

            act(() => {
                result.current.withdrawStock({ locationId: 'loc-1', quantity: 10 });
            });

            await waitFor(() => {
                expect(mockedWithdrawStock).toHaveBeenCalledWith('scenario-1', 'loc-1', 10);
            });
        });

        it('invalidates resource queries on success', async () => {
            mockedWithdrawStock.mockResolvedValue({
                id: 'loc-1',
                currentStock: 40,
                maxCapacity: 100,
                action: 'withdraw',
                quantity: 10,
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1' }), { wrapper: createWrapper(queryClient) });

            act(() => {
                result.current.withdrawStock({ locationId: 'loc-1', quantity: 10 });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['resourceInterventions', 'scenario-1'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['resourceInterventionLocation', 'scenario-1'] });
            });
        });

        it('calls onError callback when mutation fails', async () => {
            mockedWithdrawStock.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1', onError }), { wrapper: createWrapper(queryClient) });

            act(() => {
                result.current.withdrawStock({ locationId: 'loc-1', quantity: 10 });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to withdraw stock');
            });
        });
    });

    describe('restockLocation', () => {
        it('calls API with locationId and quantity', async () => {
            mockedRestockLocation.mockResolvedValue({
                id: 'loc-1',
                currentStock: 60,
                maxCapacity: 100,
                action: 'restock',
                quantity: 10,
            });

            const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1' }), { wrapper: createWrapper(queryClient) });

            act(() => {
                result.current.restockLocation({ locationId: 'loc-1', quantity: 10 });
            });

            await waitFor(() => {
                expect(mockedRestockLocation).toHaveBeenCalledWith('scenario-1', 'loc-1', 10);
            });
        });

        it('calls onError callback when mutation fails', async () => {
            mockedRestockLocation.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1', onError }), { wrapper: createWrapper(queryClient) });

            act(() => {
                result.current.restockLocation({ locationId: 'loc-1', quantity: 10 });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to restock location');
            });
        });
    });

    describe('toggleVisibility', () => {
        it('calls API with resourceTypeId and isActive', async () => {
            mockedToggleResourceTypeVisibility.mockResolvedValue({
                resourceInterventionTypeId: 'type-1',
                isActive: false,
            });

            const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1' }), { wrapper: createWrapper(queryClient) });

            act(() => {
                result.current.toggleVisibility({ resourceTypeId: 'type-1', isActive: false });
            });

            await waitFor(() => {
                expect(mockedToggleResourceTypeVisibility).toHaveBeenCalledWith('scenario-1', 'type-1', false);
            });
        });

        it('invalidates resource queries on success', async () => {
            mockedToggleResourceTypeVisibility.mockResolvedValue({
                resourceInterventionTypeId: 'type-1',
                isActive: true,
            });
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1' }), { wrapper: createWrapper(queryClient) });

            act(() => {
                result.current.toggleVisibility({ resourceTypeId: 'type-1', isActive: true });
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['resourceInterventions', 'scenario-1'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['resourceInterventionLocation', 'scenario-1'] });
            });
        });

        it('calls onError callback when mutation fails', async () => {
            mockedToggleResourceTypeVisibility.mockRejectedValue(new Error('API Error'));
            const onError = vi.fn();

            const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1', onError }), { wrapper: createWrapper(queryClient) });

            act(() => {
                result.current.toggleVisibility({ resourceTypeId: 'type-1', isActive: true });
            });

            await waitFor(() => {
                expect(onError).toHaveBeenCalledWith('Failed to toggle visibility');
            });
        });
    });

    it('isMutating is false initially', () => {
        const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1' }), { wrapper: createWrapper(queryClient) });

        expect(result.current.isMutating).toBe(false);
    });

    it('isMutating is true while withdraw mutation is pending', async () => {
        let resolveWithdraw: (value: any) => void;
        mockedWithdrawStock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveWithdraw = resolve;
                }),
        );

        const { result } = renderHook(() => useResourceMutations({ scenarioId: 'scenario-1' }), { wrapper: createWrapper(queryClient) });

        act(() => {
            result.current.withdrawStock({ locationId: 'loc-1', quantity: 5 });
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(true);
        });

        act(() => {
            resolveWithdraw!({ id: 'loc-1', currentStock: 45, maxCapacity: 100, action: 'withdraw', quantity: 5 });
        });

        await waitFor(() => {
            expect(result.current.isMutating).toBe(false);
        });
    });
});
