import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAssetInfo, fetchAssetParts, fetchDependents, fetchProviders, fetchResidents } from './assets';

vi.mock('./utils', () => ({
    createParalogEndpoint: (path: string) => `/mock-api/${path}`,
    fetchOptions: {
        headers: {
            'Content-Type': 'application/json',
        },
    },
}));

describe('assets API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAssetInfo', () => {
        it('successfully fetches asset information', async () => {
            const mockAssetData = {
                uri: 'http://example.com/asset#123',
                name: 'Test Asset',
                type: 'Building',
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssetData),
            });

            const result = await fetchAssetInfo('http://example.com/asset#123');

            expect(result).toEqual(mockAssetData);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/asset?assetUri=http%3A%2F%2Fexample.com%2Fasset%23123', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('encodes special characters in URI', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchAssetInfo('http://example.com/asset#123?param=value&other=data');

            expect(fetchMock).toHaveBeenCalled();
            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('assetUri=');
            expect(callUrl).not.toContain('&other=');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });

            await expect(fetchAssetInfo('http://example.com/asset#999')).rejects.toThrow(
                'Failed to retrieve asset information for http://example.com/asset#999',
            );
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchAssetInfo('http://example.com/asset#123')).rejects.toThrow('Network error');
        });

        it('includes fetch options with correct headers', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchAssetInfo('http://example.com/asset#123');

            expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
                headers: { 'Content-Type': 'application/json' },
            });
        });
    });

    describe('fetchAssetParts', () => {
        it('successfully fetches asset parts', async () => {
            const mockParts = [
                { uri: 'http://example.com/part#1', name: 'Part 1' },
                { uri: 'http://example.com/part#2', name: 'Part 2' },
            ];

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockParts),
            });

            const result = await fetchAssetParts('http://example.com/asset#123');

            expect(result).toEqual(mockParts);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/asset/parts?assetUri=http%3A%2F%2Fexample.com%2Fasset%23123', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('handles empty parts list', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchAssetParts('http://example.com/asset#123');

            expect(result).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
            });

            await expect(fetchAssetParts('http://example.com/asset#123')).rejects.toThrow('Failed to retrieve asset parts for http://example.com/asset#123');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Connection timeout'));

            await expect(fetchAssetParts('http://example.com/asset#123')).rejects.toThrow('Connection timeout');
        });
    });

    describe('fetchDependents', () => {
        it('successfully fetches dependents', async () => {
            const mockDependents = {
                dependents: [
                    { uri: 'http://example.com/dependent#1', name: 'Dependent 1' },
                    { uri: 'http://example.com/dependent#2', name: 'Dependent 2' },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockDependents),
            });

            const result = await fetchDependents('http://example.com/asset#123');

            expect(result).toEqual(mockDependents);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/asset/dependents?assetUri=http%3A%2F%2Fexample.com%2Fasset%23123', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('handles no dependents', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ dependents: [] }),
            });

            const result = await fetchDependents('http://example.com/asset#123');

            expect(result.dependents).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 403,
            });

            await expect(fetchDependents('http://example.com/asset#123')).rejects.toThrow('Failed to retrieve dependents for http://example.com/asset#123');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Service unavailable'));

            await expect(fetchDependents('http://example.com/asset#123')).rejects.toThrow('Service unavailable');
        });
    });

    describe('fetchProviders', () => {
        it('successfully fetches providers', async () => {
            const mockProviders = {
                providers: [
                    { uri: 'http://example.com/provider#1', name: 'Provider 1', type: 'Service' },
                    { uri: 'http://example.com/provider#2', name: 'Provider 2', type: 'Utility' },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockProviders),
            });

            const result = await fetchProviders('http://example.com/asset#123');

            expect(result).toEqual(mockProviders);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/asset/providers?assetUri=http%3A%2F%2Fexample.com%2Fasset%23123', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('handles no providers', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ providers: [] }),
            });

            const result = await fetchProviders('http://example.com/asset#123');

            expect(result.providers).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 401,
            });

            await expect(fetchProviders('http://example.com/asset#123')).rejects.toThrow('Failed to retrieve providers for http://example.com/asset#123');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('DNS lookup failed'));

            await expect(fetchProviders('http://example.com/asset#123')).rejects.toThrow('DNS lookup failed');
        });
    });

    describe('fetchResidents', () => {
        it('successfully fetches residents', async () => {
            const mockResidents = {
                residents: [
                    { uri: 'http://example.com/resident#1', name: 'Resident 1', count: 50 },
                    { uri: 'http://example.com/resident#2', name: 'Resident 2', count: 100 },
                ],
                total: 150,
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockResidents),
            });

            const result = await fetchResidents('http://example.com/asset#123');

            expect(result).toEqual(mockResidents);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/asset/residents?assetUri=http%3A%2F%2Fexample.com%2Fasset%23123', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('handles no residents', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ residents: [], total: 0 }),
            });

            const result = await fetchResidents('http://example.com/asset#123');

            expect(result.residents).toEqual([]);
            expect(result.total).toBe(0);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 404,
            });

            await expect(fetchResidents('http://example.com/asset#123')).rejects.toThrow('Failed to retrieve residents for http://example.com/asset#123');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Request timeout'));

            await expect(fetchResidents('http://example.com/asset#123')).rejects.toThrow('Request timeout');
        });
    });

    describe('URI encoding across all functions', () => {
        const testUri = 'http://example.com/asset#special?test=1&data=2';

        it('encodes URI correctly in fetchAssetInfo', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchAssetInfo(testUri);

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('assetUri=');
            expect(decodeURIComponent(callUrl)).toContain(testUri);
        });

        it('encodes URI correctly in fetchAssetParts', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            await fetchAssetParts(testUri);

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('assetUri=');
            expect(decodeURIComponent(callUrl)).toContain(testUri);
        });

        it('encodes URI correctly in fetchDependents', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchDependents(testUri);

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('assetUri=');
            expect(decodeURIComponent(callUrl)).toContain(testUri);
        });

        it('encodes URI correctly in fetchProviders', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchProviders(testUri);

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('assetUri=');
            expect(decodeURIComponent(callUrl)).toContain(testUri);
        });

        it('encodes URI correctly in fetchResidents', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await fetchResidents(testUri);

            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('assetUri=');
            expect(decodeURIComponent(callUrl)).toContain(testUri);
        });
    });
});
