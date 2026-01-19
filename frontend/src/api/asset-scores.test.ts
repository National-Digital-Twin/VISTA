import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAssetScore, type AssetScore } from './asset-scores';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('asset-scores API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAssetScore', () => {
        const mockScenarioId = 'scenario-123';
        const mockAssetId = 'asset-456';

        it('successfully fetches asset score', async () => {
            const mockAssetScore: AssetScore = {
                id: 'score-1',
                scenarioId: mockScenarioId,
                criticalityScore: '3.0',
                dependencyScore: '2.5',
                exposureScore: '1.5',
                redundancyScore: '0.5',
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssetScore),
            });

            const result = await fetchAssetScore(mockScenarioId, mockAssetId);

            expect(fetchMock).toHaveBeenCalledWith(`/ndtp-python/api/scenarios/${mockScenarioId}/assetscores/${mockAssetId}/`, {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockAssetScore);
            expect(result.criticalityScore).toBe('3.0');
            expect(result.dependencyScore).toBe('2.5');
            expect(result.exposureScore).toBe('1.5');
            expect(result.redundancyScore).toBe('0.5');
        });

        it('handles asset score with zero values', async () => {
            const mockAssetScore: AssetScore = {
                id: 'score-2',
                scenarioId: mockScenarioId,
                criticalityScore: '0',
                dependencyScore: '0',
                exposureScore: '0',
                redundancyScore: '0',
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssetScore),
            });

            const result = await fetchAssetScore(mockScenarioId, mockAssetId);

            expect(result.criticalityScore).toBe('0');
            expect(result.dependencyScore).toBe('0');
            expect(result.exposureScore).toBe('0');
            expect(result.redundancyScore).toBe('0');
        });

        it('handles asset score with maximum values', async () => {
            const mockAssetScore: AssetScore = {
                id: 'score-3',
                scenarioId: mockScenarioId,
                criticalityScore: '3',
                dependencyScore: '3',
                exposureScore: '3',
                redundancyScore: '3',
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssetScore),
            });

            const result = await fetchAssetScore(mockScenarioId, mockAssetId);

            expect(result.criticalityScore).toBe('3');
            expect(result.dependencyScore).toBe('3');
            expect(result.exposureScore).toBe('3');
            expect(result.redundancyScore).toBe('3');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchAssetScore(mockScenarioId, mockAssetId)).rejects.toThrow(`Failed to retrieve asset score for ${mockAssetId}: Not Found`);
        });

        it('throws error with status text when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(fetchAssetScore(mockScenarioId, mockAssetId)).rejects.toThrow(
                `Failed to retrieve asset score for ${mockAssetId}: Internal Server Error`,
            );
        });

        it('handles network errors', async () => {
            const networkError = new Error('Network error');
            fetchMock.mockRejectedValue(networkError);

            await expect(fetchAssetScore(mockScenarioId, mockAssetId)).rejects.toThrow('Network error');
        });

        it('handles JSON parsing errors', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            await expect(fetchAssetScore(mockScenarioId, mockAssetId)).rejects.toThrow('Invalid JSON');
        });
    });
});
