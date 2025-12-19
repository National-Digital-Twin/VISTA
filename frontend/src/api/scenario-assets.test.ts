import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Geometry } from 'geojson';

import { fetchScenarioAssets } from './scenario-assets';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('scenario-assets API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    const mockPointGeometry: Geometry = {
        type: 'Point',
        coordinates: [-1.4, 50.67],
    };

    const createMockAssetResponse = (overrides?: { id?: string; name?: string; geometry?: Geometry; typeId?: string; typeName?: string }) => ({
        id: overrides?.id ?? 'asset-123',
        name: overrides?.name ?? 'Test Asset',
        geometry: overrides?.geometry ?? mockPointGeometry,
        type: {
            id: overrides?.typeId ?? 'type-456',
            name: overrides?.typeName ?? 'Hospital',
        },
    });

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchScenarioAssets', () => {
        it('successfully fetches scenario assets', async () => {
            const mockAssets = [createMockAssetResponse()];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssets),
            });

            const result = await fetchScenarioAssets({ scenarioId: 'scenario-123' });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/assets/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('asset-123');
            expect(result[0].name).toBe('Test Asset');
            expect(result[0].type).toBe('type-456');
            expect(result[0].elementType).toBe('asset');
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchScenarioAssets({ scenarioId: 'scenario-123' })).rejects.toThrow('Failed to fetch scenario assets: Not Found');
        });

        it('handles empty assets array', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchScenarioAssets({ scenarioId: 'scenario-123' });

            expect(result).toEqual([]);
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchScenarioAssets({ scenarioId: 'scenario-123' })).rejects.toThrow('Network error');
        });
    });

    describe('response transformation', () => {
        it('includes lat/lng from geometry and preserves original geometry', async () => {
            const mockAssets = [createMockAssetResponse({ geometry: mockPointGeometry })];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssets),
            });

            const result = await fetchScenarioAssets({ scenarioId: 'scenario-123' });

            expect(result[0].lat).toBe(50.67);
            expect(result[0].lng).toBe(-1.4);
            expect(result[0].geometry).toEqual(mockPointGeometry);
        });
    });

    describe('icon mapping', () => {
        it('uses icon from iconMap when available', async () => {
            const mockAssets = [createMockAssetResponse({ typeId: 'hospital-type' })];
            const iconMap = new Map([['hospital-type', 'fa-hospital']]);

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssets),
            });

            const result = await fetchScenarioAssets({ scenarioId: 'scenario-123', iconMap });

            expect(result[0].styles.faIcon).toBe('fa-hospital');
            expect(result[0].styles.iconFallbackText).toBe('hospital');
        });

        it('uses fallback when icon not in iconMap', async () => {
            const mockAssets = [createMockAssetResponse({ typeId: 'unknown-type' })];
            const iconMap = new Map([['other-type', 'fa-other']]);

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssets),
            });

            const result = await fetchScenarioAssets({ scenarioId: 'scenario-123', iconMap });

            expect(result[0].styles.faIcon).toBeUndefined();
            expect(result[0].styles.iconFallbackText).toBe('?');
        });

        it('uses fallback when iconMap is not provided', async () => {
            const mockAssets = [createMockAssetResponse()];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssets),
            });

            const result = await fetchScenarioAssets({ scenarioId: 'scenario-123' });

            expect(result[0].styles.faIcon).toBeUndefined();
            expect(result[0].styles.iconFallbackText).toBe('?');
        });

        it('sets default icon styles', async () => {
            const mockAssets = [createMockAssetResponse({ typeId: 'type-123', typeName: 'Hospital' })];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssets),
            });

            const result = await fetchScenarioAssets({ scenarioId: 'scenario-123' });

            expect(result[0].styles.classUri).toBe('type-123');
            expect(result[0].styles.color).toBe('#DDDDDD');
            expect(result[0].styles.backgroundColor).toBe('#121212');
            expect(result[0].styles.alt).toBe('Hospital');
        });
    });

    describe('asset transformation', () => {
        it('sets default dependent values', async () => {
            const mockAssets = [createMockAssetResponse()];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssets),
            });

            const result = await fetchScenarioAssets({ scenarioId: 'scenario-123' });

            expect(result[0].dependent.count).toBe(0);
            expect(result[0].dependent.criticalitySum).toBe(0);
        });

        it('handles multiple assets', async () => {
            const mockAssets = [
                createMockAssetResponse({ id: 'asset-1', name: 'Asset One' }),
                createMockAssetResponse({ id: 'asset-2', name: 'Asset Two' }),
                createMockAssetResponse({ id: 'asset-3', name: 'Asset Three' }),
            ];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssets),
            });

            const result = await fetchScenarioAssets({ scenarioId: 'scenario-123' });

            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('asset-1');
            expect(result[1].id).toBe('asset-2');
            expect(result[2].id).toBe('asset-3');
        });
    });
});
