// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteProvider, useRouteContext } from './RouteContext';
import { calculateRoute } from '@/api/utilities';

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
    useQuery: (options: unknown) => mockUseQuery(options),
}));

vi.mock('@/api/utilities', () => ({
    calculateRoute: vi.fn(),
}));

const mockedCalculateRoute = vi.mocked(calculateRoute);

const ContextConsumer = () => {
    const route = useRouteContext();

    return (
        <div>
            <div data-testid="vehicle">{route.vehicle}</div>
            <div data-testid="has-start">{String(Boolean(route.start))}</div>
            <div data-testid="has-end">{String(Boolean(route.end))}</div>
            <div data-testid="is-loading">{String(route.isLoading)}</div>
            <div data-testid="has-error">{String(Boolean(route.error))}</div>
            <div data-testid="show-additional-summary">{String(route.showAdditionalSummary)}</div>
            <div data-testid="show-direct-line">{String(route.showDirectLine)}</div>

            <button onClick={() => route.setStart({ lat: 50.1, lng: -1.1 })}>set-start</button>
            <button onClick={() => route.setEnd({ lat: 50.2, lng: -1.2 })}>set-end</button>
            <button onClick={() => route.setVehicle('HGV')}>set-vehicle</button>
            <button onClick={() => route.setPositionSelectionMode('start')}>set-mode</button>
            <button onClick={() => route.setShowAdditionalSummary(false)}>hide-summary</button>
            <button onClick={() => route.setShowDirectLine(true)}>show-direct</button>
            <button onClick={() => route.findRoute()}>find-route</button>
        </div>
    );
};

describe('RouteContext', () => {
    beforeEach(() => {
        mockUseQuery.mockReset();
        mockedCalculateRoute.mockReset();
        mockUseQuery.mockReturnValue({
            data: undefined,
            isFetching: false,
            error: null,
            refetch: vi.fn(),
        });
    });

    it('throws when useRouteContext is used outside provider', () => {
        const BadConsumer = () => {
            useRouteContext();
            return null;
        };

        expect(() => render(<BadConsumer />)).toThrow('useRouteContext must be used within a RouteProvider');
    });

    it('provides default values and updates state through setters', () => {
        render(
            <RouteProvider scenarioId="scenario-1">
                <ContextConsumer />
            </RouteProvider>,
        );

        expect(screen.getByTestId('vehicle')).toHaveTextContent('Car');
        expect(screen.getByTestId('has-start')).toHaveTextContent('false');
        expect(screen.getByTestId('has-end')).toHaveTextContent('false');
        expect(screen.getByTestId('show-additional-summary')).toHaveTextContent('true');
        expect(screen.getByTestId('show-direct-line')).toHaveTextContent('false');

        fireEvent.click(screen.getByRole('button', { name: 'set-start' }));
        fireEvent.click(screen.getByRole('button', { name: 'set-end' }));
        fireEvent.click(screen.getByRole('button', { name: 'set-vehicle' }));
        fireEvent.click(screen.getByRole('button', { name: 'set-mode' }));
        fireEvent.click(screen.getByRole('button', { name: 'hide-summary' }));
        fireEvent.click(screen.getByRole('button', { name: 'show-direct' }));

        expect(screen.getByTestId('vehicle')).toHaveTextContent('HGV');
        expect(screen.getByTestId('has-start')).toHaveTextContent('true');
        expect(screen.getByTestId('has-end')).toHaveTextContent('true');
        expect(screen.getByTestId('show-additional-summary')).toHaveTextContent('false');
        expect(screen.getByTestId('show-direct-line')).toHaveTextContent('true');
    });

    it('calls refetch from findRoute only when start, end, and scenario are present', () => {
        const refetch = vi.fn();
        mockUseQuery.mockReturnValue({
            data: undefined,
            isFetching: false,
            error: null,
            refetch,
        });

        render(
            <RouteProvider scenarioId="scenario-1">
                <ContextConsumer />
            </RouteProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'find-route' }));
        expect(refetch).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'set-start' }));
        fireEvent.click(screen.getByRole('button', { name: 'set-end' }));
        fireEvent.click(screen.getByRole('button', { name: 'find-route' }));

        expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('builds useQuery options and queryFn uses calculateRoute with current inputs', async () => {
        render(
            <RouteProvider scenarioId="scenario-9">
                <ContextConsumer />
            </RouteProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'set-start' }));
        fireEvent.click(screen.getByRole('button', { name: 'set-end' }));
        fireEvent.click(screen.getByRole('button', { name: 'set-vehicle' }));

        const lastCallArgs = mockUseQuery.mock.calls.at(-1)?.[0] as {
            enabled: boolean;
            queryFn: () => Promise<unknown>;
            queryKey: unknown[];
        };

        expect(lastCallArgs.enabled).toBe(true);
        expect(lastCallArgs.queryKey[0]).toBe('roadRoute');
        expect(lastCallArgs.queryKey[1]).toBe('scenario-9');

        mockedCalculateRoute.mockResolvedValue({
            type: 'FeatureCollection',
            features: [],
            properties: {
                hasRoute: true,
                distanceMiles: 1,
                durationMinutes: 1,
                averageSpeedMph: 1,
                start: {
                    name: 'A',
                    requested: { lat: 50.1, lng: -1.1 },
                    snapped: { lat: 50.1, lng: -1.1 },
                    snapDistanceFeet: 0,
                },
                end: {
                    name: 'B',
                    requested: { lat: 50.2, lng: -1.2 },
                    snapped: { lat: 50.2, lng: -1.2 },
                    snapDistanceFeet: 0,
                },
            },
        });

        await lastCallArgs.queryFn();

        expect(mockedCalculateRoute).toHaveBeenCalledWith('scenario-9', {
            start: { lat: 50.1, lng: -1.1 },
            end: { lat: 50.2, lng: -1.2 },
            vehicle: 'HGV',
        });
    });
});
