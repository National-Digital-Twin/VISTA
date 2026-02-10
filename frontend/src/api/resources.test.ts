import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
    fetchResourceInterventions,
    fetchResourceInterventionLocation,
    withdrawStock,
    restockLocation,
    fetchResourceInterventionActions,
    toggleResourceTypeVisibility,
} from './resources';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('resources API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchResourceInterventions', () => {
        it('fetches resource interventions for a scenario', async () => {
            const mockData = [{ id: 'type-1', name: 'Sandbags', unit: 'bags', isActive: true, locations: [] }];
            fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockData) });

            const result = await fetchResourceInterventions('scenario-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/resource-interventions/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockData);
        });

        it('throws on non-ok response', async () => {
            fetchMock.mockResolvedValue({ ok: false, statusText: 'Not Found' });

            await expect(fetchResourceInterventions('scenario-1')).rejects.toThrow('Failed to fetch resource interventions: Not Found');
        });
    });

    describe('fetchResourceInterventionLocation', () => {
        it('fetches a single location', async () => {
            const mockLocation = { id: 'loc-1', name: 'Depot A', currentStock: 50, maxCapacity: 100 };
            fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockLocation) });

            const result = await fetchResourceInterventionLocation('scenario-1', 'loc-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/resource-interventions/locations/loc-1/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockLocation);
        });

        it('throws on non-ok response', async () => {
            fetchMock.mockResolvedValue({ ok: false, statusText: 'Not Found' });

            await expect(fetchResourceInterventionLocation('scenario-1', 'loc-1')).rejects.toThrow('Failed to fetch resource location: Not Found');
        });
    });

    describe('withdrawStock', () => {
        it('posts withdraw request with quantity', async () => {
            const mockResponse = { id: 'loc-1', currentStock: 40, maxCapacity: 100, action: 'withdraw', quantity: 10 };
            fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockResponse) });

            const result = await withdrawStock('scenario-1', 'loc-1', 10);

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/resource-interventions/locations/loc-1/withdraw/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: 10 }),
            });
            expect(result).toEqual(mockResponse);
        });

        it('throws with error message from response body', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Bad Request',
                json: vi.fn().mockResolvedValue({ error: 'Insufficient stock' }),
            });

            await expect(withdrawStock('scenario-1', 'loc-1', 999)).rejects.toThrow('Insufficient stock');
        });

        it('falls back to statusText when response body has no error field', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Bad Request',
                json: vi.fn().mockResolvedValue({}),
            });

            await expect(withdrawStock('scenario-1', 'loc-1', 999)).rejects.toThrow('Failed to withdraw stock: Bad Request');
        });
    });

    describe('restockLocation', () => {
        it('posts restock request with quantity', async () => {
            const mockResponse = { id: 'loc-1', currentStock: 60, maxCapacity: 100, action: 'restock', quantity: 10 };
            fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockResponse) });

            const result = await restockLocation('scenario-1', 'loc-1', 10);

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/resource-interventions/locations/loc-1/restock/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: 10 }),
            });
            expect(result).toEqual(mockResponse);
        });

        it('throws with error message from response body', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Bad Request',
                json: vi.fn().mockResolvedValue({ error: 'Exceeds capacity' }),
            });

            await expect(restockLocation('scenario-1', 'loc-1', 999)).rejects.toThrow('Exceeds capacity');
        });
    });

    describe('fetchResourceInterventionActions', () => {
        it('fetches actions without params', async () => {
            const mockResponse = { totalCount: 0, results: [], nextCursor: null };
            fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockResponse) });

            const result = await fetchResourceInterventionActions('scenario-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/resource-interventions/actions/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockResponse);
        });

        it('appends query params when provided', async () => {
            const mockResponse = { totalCount: 1, results: [], nextCursor: null };
            fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockResponse) });

            await fetchResourceInterventionActions('scenario-1', {
                cursor: '2024-01-01T00:00:00Z',
                limit: 25,
                typeId: 'type-1',
            });

            const calledUrl = fetchMock.mock.calls[0][0] as string;
            expect(calledUrl).toContain('cursor=2024-01-01T00%3A00%3A00Z');
            expect(calledUrl).toContain('limit=25');
            expect(calledUrl).toContain('type_id=type-1');
        });

        it('throws on non-ok response', async () => {
            fetchMock.mockResolvedValue({ ok: false, statusText: 'Server Error' });

            await expect(fetchResourceInterventionActions('scenario-1')).rejects.toThrow('Failed to fetch resource actions: Server Error');
        });
    });

    describe('toggleResourceTypeVisibility', () => {
        it('sends PUT request with resourceTypeId and isActive', async () => {
            const mockResponse = { resourceInterventionTypeId: 'type-1', isActive: false };
            fetchMock.mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockResponse) });

            const result = await toggleResourceTypeVisibility('scenario-1', 'type-1', false);

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/visible-resource-intervention-types/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resourceInterventionTypeId: 'type-1', isActive: false }),
            });
            expect(result).toEqual(mockResponse);
        });

        it('throws on non-ok response', async () => {
            fetchMock.mockResolvedValue({ ok: false, statusText: 'Forbidden' });

            await expect(toggleResourceTypeVisibility('scenario-1', 'type-1', true)).rejects.toThrow('Failed to toggle resource type visibility: Forbidden');
        });
    });
});
