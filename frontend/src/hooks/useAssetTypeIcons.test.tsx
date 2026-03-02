import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAssetTypeIcons } from './useAssetTypeIcons';

const mockFetchAssetCategories = vi.fn();

vi.mock('@/api/asset-categories', () => ({
    fetchAssetCategories: (...args: unknown[]) => mockFetchAssetCategories(...args),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useAssetTypeIcons', () => {
    beforeEach(() => {
        mockFetchAssetCategories.mockReset();
    });

    it('returns an empty map when there are no asset categories', async () => {
        mockFetchAssetCategories.mockResolvedValue([]);

        const { result } = renderHook(() => useAssetTypeIcons(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.size).toBe(0);
        });
    });

    it('builds an icon map from asset categories', async () => {
        mockFetchAssetCategories.mockResolvedValue([
            {
                id: 'cat-1',
                subCategories: [
                    {
                        id: 'sub-1',
                        assetTypes: [
                            { id: 'type-1', icon: 'icon-1' },
                            { id: 'type-2', icon: null },
                            { id: 'type-3', icon: 'icon-3' },
                        ],
                    },
                ],
            },
        ]);

        const { result } = renderHook(() => useAssetTypeIcons(), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.size).toBe(2);
            expect(result.current.get('type-1')).toBe('icon-1');
            expect(result.current.get('type-3')).toBe('icon-3');
            expect(result.current.get('type-2')).toBeUndefined();
        });
    });
});
