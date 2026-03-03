import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAssetByExternalId, fetchAssetById, type AssetExternalIdMatch } from './asset-search';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('asset-search API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('fetchAssetById returns parsed asset details when response is ok', async () => {
        const payload = {
            id: 'asset-1',
            name: 'Asset One',
            geom: 'POINT(0 0)',
            type: { id: 'type-1', name: 'Hospital' },
            providers: [],
            dependents: [],
        };

        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue(payload),
        });

        const result = await fetchAssetById('asset-1');

        expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/assets/asset-1/', {
            headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(payload);
    });

    it.each([404, 403])('fetchAssetById returns null for status %i', async (status) => {
        fetchMock.mockResolvedValue({
            ok: false,
            status,
        });

        await expect(fetchAssetById('asset-2')).resolves.toBeNull();
    });

    it('fetchAssetById throws for non-ok unexpected statuses', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
        });

        await expect(fetchAssetById('asset-3')).rejects.toThrow('Failed to retrieve asset details for asset-3');
    });

    it('fetchAssetByExternalId returns parsed match when response is ok', async () => {
        const payload: AssetExternalIdMatch = {
            id: 'asset-9',
            name: 'Asset Nine',
        };
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue(payload),
        });

        const result = await fetchAssetByExternalId('ext-9');

        expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/assets/resolve-external-id/?external_id=ext-9', {
            headers: { 'Content-Type': 'application/json' },
        });
        expect(result).toEqual(payload);
    });

    it.each([404, 403])('fetchAssetByExternalId returns null for status %i', async (status) => {
        fetchMock.mockResolvedValue({
            ok: false,
            status,
        });

        await expect(fetchAssetByExternalId('ext-404')).resolves.toBeNull();
    });

    it('fetchAssetByExternalId throws for non-ok unexpected statuses', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
        });

        await expect(fetchAssetByExternalId('ext-500')).rejects.toThrow('Failed to resolve asset external ID ext-500');
    });
});
