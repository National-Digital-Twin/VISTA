import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import useFloodAreaPolygons from './useFloodAreaPolygons';
import * as combinedApi from '@/api/combined';
import { ElementsContext } from '@/context/ElementContext';

vi.mock('@/api/combined');

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    const mockContext = {
        updateErrorNotifications: vi.fn(),
    };

    function Wrapper({ children }: { children: ReactNode }) {
        return React.createElement(
            QueryClientProvider,
            { client: queryClient },
            React.createElement(ElementsContext.Provider, { value: mockContext as any }, children),
        );
    }
    return Wrapper;
}

describe('useFloodAreaPolygons', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches polygons for selected flood areas', async () => {
        const mockPolygon1 = {
            features: [{ type: 'Feature', geometry: { type: 'Polygon' }, properties: { id: 1 } }],
        };
        const mockPolygon2 = {
            features: [{ type: 'Feature', geometry: { type: 'Polygon' }, properties: { id: 2 } }],
        };

        vi.mocked(combinedApi.fetchFloodAreaPolygon).mockResolvedValueOnce(mockPolygon1).mockResolvedValueOnce(mockPolygon2);

        const { result } = renderHook(() => useFloodAreaPolygons(['poly1', 'poly2']), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(combinedApi.fetchFloodAreaPolygon).toHaveBeenCalledTimes(2);
        expect(result.current.polygonFeatures).toBeDefined();
    });

    it('returns empty object for empty selected areas', async () => {
        const { result } = renderHook(() => useFloodAreaPolygons([]), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.polygonFeatures).toEqual({});
    });

    it('handles single flood area', async () => {
        const mockPolygon = {
            features: [{ type: 'Feature', geometry: {}, properties: {} }],
        };

        vi.mocked(combinedApi.fetchFloodAreaPolygon).mockResolvedValue(mockPolygon);

        const { result } = renderHook(() => useFloodAreaPolygons(['single-area']), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(combinedApi.fetchFloodAreaPolygon).toHaveBeenCalledWith('single-area');
    });

    it('sets isLoading true while fetching', async () => {
        vi.mocked(combinedApi.fetchFloodAreaPolygon).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ features: [] }), 100)));

        const { result } = renderHook(() => useFloodAreaPolygons(['area1']), {
            wrapper: createWrapper(),
        });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('sets isSuccess when queries complete successfully', async () => {
        vi.mocked(combinedApi.fetchFloodAreaPolygon).mockResolvedValue({ features: [] });

        const { result } = renderHook(() => useFloodAreaPolygons(['area1']), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });
    });

    it('sets isError when any query fails', async () => {
        vi.mocked(combinedApi.fetchFloodAreaPolygon).mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHook(() => useFloodAreaPolygons(['area1']), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isSuccess).toBe(false);
    });

    it('maps polygon URI to features correctly', async () => {
        const mockPolygon = {
            features: [
                { type: 'Feature', id: 'feat1' },
                { type: 'Feature', id: 'feat2' },
            ],
        };

        vi.mocked(combinedApi.fetchFloodAreaPolygon).mockResolvedValue(mockPolygon);

        const { result } = renderHook(() => useFloodAreaPolygons(['test-uri']), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.polygonFeatures['test-uri']).toEqual(mockPolygon.features);
    });

    it('handles multiple polygons in result object', async () => {
        vi.mocked(combinedApi.fetchFloodAreaPolygon).mockImplementation(async (uri) => ({
            features: [{ type: 'Feature', properties: { uri } }],
        }));

        const { result } = renderHook(() => useFloodAreaPolygons(['uri1', 'uri2', 'uri3']), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(Object.keys(result.current.polygonFeatures)).toHaveLength(3);
        expect(result.current.polygonFeatures).toHaveProperty('uri1');
        expect(result.current.polygonFeatures).toHaveProperty('uri2');
        expect(result.current.polygonFeatures).toHaveProperty('uri3');
    });

    it('skips queries for empty/falsy URIs', async () => {
        vi.mocked(combinedApi.fetchFloodAreaPolygon).mockResolvedValue({ features: [] });

        const { result } = renderHook(() => useFloodAreaPolygons(['valid-uri', '', 'another-valid']), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(combinedApi.fetchFloodAreaPolygon).toHaveBeenCalledWith('valid-uri');
        expect(combinedApi.fetchFloodAreaPolygon).toHaveBeenCalledWith('another-valid');
    });
});
