import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { Geometry } from 'geojson';

import ExposureView from './ExposureView';
import theme from '@/theme';
import { fetchExposureLayers, type ExposureLayersResponse } from '@/api/exposure-layers';

vi.mock('@/api/exposure-layers', () => ({
    fetchExposureLayers: vi.fn(),
}));

const mockedFetchExposureLayers = vi.mocked(fetchExposureLayers);

describe('ExposureView', () => {
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

    const setupMocks = (options?: { exposureLayers?: ExposureLayersResponse }) => {
        const mockGeometry1: Geometry = {
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

        const {
            exposureLayers = {
                featureCollection: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                            geometry: mockGeometry1,
                            properties: {
                                name: 'Caul Bourne',
                                groupId: '2d373dca-1337-4e60-ba08-c8326d27042d',
                                groupName: 'Floods',
                            },
                        },
                        {
                            type: 'Feature',
                            id: 'e34e3c22-a28f-45e5-99b5-a24b55ba875f',
                            geometry: mockGeometry2,
                            properties: {
                                name: 'River Medina',
                                groupId: '2d373dca-1337-4e60-ba08-c8326d27042d',
                                groupName: 'Floods',
                            },
                        },
                    ],
                },
                groups: [
                    {
                        id: '2d373dca-1337-4e60-ba08-c8326d27042d',
                        name: 'Floods',
                        exposureLayers: [
                            {
                                id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                                name: 'Caul Bourne',
                                geometry: mockGeometry1,
                            },
                            {
                                id: 'e34e3c22-a28f-45e5-99b5-a24b55ba875f',
                                name: 'River Medina',
                                geometry: mockGeometry2,
                            },
                        ],
                    },
                ],
            },
        } = options || {};

        mockedFetchExposureLayers.mockResolvedValue(exposureLayers);
    };

    const waitForComponentReady = async () => {
        await waitFor(() => {
            expect(screen.getByText('Exposure')).toBeInTheDocument();
        });
    };

    describe('Rendering', () => {
        it('renders title', async () => {
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitForComponentReady();
        });

        it('renders close button', async () => {
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
        });

        it('shows loading state when layers are loading', async () => {
            const neverResolvingPromise = new Promise<never>(() => {});
            mockedFetchExposureLayers.mockImplementation(() => neverResolvingPromise as Promise<ExposureLayersResponse>);
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Loading exposure layers...')).toBeInTheDocument();
            });
        });
    });

    describe('Exposure Layers Display', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('displays exposure layers grouped dynamically from API', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
        });

        it('shows group header', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
        });

        it('displays layer names when group is expanded', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
                expect(screen.getByText('River Medina')).toBeInTheDocument();
            });
        });

        it('sorts layers alphabetically', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                const layerNames = screen.getAllByText(/Caul Bourne|River Medina/);
                expect(layerNames[0]).toHaveTextContent('Caul Bourne');
                expect(layerNames[1]).toHaveTextContent('River Medina');
            });
        });

        it('shows "No exposure layers found" when there are no layers', async () => {
            setupMocks({
                exposureLayers: {
                    featureCollection: {
                        type: 'FeatureCollection',
                        features: [],
                    },
                    groups: [],
                },
            });
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('No exposure layers found')).toBeInTheDocument();
            });
        });
    });

    describe('Group Expansion', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('expands group when clicked', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'true');
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
            });
        });

        it('collapses group when clicked again', async () => {
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'true');
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
            });
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            });
        });

        it('allows multiple groups to be expanded simultaneously', async () => {
            setupMocks({
                exposureLayers: {
                    featureCollection: {
                        type: 'FeatureCollection',
                        features: [
                            {
                                type: 'Feature',
                                id: 'layer-1',
                                geometry: {
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
                                },
                                properties: {
                                    name: 'Layer 1',
                                    groupId: 'group-1',
                                    groupName: 'Floods',
                                },
                            },
                            {
                                type: 'Feature',
                                id: 'layer-2',
                                geometry: {
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
                                },
                                properties: {
                                    name: 'Layer 2',
                                    groupId: 'group-2',
                                    groupName: 'Environmentally sensitive areas',
                                },
                            },
                        ],
                    },
                    groups: [
                        {
                            id: 'group-1',
                            name: 'Floods',
                            exposureLayers: [
                                {
                                    id: 'layer-1',
                                    name: 'Layer 1',
                                    geometry: {
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
                                    },
                                },
                            ],
                        },
                        {
                            id: 'group-2',
                            name: 'Environmentally sensitive areas',
                            exposureLayers: [
                                {
                                    id: 'layer-2',
                                    name: 'Layer 2',
                                    geometry: {
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
                                    },
                                },
                            ],
                        },
                    ],
                },
            });
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
                expect(screen.getByText(/Environmentally sensitive areas/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const envHeader = screen.getByText(/Environmentally sensitive areas/);
            const floodsButton = floodsHeader.closest('button');
            const envButton = envHeader.closest('button');
            if (floodsButton) {
                fireEvent.click(floodsButton);
            }
            if (envButton) {
                fireEvent.click(envButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Layer 1')).toBeInTheDocument();
                expect(screen.getByText('Layer 2')).toBeInTheDocument();
            });
        });
    });

    describe('Layer Toggle', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('calls onExposureLayerToggle when toggle is clicked', async () => {
            const onExposureLayerToggle = vi.fn();
            renderWithProviders(<ExposureView {...defaultProps} onExposureLayerToggle={onExposureLayerToggle} />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
            });
            const toggleButtons = screen.getAllByRole('button').filter((button) => {
                const listItem = button.closest('li');
                return listItem?.textContent?.includes('Caul Bourne') && button.getAttribute('aria-label')?.includes('Caul Bourne');
            });
            expect(toggleButtons.length).toBeGreaterThan(0);
            const toggle = toggleButtons[0];
            fireEvent.click(toggle);
            expect(onExposureLayerToggle).toHaveBeenCalledWith('35a910f3-f611-4096-ac0b-0928c5612e32', true);
        });

        it('reflects selected state from props', async () => {
            renderWithProviders(
                <ExposureView
                    {...defaultProps}
                    selectedExposureLayerIds={{ '35a910f3-f611-4096-ac0b-0928c5612e32': true, 'e34e3c22-a28f-45e5-99b5-a24b55ba875f': false }}
                />,
            );
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Caul Bourne')).toBeInTheDocument();
                expect(screen.getByText('River Medina')).toBeInTheDocument();
            });
            const toggle1 = screen.getByLabelText('Hide Caul Bourne');
            const toggle2 = screen.getByLabelText('Show River Medina');
            expect(toggle1).toBeInTheDocument();
            expect(toggle2).toBeInTheDocument();
            const visibilityIcon1 = toggle1.querySelector('svg[data-testid="VisibilityIcon"]');
            const visibilityOffIcon2 = toggle2.querySelector('svg[data-testid="VisibilityOffIcon"]');
            expect(visibilityIcon1).toBeInTheDocument();
            expect(visibilityOffIcon2).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('displays error message when fetch fails', async () => {
            mockedFetchExposureLayers.mockRejectedValue(new Error('Network error'));
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Error loading exposure layers')).toBeInTheDocument();
            });
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', async () => {
            const onClose = vi.fn();
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} onClose={onClose} />);
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
