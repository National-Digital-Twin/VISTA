// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateRoute, fetchUtilities } from './utilities';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

describe('utilities API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('calculateRoute', () => {
        it('posts route params and maps lon to lng for routed response', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                statusText: 'OK',
                json: vi.fn().mockResolvedValue({
                    type: 'FeatureCollection',
                    features: [],
                    properties: {
                        hasRoute: true,
                        distanceMiles: 10,
                        durationMinutes: 20,
                        averageSpeedMph: 30,
                        start: {
                            name: 'Start',
                            requested: { lat: 50.1, lon: -1.1 },
                            snapped: { lat: 50.11, lon: -1.11 },
                            snapDistanceFeet: 5,
                        },
                        end: {
                            name: 'End',
                            requested: { lat: 50.2, lon: -1.2 },
                            snapped: { lat: 50.21, lon: -1.21 },
                            snapDistanceFeet: 6,
                        },
                    },
                }),
            });

            const result = await calculateRoute('scenario-1', {
                start: { lat: 50.1, lng: -1.1 },
                end: { lat: 50.2, lng: -1.2 },
                vehicle: 'Car',
            });

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/scenarios/scenario-1/route/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startLat: 50.1,
                    startLon: -1.1,
                    endLat: 50.2,
                    endLon: -1.2,
                    vehicle: 'Car',
                }),
            });
            expect(result.properties?.hasRoute).toBe(true);
            if (result.properties?.hasRoute) {
                expect(result.properties.start.requested).toEqual({ lat: 50.1, lng: -1.1 });
                expect(result.properties.start.snapped).toEqual({ lat: 50.11, lng: -1.11 });
                expect(result.properties.end.requested).toEqual({ lat: 50.2, lng: -1.2 });
                expect(result.properties.end.snapped).toEqual({ lat: 50.21, lng: -1.21 });
            }
        });

        it('returns no-route payload unchanged when hasRoute is false', async () => {
            const noRoutePayload = {
                type: 'FeatureCollection',
                features: [],
                properties: { hasRoute: false, runtimeSeconds: 1 },
            };
            fetchMock.mockResolvedValue({
                ok: true,
                statusText: 'OK',
                json: vi.fn().mockResolvedValue(noRoutePayload),
            });

            const result = await calculateRoute('scenario-2', {
                start: { lat: 51, lng: -1 },
                end: { lat: 52, lng: -2 },
            });

            expect(result).toEqual(noRoutePayload);
        });

        it('throws when route API response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Bad Gateway',
            });

            await expect(
                calculateRoute('scenario-3', {
                    start: { lat: 51, lng: -1 },
                    end: { lat: 52, lng: -2 },
                }),
            ).rejects.toThrow('Failed to calculate route: Bad Gateway');
        });
    });

    describe('fetchUtilities', () => {
        it('returns utilities response with route planner group', async () => {
            const result = await fetchUtilities();

            expect(result.groups).toHaveLength(1);
            expect(result.groups[0].id).toBe('route-planner');
            expect(result.groups[0].name).toBe('Route Planner');
            expect(result.groups[0].utilities).toHaveLength(1);
            expect(result.groups[0].utilities[0].id).toBe('road-route');
            expect(result.groups[0].utilities[0].name).toBe('Route');
        });

        it('returns consistent structure on multiple calls', async () => {
            const result1 = await fetchUtilities();
            const result2 = await fetchUtilities();

            expect(result1).toEqual(result2);
            expect(result1.groups[0].id).toBe(result2.groups[0].id);
            expect(result1.groups[0].utilities[0].id).toBe(result2.groups[0].utilities[0].id);
        });
    });
});
