import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScenarioMap from './ScenarioMap';

vi.mock('@/components/map-v2/MapView', () => ({
    default: () => <div data-testid="map-view">MapView</div>,
}));

vi.mock('@/components/map-v2/context/RouteContext', () => ({
    RouteProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useActiveScenario', () => ({
    useActiveScenario: () => ({ data: { id: 'test-scenario-id' } }),
}));

describe('ScenarioMap page', () => {
    it('renders the map view', () => {
        render(<ScenarioMap />);
        expect(screen.getByTestId('map-view')).toBeInTheDocument();
    });

    it('wraps MapView in a container', () => {
        render(<ScenarioMap />);
        const mapView = screen.getByTestId('map-view');
        expect(mapView.parentElement).not.toBeNull();
    });
});
