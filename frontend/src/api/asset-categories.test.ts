import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchAssetCategories, type AssetCategory } from './asset-categories';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('asset-categories API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAssetCategories', () => {
        it('successfully fetches asset categories', async () => {
            const mockCategories: AssetCategory[] = [
                {
                    id: 'cat1',
                    name: 'Healthcare',
                    subCategories: [
                        {
                            id: 'subcat1',
                            name: 'Healthcare Facilities',
                            assetTypes: [
                                {
                                    id: 'type1',
                                    name: 'Hospital',
                                    icon: 'fa-hospital',
                                },
                            ],
                        },
                    ],
                },
            ];

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockCategories),
            });

            const result = await fetchAssetCategories();

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/assetcategories/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockCategories);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('cat1');
            expect(result[0].name).toBe('Healthcare');
            expect(result[0].subCategories).toHaveLength(1);
        });

        it('handles empty response', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchAssetCategories();

            expect(result).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchAssetCategories()).rejects.toThrow('Failed to retrieve asset categories: Not Found');
        });

        it('handles network errors and logs them', async () => {
            const networkError = new Error('Network error');
            fetchMock.mockRejectedValue(networkError);

            await expect(fetchAssetCategories()).rejects.toThrow('Network error');
        });

        it('handles JSON parsing errors', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            await expect(fetchAssetCategories()).rejects.toThrow('Invalid JSON');
        });
    });
});
