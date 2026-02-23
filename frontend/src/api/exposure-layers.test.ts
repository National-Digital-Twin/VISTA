import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Geometry } from 'geojson';

import {
    fetchExposureLayers,
    toggleExposureLayerVisibility,
    bulkToggleExposureLayerVisibility,
    createExposureLayer,
    updateExposureLayer,
    deleteExposureLayer,
    fetchDataroomExposureLayers,
    approveExposureLayer,
    rejectExposureLayer,
    removeExposureLayer,
} from './exposure-layers';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('exposure-layers API', () => {
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

    const mockGeometry2: Geometry = {
        type: 'Polygon',
        coordinates: [
            [
                [-1.3, 50.66],
                [-1.3, 50.67],
                [-1.29, 50.67],
                [-1.29, 50.66],
                [-1.3, 50.66],
            ],
        ],
    };

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchExposureLayers', () => {
        it('fetches exposure layers from scenario endpoint', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [{ id: 'layer-1', name: 'Test Layer 1', geometry: mockGeometry, isActive: true }],
                    },
                ]),
            });

            const result = await fetchExposureLayers('scenario-1', 'focus-area-1');

            expect(result.featureCollection.type).toBe('FeatureCollection');
            expect(result.featureCollection.features).toHaveLength(1);
            expect(result.featureCollection.features[0].properties?.isActive).toBe(true);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/?focus_area_id=focus-area-1', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('fetches without focus_area_id when not provided', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            await fetchExposureLayers('scenario-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('fetches without focus_area_id when null', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            await fetchExposureLayers('scenario-1', null);

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('handles multiple layers with geometry', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [
                            { id: 'layer-1', name: 'Test Layer 1', geometry: mockGeometry, isActive: true },
                            { id: 'layer-2', name: 'Test Layer 2', geometry: mockGeometry2, isActive: false },
                        ],
                    },
                ]),
            });

            const result = await fetchExposureLayers('scenario-1', 'focus-area-1');

            expect(result.featureCollection.features).toHaveLength(2);
            expect(result.featureCollection.features[0].properties?.isActive).toBe(true);
            expect(result.featureCollection.features[1].properties?.isActive).toBe(false);
            expect(result.groups[0].exposureLayers).toHaveLength(2);
        });

        it('filters out layers without geometry in featureCollection', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [
                            { id: 'layer-1', name: 'Test Layer 1', geometry: mockGeometry, isActive: true },
                            { id: 'layer-2', name: 'Test Layer 2', geometry: undefined, isActive: true },
                        ],
                    },
                ]),
            });

            const result = await fetchExposureLayers('scenario-1', 'focus-area-1');

            expect(result.featureCollection.features).toHaveLength(1);
            expect(result.groups[0].exposureLayers).toHaveLength(2);
        });

        it('handles empty groups array', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchExposureLayers('scenario-1', 'focus-area-1');

            expect(result.featureCollection.type).toBe('FeatureCollection');
            expect(result.featureCollection.features).toHaveLength(0);
            expect(result.groups).toHaveLength(0);
        });

        it('throws error when fetch fails', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(fetchExposureLayers('scenario-1', 'focus-area-1')).rejects.toThrow('Failed to retrieve exposure layers: Internal Server Error');
        });

        it('includes focusAreaRelation in feature properties', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'Floods',
                        exposureLayers: [{ id: 'layer-1', name: 'Test Layer 1', geometry: mockGeometry, isActive: true, focusAreaRelation: 'contained' }],
                    },
                ]),
            });

            const result = await fetchExposureLayers('scenario-1', 'focus-area-1');

            expect(result.featureCollection.features[0].properties?.focusAreaRelation).toBe('contained');
        });

        it('includes isUserDefined in feature properties', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        id: 'group-1',
                        name: 'User drawn',
                        exposureLayers: [{ id: 'layer-1', name: 'My Layer', geometry: mockGeometry, isActive: true, isUserDefined: true }],
                    },
                ]),
            });

            const result = await fetchExposureLayers('scenario-1', 'focus-area-1');

            expect(result.featureCollection.features[0].properties?.isUserDefined).toBe(true);
        });
    });

    describe('toggleExposureLayerVisibility', () => {
        it('sends PUT request with correct body', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await toggleExposureLayerVisibility('scenario-1', {
                exposureLayerId: 'layer-1',
                focusAreaId: 'fa-1',
                isActive: true,
            });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/visible-exposure-layers/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exposureLayerId: 'layer-1',
                    focusAreaId: 'fa-1',
                    isActive: true,
                }),
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Bad Request',
            });

            await expect(
                toggleExposureLayerVisibility('scenario-1', {
                    exposureLayerId: 'layer-1',
                    focusAreaId: 'fa-1',
                    isActive: true,
                }),
            ).rejects.toThrow('Failed to toggle exposure layer visibility: Bad Request');
        });
    });

    describe('bulkToggleExposureLayerVisibility', () => {
        it('sends PUT request to bulk endpoint with correct body', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await bulkToggleExposureLayerVisibility('scenario-1', {
                focusAreaId: 'fa-1',
                typeId: 'flood-type',
                isActive: true,
            });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/visible-exposure-layers/bulk/', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    focusAreaId: 'fa-1',
                    typeId: 'flood-type',
                    isActive: true,
                }),
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(
                bulkToggleExposureLayerVisibility('scenario-1', {
                    focusAreaId: 'fa-1',
                    typeId: 'flood-type',
                    isActive: false,
                }),
            ).rejects.toThrow('Failed to bulk toggle exposure layer visibility: Internal Server Error');
        });
    });

    describe('createExposureLayer', () => {
        it('sends POST request with correct body', async () => {
            const mockResponse = { id: 'new-layer', name: 'New Layer', geometry: mockGeometry };
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockResponse),
            });

            const result = await createExposureLayer('scenario-1', {
                typeId: 'type-1',
                geometry: mockGeometry,
                name: 'New Layer',
                focusAreaId: 'fa-1',
            });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    typeId: 'type-1',
                    geometry: mockGeometry,
                    name: 'New Layer',
                    focusAreaId: 'fa-1',
                }),
            });
            expect(result).toEqual(mockResponse);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Bad Request',
            });

            await expect(
                createExposureLayer('scenario-1', {
                    typeId: 'type-1',
                    geometry: mockGeometry,
                }),
            ).rejects.toThrow('Failed to create exposure layer: Bad Request');
        });
    });

    describe('updateExposureLayer', () => {
        it('sends PATCH request with correct body', async () => {
            const mockResponse = { id: 'layer-1', name: 'Updated Name', geometry: mockGeometry };
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockResponse),
            });

            const result = await updateExposureLayer('scenario-1', 'layer-1', { name: 'Updated Name' });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/layer-1/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Updated Name' }),
            });
            expect(result).toEqual(mockResponse);
        });

        it('sends PATCH request with geometry', async () => {
            const mockResponse = { id: 'layer-1', name: 'Layer', geometry: mockGeometry2 };
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockResponse),
            });

            await updateExposureLayer('scenario-1', 'layer-1', { geometry: mockGeometry2 });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/layer-1/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ geometry: mockGeometry2 }),
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(updateExposureLayer('scenario-1', 'layer-1', { name: 'New Name' })).rejects.toThrow('Failed to update exposure layer: Not Found');
        });
    });

    describe('deleteExposureLayer', () => {
        it('sends DELETE request', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await deleteExposureLayer('scenario-1', 'layer-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/layer-1/', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Forbidden',
            });

            await expect(deleteExposureLayer('scenario-1', 'layer-1')).rejects.toThrow('Failed to delete exposure layer: Forbidden');
        });
    });

    describe('fetchDataroomExposureLayers', () => {
        it('fetches dataroom exposure layers from scenario endpoint', async () => {
            const mockLayers = [{ id: 'layer-1', name: 'Pending Layer', status: 'pending', isUserDefined: true, geometry: mockGeometry }];
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockLayers),
            });

            const result = await fetchDataroomExposureLayers('scenario-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/dataroom/exposure-layers/', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(result).toEqual(mockLayers);
            expect(result).toHaveLength(1);
        });

        it('throws error when fetch fails', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchDataroomExposureLayers('scenario-1')).rejects.toThrow('Failed to fetch dataroom exposure layers: Not Found');
        });
    });

    describe('approveExposureLayer', () => {
        it('sends POST request to approve endpoint', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await approveExposureLayer('scenario-1', 'layer-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/layer-1/approve/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error with response text when not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Forbidden',
                text: vi.fn().mockResolvedValue('Not allowed'),
            });

            await expect(approveExposureLayer('scenario-1', 'layer-1')).rejects.toThrow('Not allowed');
        });
    });

    describe('rejectExposureLayer', () => {
        it('sends POST request to reject endpoint', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await rejectExposureLayer('scenario-1', 'layer-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/layer-1/reject/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Bad Request',
                text: vi.fn().mockResolvedValue(''),
            });

            await expect(rejectExposureLayer('scenario-1', 'layer-1')).rejects.toThrow('Failed to reject exposure layer: Bad Request');
        });
    });

    describe('removeExposureLayer', () => {
        it('sends POST request to remove endpoint', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await removeExposureLayer('scenario-1', 'layer-1');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/exposure-layers/layer-1/remove/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Forbidden',
                text: vi.fn().mockResolvedValue(''),
            });

            await expect(removeExposureLayer('scenario-1', 'layer-1')).rejects.toThrow('Failed to remove exposure layer: Forbidden');
        });
    });
});
