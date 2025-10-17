import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import useDependents from './useDependents';
import * as combinedApi from '@/api/combined';

vi.mock('@/api/combined');

function createQueryWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    function Wrapper({ children }: { children: ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    }
    return Wrapper;
}

describe('useDependents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('For assets', () => {
        it('fetches dependents when isAsset is true', async () => {
            const mockDependents = [
                { dependentNode: 'http://example.com/dependent#1', criticalityRating: 8 },
                { dependentNode: 'http://example.com/dependent#2', criticalityRating: 6 },
            ];

            const mockDependentInfo = {
                uri: 'http://example.com/dependent#1',
                name: 'Dependent 1',
                type: 'Building',
            };

            vi.mocked(combinedApi.fetchDependents).mockResolvedValue(mockDependents);
            vi.mocked(combinedApi.fetchAssetInfo).mockResolvedValue(mockDependentInfo);

            const { result } = renderHook(() => useDependents(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(combinedApi.fetchDependents).toHaveBeenCalledWith('http://example.com/asset#123');
            expect(result.current.data).toBeDefined();
        });

        it('does not fetch when isAsset is false', async () => {
            const { result } = renderHook(() => useDependents(false, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(combinedApi.fetchDependents).not.toHaveBeenCalled();
        });

        it('fetches details for each dependent', async () => {
            const mockDependents = [
                { dependentNode: 'http://example.com/dep#1', criticalityRating: 9 },
                { dependentNode: 'http://example.com/dep#2', criticalityRating: 7 },
            ];

            vi.mocked(combinedApi.fetchDependents).mockResolvedValue(mockDependents);
            vi.mocked(combinedApi.fetchAssetInfo).mockImplementation(async (uri) => ({
                uri,
                name: `Dependent ${uri.slice(-1)}`,
                type: 'Building',
            }));

            const { result } = renderHook(() => useDependents(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(combinedApi.fetchAssetInfo).toHaveBeenCalledTimes(2);
            expect(result.current.data).toHaveLength(2);
        });

        it('includes connectionStrength in dependent details', async () => {
            const mockDependents = [{ dependentNode: 'http://example.com/dep#1', criticalityRating: 10 }];

            vi.mocked(combinedApi.fetchDependents).mockResolvedValue(mockDependents);
            vi.mocked(combinedApi.fetchAssetInfo).mockResolvedValue({
                uri: 'http://example.com/dep#1',
                name: 'Critical Dependent',
            });

            const { result } = renderHook(() => useDependents(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data[0]).toHaveProperty('connectionStrength', 10);
        });
    });

    describe('For dependencies', () => {
        it('fetches single dependent when isDependency is true', async () => {
            const mockDependent = {
                uri: 'http://example.com/dependent#1',
                criticality: 8,
            };

            vi.mocked(combinedApi.fetchAssetInfo).mockResolvedValue({
                uri: mockDependent.uri,
                name: 'Single Dependent',
                type: 'Service',
            });

            const { result } = renderHook(() => useDependents(false, true, '', mockDependent), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(combinedApi.fetchAssetInfo).toHaveBeenCalledWith(mockDependent.uri);
            expect(result.current.data[0]).toHaveProperty('connectionStrength', 8);
        });

        it('still fetches asset dependents even when isDependency is true', async () => {
            const mockDependent = { uri: 'http://example.com/dep#1', criticality: 5 };

            vi.mocked(combinedApi.fetchDependents).mockResolvedValue([]);
            vi.mocked(combinedApi.fetchAssetInfo).mockResolvedValue({ uri: mockDependent.uri });

            const { result } = renderHook(() => useDependents(true, true, 'http://example.com/asset#123', mockDependent), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(combinedApi.fetchDependents).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('handles dependents fetch error', async () => {
            vi.mocked(combinedApi.fetchDependents).mockRejectedValue(new Error('Failed to fetch dependents'));

            const { result } = renderHook(() => useDependents(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.isError).toBe(true);
            expect(result.current.error).toBeDefined();
        });

        it('handles dependent detail fetch error', async () => {
            const mockDependents = [{ dependentNode: 'http://example.com/dep#1', criticalityRating: 5 }];

            vi.mocked(combinedApi.fetchDependents).mockResolvedValue(mockDependents);
            vi.mocked(combinedApi.fetchAssetInfo).mockRejectedValue(new Error('Details error'));

            const { result } = renderHook(() => useDependents(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data[0]).toHaveProperty('error');
        });
    });

    describe('Empty states', () => {
        it('handles empty dependents list', async () => {
            vi.mocked(combinedApi.fetchDependents).mockResolvedValue([]);

            const { result } = renderHook(() => useDependents(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toEqual([]);
        });

        it('attempts to fetch with null dependent in dependency mode', async () => {
            vi.mocked(combinedApi.fetchAssetInfo).mockResolvedValue({});

            const { result } = renderHook(() => useDependents(false, true, '', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(combinedApi.fetchAssetInfo).toHaveBeenCalled();
        });
    });

    describe('Loading states', () => {
        it('shows loading while fetching dependents', async () => {
            vi.mocked(combinedApi.fetchDependents).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 100)));

            const { result } = renderHook(() => useDependents(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });

        it('shows loading while fetching dependent details', async () => {
            const mockDependents = [{ dependentNode: 'http://example.com/dep#1', criticalityRating: 5 }];

            vi.mocked(combinedApi.fetchDependents).mockResolvedValue(mockDependents);
            vi.mocked(combinedApi.fetchAssetInfo).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({}), 100)));

            const { result } = renderHook(() => useDependents(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });
    });
});
