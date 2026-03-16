// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useActiveScenario } from './useActiveScenario';
import { fetchScenarios, type Scenario } from '@/api/scenarios';

vi.mock('@/api/scenarios');

const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

const TestWrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: createQueryClient() }, children);

const pendingPromise = () => new Promise<never>(() => {});

describe('useActiveScenario', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Data fetching', () => {
        it('returns loading state initially', () => {
            vi.mocked(fetchScenarios).mockImplementation(pendingPromise);

            const { result } = renderHook(() => useActiveScenario(), {
                wrapper: TestWrapper,
            });

            expect(result.current.isLoading).toBe(true);
            expect(result.current.data).toBeUndefined();
        });

        it('returns the active scenario when one exists', async () => {
            const mockScenarios: Scenario[] = [
                { id: 'scenario-1', name: 'Inactive Scenario', isActive: false, code: 'S001' },
                { id: 'scenario-2', name: 'Active Scenario', isActive: true, code: 'S002' },
                { id: 'scenario-3', name: 'Another Inactive', isActive: false, code: 'S003' },
            ];

            vi.mocked(fetchScenarios).mockResolvedValue(mockScenarios);

            const { result } = renderHook(() => useActiveScenario(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toEqual({
                id: 'scenario-2',
                name: 'Active Scenario',
                isActive: true,
                code: 'S002',
            });
        });

        it('returns undefined when no scenario is active', async () => {
            const mockScenarios: Scenario[] = [
                { id: 'scenario-1', name: 'Scenario 1', isActive: false, code: 'S001' },
                { id: 'scenario-2', name: 'Scenario 2', isActive: false, code: 'S001' },
            ];

            vi.mocked(fetchScenarios).mockResolvedValue(mockScenarios);

            const { result } = renderHook(() => useActiveScenario(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toBeUndefined();
        });

        it('returns undefined when scenarios array is empty', async () => {
            vi.mocked(fetchScenarios).mockResolvedValue([]);

            const { result } = renderHook(() => useActiveScenario(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toBeUndefined();
        });

        it('returns the first active scenario when multiple are active', async () => {
            const mockScenarios: Scenario[] = [
                { id: 'scenario-1', name: 'First Active', isActive: true, code: 'S001' },
                { id: 'scenario-2', name: 'Second Active', isActive: true, code: 'S001' },
            ];

            vi.mocked(fetchScenarios).mockResolvedValue(mockScenarios);

            const { result } = renderHook(() => useActiveScenario(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data?.id).toBe('scenario-1');
        });
    });

    describe('Error handling', () => {
        it('sets error state when fetch fails', async () => {
            vi.mocked(fetchScenarios).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useActiveScenario(), {
                wrapper: TestWrapper,
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toBeInstanceOf(Error);
            expect(result.current.error?.message).toBe('Network error');
        });
    });
});
