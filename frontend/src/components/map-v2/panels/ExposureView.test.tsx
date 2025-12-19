import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { Geometry } from 'geojson';

import ExposureView from './ExposureView';
import theme from '@/theme';
import { fetchExposureLayers, toggleExposureLayerVisibility, type ExposureLayersResponse } from '@/api/exposure-layers';
import { fetchFocusAreas, type FocusArea } from '@/api/focus-areas';

vi.mock('@/api/exposure-layers', () => ({
    fetchExposureLayers: vi.fn(),
    toggleExposureLayerVisibility: vi.fn(),
}));

vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: vi.fn(),
}));

const mockedFetchExposureLayers = vi.mocked(fetchExposureLayers);
const mockedToggleExposureLayerVisibility = vi.mocked(toggleExposureLayerVisibility);
const mockedFetchFocusAreas = vi.mocked(fetchFocusAreas);

describe('ExposureView', () => {
    const defaultProps = {
        onClose: vi.fn(),
        scenarioId: 'scenario-1',
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

    const createMockExposureLayersResponse = (options?: { layers?: Array<{ id: string; name: string; isActive: boolean }> }): ExposureLayersResponse => {
        const { layers = [] } = options || {};
        return {
            featureCollection: {
                type: 'FeatureCollection',
                features: layers.map((layer, index) => ({
                    type: 'Feature',
                    id: layer.id,
                    geometry: index === 0 ? mockGeometry1 : mockGeometry2,
                    properties: {
                        name: layer.name,
                        groupId: 'group-1',
                        groupName: 'Floods',
                        isActive: layer.isActive,
                    },
                })),
            },
            groups: [
                {
                    id: 'group-1',
                    name: 'Floods',
                    exposureLayers: layers.map((layer, index) => ({
                        id: layer.id,
                        name: layer.name,
                        geometry: index === 0 ? mockGeometry1 : mockGeometry2,
                        isActive: layer.isActive,
                    })),
                },
            ],
        };
    };

    const mockFocusAreas: FocusArea[] = [
        { id: 'map-wide-1', name: 'Map-wide', isActive: true, geometry: null, filterMode: 'by_asset_type', isSystem: true },
        { id: 'fa-1', name: 'Focus Area 1', isActive: true, geometry: mockGeometry1, filterMode: 'by_asset_type', isSystem: false },
        { id: 'fa-2', name: 'Focus Area 2', isActive: false, geometry: mockGeometry2, filterMode: 'by_asset_type', isSystem: false },
    ];

    const setupMocks = (options?: { exposureLayers?: ExposureLayersResponse; focusAreas?: FocusArea[] }) => {
        const {
            exposureLayers = createMockExposureLayersResponse({
                layers: [
                    { id: 'layer-1', name: 'Caul Bourne', isActive: false },
                    { id: 'layer-2', name: 'River Medina', isActive: false },
                ],
            }),
            focusAreas = mockFocusAreas,
        } = options || {};

        mockedFetchExposureLayers.mockResolvedValue(exposureLayers);
        mockedFetchFocusAreas.mockResolvedValue(focusAreas);
        mockedToggleExposureLayerVisibility.mockResolvedValue(undefined);
    };

    describe('Rendering', () => {
        it('renders title', async () => {
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Exposure')).toBeInTheDocument();
            });
        });

        it('renders close button', async () => {
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
        });

        it('shows no scenario message when scenarioId is not provided', () => {
            renderWithProviders(<ExposureView onClose={vi.fn()} />);
            expect(screen.getByText('No scenario selected')).toBeInTheDocument();
        });

        it('shows loading state when layers are loading', async () => {
            const neverResolvingPromise = new Promise<never>(() => {});
            mockedFetchExposureLayers.mockImplementation(() => neverResolvingPromise as Promise<ExposureLayersResponse>);
            mockedFetchFocusAreas.mockResolvedValue(mockFocusAreas);
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('Loading exposure layers...')).toBeInTheDocument();
            });
        });
    });

    describe('Focus Area Dropdown', () => {
        it('renders focus area dropdown', async () => {
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Focus area')).toBeInTheDocument();
            });
        });

        it('shows Map-wide as default option', async () => {
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('Map-wide')).toBeInTheDocument();
            });
        });

        it('calls onFocusAreaSelect when focus area is changed', async () => {
            const onFocusAreaSelect = vi.fn();
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} onFocusAreaSelect={onFocusAreaSelect} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Focus area')).toBeInTheDocument();
            });

            // Wait for focus areas to load
            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalled();
            });

            // Allow time for data to be processed
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 100);
            });

            const select = screen.getByRole('combobox');
            fireEvent.mouseDown(select);

            await waitFor(
                () => {
                    expect(screen.getByRole('option', { name: 'Focus Area 1' })).toBeInTheDocument();
                },
                { timeout: 2000 },
            );

            fireEvent.click(screen.getByRole('option', { name: 'Focus Area 1' }));

            expect(onFocusAreaSelect).toHaveBeenCalledWith('fa-1');
        });

        it('disables inactive focus areas in dropdown', async () => {
            setupMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Focus area')).toBeInTheDocument();
            });

            // Wait for focus areas to load
            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalled();
            });

            // Allow time for data to be processed
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 100);
            });

            const select = screen.getByRole('combobox');
            fireEvent.mouseDown(select);

            // Inactive focus areas should now be selectable (not disabled)
            await waitFor(
                () => {
                    const inactiveOption = screen.getByRole('option', { name: 'Focus Area 2' });
                    expect(inactiveOption).not.toHaveAttribute('aria-disabled', 'true');
                },
                { timeout: 2000 },
            );
        });
    });

    describe('Exposure Layers Display', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('displays exposure layer groups', async () => {
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
        });

        it('shows layer names when group is expanded', async () => {
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
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

        it('shows "No exposure layers found" when there are no layers', async () => {
            setupMocks({
                exposureLayers: {
                    featureCollection: { type: 'FeatureCollection', features: [] },
                    groups: [],
                },
            });
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('No exposure layers found')).toBeInTheDocument();
            });
        });
    });

    describe('Layer Toggle', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('calls toggleExposureLayerVisibility when toggle is clicked', async () => {
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
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

            const toggle = screen.getByLabelText('Show Caul Bourne');
            fireEvent.click(toggle);

            await waitFor(() => {
                expect(mockedToggleExposureLayerVisibility).toHaveBeenCalledWith('scenario-1', {
                    exposureLayerId: 'layer-1',
                    focusAreaId: 'map-wide-1',
                    isActive: true,
                });
            });
        });

        it('passes correct focusAreaId when toggling in a focus area', async () => {
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="fa-1" />);
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

            const toggle = screen.getByLabelText('Show Caul Bourne');
            fireEvent.click(toggle);

            await waitFor(() => {
                expect(mockedToggleExposureLayerVisibility).toHaveBeenCalledWith('scenario-1', {
                    exposureLayerId: 'layer-1',
                    focusAreaId: 'fa-1',
                    isActive: true,
                });
            });
        });

        it('reflects visibility state from API response', async () => {
            setupMocks({
                exposureLayers: createMockExposureLayersResponse({
                    layers: [
                        { id: 'layer-1', name: 'Caul Bourne', isActive: true },
                        { id: 'layer-2', name: 'River Medina', isActive: false },
                    ],
                }),
            });
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByLabelText('Hide Caul Bourne')).toBeInTheDocument();
                expect(screen.getByLabelText('Show River Medina')).toBeInTheDocument();
            });
        });
    });

    describe('Group Expansion', () => {
        beforeEach(() => {
            setupMocks();
        });

        it('expands group when clicked', async () => {
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
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
            });
        });

        it('collapses group when clicked again', async () => {
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            });
        });

        it('auto-expands groups with active layers', async () => {
            setupMocks({
                exposureLayers: createMockExposureLayersResponse({
                    layers: [{ id: 'layer-1', name: 'Caul Bourne', isActive: true }],
                }),
            });
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                const floodsHeader = screen.getByText(/Floods/);
                const headerButton = floodsHeader.closest('button');
                expect(headerButton).toHaveAttribute('aria-expanded', 'true');
            });
        });
    });

    describe('Error Handling', () => {
        it('displays error message when fetch fails', async () => {
            mockedFetchExposureLayers.mockRejectedValue(new Error('Network error'));
            mockedFetchFocusAreas.mockResolvedValue(mockFocusAreas);
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
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
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Close panel'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });
});
