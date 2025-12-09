import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAssetsByType } from './useAssetsByType';

const mockFetchAssetsByType = vi.fn();

vi.mock('@/api/assets-by-type', () => ({
    fetchAssetsByType: (...args: unknown[]) => mockFetchAssetsByType(...args),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useAssetsByType', () => {
    beforeEach(() => {
        mockFetchAssetsByType.mockReset();
    });

    it('aggregates assets and tracks empty results', async () => {
        mockFetchAssetsByType.mockImplementation((typeId: string) => {
            if (typeId === 'type-a') {
                return Promise.resolve([{ id: 'a1' }]);
            }
            if (typeId === 'type-b') {
                return Promise.resolve([]);
            }
            return Promise.resolve([]);
        });

        const { result } = renderHook(() => useAssetsByType({ selectedAssetTypeIds: ['type-a', 'type-b'] }), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.hasError).toBe(false);
            expect(result.current.assets).toHaveLength(1);
            expect(result.current.assets[0].id).toBe('a1');
            expect(result.current.emptyResults).toEqual(['type-b']);
        });
    });

    it('captures errors from queries', async () => {
        mockFetchAssetsByType.mockImplementation((typeId: string) => {
            if (typeId === 'type-error') {
                return Promise.reject(new Error('boom'));
            }
            return Promise.resolve([]);
        });

        const { result } = renderHook(() => useAssetsByType({ selectedAssetTypeIds: ['type-error'] }), { wrapper: createWrapper() });

        await waitFor(() => {
            expect(result.current.hasError).toBe(true);
            expect(result.current.errors).toHaveLength(1);
            expect((result.current.errors[0] as Error).message).toBe('boom');
        });
    });
});
