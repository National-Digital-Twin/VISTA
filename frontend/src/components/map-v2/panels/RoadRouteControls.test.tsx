import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoadRouteControls from './RoadRouteControls';

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
    error: null as Error | null,
    findRoute: vi.fn(),
    showAdditionalSummary: true,
    setShowAdditionalSummary: vi.fn(),
    showDirectLine: false,
    setShowDirectLine: vi.fn(),
};

vi.mock('../context/RouteContext', () => ({
    useRouteContext: () => mockRouteContext,
}));

const makeRouteData = (
    overrides?: Partial<{
        distanceMiles: number;
        durationMinutes: number;
        averageSpeedMph: number;
        start: any;
        end: any;
        hasRoute: boolean;
    }>,
) => ({
    type: 'FeatureCollection' as const,
    features: [],
    properties: {
        hasRoute: overrides?.hasRoute ?? true,
        distanceMiles: overrides?.distanceMiles ?? 1.5,
        durationMinutes: overrides?.durationMinutes ?? 3,
        averageSpeedMph: overrides?.averageSpeedMph ?? 30,
        start: overrides?.start ?? {
            name: 'Start Road',
            requested: { lat: 50.67, lng: -1.4 },
            snapped: { lat: 50.67, lng: -1.4 },
            snapDistanceFeet: 0,
        },
        end: overrides?.end ?? {
            name: 'End Road',
            requested: { lat: 50.68, lng: -1.39 },
            snapped: { lat: 50.68, lng: -1.39 },
            snapDistanceFeet: 0,
        },
    },
});

const endpoint = (name: string, snapFeet: number) => ({
    name,
    requested: { lat: 50.67, lng: -1.4 },
    snapped: { lat: 50.671, lng: -1.401 },
    snapDistanceFeet: snapFeet,
});

