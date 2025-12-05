import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchDataSources, type DataSource } from './datasources';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('datasources API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchDataSources', () => {
        it('successfully fetches data sources', async () => {
            const mockDataSources: DataSource[] = [
                {
                    id: 'ds1',
                    name: 'Data Source 1',
                    assetCount: 100,
                    lastUpdated: '2024-01-01T00:00:00Z',
                    owner: 'Owner 1',
                },
                {
                    id: 'ds2',
                    name: 'Data Source 2',
                    assetCount: 200,
                    lastUpdated: null,
                    owner: 'Owner 2',
                },
            ];

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockDataSources),
            });

            const result = await fetchDataSources();

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/datasources/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockDataSources);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('ds1');
            expect(result[0].name).toBe('Data Source 1');
            expect(result[0].assetCount).toBe(100);
            expect(result[1].lastUpdated).toBeNull();
        });

        it('handles empty response', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchDataSources();

            expect(result).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(fetchDataSources()).rejects.toThrow('Failed to fetch data sources: Internal Server Error');
        });

        it('handles network errors', async () => {
            const networkError = new Error('Network error');
            fetchMock.mockRejectedValue(networkError);

            await expect(fetchDataSources()).rejects.toThrow('Network error');
        });

        it('handles JSON parsing errors', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            await expect(fetchDataSources()).rejects.toThrow('Invalid JSON');
        });
    });
});
