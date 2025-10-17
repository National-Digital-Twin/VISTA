import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fetchLiveFloodAreas from './fetchLiveFloodAreas';

describe('fetchLiveFloodAreas', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('successfully fetches live flood areas', async () => {
        const mockFloods = {
            items: [
                {
                    floodArea: {
                        polygon: 'https://example.com/polygon1.geojson',
                    },
                },
                {
                    floodArea: {
                        polygon: 'https://example.com/polygon2.geojson',
                    },
                },
            ],
        };

        const mockPolygon1 = {
            features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: { id: 1 } }],
        };

        const mockPolygon2 = {
            features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: { id: 2 } }],
        };

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFloods),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockPolygon1),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockPolygon2),
            });

        const result = await fetchLiveFloodAreas();

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock).toHaveBeenNthCalledWith(1, 'https://environment.data.gov.uk/flood-monitoring/id/floods?lat=50.7&long=-1.35&dist=10');
        expect(result).toHaveLength(2);
        expect(result[0].properties.id).toBe(1);
        expect(result[1].properties.id).toBe(2);
    });

    it('flattens multiple features from each polygon', async () => {
        const mockFloods = {
            items: [
                {
                    floodArea: {
                        polygon: 'https://example.com/polygon1.geojson',
                    },
                },
            ],
        };

        const mockPolygon = {
            features: [
                { type: 'Feature', properties: { id: 1 } },
                { type: 'Feature', properties: { id: 2 } },
                { type: 'Feature', properties: { id: 3 } },
            ],
        };

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFloods),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockPolygon),
            });

        const result = await fetchLiveFloodAreas();

        expect(result).toHaveLength(3);
    });

    it('throws error when initial flood request fails', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 503,
        });

        await expect(fetchLiveFloodAreas()).rejects.toThrow('An error occurred while retrieving live flood areas');
    });

    it('throws error when polygon fetch fails', async () => {
        const mockFloods = {
            items: [
                {
                    floodArea: {
                        polygon: 'https://example.com/polygon1.geojson',
                    },
                },
            ],
        };

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFloods),
            })
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

        await expect(fetchLiveFloodAreas()).rejects.toThrow('An error occurred while retrieving live flood polygon');
    });

    it('throws error on network failure', async () => {
        fetchMock.mockRejectedValue(new Error('Network timeout'));

        await expect(fetchLiveFloodAreas()).rejects.toThrow('Network timeout');
    });

    it('handles empty flood areas', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ items: [] }),
        });

        const result = await fetchLiveFloodAreas();

        expect(result).toEqual([]);
    });

    it('uses correct query parameters for Isle of Wight', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ items: [] }),
        });

        await fetchLiveFloodAreas();

        const callUrl = fetchMock.mock.calls[0][0];
        expect(callUrl).toContain('lat=50.7');
        expect(callUrl).toContain('long=-1.35');
        expect(callUrl).toContain('dist=10');
    });

    it('fetches polygons in parallel', async () => {
        const mockFloods = {
            items: [
                { floodArea: { polygon: 'https://example.com/p1.geojson' } },
                { floodArea: { polygon: 'https://example.com/p2.geojson' } },
                { floodArea: { polygon: 'https://example.com/p3.geojson' } },
            ],
        };

        const mockPolygon = { features: [{ type: 'Feature', properties: {} }] };

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFloods),
            })
            .mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockPolygon),
            });

            await fetchLiveFloodAreas();

        expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('preserves feature order when flattening', async () => {
        const mockFloods = {
            items: [{ floodArea: { polygon: 'https://example.com/p1.geojson' } }, { floodArea: { polygon: 'https://example.com/p2.geojson' } }],
        };

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFloods),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    features: [
                        { type: 'Feature', properties: { id: 'p1-f1' } },
                        { type: 'Feature', properties: { id: 'p1-f2' } },
                    ],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    features: [{ type: 'Feature', properties: { id: 'p2-f1' } }],
                }),
            });

        const result = await fetchLiveFloodAreas();

        expect(result).toHaveLength(3);
        expect(result[0].properties.id).toBe('p1-f1');
        expect(result[1].properties.id).toBe('p1-f2');
        expect(result[2].properties.id).toBe('p2-f1');
    });
});
