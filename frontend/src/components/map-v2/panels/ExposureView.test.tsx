import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { Geometry } from 'geojson';

import ExposureView from './ExposureView';
import theme from '@/theme';
import {
    toggleExposureLayerVisibility,
    bulkToggleExposureLayerVisibility,
    updateExposureLayer,
    deleteExposureLayer,
    type ExposureLayersResponse,
    type FocusAreaRelation,
} from '@/api/exposure-layers';
import { fetchFocusAreas, type FocusArea } from '@/api/focus-areas';

vi.mock('@/api/exposure-layers', () => ({
    toggleExposureLayerVisibility: vi.fn(),
    bulkToggleExposureLayerVisibility: vi.fn(),
    updateExposureLayer: vi.fn(),
    deleteExposureLayer: vi.fn(),
}));

vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: vi.fn(),
}));

// Mock the drawing context since the component uses it directly
const mockStartDrawing = vi.fn();
const mockSetDrawingConfig = vi.fn();
vi.mock('../context/DrawingContext', () => ({
    useDrawingContext: vi.fn(() => ({
        setDrawingConfig: mockSetDrawingConfig,
        drawingMode: null,
        startDrawing: mockStartDrawing,
    })),
}));

// Mock the exposure layer mutations hook
vi.mock('../hooks/useExposureLayerMutations', () => ({
    default: vi.fn(() => ({
        createExposureLayer: vi.fn(),
        updateExposureLayer: vi.fn(),
    })),
}));

const mockedToggleExposureLayerVisibility = vi.mocked(toggleExposureLayerVisibility);
const mockedBulkToggleExposureLayerVisibility = vi.mocked(bulkToggleExposureLayerVisibility);
const mockedUpdateExposureLayer = vi.mocked(updateExposureLayer);
const mockedDeleteExposureLayer = vi.mocked(deleteExposureLayer);
const mockedFetchFocusAreas = vi.mocked(fetchFocusAreas);

