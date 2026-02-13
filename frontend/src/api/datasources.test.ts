import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchDataSources, fetchDataSource, grantDataSourceGroupAccess, revokeDataSourceGroupAccess, type DataSource } from './datasources';

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
                    description: 'ds1 description',
                    assetCount: 100,
                    lastUpdated: '2024-01-01T00:00:00Z',
                    owner: 'Owner 1',
                    globallyAvailable: true,
                    groupsWithAccess: [],
                },
                {
                    id: 'ds2',
                    name: 'Data Source 2',
                    description: 'ds2 description',
                    assetCount: 200,
                    lastUpdated: null,
                    owner: 'Owner 2',
                    globallyAvailable: false,
                    groupsWithAccess: [{ id: 'g1', name: 'Group 1', members: ['m1'] }],
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
            expect(result[0].globallyAvailable).toBe(true);
            expect(result[1].lastUpdated).toBeNull();
            expect(result[1].groupsWithAccess).toHaveLength(1);
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

    describe('fetchDataSource', () => {
        it('successfully fetches a data source detail', async () => {
            const mockDataSource: DataSource = {
                id: 'ds1',
                name: 'Data Source 1',
                description: 'ds1 description',
                assetCount: 100,
                lastUpdated: '2024-01-01T00:00:00Z',
                owner: 'Owner 1',
                globallyAvailable: false,
                groupsWithAccess: [{ id: 'g1', name: 'Group 1', members: ['m1'] }],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockDataSource),
            });

            const result = await fetchDataSource('ds1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/datasources/ds1/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockDataSource);
        });

        it('throws error when detail response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchDataSource('missing')).rejects.toThrow('Failed to fetch data sources: Not Found');
        });
    });

    describe('grantDataSourceGroupAccess', () => {
        it('grants group access successfully', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await grantDataSourceGroupAccess('ds1', 'g1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/datasources/ds1/access/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group: 'g1' }),
            });
        });

        it('throws on grant access failure', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Bad Request',
                text: vi.fn().mockResolvedValue('Invalid group'),
            });

            await expect(grantDataSourceGroupAccess('ds1', 'bad')).rejects.toThrow('Invalid group');
        });
    });

    describe('revokeDataSourceGroupAccess', () => {
        it('revokes group access successfully', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await revokeDataSourceGroupAccess('ds1', 'g1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/datasources/ds1/access/g1/', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws on revoke access failure', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
                text: vi.fn().mockResolvedValue('Access not found'),
            });

            await expect(revokeDataSourceGroupAccess('ds1', 'g1')).rejects.toThrow('Access not found');
        });
    });
});
