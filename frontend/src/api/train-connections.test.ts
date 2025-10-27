import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTrainDepartures, fetchTrainArrivals } from './train-connections';

describe('train-connections API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchTrainDepartures', () => {
        it('successfully fetches train departures', async () => {
            const mockDepartures = {
                location: { name: 'Test Station' },
                services: [
                    {
                        serviceUid: 'service-1',
                        runDate: '2024-06-15',
                        trainIdentity: '1A23',
                        destination: { description: 'London Waterloo' },
                        locationDetail: {
                            gbttBookedDeparture: '10:30',
                            realtimeDeparture: '10:32',
                        },
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockDepartures),
            });

            const result = await fetchTrainDepartures('RYD');

            expect(result).toEqual(mockDepartures);
            expect(fetchMock).toHaveBeenCalledWith('/transparent-proxy/realtime-trains/json/search/RYD');
        });

        it('handles CRS station codes', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ services: [] }),
            });

            await fetchTrainDepartures('WAT');

            expect(fetchMock).toHaveBeenCalledWith('/transparent-proxy/realtime-trains/json/search/WAT');
        });

        it('handles TIPLOC station codes', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ services: [] }),
            });

            await fetchTrainDepartures('WATRLMN');

            expect(fetchMock).toHaveBeenCalledWith('/transparent-proxy/realtime-trains/json/search/WATRLMN');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
            });

            await expect(fetchTrainDepartures('INVALID')).rejects.toThrow('An error occurred while retrieving train departure data for the specified station.');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchTrainDepartures('RYD')).rejects.toThrow('Network error');
        });

        it('handles empty services array', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ services: [] }),
            });

            const result = await fetchTrainDepartures('RYD');

            expect(result.services).toEqual([]);
        });

        it('handles station with multiple departures', async () => {
            const mockMultipleDepartures = {
                services: [
                    { serviceUid: 'service-1', trainIdentity: '1A23' },
                    { serviceUid: 'service-2', trainIdentity: '2B45' },
                    { serviceUid: 'service-3', trainIdentity: '3C67' },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockMultipleDepartures),
            });

            const result = await fetchTrainDepartures('RYD');

            expect(result.services).toHaveLength(3);
        });
    });

    describe('fetchTrainArrivals', () => {
        it('successfully fetches train arrivals', async () => {
            const mockArrivals = {
                location: { name: 'Test Station' },
                services: [
                    {
                        serviceUid: 'service-1',
                        runDate: '2024-06-15',
                        trainIdentity: '1A23',
                        origin: { description: 'Portsmouth Harbour' },
                        locationDetail: {
                            gbttBookedArrival: '11:45',
                            realtimeArrival: '11:47',
                        },
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockArrivals),
            });

            const result = await fetchTrainArrivals('RYD');

            expect(result).toEqual(mockArrivals);
            expect(fetchMock).toHaveBeenCalledWith('/transparent-proxy/realtime-trains/json/search/RYD/arrivals');
        });

        it('constructs correct URL with /arrivals suffix', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ services: [] }),
            });

            await fetchTrainArrivals('TEST');

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toBe('/transparent-proxy/realtime-trains/json/search/TEST/arrivals');
            expect(callUrl).toContain('/arrivals');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 503,
            });

            await expect(fetchTrainArrivals('STATION')).rejects.toThrow('An error occurred while retrieving train arrival data for the specified station.');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Connection timeout'));

            await expect(fetchTrainArrivals('RYD')).rejects.toThrow('Connection timeout');
        });

        it('handles empty arrivals array', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ services: [] }),
            });

            const result = await fetchTrainArrivals('RYD');

            expect(result.services).toEqual([]);
        });

        it('handles station with multiple arrivals', async () => {
            const mockMultipleArrivals = {
                services: [
                    { serviceUid: 'arr-1', trainIdentity: '1A23' },
                    { serviceUid: 'arr-2', trainIdentity: '2B45' },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockMultipleArrivals),
            });

            const result = await fetchTrainArrivals('RYD');

            expect(result.services).toHaveLength(2);
        });

        it('handles different station codes', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ services: [] }),
            });

            await fetchTrainArrivals('SWN');

            expect(fetchMock).toHaveBeenCalledWith('/transparent-proxy/realtime-trains/json/search/SWN/arrivals');
        });
    });

    describe('API endpoint consistency', () => {
        it('uses same base path for departures and arrivals', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ services: [] }),
            });

            await fetchTrainDepartures('TEST');
            const departuresUrl = fetchMock.mock.calls[0][0];

            await fetchTrainArrivals('TEST');
            const arrivalsUrl = fetchMock.mock.calls[1][0];

            expect(departuresUrl).toContain('/transparent-proxy/realtime-trains/json/search/TEST');
            expect(arrivalsUrl).toContain('/transparent-proxy/realtime-trains/json/search/TEST');
        });
    });
});
