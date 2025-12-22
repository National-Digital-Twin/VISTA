import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { fetchScenarios, setActiveScenario, type Scenario } from './scenarios';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

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
                { id: 'scenario1', name: 'Flood in Newport', isActive: true },
                { id: 'scenario2', name: 'Landslide in Ventnor', isActive: false },
            ];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockScenarios),
            });

            const result = await fetchScenarios();

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/');
            expect(result).toEqual(mockScenarios);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('scenario1');
            expect(result[0].name).toBe('Flood in Newport');
            expect(result[0].isActive).toBe(true);
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchScenarios()).rejects.toThrow('Failed to fetch scenarios: Not Found');
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

    describe('updateScenario', () => {
        it('successfully updates scenario', async () => {
            const scenario_id = 'scenario1';

            fetchMock.mockResolvedValueOnce({
                ok: true,
                statusText: 'No Content',
            });

            await setActiveScenario(scenario_id);

            const [url, options] = fetchMock.mock.calls[0];

            expect(url).toContain('/api/scenarios/scenario1/activate/');
            expect(options.method).toBe('POST');
            expect(options.headers['Content-Type']).toBe('application/json');
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(setActiveScenario('scenario1')).rejects.toThrow('Failed to activate scenario: Not Found');
        });
    });
});
