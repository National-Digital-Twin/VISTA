// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Geometry } from 'geojson';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchConstraintInterventions,
    createConstraintIntervention,
    updateConstraintIntervention,
    deleteConstraintIntervention,
    type ConstraintIntervention,
    type ConstraintInterventionType,
} from './constraint-interventions';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('constraint-interventions API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    const mockPolygonGeometry: Geometry = {
        type: 'Polygon',
        coordinates: [
            [
                [-1.4, 50.67],
                [-1.4, 50.68],
                [-1.39, 50.68],
                [-1.39, 50.67],
                [-1.4, 50.67],
            ],
        ],
    };

    const mockLineGeometry: Geometry = {
        type: 'LineString',
        coordinates: [
            [-1.4, 50.67],
            [-1.39, 50.68],
        ],
    };

    const mockIntervention: ConstraintIntervention = {
        id: 'ci-123',
        name: 'Road block 1',
        geometry: mockPolygonGeometry,
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    };

    const mockConstraintType: ConstraintInterventionType = {
        id: 'type-123',
        name: 'Road blocks',
        constraintInterventions: [mockIntervention],
    };

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchConstraintInterventions', () => {
        it('fetches constraint interventions from API', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue([mockConstraintType]),
            });

            const result = await fetchConstraintInterventions('scenario-123');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/constraint-interventions/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual([mockConstraintType]);
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchConstraintInterventions('scenario-123')).rejects.toThrow('Failed to fetch constraint interventions: Not Found');
        });

        it('handles empty response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchConstraintInterventions('scenario-123');
            expect(result).toEqual([]);
        });
    });

    describe('createConstraintIntervention', () => {
        it('creates a constraint intervention with polygon geometry', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockIntervention),
            });

            const result = await createConstraintIntervention('scenario-123', {
                typeId: 'type-123',
                geometry: mockPolygonGeometry,
            });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/constraint-interventions/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    typeId: 'type-123',
                    geometry: mockPolygonGeometry,
                }),
            });
            expect(result).toEqual(mockIntervention);
        });

        it('creates a constraint intervention with line geometry', async () => {
            const lineIntervention = { ...mockIntervention, geometry: mockLineGeometry };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(lineIntervention),
            });

            const result = await createConstraintIntervention('scenario-123', {
                typeId: 'type-123',
                geometry: mockLineGeometry,
            });

            expect(result.geometry).toEqual(mockLineGeometry);
        });

        it('includes name when provided', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockIntervention),
            });

            await createConstraintIntervention('scenario-123', {
                typeId: 'type-123',
                geometry: mockPolygonGeometry,
                name: 'Custom name',
            });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/constraint-interventions/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    typeId: 'type-123',
                    geometry: mockPolygonGeometry,
                    name: 'Custom name',
                }),
            });
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Bad Request',
            });

            await expect(
                createConstraintIntervention('scenario-123', {
                    typeId: 'type-123',
                    geometry: mockPolygonGeometry,
                }),
            ).rejects.toThrow('Failed to create constraint intervention: Bad Request');
        });
    });

    describe('updateConstraintIntervention', () => {
        it('updates constraint name', async () => {
            const updated = { ...mockIntervention, name: 'Updated Name' };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(updated),
            });

            const result = await updateConstraintIntervention('scenario-123', 'ci-123', { name: 'Updated Name' });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/constraint-interventions/ci-123/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Updated Name' }),
            });
            expect(result.name).toBe('Updated Name');
        });

        it('updates constraint isActive status', async () => {
            const updated = { ...mockIntervention, isActive: false };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(updated),
            });

            const result = await updateConstraintIntervention('scenario-123', 'ci-123', { isActive: false });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/constraint-interventions/ci-123/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: false }),
            });
            expect(result.isActive).toBe(false);
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(updateConstraintIntervention('scenario-123', 'ci-123', { name: 'New Name' })).rejects.toThrow(
                'Failed to update constraint intervention: Not Found',
            );
        });
    });

    describe('deleteConstraintIntervention', () => {
        it('deletes a constraint intervention', async () => {
            fetchMock.mockResolvedValueOnce({ ok: true });

            await deleteConstraintIntervention('scenario-123', 'ci-123');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/constraint-interventions/ci-123/', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(deleteConstraintIntervention('scenario-123', 'ci-123')).rejects.toThrow('Failed to delete constraint intervention: Not Found');
        });
    });
});
