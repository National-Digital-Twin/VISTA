import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import useLiveFloodAreas from './useLiveFloodAreas';
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

describe('useLiveFloodAreas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches live flood areas', async () => {
        const mockFloodAreas = [
            { type: 'Feature', properties: { severity: 'High' }, geometry: {} },
            { type: 'Feature', properties: { severity: 'Medium' }, geometry: {} },
        ];

        vi.mocked(combinedApi.fetchLiveFloodAreas).mockResolvedValue(mockFloodAreas);

        const { result } = renderHook(() => useLiveFloodAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(
            () => {
                expect(result.current.data).toEqual(mockFloodAreas);
            },
            { timeout: 3000 },
        );

        expect(combinedApi.fetchLiveFloodAreas).toHaveBeenCalled();
        expect(result.current.isSuccess).toBe(true);
    });

    it('uses empty array as placeholder data while loading', async () => {
        vi.mocked(combinedApi.fetchLiveFloodAreas).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([]), 200)));

        const { result } = renderHook(() => useLiveFloodAreas(), {
            wrapper: createQueryWrapper(),
        });

        expect(result.current.data).toEqual([]);

        await waitFor(() => {
            expect(result.current.isLoading || result.current.data).toBeTruthy();
        });
    });

    it('returns data when fetch succeeds', async () => {
        const mockData = [{ type: 'Feature', id: 'flood-1' }];

        vi.mocked(combinedApi.fetchLiveFloodAreas).mockResolvedValue(mockData);

        const { result } = renderHook(() => useLiveFloodAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.data).toEqual(mockData);
        });
    });

    it('handles fetch error', async () => {
        vi.mocked(combinedApi.fetchLiveFloodAreas).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useLiveFloodAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toBeDefined();
    });

    it('completes loading after data fetched', async () => {
        vi.mocked(combinedApi.fetchLiveFloodAreas).mockResolvedValue([]);

        const { result } = renderHook(() => useLiveFloodAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isSuccess).toBe(true);
    });

    it('handles empty flood areas list', async () => {
        vi.mocked(combinedApi.fetchLiveFloodAreas).mockResolvedValue([]);

        const { result } = renderHook(() => useLiveFloodAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual([]);
    });

    it('preserves flood area features', async () => {
        const mockFloodAreas = [
            {
                type: 'Feature',
                id: 'area-1',
                geometry: { type: 'Polygon', coordinates: [] },
                properties: {
                    severity: 'High',
                    description: 'Critical flood zone',
                },
            },
        ];

        vi.mocked(combinedApi.fetchLiveFloodAreas).mockResolvedValue(mockFloodAreas);

        const { result } = renderHook(() => useLiveFloodAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.data).toEqual(mockFloodAreas);
        });

        expect(result.current.data?.[0].properties).toEqual({
            severity: 'High',
            description: 'Critical flood zone',
        });
    });
});
