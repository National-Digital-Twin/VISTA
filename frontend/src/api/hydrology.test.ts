import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchStations, fetchReadings, fetchMostRecentReading, fetchStationGeoJson, fetchAllLiveStations, STATION_TYPES } from './hydrology';

vi.mock('@turf/turf', () => ({
    distance: vi.fn((from: number[], to: number[]) => {
        const [lon1, lat1] = from;
        const [lon2, lat2] = to;
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        return Math.hypot(dLat, dLon) * 100;
    }),
}));

describe('hydrology API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchStations', () => {
        const mockStationsResponse = {
            items: [
                {
                    stationGuid: 'station-guid-1',
                    label: 'Station 1',
                    lat: 50.7,
                    long: -1.35,
                    type: [
                        { '@id': 'https://environment.data.gov.uk/flood-monitoring/def/core/RiverLevel' },
                        { '@id': 'https://environment.data.gov.uk/flood-monitoring/def/core/RiverFlow' },
                    ],
                    measures: [{ 'period': 900, 'parameter': 'level', '@id': 'http://example.com/measure#1' }],
                    RLOIid: 12345,
                },
                {
                    stationGuid: 'station-guid-2',
                    label: 'Station 2',
                    lat: 50.8,
                    long: -1.4,
                    type: [{ '@id': 'https://environment.data.gov.uk/flood-monitoring/def/core/Groundwater' }],
                    measures: [{ 'period': 900, 'parameter': 'groundwater', '@id': 'http://example.com/measure#2' }],
                    RLOIid: 67890,
                },
            ],
        };

        it('successfully fetches and transforms stations', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockStationsResponse),
            });

            const result = await fetchStations();

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                id: 'station-guid-1',
                name: 'Station 1',
                latitude: 50.7,
                longitude: -1.35,
                RLOIid: 12345,
            });
        });

        it('transforms station types correctly', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockStationsResponse),
            });

            const result = await fetchStations();

            expect(result[0].types).toContain(STATION_TYPES.RiverLevel);
            expect(result[0].types).toContain(STATION_TYPES.RiverFlow);
            expect(result[1].types).toContain(STATION_TYPES.Groundwater);
        });

        it('preserves measures data', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockStationsResponse),
            });

            const result = await fetchStations();

            expect(result[0].measures).toHaveLength(1);
            expect(result[0].measures[0]).toMatchObject({
                'period': 900,
                'parameter': 'level',
                '@id': 'http://example.com/measure#1',
            });
        });

        it('uses correct API endpoint with query parameters', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            await fetchStations();

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('lat=50.7');
            expect(callUrl).toContain('long=-1.35');
            expect(callUrl).toContain('dist=10');
            expect(callUrl).toContain('_limit=20000');
            expect(callUrl).toContain('_projection=RLOIid');
            expect(callUrl).toContain('_withView');
            expect(callUrl).toContain('status=statusActive');
        });

        it('handles station with all station types', async () => {
            const allTypesStation = {
                items: [
                    {
                        stationGuid: 'all-types',
                        label: 'All Types Station',
                        lat: 50.7,
                        long: -1.35,
                        type: [
                            { '@id': 'https://environment.data.gov.uk/flood-monitoring/def/core/GroundwaterDippedOnly' },
                            { '@id': 'https://environment.data.gov.uk/flood-monitoring/def/core/Groundwater' },
                            { '@id': 'https://environment.data.gov.uk/flood-monitoring/def/core/RainfallStation' },
                            { '@id': 'https://environment.data.gov.uk/flood-monitoring/def/core/RiverFlow' },
                            { '@id': 'https://environment.data.gov.uk/flood-monitoring/def/core/RiverLevel' },
                        ],
                        measures: [],
                        RLOIid: 11111,
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(allTypesStation),
            });

            const result = await fetchStations();

            expect(result[0].types).toHaveLength(5);
            expect(result[0].types).toContain(STATION_TYPES.GroundwaterDippedOnly);
            expect(result[0].types).toContain(STATION_TYPES.Groundwater);
            expect(result[0].types).toContain(STATION_TYPES.RainfallStation);
            expect(result[0].types).toContain(STATION_TYPES.RiverFlow);
            expect(result[0].types).toContain(STATION_TYPES.RiverLevel);
        });

        it('handles empty stations response', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            const result = await fetchStations();

            expect(result).toEqual([]);
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchStations()).rejects.toThrow('Network error');
        });
    });

    describe('fetchReadings', () => {
        it('successfully fetches readings for date range', async () => {
            const mockReadings = {
                items: [
                    { dateTime: '2024-06-01T10:00:00Z', value: 1.5 },
                    { dateTime: '2024-06-01T11:00:00Z', value: 1.6 },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockReadings),
            });

            const startDate = new Date('2024-06-01T00:00:00Z');
            const endDate = new Date('2024-06-02T00:00:00Z');
            const result = await fetchReadings('http://example.com/measure#1', startDate, endDate);

            expect(result).toEqual(mockReadings);
            expect(fetchMock).toHaveBeenCalled();
            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('maxeq-dateTime=2024-06-02T00:00:00.000Z');
            expect(callUrl).toContain('mineq-dateTime=2024-06-01T00:00:00.000Z');
        });

        it('upgrades HTTP URLs to HTTPS', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            const startDate = new Date('2024-06-01');
            const endDate = new Date('2024-06-02');
            await fetchReadings('http://example.com/measure#1', startDate, endDate);

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toMatch(/^https:/);
            expect(callUrl).not.toMatch(/^http:/);
        });

        it('preserves HTTPS URLs', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            const startDate = new Date('2024-06-01');
            const endDate = new Date('2024-06-02');
            await fetchReadings('https://secure.example.com/measure#1', startDate, endDate);

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toMatch(/^https:\/\/secure/);
        });

        it('handles empty readings response', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            const result = await fetchReadings('http://example.com/measure#1', new Date(), new Date());

            expect(result.items).toEqual([]);
        });

        it('formats ISO date strings correctly', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            const startDate = new Date('2024-03-15T14:30:45.123Z');
            const endDate = new Date('2024-03-20T09:15:30.456Z');
            await fetchReadings('http://example.com/measure#1', startDate, endDate);

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('mineq-dateTime=2024-03-15T14:30:45.123Z');
            expect(callUrl).toContain('maxeq-dateTime=2024-03-20T09:15:30.456Z');
        });
    });

    describe('fetchMostRecentReading', () => {
        it('successfully fetches most recent reading', async () => {
            const mockReading = {
                items: [{ dateTime: '2024-06-15T12:00:00Z', value: 2.5 }],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockReading),
            });

            const result = await fetchMostRecentReading('http://example.com/measure#1');

            expect(result).toEqual(mockReading);
            expect(fetchMock).toHaveBeenCalled();
            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('/readings?latest');
        });

        it('upgrades HTTP URLs to HTTPS', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            await fetchMostRecentReading('http://example.com/measure#1');

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toMatch(/^https:/);
        });

        it('preserves HTTPS URLs', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            await fetchMostRecentReading('https://secure.example.com/measure#1');

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toMatch(/^https:\/\/secure/);
        });

        it('handles empty reading response', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ items: [] }),
            });

            const result = await fetchMostRecentReading('http://example.com/measure#1');

            expect(result.items).toEqual([]);
        });
    });

    describe('fetchStationGeoJson', () => {
        it('successfully fetches station GeoJSON', async () => {
            const mockGeoJson = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [-1.35, 50.7] },
                        properties: { stationReference: 'REF1', name: 'Station 1' },
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockGeoJson),
            });

            const result = await fetchStationGeoJson();

            expect(result).toEqual(mockGeoJson);
            expect(fetchMock).toHaveBeenCalledWith('https://check-for-flooding.service.gov.uk/api/stations.geojson');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 503,
            });

            await expect(fetchStationGeoJson()).rejects.toThrow('An error occurred while retrieving station geojson');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchStationGeoJson()).rejects.toThrow('Network error');
        });

        it('handles empty features array', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
            });

            const result = await fetchStationGeoJson();

            expect(result.features).toEqual([]);
        });
    });

    describe('fetchAllLiveStations', () => {
        const mockGeoJson = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [-1.35, 50.7] },
                    properties: { stationReference: 'CLOSE1', name: 'Close Station' },
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [-1.36, 50.71] },
                    properties: { stationReference: 'CLOSE2', name: 'Another Close Station' },
                },
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [-5, 55] },
                    properties: { stationReference: 'FAR1', name: 'Far Station' },
                },
            ],
        };

        it('successfully fetches and filters stations by distance', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(structuredClone(mockGeoJson)),
            });

            const result = await fetchAllLiveStations();

            expect(fetchMock).toHaveBeenCalledWith('https://check-for-flooding.service.gov.uk/api/stations.geojson');
            expect(result.type).toBe('FeatureCollection');
            expect(Array.isArray(result.features)).toBe(true);
        });

        it('filters out stations beyond max distance', async () => {
            const testData = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [-1.35, 50.7] },
                        properties: { name: 'Close' },
                    },
                    {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [-10, 60] },
                        properties: { name: 'Far' },
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(structuredClone(testData)),
            });

            const result = await fetchAllLiveStations();

            expect(result.features.length).toBeLessThan(testData.features.length);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
            });

            await expect(fetchAllLiveStations()).rejects.toThrow('An error occurred while retrieving station geojson');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Connection timeout'));

            await expect(fetchAllLiveStations()).rejects.toThrow('Connection timeout');
        });

        it('handles empty features array', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
            });

            const result = await fetchAllLiveStations();

            expect(result.features).toEqual([]);
        });

        it('preserves GeoJSON structure', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(structuredClone(mockGeoJson)),
            });

            const result = await fetchAllLiveStations();

            expect(result.type).toBe('FeatureCollection');
            expect(result).toHaveProperty('features');
            expect(result.features.every((f: any) => f.type === 'Feature')).toBe(true);
        });

        it('preserves feature properties after filtering', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(structuredClone(mockGeoJson)),
            });

            const result = await fetchAllLiveStations();

            for (const feature of result.features as any[]) {
                expect(feature).toHaveProperty('geometry');
                expect(feature).toHaveProperty('properties');
                expect(feature.geometry).toHaveProperty('coordinates');
            }
        });
    });

    describe('STATION_TYPES', () => {
        it('exports all station type constants', () => {
            expect(STATION_TYPES.GroundwaterDippedOnly).toBe('GroundwaterDippedOnly');
            expect(STATION_TYPES.Groundwater).toBe('Groundwater');
            expect(STATION_TYPES.RainfallStation).toBe('RainfallStation');
            expect(STATION_TYPES.RiverFlow).toBe('RiverFlow');
            expect(STATION_TYPES.RiverLevel).toBe('RiverLevel');
        });
    });

    describe('URL upgrading behavior', () => {
        it('upgrades HTTP to HTTPS in fetchReadings', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchReadings('http://insecure.example.com/measure#1', new Date(), new Date());

            expect(fetchMock.mock.calls[0][0]).toMatch(/^https:/);
            expect(fetchMock.mock.calls[0][0]).toContain('insecure.example.com');
        });

        it('upgrades HTTP to HTTPS in fetchMostRecentReading', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchMostRecentReading('http://insecure.example.com/measure#1');

            expect(fetchMock.mock.calls[0][0]).toMatch(/^https:/);
            expect(fetchMock.mock.calls[0][0]).toContain('insecure.example.com');
        });
    });
});