describe('ExposureView', () => {
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

    const createMockExposureLayersResponse = (options?: {
        layers?: Array<{ id: string; name: string; isActive: boolean; focusAreaRelation?: FocusAreaRelation }>;
    }): ExposureLayersResponse => {
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
                        focusAreaRelation: layer.focusAreaRelation,
                    },
                })),
            },
            groups: [
                {
                    id: 'group-1',
                    name: 'Floods',
                    isUserEditable: false,
                    exposureLayers: layers.map((layer, index) => ({
                        id: layer.id,
                        name: layer.name,
                        geometry: index === 0 ? mockGeometry1 : mockGeometry2,
                        isActive: layer.isActive,
                        focusAreaRelation: layer.focusAreaRelation,
                    })),
                },
                {
                    id: 'group-user-drawn',
                    name: 'User drawn',
                    isUserEditable: true,
                    exposureLayers: [],
                },
            ],
        };
    };

    const mockFocusAreas: FocusArea[] = [
        { id: 'map-wide-1', name: 'Map-wide', isActive: true, geometry: null, filterMode: 'by_asset_type', isSystem: true },
        { id: 'fa-1', name: 'Focus Area 1', isActive: true, geometry: mockGeometry1, filterMode: 'by_asset_type', isSystem: false },
        { id: 'fa-2', name: 'Focus Area 2', isActive: false, geometry: mockGeometry2, filterMode: 'by_asset_type', isSystem: false },
    ];

    const defaultExposureLayersData = createMockExposureLayersResponse({
        layers: [
            { id: 'layer-1', name: 'Caul Bourne', isActive: false },
            { id: 'layer-2', name: 'River Medina', isActive: false },
        ],
    });

    const defaultProps = {
        onClose: vi.fn(),
        scenarioId: 'scenario-1',
        exposureLayersData: defaultExposureLayersData,
        isLoading: false,
        isError: false,
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
        mockStartDrawing.mockClear();
        mockSetDrawingConfig.mockClear();
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>,
        );
    };

    const setupMutationMocks = () => {
        mockedFetchFocusAreas.mockResolvedValue(mockFocusAreas);
        mockedToggleExposureLayerVisibility.mockResolvedValue(undefined);
        mockedBulkToggleExposureLayerVisibility.mockResolvedValue(undefined);
        mockedUpdateExposureLayer.mockResolvedValue({ id: '', name: '' });
        mockedDeleteExposureLayer.mockResolvedValue(undefined);
    };

    describe('Rendering', () => {
        it('renders title', async () => {
            setupMutationMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByText('Exposure')).toBeInTheDocument();
            });
        });

        it('renders close button', async () => {
            setupMutationMocks();
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
            setupMutationMocks();
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={undefined} isLoading={true} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('Loading exposure layers...')).toBeInTheDocument();
            });
        });
    });

    describe('Focus Area Dropdown', () => {
        it('renders focus area dropdown', async () => {
            setupMutationMocks();
            renderWithProviders(<ExposureView {...defaultProps} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Focus area')).toBeInTheDocument();
            });
        });

        it('shows Map-wide as default option', async () => {
            setupMutationMocks();
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('Map-wide')).toBeInTheDocument();
            });
        });

        it('calls onFocusAreaSelect when focus area is changed', async () => {
            const onFocusAreaSelect = vi.fn();
            setupMutationMocks();
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
            setupMutationMocks();
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
            setupMutationMocks();
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
            const emptyExposureLayersData: ExposureLayersResponse = {
                featureCollection: { type: 'FeatureCollection', features: [] },
                groups: [],
            };
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={emptyExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('No exposure layers found')).toBeInTheDocument();
            });
        });
    });

    describe('Layer Toggle', () => {
        beforeEach(() => {
            setupMutationMocks();
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
            const exposureLayersData = createMockExposureLayersResponse({
                layers: [
                    { id: 'layer-1', name: 'Caul Bourne', isActive: true },
                    { id: 'layer-2', name: 'River Medina', isActive: false },
                ],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={exposureLayersData} selectedFocusAreaId="map-wide-1" />);
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

        it('invalidates exposureLayers and asset-score queries when layer is toggled', async () => {
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
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
                expect(mockedToggleExposureLayerVisibility).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['exposureLayers', 'scenario-1'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['asset-score', 'scenario-1'] });
            });
        });
    });

    describe('Group Expansion', () => {
        beforeEach(() => {
            setupMutationMocks();
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
            const exposureLayersData = createMockExposureLayersResponse({
                layers: [{ id: 'layer-1', name: 'Caul Bourne', isActive: true }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={exposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                const floodsHeader = screen.getByText(/Floods/);
                const headerButton = floodsHeader.closest('button');
                expect(headerButton).toHaveAttribute('aria-expanded', 'true');
            });
        });
    });

    describe('Error Handling', () => {
        it('displays error message when fetch fails', async () => {
            setupMutationMocks();
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={undefined} isError={true} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('Error loading exposure layers')).toBeInTheDocument();
            });
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked', async () => {
            const onClose = vi.fn();
            setupMutationMocks();
            renderWithProviders(<ExposureView {...defaultProps} onClose={onClose} />);
            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
            fireEvent.click(screen.getByLabelText('Close panel'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Toggle All Functionality', () => {
        const createEnvironmentallySensitiveAreasResponse = (options?: {
            layers?: Array<{ id: string; name: string; isActive: boolean }>;
        }): ExposureLayersResponse => {
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
                            groupId: 'env-sensitive-1',
                            groupName: 'Environmentally sensitive areas',
                            isActive: layer.isActive,
                        },
                    })),
                },
                groups: [
                    {
                        id: 'env-sensitive-1',
                        name: 'Environmentally sensitive areas',
                        isUserEditable: false,
                        exposureLayers: layers.map((layer, index) => ({
                            id: layer.id,
                            name: layer.name,
                            geometry: index === 0 ? mockGeometry1 : mockGeometry2,
                            isActive: layer.isActive,
                        })),
                    },
                    {
                        id: 'group-user-drawn',
                        name: 'User drawn',
                        isUserEditable: true,
                        exposureLayers: [],
                    },
                ],
            };
        };

        const envSensitiveExposureLayersData = createEnvironmentallySensitiveAreasResponse({
            layers: [
                { id: 'layer-1', name: 'Protected Area 1', isActive: false },
                { id: 'layer-2', name: 'Protected Area 2', isActive: false },
                { id: 'layer-3', name: 'Protected Area 3', isActive: false },
            ],
        });

        beforeEach(() => {
            setupMutationMocks();
        });

        it('displays toggle all button for Environmentally sensitive areas group', async () => {
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={envSensitiveExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('Environmentally sensitive areas')).toBeInTheDocument();
            });
            await waitFor(() => {
                expect(screen.getByLabelText('Show all')).toBeInTheDocument();
            });
        });

        it('shows toggle all button even when group is collapsed', async () => {
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={envSensitiveExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('Environmentally sensitive areas')).toBeInTheDocument();
            });
            const groupHeader = screen.getByText('Environmentally sensitive areas');
            const headerButton = groupHeader.closest('button');
            expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            await waitFor(() => {
                expect(screen.getByLabelText('Show all')).toBeInTheDocument();
            });
        });

        it('does not show toggle all button for other groups', async () => {
            renderWithProviders(<ExposureView {...defaultProps} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            expect(screen.queryByLabelText('Show all')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Hide all')).not.toBeInTheDocument();
        });

        it('toggles all layers when toggle all button is clicked', async () => {
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={envSensitiveExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByLabelText('Show all')).toBeInTheDocument();
            });

            const toggleAll = screen.getByLabelText('Show all');
            fireEvent.click(toggleAll);

            await waitFor(() => {
                expect(mockedBulkToggleExposureLayerVisibility).toHaveBeenCalledWith('scenario-1', {
                    focusAreaId: 'map-wide-1',
                    typeId: 'env-sensitive-1',
                    isActive: true,
                });
            });
        });

        it('invalidates exposureLayers and asset-score queries when toggle all is clicked', async () => {
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={envSensitiveExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByLabelText('Show all')).toBeInTheDocument();
            });

            const toggleAll = screen.getByLabelText('Show all');
            fireEvent.click(toggleAll);

            await waitFor(() => {
                expect(mockedBulkToggleExposureLayerVisibility).toHaveBeenCalledTimes(1);
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['exposureLayers', 'scenario-1'] });
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['asset-score', 'scenario-1'] });
            });
        });

        it('toggles all layers off when all are visible', async () => {
            const allActiveExposureLayersData = createEnvironmentallySensitiveAreasResponse({
                layers: [
                    { id: 'layer-1', name: 'Protected Area 1', isActive: true },
                    { id: 'layer-2', name: 'Protected Area 2', isActive: true },
                    { id: 'layer-3', name: 'Protected Area 3', isActive: true },
                ],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={allActiveExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByLabelText('Hide all')).toBeInTheDocument();
            });

            const toggleAll = screen.getByLabelText('Hide all');
            fireEvent.click(toggleAll);

            await waitFor(() => {
                expect(mockedBulkToggleExposureLayerVisibility).toHaveBeenCalledWith('scenario-1', {
                    focusAreaId: 'map-wide-1',
                    typeId: 'env-sensitive-1',
                    isActive: false,
                });
            });
        });

        it('does not change expansion state when toggle all is clicked', async () => {
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={envSensitiveExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('Environmentally sensitive areas')).toBeInTheDocument();
            });

            const groupHeader = screen.getByText('Environmentally sensitive areas');
            const headerButton = groupHeader.closest('button');
            expect(headerButton).toHaveAttribute('aria-expanded', 'false');

            const toggleAll = screen.getByLabelText('Show all');
            fireEvent.click(toggleAll);

            await waitFor(() => {
                expect(headerButton).toHaveAttribute('aria-expanded', 'false');
            });
        });

        it('shows correct label when some layers are visible', async () => {
            const mixedExposureLayersData = createEnvironmentallySensitiveAreasResponse({
                layers: [
                    { id: 'layer-1', name: 'Protected Area 1', isActive: true },
                    { id: 'layer-2', name: 'Protected Area 2', isActive: false },
                    { id: 'layer-3', name: 'Protected Area 3', isActive: false },
                ],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={mixedExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByLabelText('Show all')).toBeInTheDocument();
            });
        });
    });

    describe('Spatial Relation Badges', () => {
        beforeEach(() => {
            setupMutationMocks();
        });

        it('displays "In area" badge for contained layers', async () => {
            const exposureLayersData = createMockExposureLayersResponse({
                layers: [{ id: 'layer-1', name: 'Contained Layer', isActive: false, focusAreaRelation: 'contained' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={exposureLayersData} selectedFocusAreaId="fa-1" />);

            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });

            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }

            await waitFor(() => {
                expect(screen.getByText('Contained Layer')).toBeInTheDocument();
                expect(screen.getByText('In area')).toBeInTheDocument();
            });
        });

        it('displays "Near area" badge for overlapping layers', async () => {
            const exposureLayersData = createMockExposureLayersResponse({
                layers: [{ id: 'layer-1', name: 'Overlapping Layer', isActive: false, focusAreaRelation: 'overlaps' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={exposureLayersData} selectedFocusAreaId="fa-1" />);

            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });

            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }

            await waitFor(() => {
                expect(screen.getByText('Overlapping Layer')).toBeInTheDocument();
                expect(screen.getByText('Near area')).toBeInTheDocument();
            });
        });

        it('displays "Not in area" badge for elsewhere layers', async () => {
            const exposureLayersData = createMockExposureLayersResponse({
                layers: [{ id: 'layer-1', name: 'Elsewhere Layer', isActive: false, focusAreaRelation: 'elsewhere' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={exposureLayersData} selectedFocusAreaId="fa-1" />);

            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });

            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }

            await waitFor(() => {
                expect(screen.getByText('Elsewhere Layer')).toBeInTheDocument();
                expect(screen.getByText('Not in area')).toBeInTheDocument();
            });
        });

        it('displays correct badges for multiple layers with different relations', async () => {
            const exposureLayersData = createMockExposureLayersResponse({
                layers: [
                    { id: 'layer-1', name: 'Inside Layer', isActive: false, focusAreaRelation: 'contained' },
                    { id: 'layer-2', name: 'Partial Layer', isActive: false, focusAreaRelation: 'overlaps' },
                ],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={exposureLayersData} selectedFocusAreaId="fa-1" />);

            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });

            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }

            await waitFor(() => {
                expect(screen.getByText('Inside Layer')).toBeInTheDocument();
                expect(screen.getByText('Partial Layer')).toBeInTheDocument();
                expect(screen.getByText('In area')).toBeInTheDocument();
                expect(screen.getByText('Near area')).toBeInTheDocument();
            });
        });

        it('does not display badge when focusAreaRelation is not provided', async () => {
            const exposureLayersData = createMockExposureLayersResponse({
                layers: [{ id: 'layer-1', name: 'Layer Without Relation', isActive: false }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={exposureLayersData} selectedFocusAreaId="fa-1" />);

            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });

            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }

            await waitFor(() => {
                expect(screen.getByText('Layer Without Relation')).toBeInTheDocument();
            });

            expect(screen.queryByText('In area')).not.toBeInTheDocument();
            expect(screen.queryByText('Near area')).not.toBeInTheDocument();
            expect(screen.queryByText('Not in area')).not.toBeInTheDocument();
        });
    });
});
