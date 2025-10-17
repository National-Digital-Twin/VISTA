import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import useFloodWatchAreas from './useFloodWatchAreas';
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

describe('useFloodWatchAreas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and transforms flood watch areas', async () => {
        const mockData = [
            {
                uri: 'http://example.com/watch#1',
                name: 'Watch Area 1',
                polygon_uri: 'http://example.com/polygon#1',
                flood_areas: [
                    {
                        uri: 'http://example.com/flood#1',
                        name: 'Flood Area 1',
                        polygon_uri: 'http://example.com/flood-polygon#1',
                    },
                ],
            },
        ];

        vi.mocked(combinedApi.fetchAllFloodAreas).mockResolvedValue(mockData);

        const { result } = renderHook(() => useFloodWatchAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        expect(result.current.data).toHaveLength(1);
        expect(result.current.data?.[0]).toMatchObject({
            value: 'http://example.com/polygon#1',
            label: 'Watch Area 1',
        });
        expect(result.current.data?.[0].children).toHaveLength(1);
    });

    it('uses URI as label when name is missing', async () => {
        const mockData = [
            {
                uri: 'http://example.com/watch#1',
                polygon_uri: 'http://example.com/polygon#1',
                flood_areas: [],
            },
        ];

        vi.mocked(combinedApi.fetchAllFloodAreas).mockResolvedValue(mockData);

        const { result } = renderHook(() => useFloodWatchAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        expect(result.current.data?.[0].label).toBe('http://example.com/watch#1');
    });

    it('transforms flood areas to children correctly', async () => {
        const mockData = [
            {
                uri: 'http://example.com/watch#1',
                polygon_uri: 'http://example.com/polygon#1',
                flood_areas: [
                    {
                        uri: 'http://example.com/flood#1',
                        name: 'Flood Area 1',
                        polygon_uri: 'http://example.com/flood-polygon#1',
                    },
                    {
                        uri: 'http://example.com/flood#2',
                        name: 'Flood Area 2',
                        polygon_uri: 'http://example.com/flood-polygon#2',
                    },
                ],
            },
        ];

        vi.mocked(combinedApi.fetchAllFloodAreas).mockResolvedValue(mockData);

        const { result } = renderHook(() => useFloodWatchAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        expect(result.current.data?.[0].children).toHaveLength(2);
        expect(result.current.data?.[0].children[0]).toEqual({
            value: 'http://example.com/flood-polygon#1',
            label: 'Flood Area 1',
        });
    });

    it('throws error when watch area polygon_uri is missing', async () => {
        const mockData = [
            {
                uri: 'http://example.com/watch#1',
                name: 'Watch Area 1',
                flood_areas: [],
            },
        ];

        vi.mocked(combinedApi.fetchAllFloodAreas).mockResolvedValue(mockData);

        const { result } = renderHook(() => useFloodWatchAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toContain('polygon for');
        expect(result.current.error?.message).toContain('is not defined');
    });

    it('throws error when flood area polygon_uri is missing', async () => {
        const mockData = [
            {
                uri: 'http://example.com/watch#1',
                polygon_uri: 'http://example.com/polygon#1',
                flood_areas: [
                    {
                        uri: 'http://example.com/flood#1',
                        name: 'Flood Area 1',
                    },
                ],
            },
        ];

        vi.mocked(combinedApi.fetchAllFloodAreas).mockResolvedValue(mockData);

        const { result } = renderHook(() => useFloodWatchAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toContain('Flood area polygon for');
    });

    it('handles empty flood_areas array', async () => {
        const mockData = [
            {
                uri: 'http://example.com/watch#1',
                name: 'Watch Area 1',
                polygon_uri: 'http://example.com/polygon#1',
                flood_areas: [],
            },
        ];

        vi.mocked(combinedApi.fetchAllFloodAreas).mockResolvedValue(mockData);

        const { result } = renderHook(() => useFloodWatchAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        expect(result.current.data?.[0].children).toEqual([]);
    });

    it('handles multiple watch areas', async () => {
        const mockData = [
            {
                uri: 'http://example.com/watch#1',
                name: 'Watch Area 1',
                polygon_uri: 'http://example.com/polygon#1',
                flood_areas: [],
            },
            {
                uri: 'http://example.com/watch#2',
                name: 'Watch Area 2',
                polygon_uri: 'http://example.com/polygon#2',
                flood_areas: [],
            },
        ];

        vi.mocked(combinedApi.fetchAllFloodAreas).mockResolvedValue(mockData);

        const { result } = renderHook(() => useFloodWatchAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        expect(result.current.data).toHaveLength(2);
    });

    it('uses flood area URI as label when name is missing', async () => {
        const mockData = [
            {
                uri: 'http://example.com/watch#1',
                polygon_uri: 'http://example.com/polygon#1',
                flood_areas: [
                    {
                        uri: 'http://example.com/flood#1',
                        polygon_uri: 'http://example.com/flood-polygon#1',
                    },
                ],
            },
        ];

        vi.mocked(combinedApi.fetchAllFloodAreas).mockResolvedValue(mockData);

        const { result } = renderHook(() => useFloodWatchAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.data).toBeDefined();
        });

        expect(result.current.data?.[0].children[0].label).toBe('http://example.com/flood#1');
    });

    it('handles API fetch error', async () => {
        vi.mocked(combinedApi.fetchAllFloodAreas).mockRejectedValue(new Error('API error'));

        const { result } = renderHook(() => useFloodWatchAreas(), {
            wrapper: createQueryWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toBeDefined();
    });
});
