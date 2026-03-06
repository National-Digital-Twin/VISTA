// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import type { Geometry } from 'geojson';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchFocusAreas, createFocusArea, updateFocusArea, deleteFocusArea, type FocusArea } from './focus-areas';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('focus-areas API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    const mockGeometry: Geometry = {
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

    const mockFocusArea: FocusArea = {
        id: 'fa-123',
        name: 'Test Focus Area',
        geometry: mockGeometry,
        filterMode: 'by_asset_type',
        isActive: true,
        isSystem: false,
    };

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchFocusAreas', () => {
        it('successfully fetches focus areas from API', async () => {
            const mockFocusAreas: FocusArea[] = [
                mockFocusArea,
                { id: 'fa-456', name: 'Another Area', geometry: mockGeometry, filterMode: 'by_asset_type', isActive: true, isSystem: false },
            ];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFocusAreas),
            });

            const result = await fetchFocusAreas('scenario-123');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/focus-areas/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockFocusAreas);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('fa-123');
            expect(result[0].name).toBe('Test Focus Area');
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchFocusAreas('scenario-123')).rejects.toThrow('Failed to fetch focus areas: Not Found');
        });

        it('handles empty focus areas array', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchFocusAreas('scenario-123');

            expect(result).toEqual([]);
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchFocusAreas('scenario-123')).rejects.toThrow('Network error');
        });
    });

    describe('createFocusArea', () => {
        it('successfully creates a focus area', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFocusArea),
            });

            const result = await createFocusArea('scenario-123', {
                geometry: mockGeometry,
                name: 'Test Focus Area',
                isActive: true,
            });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/focus-areas/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    geometry: mockGeometry,
                    name: 'Test Focus Area',
                    isActive: true,
                }),
            });
            expect(result).toEqual(mockFocusArea);
        });

        it('creates focus area with default values when optional fields are omitted', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(mockFocusArea),
            });

            await createFocusArea('scenario-123', { geometry: mockGeometry });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/focus-areas/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    geometry: mockGeometry,
                    name: '',
                    isActive: true,
                }),
            });
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Bad Request',
            });

            await expect(createFocusArea('scenario-123', { geometry: mockGeometry })).rejects.toThrow('Failed to create focus area: Bad Request');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            await expect(createFocusArea('scenario-123', { geometry: mockGeometry })).rejects.toThrow('Network error');
        });
    });

    describe('updateFocusArea', () => {
        it('successfully updates focus area name', async () => {
            const updatedFocusArea = { ...mockFocusArea, name: 'Updated Name' };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(updatedFocusArea),
            });

            const result = await updateFocusArea('scenario-123', 'fa-123', { name: 'Updated Name' });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/focus-areas/fa-123/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Updated Name' }),
            });
            expect(result.name).toBe('Updated Name');
        });

        it('successfully updates focus area isActive status', async () => {
            const updatedFocusArea = { ...mockFocusArea, isActive: false };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(updatedFocusArea),
            });

            const result = await updateFocusArea('scenario-123', 'fa-123', { isActive: false });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/focus-areas/fa-123/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: false }),
            });
            expect(result.isActive).toBe(false);
        });

        it('successfully updates focus area geometry', async () => {
            const newGeometry: Geometry = {
                type: 'Polygon',
                coordinates: [
                    [
                        [-2, 51],
                        [-2, 51.1],
                        [-1.9, 51.1],
                        [-1.9, 51],
                        [-2, 51],
                    ],
                ],
            };
            const updatedFocusArea = { ...mockFocusArea, geometry: newGeometry };
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue(updatedFocusArea),
            });

            const result = await updateFocusArea('scenario-123', 'fa-123', { geometry: newGeometry });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/focus-areas/fa-123/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ geometry: newGeometry }),
            });
            expect(result.geometry).toEqual(newGeometry);
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(updateFocusArea('scenario-123', 'fa-123', { name: 'New Name' })).rejects.toThrow('Failed to update focus area: Not Found');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            await expect(updateFocusArea('scenario-123', 'fa-123', { name: 'New Name' })).rejects.toThrow('Network error');
        });
    });

    describe('deleteFocusArea', () => {
        it('successfully deletes a focus area', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
            });

            await deleteFocusArea('scenario-123', 'fa-123');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-123/focus-areas/fa-123/', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when API call fails', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(deleteFocusArea('scenario-123', 'fa-123')).rejects.toThrow('Failed to delete focus area: Not Found');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            await expect(deleteFocusArea('scenario-123', 'fa-123')).rejects.toThrow('Network error');
        });
    });
});