describe('RoadRouteControls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRouteContext.start = null;
        mockRouteContext.end = null;
        mockRouteContext.vehicle = 'Car';
        mockRouteContext.positionSelectionMode = null;
        mockRouteContext.routeData = undefined;
        mockRouteContext.isLoading = false;
        mockRouteContext.error = null;
        mockRouteContext.showAdditionalSummary = true;
        mockRouteContext.showDirectLine = false;
    });

    describe('Vehicle type select', () => {
        it('renders vehicle type select with default value', () => {
            render(<RoadRouteControls />);
            expect(screen.getByLabelText('Vehicle type')).toBeInTheDocument();
        });
    });

    describe('Position buttons', () => {
        it('shows placeholder text when no positions set', () => {
            render(<RoadRouteControls />);
            expect(screen.getByText('Select Start Position')).toBeInTheDocument();
            expect(screen.getByText('Select End Location')).toBeInTheDocument();
        });

        it('shows coordinates when positions are set', () => {
            mockRouteContext.start = { lat: 50.6712, lng: -1.4001 };
            mockRouteContext.end = { lat: 50.6834, lng: -1.3902 };
            render(<RoadRouteControls />);
            expect(screen.getByText('START: 50.6712, -1.4001')).toBeInTheDocument();
            expect(screen.getByText('END: 50.6834, -1.3902')).toBeInTheDocument();
        });

        it('calls setPositionSelectionMode when start button is clicked', () => {
            render(<RoadRouteControls />);
            fireEvent.click(screen.getByText('Select Start Position'));
            expect(mockRouteContext.setPositionSelectionMode).toHaveBeenCalledWith('start');
        });

        it('calls setPositionSelectionMode when end button is clicked', () => {
            render(<RoadRouteControls />);
            fireEvent.click(screen.getByText('Select End Location'));
            expect(mockRouteContext.setPositionSelectionMode).toHaveBeenCalledWith('end');
        });

        it('shows delete icons when positions are set', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            render(<RoadRouteControls />);
            expect(screen.getByLabelText('Clear start position')).toBeInTheDocument();
            expect(screen.getByLabelText('Clear end position')).toBeInTheDocument();
        });

        it('calls setStart(null) when start delete icon is clicked', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            render(<RoadRouteControls />);
            fireEvent.click(screen.getByLabelText('Clear start position'));
            expect(mockRouteContext.setStart).toHaveBeenCalledWith(null);
        });

        it('calls setEnd(null) when end delete icon is clicked', () => {
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            render(<RoadRouteControls />);
            fireEvent.click(screen.getByLabelText('Clear end position'));
            expect(mockRouteContext.setEnd).toHaveBeenCalledWith(null);
        });

        it('does not show delete icons when no positions set', () => {
            render(<RoadRouteControls />);
            expect(screen.queryByLabelText('Clear start position')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Clear end position')).not.toBeInTheDocument();
        });
    });

    describe('Find route button', () => {
        it('renders find route button', () => {
            render(<RoadRouteControls />);
            expect(screen.getByText('FIND ROUTE')).toBeInTheDocument();
        });

        it('is disabled when no start position', () => {
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            render(<RoadRouteControls />);
            expect(screen.getByText('FIND ROUTE').closest('button')).toBeDisabled();
        });

        it('is disabled when no end position', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            render(<RoadRouteControls />);
            expect(screen.getByText('FIND ROUTE').closest('button')).toBeDisabled();
        });

        it('is disabled when loading', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.isLoading = true;
            render(<RoadRouteControls />);
            expect(screen.getByText('FIND ROUTE').closest('button')).toBeDisabled();
        });

        it('is enabled when start and end are set', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            render(<RoadRouteControls />);
            expect(screen.getByText('FIND ROUTE').closest('button')).not.toBeDisabled();
        });

        it('calls findRoute when clicked', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            render(<RoadRouteControls />);
            fireEvent.click(screen.getByText('FIND ROUTE'));
            expect(mockRouteContext.findRoute).toHaveBeenCalled();
        });
    });

    describe('Status messages', () => {
        it('shows loading message when route is loading', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.isLoading = true;
            render(<RoadRouteControls />);
            expect(screen.getByText('Loading route...')).toBeInTheDocument();
        });

        it('does not show loading message when only start is set', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.isLoading = true;
            render(<RoadRouteControls />);
            expect(screen.queryByText('Loading route...')).not.toBeInTheDocument();
        });

        it('shows error message when route fails', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.error = new Error('fail');
            render(<RoadRouteControls />);
            expect(screen.getByText('Route loading failed. Please try again.')).toBeInTheDocument();
        });

        it('shows no-route message when hasRoute is false', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData({ hasRoute: false });
            render(<RoadRouteControls />);
            expect(screen.getByText('No route available between these points.')).toBeInTheDocument();
        });
    });

    describe('Route summary', () => {
        it('shows route summary with distance, time, and speed', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData({
                distanceMiles: 1.5,
                durationMinutes: 3,
                averageSpeedMph: 30,
            });
            render(<RoadRouteControls />);
            expect(screen.getByText('Route Summary')).toBeInTheDocument();
            expect(screen.getByText(/1\.50 miles/)).toBeInTheDocument();
            expect(screen.getByText(/3 mins/)).toBeInTheDocument();
            expect(screen.getByText(/30\.0 mph/)).toBeInTheDocument();
        });

        it('shows start and end names', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData();
            render(<RoadRouteControls />);
            expect(screen.getByText(/Start: Start Road/)).toBeInTheDocument();
            expect(screen.getByText(/End: End Road/)).toBeInTheDocument();
        });

        it('formats time as hours and minutes when over 60 minutes', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData({ durationMinutes: 90 });
            render(<RoadRouteControls />);
            expect(screen.getByText(/1 hr 30 mins/)).toBeInTheDocument();
        });

        it('uses singular for 1 minute', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData({ durationMinutes: 1 });
            render(<RoadRouteControls />);
            expect(screen.getByText(/1 min$/)).toBeInTheDocument();
        });

        it('uses singular for 1 hour', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData({ durationMinutes: 61 });
            render(<RoadRouteControls />);
            expect(screen.getByText(/1 hr 1 min$/)).toBeInTheDocument();
        });

        it('hides average speed when zero', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData({ averageSpeedMph: 0 });
            render(<RoadRouteControls />);
            expect(screen.queryByText(/Average Speed/)).not.toBeInTheDocument();
        });

        it('does not show route summary when no route data', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            render(<RoadRouteControls />);
            expect(screen.queryByText('Route Summary')).not.toBeInTheDocument();
        });
    });

    describe('Additional route summary (walking)', () => {
        it('shows additional summary section when snap distance > 3', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData({
                start: endpoint('Start Road', 100),
                end: endpoint('End Road', 50),
            });
            render(<RoadRouteControls />);
            expect(screen.getByText('Additional Route Summary')).toBeInTheDocument();
        });

        it('does not show additional summary section when snap distance <= 3', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData({
                start: endpoint('Start Road', 2),
                end: endpoint('End Road', 1),
            });
            render(<RoadRouteControls />);
            expect(screen.queryByText('Additional Route Summary')).not.toBeInTheDocument();
        });

        it('shows walking summary text with distance and time', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.showAdditionalSummary = true;
            mockRouteContext.routeData = makeRouteData({
                start: endpoint('Start Road', 44),
                end: endpoint('End Road', 2),
            });
            render(<RoadRouteControls />);
            expect(screen.getByText(/Walk 44ft to Start Road/)).toBeInTheDocument();
        });

        it('shows walking time in seconds for short walks', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.showAdditionalSummary = true;
            mockRouteContext.routeData = makeRouteData({
                start: endpoint('Start Road', 10),
                end: endpoint('End Road', 2),
            });
            render(<RoadRouteControls />);
            // 10 / 4.4 ≈ 2 secs
            expect(screen.getByText(/Walk 10ft to Start Road ~ 2 secs/)).toBeInTheDocument();
        });

        it('shows "from" for end endpoint walking summary', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.showAdditionalSummary = true;
            mockRouteContext.routeData = makeRouteData({
                start: endpoint('Start Road', 1),
                end: endpoint('End Road', 100),
            });
            render(<RoadRouteControls />);
            expect(screen.getByText(/Walk 100ft from End Road/)).toBeInTheDocument();
        });
    });

    describe('Direct line toggle', () => {
        it('shows direct line toggle when route summary is visible', () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = makeRouteData();
            render(<RoadRouteControls />);
            expect(screen.getByText('Show Direct Line')).toBeInTheDocument();
        });

        it('does not show direct line toggle without route summary', () => {
            render(<RoadRouteControls />);
            expect(screen.queryByText('Show Direct Line')).not.toBeInTheDocument();
        });
    });
});
