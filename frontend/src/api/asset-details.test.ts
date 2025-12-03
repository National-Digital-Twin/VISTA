import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchAssetDetails, type AssetDetailsResponse } from './asset-details';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('asset-details API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAssetDetails', () => {
        const mockAssetId = '35a910f3-f611-4096-ac0b-0928c5612e32';

        it('successfully fetches asset details', async () => {
            const mockAssetDetails: AssetDetailsResponse = {
                id: mockAssetId,
                name: 'Test Hospital',
                geom: 'SRID=4326;POINT (-1.4 50.67)',
                type: {
                    id: 'type1',
                    name: 'Hospital',
                },
                providers: [
                    {
                        id: 'provider1',
                        name: 'Provider 1',
                        geom: 'SRID=4326;POINT (-1.5 50.68)',
                        type: {
                            id: 'provider-type1',
                            name: 'Provider Type 1',
                        },
                    },
                ],
                dependents: [
                    {
                        id: 'dependent1',
                        name: 'Dependent 1',
                        geom: 'SRID=4326;POINT (-1.3 50.66)',
                        type: {
                            id: 'dependent-type1',
                            name: 'Dependent Type 1',
                        },
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssetDetails),
            });

            const result = await fetchAssetDetails(mockAssetId);

            expect(fetchMock).toHaveBeenCalledWith(`/ndtp-python/api/assets/${mockAssetId}/`, {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockAssetDetails);
            expect(result.id).toBe(mockAssetId);
            expect(result.name).toBe('Test Hospital');
            expect(result.providers).toHaveLength(1);
            expect(result.dependents).toHaveLength(1);
        });

        it('handles asset with no providers or dependents', async () => {
            const mockAssetDetails: AssetDetailsResponse = {
                id: mockAssetId,
                name: 'Test Asset',
                geom: 'SRID=4326;POINT (-1.4 50.67)',
                type: {
                    id: 'type1',
                    name: 'Asset Type',
                },
                providers: [],
                dependents: [],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssetDetails),
            });

            const result = await fetchAssetDetails(mockAssetId);

            expect(result.providers).toEqual([]);
            expect(result.dependents).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchAssetDetails(mockAssetId)).rejects.toThrow(`Failed to retrieve asset details for ${mockAssetId}`);
        });

        it('handles network errors', async () => {
            const networkError = new Error('Network error');
            fetchMock.mockRejectedValue(networkError);

            await expect(fetchAssetDetails(mockAssetId)).rejects.toThrow('Network error');
        });

        it('handles JSON parsing errors', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            await expect(fetchAssetDetails(mockAssetId)).rejects.toThrow('Invalid JSON');
        });
    });
});
