import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';

import UtilitiesView from './UtilitiesView';
import theme from '@/theme';
import { fetchUtilities, type UtilitiesResponse, type RoadRouteResponse } from '@/api/utilities';

vi.mock('@/api/utilities', () => ({
    fetchUtilities: vi.fn(),
    calculateRoute: vi.fn(),
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
    routeData: undefined as RoadRouteResponse | undefined,
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

const mockedFetchUtilities = vi.mocked(fetchUtilities);

describe('UtilitiesView', () => {
    const defaultProps = {
        onClose: vi.fn(),
    };

    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
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

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>,
        );
    };

    const setupMocks = (options?: { utilities?: UtilitiesResponse }) => {
        const {
            utilities = {
                groups: [
                    {
                        id: 'route-planner',
                        name: 'Route Planner',
                        utilities: [
                            {
                                id: 'road-route',
                                name: 'Route',
                            },
                        ],
                    },
                ],
            },
        } = options || {};

        mockedFetchUtilities.mockResolvedValue(utilities);
    };

    const waitForComponentReady = async () => {
        await waitFor(() => {
            expect(screen.getByText('Utilities')).toBeInTheDocument();
        });
    };

    describe('Rendering', () => {
        it('renders title', async () => {
            setupMocks();
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitForComponentReady();
        });

        it('renders close button', async () => {
            setupMocks();
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
        });

        it('shows loading state when utilities are loading', async () => {
            const neverResolvingPromise = new Promise<never>(() => {});
            mockedFetchUtilities.mockImplementation(() => neverResolvingPromise as Promise<UtilitiesResponse>);
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Loading utilities...')).toBeInTheDocument();
            });
        });
    });

    describe('Utilities Display', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('displays utilities grouped from API', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
        });

        it('shows group header', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
        });

        it('shows road route controls expanded by default', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
                expect(screen.getByText('FIND ROUTE')).toBeInTheDocument();
            });
        });
    });

    describe('Group Expansion', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('road route group starts expanded', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Route Planner/);
            const headerButton = roadRoutesHeader.closest('button');
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'true');
                expect(screen.getByText('FIND ROUTE')).toBeInTheDocument();
            });
        });

        it('collapses group when clicked', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Route Planner/);
            const headerButton = roadRoutesHeader.closest('button');
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'true');
            });
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            });
        });
    });

    describe('Road Route Controls', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('shows road route controls when route is selected and toggle is on', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(
                () => {
                    expect(screen.getByLabelText('Vehicle type')).toBeInTheDocument();
                    expect(screen.getByText('Select Start Position')).toBeInTheDocument();
                    expect(screen.getByText('Select End Location')).toBeInTheDocument();
                    expect(screen.getByText('FIND ROUTE')).toBeInTheDocument();
                },
                { timeout: 3000 },
            );
        });

        it('calls setPositionSelectionMode when start button is clicked', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Select Start Position')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Select Start Position'));
            expect(mockRouteContext.setPositionSelectionMode).toHaveBeenCalledWith('start');
        });

        it('calls setPositionSelectionMode when end button is clicked', async () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Select End Location')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('Select End Location'));
            expect(mockRouteContext.setPositionSelectionMode).toHaveBeenCalledWith('end');
        });

        it('shows loading message when route is loading', async () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.isLoading = true;
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Loading route...')).toBeInTheDocument();
            });
        });

        it('shows error message when route fails to load', async () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.error = new Error('Route loading failed');
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Route loading failed. Please try again.')).toBeInTheDocument();
            });
        });

        it('shows "No route available" when route data has no route', async () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = {
                type: 'FeatureCollection',
                features: [],
                properties: { hasRoute: false },
            };
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('No route available between these points.')).toBeInTheDocument();
            });
        });

        it('shows route summary when route data is available', async () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = {
                type: 'FeatureCollection',
                features: [],
                properties: {
                    hasRoute: true,
                    distanceMiles: 0.62,
                    durationMinutes: 2,
                    averageSpeedMph: 18.6,
                    start: { name: 'Start Road', requested: { lat: 50.67, lng: -1.4 }, snapped: { lat: 50.67, lng: -1.4 }, snapDistanceFeet: 0 },
                    end: { name: 'End Road', requested: { lat: 50.68, lng: -1.39 }, snapped: { lat: 50.68, lng: -1.39 }, snapDistanceFeet: 0 },
                },
            };
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Route Summary')).toBeInTheDocument();
                expect(screen.getByText(/Distance:/)).toBeInTheDocument();
                expect(screen.getByText(/Time:/)).toBeInTheDocument();
            });
        });

        it('shows find route button', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('FIND ROUTE')).toBeInTheDocument();
            });
        });

        it('calls findRoute when find route button is clicked', async () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('FIND ROUTE')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByText('FIND ROUTE'));
            expect(mockRouteContext.findRoute).toHaveBeenCalled();
        });

        it('shows delete icons when positions are set', async () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByLabelText('Clear start position')).toBeInTheDocument();
                expect(screen.getByLabelText('Clear end position')).toBeInTheDocument();
            });
        });

        it('calls setStart(null) when start delete icon is clicked', async () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByLabelText('Clear start position')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Clear start position'));
            expect(mockRouteContext.setStart).toHaveBeenCalledWith(null);
        });

        it('shows direct line toggle when route summary is visible', async () => {
            mockRouteContext.start = { lat: 50.67, lng: -1.4 };
            mockRouteContext.end = { lat: 50.68, lng: -1.39 };
            mockRouteContext.routeData = {
                type: 'FeatureCollection',
                features: [],
                properties: {
                    hasRoute: true,
                    distanceMiles: 0.62,
                    durationMinutes: 2,
                    averageSpeedMph: 18.6,
                    start: { name: 'Start Road', requested: { lat: 50.67, lng: -1.4 }, snapped: { lat: 50.67, lng: -1.4 }, snapDistanceFeet: 0 },
                    end: { name: 'End Road', requested: { lat: 50.68, lng: -1.39 }, snapped: { lat: 50.68, lng: -1.39 }, snapDistanceFeet: 0 },
                },
            };
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Route Planner/)).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByText('Show Direct Line')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('displays error message when fetch fails', async () => {
            mockedFetchUtilities.mockRejectedValue(new Error('Network error'));
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Error loading utilities')).toBeInTheDocument();
            });
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', async () => {
            const onClose = vi.fn();
            setupMocks();
            renderWithProviders(<UtilitiesView {...defaultProps} onClose={onClose} />);
            await waitFor(() => {
                const closeButton = screen.getByLabelText('Close panel');
                expect(closeButton).toBeInTheDocument();
            });
            const closeButton = screen.getByLabelText('Close panel');
            fireEvent.click(closeButton);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
