import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTypeSuperclass, fetchResidentialInformation, fetchFloodTimeline, fetchFloodMonitoringStations } from './common';

vi.mock('./utils', () => ({
    createParalogEndpoint: (path: string) => `/mock-api/${path}`,
    fetchOptions: {
        headers: {
            'Content-Type': 'application/json',
        },
    },
}));

describe('common API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchTypeSuperclass', () => {
        it('successfully fetches type superclass', async () => {
            const mockSuperclass = {
                uri: 'http://example.com/type#parent',
                name: 'Parent Type',
                properties: ['prop1', 'prop2'],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockSuperclass),
            });

            const result = await fetchTypeSuperclass('http://example.com/type#child');

            expect(result).toEqual(mockSuperclass);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/ontology/class?classUri=http%3A%2F%2Fexample.com%2Ftype%23child', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('returns empty object when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
            });

            const result = await fetchTypeSuperclass('http://example.com/type#missing');

            expect(result).toEqual({});
        });

        it('returns empty object on network error', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchTypeSuperclass('http://example.com/type#test')).rejects.toThrow('Network error');
        });

        it('encodes special characters in classUri', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchTypeSuperclass('http://example.com/type#special?param=value');

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('classUri=');
            expect(callUrl).not.toContain('?param=');
        });

        it('handles empty response data', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            const result = await fetchTypeSuperclass('http://example.com/type#test');

            expect(result).toEqual({});
        });
    });

    describe('fetchResidentialInformation', () => {
        it('successfully fetches residential information', async () => {
            const mockResidences = {
                residences: [
                    { address: '123 Main St', type: 'House', occupants: 4 },
                    { address: '456 Oak Ave', type: 'Apartment', occupants: 2 },
                ],
                total: 2,
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockResidences),
            });

            const result = await fetchResidentialInformation('http://example.com/person#123');

            expect(result).toEqual(mockResidences);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/person/residences?personUri=http%3A%2F%2Fexample.com%2Fperson%23123', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
            });

            await expect(fetchResidentialInformation('http://example.com/person#123')).rejects.toThrow(
                'An error occured while retrieving residential information',
            );
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Connection timeout'));

            await expect(fetchResidentialInformation('http://example.com/person#123')).rejects.toThrow('Connection timeout');
        });

        it('handles empty residences list', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ residences: [], total: 0 }),
            });

            const result = await fetchResidentialInformation('http://example.com/person#123');

            expect(result.residences).toEqual([]);
            expect(result.total).toBe(0);
        });

        it('encodes special characters in personUri', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchResidentialInformation('http://example.com/person#special?id=1&name=test');

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('personUri=');
            expect(callUrl).not.toContain('&name=');
        });
    });

    describe('fetchFloodTimeline', () => {
        it('successfully fetches flood timeline', async () => {
            const mockTimeline = {
                timeline: [
                    { date: '2024-01-01', severity: 'Low', message: 'No flooding' },
                    { date: '2024-02-01', severity: 'Medium', message: 'Some flooding' },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockTimeline),
            });

            const result = await fetchFloodTimeline('area123');

            expect(result).toEqual(mockTimeline);
            expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/mock-api/states?parent_uri='), {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('constructs correct flood area URI', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchFloodTimeline('testArea456');

            const callUrl = fetchMock.mock.calls[0][0];
            expect(decodeURIComponent(callUrl)).toContain('https://environment.data.gov.uk/flood-monitoring/id/floodAreas/testArea456');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
            });

            await expect(fetchFloodTimeline('area999')).rejects.toThrow('An error occured while retrieving flood timeline for Flood Area area999');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchFloodTimeline('area123')).rejects.toThrow('Network error');
        });

        it('handles empty timeline', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ timeline: [] }),
            });

            const result = await fetchFloodTimeline('area123');

            expect(result.timeline).toEqual([]);
        });
    });

    describe('fetchFloodMonitoringStations', () => {
        it('successfully fetches flood monitoring stations', async () => {
            const mockStations = {
                items: [
                    {
                        '@id': 'station-1',
                        'label': 'Station 1',
                        'lat': 50.7,
                        'long': -1.35,
                        'stationReference': 'REF1',
                    },
                    {
                        '@id': 'station-2',
                        'label': 'Station 2',
                        'lat': 50.8,
                        'long': -1.4,
                        'stationReference': 'REF2',
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockStations),
            });

            const result = await fetchFloodMonitoringStations();

            expect(result).toEqual(mockStations);
            expect(fetchMock).toHaveBeenCalledWith('https://environment.data.gov.uk/flood-monitoring/id/stations?catchmentName=Isle%20of%20Wight');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 503,
            });

            await expect(fetchFloodMonitoringStations()).rejects.toThrow('An error occured while retrieving flood monitoring stations for the Isle of Wight');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Service unavailable'));

            await expect(fetchFloodMonitoringStations()).rejects.toThrow('Service unavailable');
        });

        it('handles empty stations list', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            const result = await fetchFloodMonitoringStations();

            expect(result.items).toEqual([]);
        });

        it('uses correct catchment name for Isle of Wight', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            await fetchFloodMonitoringStations();

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('catchmentName=Isle%20of%20Wight');
        });
    });
});
