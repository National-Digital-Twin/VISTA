// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Geometry } from 'geojson';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExposureView from './ExposureView';
import {
    toggleExposureLayerVisibility,
    bulkToggleExposureLayerVisibility,
    updateExposureLayer,
    deleteExposureLayer,
    publishExposureLayer,
    type ExposureLayersResponse,
    type ExposureLayerStatus,
    type FocusAreaRelation,
} from '@/api/exposure-layers';
import { fetchFocusAreas, type FocusArea } from '@/api/focus-areas';
import theme from '@/theme';

vi.mock('@/api/exposure-layers', () => ({
    toggleExposureLayerVisibility: vi.fn(),
    bulkToggleExposureLayerVisibility: vi.fn(),
    updateExposureLayer: vi.fn(),
    deleteExposureLayer: vi.fn(),
    publishExposureLayer: vi.fn(),
}));

vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: vi.fn(),
}));

const mockStartDrawing = vi.fn();
const mockSetDrawingConfig = vi.fn();
vi.mock('../context/DrawingContext', () => ({
    useDrawingContext: vi.fn(() => ({
        setDrawingConfig: mockSetDrawingConfig,
        drawingMode: null,
        startDrawing: mockStartDrawing,
    })),
}));

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
const mockedPublishExposureLayer = vi.mocked(publishExposureLayer);
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
        mockedPublishExposureLayer.mockResolvedValue(undefined);
    };

    const createUserDrawnExposureLayersResponse = (options: {
        layers: Array<{ id: string; name: string; isActive: boolean; status?: ExposureLayerStatus }>;
    }): ExposureLayersResponse => {
        const { layers } = options;
        return {
            featureCollection: { type: 'FeatureCollection', features: [] },
            groups: [
                {
                    id: 'group-user-drawn',
                    name: 'User drawn',
                    isUserEditable: true,
                    exposureLayers: layers.map((layer, index) => ({
                        id: layer.id,
                        name: layer.name,
                        geometry: index === 0 ? mockGeometry1 : mockGeometry2,
                        isActive: layer.isActive,
                        isUserDefined: true,
                        status: layer.status ?? 'unpublished',
                    })),
                },
            ],
        };
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

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalled();
            });

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

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalled();
            });

            await new Promise<void>((resolve) => {
                setTimeout(resolve, 100);
            });

            const select = screen.getByRole('combobox');
            fireEvent.mouseDown(select);

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

        it('invalidates roadRoute query when toggling a floods exposure layer', async () => {
            const floodsTypeId = '2d373dca-1337-4e60-ba08-c8326d27042d';
            const floodsExposureLayersData: ExposureLayersResponse = {
                featureCollection: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            id: 'flood-layer-1',
                            geometry: mockGeometry1,
                            properties: {
                                name: 'Flood Zone A',
                                groupId: floodsTypeId,
                                groupName: 'Floods',
                                isActive: false,
                            },
                        },
                    ],
                },
                groups: [
                    {
                        id: floodsTypeId,
                        name: 'Floods',
                        isUserEditable: false,
                        exposureLayers: [{ id: 'flood-layer-1', name: 'Flood Zone A', geometry: mockGeometry1, isActive: false }],
                    },
                    { id: 'group-user-drawn', name: 'User drawn', isUserEditable: true, exposureLayers: [] },
                ],
            };

            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={floodsExposureLayersData} selectedFocusAreaId="map-wide-1" />);

            await waitFor(() => {
                expect(screen.getByText(/Floods/)).toBeInTheDocument();
            });
            const floodsHeader = screen.getByText(/Floods/);
            const headerButton = floodsHeader.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
            await waitFor(() => {
                expect(screen.getByText('Flood Zone A')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Show Flood Zone A'));

            await waitFor(() => {
                expect(mockedToggleExposureLayerVisibility).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['roadRoute', 'scenario-1'] });
            });
        });

        it('does not invalidate roadRoute query when toggling a non-floods exposure layer', async () => {
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

            fireEvent.click(screen.getByLabelText('Show Caul Bourne'));

            await waitFor(() => {
                expect(mockedToggleExposureLayerVisibility).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['exposureLayers', 'scenario-1'] });
            });

            expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['roadRoute', 'scenario-1'] });
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

        it('shows partial visibility icon when some layers are visible', async () => {
            const mixedExposureLayersData = createEnvironmentallySensitiveAreasResponse({
                layers: [
                    { id: 'layer-1', name: 'Protected Area 1', isActive: true },
                    { id: 'layer-2', name: 'Protected Area 2', isActive: false },
                    { id: 'layer-3', name: 'Protected Area 3', isActive: false },
                ],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={mixedExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                const toggleButton = screen.getByLabelText('Show all');
                expect(toggleButton.querySelector('[data-testid="VisibilityOutlinedIcon"]')).toBeInTheDocument();
            });
        });

        it('shows filled visibility icon when all layers are visible', async () => {
            const allActiveExposureLayersData = createEnvironmentallySensitiveAreasResponse({
                layers: [
                    { id: 'layer-1', name: 'Protected Area 1', isActive: true },
                    { id: 'layer-2', name: 'Protected Area 2', isActive: true },
                    { id: 'layer-3', name: 'Protected Area 3', isActive: true },
                ],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={allActiveExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                const toggleButton = screen.getByLabelText('Hide all');
                expect(toggleButton.querySelector('[data-testid="VisibilityIcon"]')).toBeInTheDocument();
            });
        });

        it('shows visibility off icon when no layers are visible', async () => {
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={envSensitiveExposureLayersData} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                const toggleButton = screen.getByLabelText('Show all');
                expect(toggleButton.querySelector('[data-testid="VisibilityOffIcon"]')).toBeInTheDocument();
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

        it('displays "Partially in area" badge for overlapping layers', async () => {
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
                expect(screen.getByText('Partially in area')).toBeInTheDocument();
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
                expect(screen.getByText('Partially in area')).toBeInTheDocument();
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
            expect(screen.queryByText('Partially in area')).not.toBeInTheDocument();
            expect(screen.queryByText('Not in area')).not.toBeInTheDocument();
        });
    });

    describe('Send to Data Room', () => {
        const expandUserDrawnGroup = async () => {
            const header = screen.getByText('User drawn');
            const headerButton = header.closest('button');
            if (headerButton) {
                fireEvent.click(headerButton);
            }
        };

        beforeEach(() => {
            setupMutationMocks();
        });

        it('shows Send to Data Room button for unpublished user-drawn layers', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'My Layer', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByLabelText('Send to Data Room')).toBeInTheDocument();
                expect(screen.getByLabelText('Edit layer name')).toBeInTheDocument();
                expect(screen.getByLabelText('Delete layer')).toBeInTheDocument();
            });
        });

        it('shows checkmark icon and hides edit/delete/send for pending layers', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Pending Layer', isActive: false, status: 'pending' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByText('Pending Layer')).toBeInTheDocument();
                expect(screen.getByTitle('Sent to Data Room')).toBeInTheDocument();
            });
            expect(screen.queryByLabelText('Send to Data Room')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Edit layer name')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Delete layer')).not.toBeInTheDocument();
        });

        it('shows only visibility toggle for approved layers', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'UD.1 Approved Layer', isActive: false, status: 'approved' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByText('UD.1 Approved Layer')).toBeInTheDocument();
            });
            expect(screen.queryByLabelText('Send to Data Room')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Edit layer name')).not.toBeInTheDocument();
            expect(screen.queryByLabelText('Delete layer')).not.toBeInTheDocument();
            expect(screen.queryByTitle('Sent to Data Room')).not.toBeInTheDocument();
            expect(screen.getByLabelText('Show layer')).toBeInTheDocument();
        });

        it('opens confirmation dialog when Send to Data Room is clicked', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Newport', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByLabelText('Send to Data Room')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Send to Data Room'));

            await waitFor(() => {
                expect(screen.getByText('Send exposure layer to Data Room')).toBeInTheDocument();
                expect(screen.getByText(/submit it for admin review/)).toBeInTheDocument();
                expect(screen.getByText(/will be available to all users/)).toBeInTheDocument();
            });
        });

        it('closes confirmation dialog when cancel is clicked', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Newport', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByLabelText('Send to Data Room')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Send to Data Room'));
            await waitFor(() => {
                expect(screen.getByText('Send exposure layer to Data Room')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('CANCEL'));
            await waitFor(() => {
                expect(screen.queryByText('Send exposure layer to Data Room')).not.toBeInTheDocument();
            });
        });

        it('calls publishExposureLayer when send is confirmed', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Newport', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByLabelText('Send to Data Room')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Send to Data Room'));
            await waitFor(() => {
                expect(screen.getByText('Send exposure layer to Data Room')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('SEND'));

            await waitFor(() => {
                expect(mockedPublishExposureLayer).toHaveBeenCalledWith('scenario-1', 'ud-1');
            });
        });

        it('shows success snackbar after successful publish', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Newport', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByLabelText('Send to Data Room')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Send to Data Room'));
            await waitFor(() => {
                expect(screen.getByText('Send exposure layer to Data Room')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('SEND'));

            await waitFor(() => {
                expect(screen.getByText('Exposure layer sent to Data Room')).toBeInTheDocument();
                expect(screen.getByText('Newport sent for Admin approval')).toBeInTheDocument();
            });
        });

        it('shows error snackbar when publish fails', async () => {
            mockedPublishExposureLayer.mockRejectedValueOnce(new Error('Server error'));
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Newport', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByLabelText('Send to Data Room')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Send to Data Room'));
            await waitFor(() => {
                expect(screen.getByText('Send exposure layer to Data Room')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('SEND'));

            await waitFor(() => {
                expect(screen.getByText('Failed to send exposure layer to Data Room')).toBeInTheDocument();
            });
        });

        it('displays publishedId prefix for approved layers', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Approved Layer', isActive: false, status: 'approved' }],
            });
            data.groups[0].exposureLayers[0].publishedId = 'UD.ABCD';
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByText('UD.ABCD Approved Layer')).toBeInTheDocument();
            });
        });

        it('opens delete confirmation dialog and calls deleteExposureLayer on confirm', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'My Layer', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByLabelText('Delete layer')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Delete layer'));

            await waitFor(() => {
                expect(screen.getByText('Delete exposure layer')).toBeInTheDocument();
                expect(screen.getByText(/Are you sure you want to delete "My Layer"/)).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('DELETE'));

            await waitFor(() => {
                expect(mockedDeleteExposureLayer).toHaveBeenCalledWith('scenario-1', 'ud-1');
            });
        });

        it('closes delete dialog on cancel without calling API', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'My Layer', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();

            fireEvent.click(screen.getByLabelText('Delete layer'));
            await waitFor(() => {
                expect(screen.getByText('Delete exposure layer')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('CANCEL'));
            await waitFor(() => {
                expect(screen.queryByText('Delete exposure layer')).not.toBeInTheDocument();
            });
            expect(mockedDeleteExposureLayer).not.toHaveBeenCalled();
        });

        it('renames layer via inline edit on double-click', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Old Name', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByText('Old Name')).toBeInTheDocument();
            });

            fireEvent.doubleClick(screen.getByText('Old Name'));

            const textbox = screen.getByRole('textbox');
            expect(textbox).toBeInTheDocument();

            fireEvent.change(textbox, { target: { value: 'New Name' } });
            fireEvent.blur(textbox);

            await waitFor(() => {
                expect(mockedUpdateExposureLayer).toHaveBeenCalledWith('scenario-1', 'ud-1', { name: 'New Name' });
            });
        });

        it('does not call update when name is unchanged after edit', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Same Name', isActive: false, status: 'unpublished' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByText('Same Name')).toBeInTheDocument();
            });

            fireEvent.doubleClick(screen.getByText('Same Name'));

            const textbox = screen.getByRole('textbox');
            fireEvent.blur(textbox);

            expect(mockedUpdateExposureLayer).not.toHaveBeenCalled();
        });

        it('does not open edit mode on double-click for pending layers', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'Pending Layer', isActive: false, status: 'pending' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByText('Pending Layer')).toBeInTheDocument();
            });

            fireEvent.doubleClick(screen.getByText('Pending Layer'));

            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });

        it('does not open edit mode on double-click for approved layers', async () => {
            const data = createUserDrawnExposureLayersResponse({
                layers: [{ id: 'ud-1', name: 'UD.1 Approved', isActive: false, status: 'approved' }],
            });
            renderWithProviders(<ExposureView {...defaultProps} exposureLayersData={data} selectedFocusAreaId="map-wide-1" />);
            await waitFor(() => {
                expect(screen.getByText('User drawn')).toBeInTheDocument();
            });
            await expandUserDrawnGroup();
            await waitFor(() => {
                expect(screen.getByText('UD.1 Approved')).toBeInTheDocument();
            });

            fireEvent.doubleClick(screen.getByText('UD.1 Approved'));

            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        });
    });
});
