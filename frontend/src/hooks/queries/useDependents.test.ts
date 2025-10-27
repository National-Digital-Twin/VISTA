import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import useDependents from './useDependents';
import { fetchDependents, fetchAssetInfo } from '@/api/combined';

vi.mock('@/api/combined');

const delay = (ms: number) =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });

const createQueryWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: ReactNode }) => React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const renderHookWithWrapper = (hook: () => any) => renderHook(hook, { wrapper: createQueryWrapper() });

describe('useDependents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('For assets', () => {
        it('fetches dependents when isAsset is true', async () => {
            vi.mocked(fetchDependents).mockResolvedValue([
                { dependentNode: 'http://example.com/dependent#1', criticalityRating: 8 },
                { dependentNode: 'http://example.com/dependent#2', criticalityRating: 6 },
            ]);
            vi.mocked(fetchAssetInfo).mockResolvedValue({ uri: 'http://example.com/dependent#1', name: 'Dependent 1', type: 'Building' });

            const { result } = renderHookWithWrapper(() => useDependents(true, false, 'http://example.com/asset#123', null));

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(fetchDependents).toHaveBeenCalledWith('http://example.com/asset#123');
            expect(result.current.data).toBeDefined();
        });

        it('does not fetch when isAsset is false', async () => {
            const { result } = renderHookWithWrapper(() => useDependents(false, false, 'http://example.com/asset#123', null));

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(fetchDependents).not.toHaveBeenCalled();
        });

        it('fetches details for each dependent', async () => {
            const mockDependents = [
                { dependentNode: 'http://example.com/dep#1', criticalityRating: 9 },
                { dependentNode: 'http://example.com/dep#2', criticalityRating: 7 },
            ];

            vi.mocked(fetchDependents).mockResolvedValue(mockDependents);
            vi.mocked(fetchAssetInfo).mockImplementation(async (uri) => ({
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

            expect(fetchAssetInfo).toHaveBeenCalledTimes(2);
            expect(result.current.data).toHaveLength(2);
        });

        it('includes connectionStrength in dependent details', async () => {
            const mockDependents = [{ dependentNode: 'http://example.com/dep#1', criticalityRating: 10 }];

            vi.mocked(fetchDependents).mockResolvedValue(mockDependents);
            vi.mocked(fetchAssetInfo).mockResolvedValue({
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

            vi.mocked(fetchAssetInfo).mockResolvedValue({
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

            expect(fetchAssetInfo).toHaveBeenCalledWith(mockDependent.uri);
            expect(result.current.data[0]).toHaveProperty('connectionStrength', 8);
        });

        it('still fetches asset dependents even when isDependency is true', async () => {
            const mockDependent = { uri: 'http://example.com/dep#1', criticality: 5 };

            vi.mocked(fetchDependents).mockResolvedValue([]);
            vi.mocked(fetchAssetInfo).mockResolvedValue({ uri: mockDependent.uri });

            const { result } = renderHook(() => useDependents(true, true, 'http://example.com/asset#123', mockDependent), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(fetchDependents).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('handles dependents fetch error', async () => {
            vi.mocked(fetchDependents).mockRejectedValue(new Error('Failed to fetch dependents'));

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

            vi.mocked(fetchDependents).mockResolvedValue(mockDependents);
            vi.mocked(fetchAssetInfo).mockRejectedValue(new Error('Details error'));

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
            vi.mocked(fetchDependents).mockResolvedValue([]);

            const { result } = renderHook(() => useDependents(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toEqual([]);
        });

        it('attempts to fetch with null dependent in dependency mode', async () => {
            vi.mocked(fetchAssetInfo).mockResolvedValue({});

            const { result } = renderHook(() => useDependents(false, true, '', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(fetchAssetInfo).toHaveBeenCalled();
        });
    });

    describe('Loading states', () => {
        it('shows loading while fetching dependents', async () => {
            const delayedResolve = async () => {
                await delay(100);
                return [];
            };
            vi.mocked(fetchDependents).mockImplementation(delayedResolve);

            const { result } = renderHookWithWrapper(() => useDependents(true, false, 'http://example.com/asset#123', null));

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });

        it('shows loading while fetching dependent details', async () => {
            const mockDependents = [{ dependentNode: 'http://example.com/dep#1', criticalityRating: 5 }];
            const delayedResolve = async () => {
                await delay(100);
                return {};
            };

            vi.mocked(fetchDependents).mockResolvedValue(mockDependents);
            vi.mocked(fetchAssetInfo).mockImplementation(delayedResolve);

            const { result } = renderHookWithWrapper(() => useDependents(true, false, 'http://example.com/asset#123', null));

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });
    });
});
