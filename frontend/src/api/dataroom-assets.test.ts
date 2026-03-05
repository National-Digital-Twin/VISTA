// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDataroomAssets, updateBulkCriticality } from './dataroom-assets';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('dataroom-assets API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('fetchDataroomAssets requests assets with all optional query params', async () => {
        const payload = [
            {
                id: 'a1',
                name: 'Asset 1',
                geometry: { type: 'Point', coordinates: [1, 2] },
                assetTypeId: 't1',
                assetTypeName: 'Hospital',
                subCategoryName: 'Sub',
                categoryName: 'Cat',
                criticalityScore: 2,
                criticalityIsOverridden: false,
            },
        ];
        fetchMock.mockResolvedValue({
            ok: true,
            statusText: 'OK',
            json: vi.fn().mockResolvedValue(payload),
        });

        const result = await fetchDataroomAssets({
            scenarioId: 'scenario-1',
            categoryId: 'cat-1',
            subCategoryId: 'sub-1',
            assetTypeId: 'type-1',
            geometry: 'POLYGON((0 0,1 1,1 0,0 0))',
        });

        expect(fetchMock).toHaveBeenCalledWith(
            '/ndtp-python/api/scenarios/scenario-1/dataroom/assets/?category_id=cat-1&sub_category_id=sub-1&asset_type_id=type-1&geometry=POLYGON%28%280+0%2C1+1%2C1+0%2C0+0%29%29',
        );
        expect(result).toEqual(payload);
    });

    it('fetchDataroomAssets throws when response is not ok', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            statusText: 'Bad Request',
        });

        await expect(fetchDataroomAssets({ scenarioId: 'scenario-2' })).rejects.toThrow('Failed to fetch dataroom assets: Bad Request');
    });

    it('updateBulkCriticality sends PUT request with payload and returns response', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            statusText: 'OK',
            json: vi.fn().mockResolvedValue({ updatedCount: 2 }),
        });

        const result = await updateBulkCriticality('scenario-1', {
            updates: [
                { assetId: 'a1', criticalityScore: 1 },
                { assetId: 'a2', criticalityScore: 3 },
            ],
        });

        expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/dataroom/assets/criticality/', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                updates: [
                    { assetId: 'a1', criticalityScore: 1 },
                    { assetId: 'a2', criticalityScore: 3 },
                ],
            }),
        });
        expect(result).toEqual({ updatedCount: 2 });
    });

    it('updateBulkCriticality throws when response is not ok', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            statusText: 'Internal Server Error',
        });

        await expect(updateBulkCriticality('scenario-1', { updates: [] })).rejects.toThrow('Failed to update criticality: Internal Server Error');
    });
});
