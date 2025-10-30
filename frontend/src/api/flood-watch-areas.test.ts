import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAllFloodAreas, fetchFloodAreaPolygon } from './flood-watch-areas';

vi.mock('./utils', () => ({
    createParalogEndpoint: (path: string) => `/mock-api/${path}`,
}));

describe('flood-watch-areas API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAllFloodAreas', () => {
        it('successfully fetches all flood areas', async () => {
            const mockFloodAreas = {
                areas: [
                    {
                        uri: 'http://example.com/area#1',
                        name: 'Flood Area 1',
                        severity: 'Low',
                    },
                    {
                        uri: 'http://example.com/area#2',
                        name: 'Flood Area 2',
                        severity: 'Medium',
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFloodAreas),
            });

            const result = await fetchAllFloodAreas();

            expect(result).toEqual(mockFloodAreas);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/flood-watch-areas');
        });

        it('handles empty flood areas list', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ areas: [] }),
            });

            const result = await fetchAllFloodAreas();

            expect(result.areas).toEqual([]);
        });

        it('throws error with detail message when available', async () => {
            const errorResponse = { detail: 'Specific error message' };

            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: vi.fn().mockResolvedValue(errorResponse),
            });

            await expect(fetchAllFloodAreas()).rejects.toThrow('Specific error message');
        });

        it('throws generic error when no detail message', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: vi.fn().mockResolvedValue({}),
            });

            await expect(fetchAllFloodAreas()).rejects.toThrow('An error occurred while retrieving flood areas');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchAllFloodAreas()).rejects.toThrow('Network error');
        });

        it('parses JSON response before checking ok status', async () => {
            const jsonMock = vi.fn().mockResolvedValue({ areas: [] });
            fetchMock.mockResolvedValue({
                ok: true,
                json: jsonMock,
            });

            await fetchAllFloodAreas();

            expect(jsonMock).toHaveBeenCalled();
        });
    });

    describe('fetchFloodAreaPolygon', () => {
        it('successfully fetches flood area polygon', async () => {
            const mockPolygon = {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-1.35, 50.7],
                            [-1.36, 50.71],
                            [-1.34, 50.72],
                            [-1.35, 50.7],
                        ],
                    ],
                },
                properties: {
                    uri: 'http://example.com/polygon#1',
                    name: 'Test Polygon',
                },
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockPolygon),
            });

            const result = await fetchFloodAreaPolygon('http://example.com/polygon#1');

            expect(result).toEqual(mockPolygon);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/flood-watch-areas/polygon?polygon_uri=http%3A%2F%2Fexample.com%2Fpolygon%231');
        });

        it('encodes polygon URI correctly', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchFloodAreaPolygon('http://example.com/polygon#special?param=value&data=test');

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('polygon_uri=');
            expect(callUrl).not.toContain('&data=');
            expect(decodeURIComponent(callUrl)).toContain('http://example.com/polygon#special?param=value&data=test');
        });

        it('throws error with detail message when available', async () => {
            const errorResponse = { detail: 'Polygon not found' };

            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
                json: vi.fn().mockResolvedValue(errorResponse),
            });

            await expect(fetchFloodAreaPolygon('http://example.com/polygon#missing')).rejects.toThrow('Polygon not found');
        });

        it('throws error with URI in message when no detail', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: vi.fn().mockResolvedValue({}),
            });

            await expect(fetchFloodAreaPolygon('http://example.com/polygon#test')).rejects.toThrow(
                'An error occured while retrieving polygon http://example.com/polygon#test',
            );
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Connection timeout'));

            await expect(fetchFloodAreaPolygon('http://example.com/polygon#1')).rejects.toThrow('Connection timeout');
        });

        it('handles multipolygon geometry', async () => {
            const mockMultiPolygon = {
                type: 'Feature',
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [
                                [-1.35, 50.7],
                                [-1.36, 50.71],
                                [-1.35, 50.7],
                            ],
                        ],
                        [
                            [
                                [-1.4, 50.75],
                                [-1.41, 50.76],
                                [-1.4, 50.75],
                            ],
                        ],
                    ],
                },
                properties: {},
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockMultiPolygon),
            });

            const result = await fetchFloodAreaPolygon('http://example.com/polygon#multi');

            expect(result.geometry.type).toBe('MultiPolygon');
            expect(result.geometry.coordinates).toHaveLength(2);
        });

        it('preserves polygon properties', async () => {
            const mockPolygonWithProps = {
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [] },
                properties: {
                    name: 'Test Area',
                    severity: 'High',
                    description: 'Test description',
                },
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockPolygonWithProps),
            });

            const result = await fetchFloodAreaPolygon('http://example.com/polygon#1');

            expect(result.properties).toEqual(mockPolygonWithProps.properties);
        });

        it('parses JSON before checking ok status', async () => {
            const jsonMock = vi.fn().mockResolvedValue({ type: 'Feature' });
            fetchMock.mockResolvedValue({
                ok: true,
                json: jsonMock,
            });

            await fetchFloodAreaPolygon('http://example.com/polygon#1');

            expect(jsonMock).toHaveBeenCalled();
        });
    });
});
