import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { Geometry } from 'geojson';

import UtilitiesView from './UtilitiesView';
import theme from '@/theme';
import { fetchUtilities, type UtilitiesResponse } from '@/api/utilities';

vi.mock('@/api/utilities', () => ({
    fetchUtilities: vi.fn(),
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
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>,
        );
    };

    const setupMocks = (options?: { utilities?: UtilitiesResponse }) => {
        const mockGeometry: Geometry = {
            type: 'LineString',
            coordinates: [
                [-1.4, 50.67],
                [-1.39, 50.68],
            ],
        };

        const {
            utilities = {
                featureCollection: {
                    type: 'FeatureCollection',
                    features: [],
                },
                groups: [
                    {
                        id: 'road-routes',
                        name: 'Road routes',
                        utilities: [
                            {
                                id: 'road-route',
                                name: 'Route',
                                geometry: mockGeometry,
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
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
        });

        it('shows group header', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
        });

        it('displays utility names when group is expanded', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Route')).toBeInTheDocument();
            });
        });
    });

    describe('Group Expansion', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('expands group when clicked', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'true');
                expect(screen.getByText('Route')).toBeInTheDocument();
            });
        });

        it('collapses group when clicked again', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'true');
                expect(screen.getByText('Route')).toBeInTheDocument();
            });
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            });
        });
    });

    describe('Utility Toggle', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('calls onUtilityToggle when toggle is clicked', async () => {
            const onUtilityToggle = vi.fn();
            renderWithProviders(<UtilitiesView {...defaultProps} onUtilityToggle={onUtilityToggle} />);
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Route')).toBeInTheDocument();
            });
            const toggle = screen.getByLabelText('Show Route');
            const switchElement = toggle.closest('span')?.querySelector('input[type="checkbox"]');
            if (switchElement) {
                fireEvent.click(switchElement);
            }
            expect(onUtilityToggle).toHaveBeenCalledWith('road-route', true);
        });

        it('reflects selected state from props', async () => {
            renderWithProviders(<UtilitiesView {...defaultProps} selectedUtilityIds={{ 'road-route': true }} onUtilityToggle={vi.fn()} />);
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Route')).toBeInTheDocument();
            });
            const toggle = screen.getByLabelText('Hide Route');
            expect(toggle).toBeInTheDocument();
        });
    });

    describe('Road Route Controls', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('shows road route controls when route is selected and toggle is on', async () => {
            const onRequestPositionSelection = vi.fn();
            renderWithProviders(
                <UtilitiesView
                    {...defaultProps}
                    selectedUtilityIds={{ 'road-route': true }}
                    roadRouteVehicle="Car"
                    onRoadRouteVehicleChange={vi.fn()}
                    onRequestPositionSelection={onRequestPositionSelection}
                />,
            );
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Route')).toBeInTheDocument();
            });
            await waitFor(
                () => {
                    expect(screen.getByLabelText('Vehicle type')).toBeInTheDocument();
                    expect(screen.getByText('Select Start Position')).toBeInTheDocument();
                    expect(screen.getByText('Select End Location')).toBeInTheDocument();
                },
                { timeout: 3000 },
            );
        });

        it('calls onRequestPositionSelection when start button is clicked', async () => {
            const onRequestPositionSelection = vi.fn();
            renderWithProviders(
                <UtilitiesView
                    {...defaultProps}
                    selectedUtilityIds={{ 'road-route': true }}
                    roadRouteVehicle="Car"
                    onRoadRouteVehicleChange={vi.fn()}
                    onRequestPositionSelection={onRequestPositionSelection}
                />,
            );
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Select Start Position')).toBeInTheDocument();
            });
            const startButton = screen.getByText('Select Start Position');
            fireEvent.click(startButton);
            expect(onRequestPositionSelection).toHaveBeenCalledWith('start');
        });

        it('calls onRequestPositionSelection when end button is clicked', async () => {
            const onRequestPositionSelection = vi.fn();
            renderWithProviders(
                <UtilitiesView
                    {...defaultProps}
                    selectedUtilityIds={{ 'road-route': true }}
                    roadRouteStart={{ lat: 50.67, lng: -1.4 }}
                    roadRouteVehicle="Car"
                    onRoadRouteVehicleChange={vi.fn()}
                    onRequestPositionSelection={onRequestPositionSelection}
                />,
            );
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Select End Location')).toBeInTheDocument();
            });
            const endButton = screen.getByText('Select End Location');
            fireEvent.click(endButton);
            expect(onRequestPositionSelection).toHaveBeenCalledWith('end');
        });

        it('shows loading message when route is loading', async () => {
            renderWithProviders(
                <UtilitiesView
                    {...defaultProps}
                    selectedUtilityIds={{ 'road-route': true }}
                    roadRouteStart={{ lat: 50.67, lng: -1.4 }}
                    roadRouteEnd={{ lat: 50.68, lng: -1.39 }}
                    roadRouteVehicle="Car"
                    roadRouteLoading={true}
                    onRoadRouteVehicleChange={vi.fn()}
                    onRequestPositionSelection={vi.fn()}
                />,
            );
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Loading route...')).toBeInTheDocument();
            });
        });

        it('shows error message when route fails to load', async () => {
            const mockError = new Error('Route loading failed');
            renderWithProviders(
                <UtilitiesView
                    {...defaultProps}
                    selectedUtilityIds={{ 'road-route': true }}
                    roadRouteStart={{ lat: 50.67, lng: -1.4 }}
                    roadRouteEnd={{ lat: 50.68, lng: -1.39 }}
                    roadRouteVehicle="Car"
                    roadRouteError={mockError}
                    onRoadRouteVehicleChange={vi.fn()}
                    onRequestPositionSelection={vi.fn()}
                />,
            );
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Route loading failed. Please try again.')).toBeInTheDocument();
            });
        });

        it('shows "No route available" when route data is empty', async () => {
            renderWithProviders(
                <UtilitiesView
                    {...defaultProps}
                    selectedUtilityIds={{ 'road-route': true }}
                    roadRouteStart={{ lat: 50.67, lng: -1.4 }}
                    roadRouteEnd={{ lat: 50.68, lng: -1.39 }}
                    roadRouteVehicle="Car"
                    roadRouteData={{ routeGeojson: { features: [] } }}
                    onRoadRouteVehicleChange={vi.fn()}
                    onRequestPositionSelection={vi.fn()}
                />,
            );
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('No route available between these points.')).toBeInTheDocument();
            });
        });

        it('shows route summary when route data is available', async () => {
            renderWithProviders(
                <UtilitiesView
                    {...defaultProps}
                    selectedUtilityIds={{ 'road-route': true }}
                    roadRouteStart={{ lat: 50.67, lng: -1.4 }}
                    roadRouteEnd={{ lat: 50.68, lng: -1.39 }}
                    roadRouteVehicle="Car"
                    roadRouteData={{
                        routeGeojson: {
                            features: [
                                {
                                    type: 'Feature',
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: [
                                            [-1.4, 50.67],
                                            [-1.39, 50.68],
                                        ],
                                    },
                                    properties: {
                                        length: 1000,
                                        travel_time: 120,
                                        speed_kph: 30,
                                    },
                                },
                            ],
                        },
                    }}
                    onRoadRouteVehicleChange={vi.fn()}
                    onRequestPositionSelection={vi.fn()}
                />,
            );
            await waitFor(() => {
                expect(screen.getByText(/Road routes/)).toBeInTheDocument();
            });
            const roadRoutesHeader = screen.getByText(/Road routes/);
            const headerButton = roadRoutesHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Route Summary')).toBeInTheDocument();
                expect(screen.getByText(/Distance:/)).toBeInTheDocument();
                expect(screen.getByText(/Time:/)).toBeInTheDocument();
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
