import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import useProviders from './useProviders';
import { fetchProviders, fetchAssetInfo } from '@/api/combined';

vi.mock('@/api/combined');

const createQueryWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: ReactNode }) => React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const renderHookWithWrapper = (hook: () => any) => renderHook(hook, { wrapper: createQueryWrapper() });

describe('useProviders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('For assets', () => {
        it('fetches providers when isAsset is true', async () => {
            vi.mocked(fetchProviders).mockResolvedValue([
                { providerNode: 'http://example.com/provider#1', criticalityRating: 5 },
                { providerNode: 'http://example.com/provider#2', criticalityRating: 3 },
            ]);
            vi.mocked(fetchAssetInfo).mockResolvedValue({ uri: 'http://example.com/provider#1', name: 'Provider 1', type: 'Service' });

            const { result } = renderHookWithWrapper(() => useProviders(true, false, 'http://example.com/asset#123', null));

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(fetchProviders).toHaveBeenCalledWith('http://example.com/asset#123');
            expect(result.current.data).toBeDefined();
        });

        it('does not fetch when isAsset is false', async () => {
            const { result } = renderHookWithWrapper(() => useProviders(false, false, 'http://example.com/asset#123', null));

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(fetchProviders).not.toHaveBeenCalled();
        });

        it('fetches details for each provider', async () => {
            const mockProviders = [
                { providerNode: 'http://example.com/provider#1', criticalityRating: 8 },
                { providerNode: 'http://example.com/provider#2', criticalityRating: 6 },
            ];

            vi.mocked(fetchProviders).mockResolvedValue(mockProviders);
            vi.mocked(fetchAssetInfo).mockImplementation(async (uri) => ({
                uri,
                name: `Provider ${uri.slice(-1)}`,
                type: 'Service',
            }));

            const { result } = renderHook(() => useProviders(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(fetchAssetInfo).toHaveBeenCalledTimes(2);
            expect(result.current.data).toHaveLength(2);
        });

        it('includes connectionStrength in provider details', async () => {
            const mockProviders = [{ providerNode: 'http://example.com/provider#1', criticalityRating: 7 }];

            vi.mocked(fetchProviders).mockResolvedValue(mockProviders);
            vi.mocked(fetchAssetInfo).mockResolvedValue({
                uri: 'http://example.com/provider#1',
                name: 'Provider 1',
            });

            const { result } = renderHook(() => useProviders(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data[0]).toHaveProperty('connectionStrength', 7);
        });
    });

    describe('For dependencies', () => {
        it('fetches single provider when isDependency is true', async () => {
            const mockProvider = {
                uri: 'http://example.com/provider#1',
                criticality: 9,
            };

            vi.mocked(fetchAssetInfo).mockResolvedValue({
                uri: mockProvider.uri,
                name: 'Single Provider',
                type: 'Infrastructure',
            });

            const { result } = renderHook(() => useProviders(false, true, '', mockProvider), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(fetchAssetInfo).toHaveBeenCalledWith(mockProvider.uri);
            expect(result.current.data[0]).toHaveProperty('connectionStrength', 9);
        });

        it('still fetches asset providers even when isDependency is true', async () => {
            const mockProvider = { uri: 'http://example.com/provider#1', criticality: 5 };

            vi.mocked(fetchProviders).mockResolvedValue([]);
            vi.mocked(fetchAssetInfo).mockResolvedValue({ uri: mockProvider.uri });

            const { result } = renderHook(() => useProviders(true, true, 'http://example.com/asset#123', mockProvider), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(fetchProviders).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('handles provider fetch error', async () => {
            vi.mocked(fetchProviders).mockRejectedValue(new Error('Failed to fetch providers'));

            const { result } = renderHook(() => useProviders(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.isError).toBe(true);
            expect(result.current.error).toBeDefined();
        });

        it('handles provider detail fetch error', async () => {
            const mockProviders = [{ providerNode: 'http://example.com/provider#1', criticalityRating: 5 }];

            vi.mocked(fetchProviders).mockResolvedValue(mockProviders);
            vi.mocked(fetchAssetInfo).mockRejectedValue(new Error('Provider details error'));

            const { result } = renderHook(() => useProviders(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data[0]).toHaveProperty('error');
        });
    });

    describe('Empty states', () => {
        it('handles empty providers list', async () => {
            vi.mocked(fetchProviders).mockResolvedValue([]);

            const { result } = renderHook(() => useProviders(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toEqual([]);
        });

        it('attempts to fetch with null provider in dependency mode', async () => {
            vi.mocked(fetchAssetInfo).mockResolvedValue({});

            const { result } = renderHook(() => useProviders(false, true, '', null), {
                wrapper: createQueryWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(fetchAssetInfo).toHaveBeenCalled();
        });
    });

    describe('Loading states', () => {
        it('shows loading while fetching providers', async () => {
            vi.mocked(fetchProviders).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 100)));

            const { result } = renderHook(() => useProviders(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });

        it('shows loading while fetching provider details', async () => {
            const mockProviders = [{ providerNode: 'http://example.com/provider#1', criticalityRating: 5 }];

            vi.mocked(fetchProviders).mockResolvedValue(mockProviders);
            vi.mocked(fetchAssetInfo).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({}), 100)));

            const { result } = renderHook(() => useProviders(true, false, 'http://example.com/asset#123', null), {
                wrapper: createQueryWrapper(),
            });

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });
        });
    });
});
