import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchScenarios, type Scenario } from './scenarios';

describe('scenarios API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchScenarios', () => {
        it('successfully fetches scenarios from API', async () => {
            const mockScenarios: Scenario[] = [
                { id: 'scenario1', name: 'Flood in Newport' },
                { id: 'scenario2', name: 'Landslide in Ventnor' },
            ];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockScenarios),
            });

            const result = await fetchScenarios();

            expect(fetchMock).toHaveBeenCalledWith('/api/scenarios');
            expect(result).toEqual(mockScenarios);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('scenario1');
            expect(result[0].name).toBe('Flood in Newport');
        });

        it('falls back to mock data when API call fails', async () => {
            const mockScenarios: Scenario[] = [
                { id: 'flood-newport', name: 'Flood in Newport' },
                { id: 'landslide-ventnor', name: 'Landslide in Ventnor' },
            ];

            fetchMock
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Not Found',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockScenarios),
                });

            const result = await fetchScenarios();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/scenarios');
            expect(fetchMock).toHaveBeenNthCalledWith(2, '/data/scenarios.json');
            expect(result).toEqual(mockScenarios);
        });

        it('falls back to mock data when API call throws network error', async () => {
            const mockScenarios: Scenario[] = [{ id: 'scenario1', name: 'Test Scenario' }];

            fetchMock.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockScenarios),
            });

            const result = await fetchScenarios();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/scenarios');
            expect(fetchMock).toHaveBeenNthCalledWith(2, '/data/scenarios.json');
            expect(result).toEqual(mockScenarios);
        });

        it('throws error when both API and fallback fail', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Not Found',
                })
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Not Found',
                });

            await expect(fetchScenarios()).rejects.toThrow('Failed to fetch mock scenarios: Not Found');
        });

        it('throws error when fallback JSON parsing fails', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Not Found',
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
                });

            await expect(fetchScenarios()).rejects.toThrow('Invalid JSON');
        });

        it('handles empty scenarios array', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchScenarios();

            expect(result).toEqual([]);
        });
    });
});
