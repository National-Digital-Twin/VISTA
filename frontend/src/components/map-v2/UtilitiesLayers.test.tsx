// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import type { FeatureCollection } from 'geojson';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UtilitiesLayers from './UtilitiesLayers';

vi.mock('react-map-gl/maplibre', () => ({
    useMap: vi.fn(() => ({})),
    Source: ({ children, data }: { children: React.ReactNode; data: FeatureCollection }) => (
        <div data-testid="source" data-features-count={data.features.length}>
            {children}
        </div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
    Marker: ({ children, longitude, latitude }: { children: React.ReactNode; longitude: number; latitude: number }) => (
        <div data-testid={`marker-${latitude}-${longitude}`}>{children}</div>
    ),
}));

const mockRouteContext = {
    start: null as { lat: number; lng: number } | null,
    end: null as { lat: number; lng: number } | null,
    setStart: vi.fn(),
    setEnd: vi.fn(),
    vehicle: 'Car' as const,
    setVehicle: vi.fn(),
    positionSelectionMode: null as 'start' | 'end' | null,
    setPositionSelectionMode: vi.fn(),
    routeData: undefined as any,
    isLoading: false,
    error: null,
    findRoute: vi.fn(),
    showAdditionalSummary: true,
    setShowAdditionalSummary: vi.fn(),
    showDirectLine: false,
    setShowDirectLine: vi.fn(),
};

vi.mock('./context/RouteContext', () => ({
    useRouteContext: () => mockRouteContext,
}));

const makeRouteData = (overrides?: Partial<{ hasRoute: boolean; start: any; end: any; features: any[] }>) => {
    const start = overrides?.start ?? {
        name: 'Start',
        requested: { lat: 50.67, lng: -1.4 },
        snapped: { lat: 50.671, lng: -1.401 },
        snapDistanceFeet: 10,
    };
    const end = overrides?.end ?? {
        name: 'End',
        requested: { lat: 50.68, lng: -1.39 },
        snapped: { lat: 50.681, lng: -1.391 },
        snapDistanceFeet: 10,
    };
    return {
        type: 'FeatureCollection' as const,
        features: overrides?.features ?? [
            {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [-1.4, 50.67],
                        [-1.39, 50.68],
                    ],
                },
                properties: { name: 'Segment 1' },
            },
        ],
        properties: {
            hasRoute: overrides?.hasRoute ?? true,
            distanceMiles: 1.5,
            durationMinutes: 3,
            averageSpeedMph: 30,
            start,
            end,
        },
    };
};

describe('UtilitiesLayers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRouteContext.start = null;
        mockRouteContext.end = null;
        mockRouteContext.routeData = undefined;
        mockRouteContext.showAdditionalSummary = true;
        mockRouteContext.showDirectLine = false;
    });

    describe('Rendering', () => {
        it('returns null when map is not ready', () => {
            const { container } = render(<UtilitiesLayers mapReady={false} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders nothing when no route data', () => {
            const { container } = render(<UtilitiesLayers mapReady={true} />);
            expect(container.innerHTML).toBe('');
        });

        it('renders route line source and layer when route data has features', () => {
            mockRouteContext.routeData = makeRouteData();
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.getByTestId('layer-map-v2-utilities-layer')).toBeInTheDocument();
        });
    });

    describe('Walk lines', () => {
        it('renders walk lines when showAdditionalSummary is true and snap distance > 3', () => {
            mockRouteContext.routeData = makeRouteData();
            mockRouteContext.showAdditionalSummary = true;
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.getByTestId('layer-map-v2-walk-lines-layer')).toBeInTheDocument();
        });

        it('hides walk lines when showAdditionalSummary is false', () => {
            mockRouteContext.routeData = makeRouteData();
            mockRouteContext.showAdditionalSummary = false;
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.queryByTestId('layer-map-v2-walk-lines-layer')).not.toBeInTheDocument();
        });

        it('hides walk lines when snap distance is <= 3', () => {
            mockRouteContext.routeData = makeRouteData({
                start: {
                    name: 'Start',
                    requested: { lat: 50.67, lng: -1.4 },
                    snapped: { lat: 50.671, lng: -1.401 },
                    snapDistanceFeet: 2,
                },
                end: {
                    name: 'End',
                    requested: { lat: 50.68, lng: -1.39 },
                    snapped: { lat: 50.681, lng: -1.391 },
                    snapDistanceFeet: 1,
                },
            });
            mockRouteContext.showAdditionalSummary = true;
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.queryByTestId('layer-map-v2-walk-lines-layer')).not.toBeInTheDocument();
        });
    });

    describe('Direct line', () => {
        it('renders direct line when showDirectLine is true', () => {
            mockRouteContext.routeData = makeRouteData();
            mockRouteContext.showDirectLine = true;
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.getByTestId('layer-map-v2-direct-line-layer')).toBeInTheDocument();
        });

        it('hides direct line when showDirectLine is false', () => {
            mockRouteContext.routeData = makeRouteData();
            mockRouteContext.showDirectLine = false;
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.queryByTestId('layer-map-v2-direct-line-layer')).not.toBeInTheDocument();
        });
    });

    describe('Route markers', () => {
        it('renders snapped S/E markers when route data exists', () => {
            mockRouteContext.routeData = makeRouteData();
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.getByTestId('marker-50.671--1.401')).toBeInTheDocument();
            expect(screen.getByTestId('marker-50.681--1.391')).toBeInTheDocument();
        });

        it('renders clicked position markers when showAdditionalSummary and route exists', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData();
            mockRouteContext.showAdditionalSummary = true;
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.getByTestId('marker-50.67--1.4')).toBeInTheDocument();
            expect(screen.getByTestId('marker-50.68--1.39')).toBeInTheDocument();
        });

        it('does not render clicked position markers when snap distance <= 3', () => {
            mockRouteContext.start = { lat: 50.5, lng: -1.5 };
            mockRouteContext.end = { lat: 50.6, lng: -1.6 };
            mockRouteContext.routeData = makeRouteData({
                start: {
                    name: 'Start',
                    requested: { lat: 50.5, lng: -1.5 },
                    snapped: { lat: 50.501, lng: -1.501 },
                    snapDistanceFeet: 1,
                },
                end: {
                    name: 'End',
                    requested: { lat: 50.6, lng: -1.6 },
                    snapped: { lat: 50.601, lng: -1.601 },
                    snapDistanceFeet: 2,
                },
            });
            mockRouteContext.showAdditionalSummary = true;
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.queryByTestId('marker-50.5--1.5')).not.toBeInTheDocument();
            expect(screen.queryByTestId('marker-50.6--1.6')).not.toBeInTheDocument();
        });

        it('does not render clicked position markers when showAdditionalSummary is false', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData();
            mockRouteContext.showAdditionalSummary = false;
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.queryByTestId('marker-50.67--1.4')).not.toBeInTheDocument();
            expect(screen.queryByTestId('marker-50.68--1.39')).not.toBeInTheDocument();
        });

        it('renders fallback markers when start/end set but no route', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.getByTestId('marker-50.67--1.4')).toBeInTheDocument();
            expect(screen.getByTestId('marker-50.68--1.39')).toBeInTheDocument();
        });

        it('does not render markers when no start/end set and no route', () => {
            render(<UtilitiesLayers mapReady={true} />);
            expect(screen.queryByTestId(/^marker-/)).not.toBeInTheDocument();
        });
    });
});
