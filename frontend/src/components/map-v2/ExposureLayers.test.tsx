import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { FeatureCollection, Geometry } from 'geojson';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExposureLayers from './ExposureLayers';
import { fetchExposureLayers, type ExposureLayersResponse } from '@/api/exposure-layers';
import theme from '@/theme';

vi.mock('react-map-gl/maplibre', () => ({
    useMap: () => ({}),
    Source: ({ children, data }: { children: React.ReactNode; data: FeatureCollection }) => (
        <div data-testid="source" data-features-count={data.features.length}>
            {children}
        </div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

vi.mock('@/api/exposure-layers', () => ({
    fetchExposureLayers: vi.fn(),
}));

const mockedFetchExposureLayers = vi.mocked(fetchExposureLayers);

describe('ExposureLayers', () => {
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

    const createMockResponse = (layers: Array<{ id: string; name: string; isActive: boolean; geometry: Geometry }>): ExposureLayersResponse => ({
        featureCollection: {
            type: 'FeatureCollection',
            features: layers.map((layer) => ({
                type: 'Feature',
                id: layer.id,
                geometry: layer.geometry,
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
                exposureLayers: layers.map((layer) => ({
                    id: layer.id,
                    name: layer.name,
                    geometry: layer.geometry,
                    isActive: layer.isActive,
                })),
            },
        ],
    });

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

    describe('Rendering', () => {
        it('returns null when map is not ready', () => {
            const { container } = renderWithProviders(<ExposureLayers scenarioId="scenario-1" mapReady={false} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when scenarioId is not provided', () => {
            const { container } = renderWithProviders(<ExposureLayers mapReady={true} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders Source and Layers when data is loaded with active layers', async () => {
            mockedFetchExposureLayers.mockResolvedValue(createMockResponse([{ id: 'layer-1', name: 'Caul Bourne', isActive: true, geometry: mockGeometry1 }]));

            renderWithProviders(<ExposureLayers scenarioId="scenario-1" selectedFocusAreaId="focus-area-1" mapReady={true} />);

            await waitFor(() => {
                expect(screen.getByTestId('source')).toBeInTheDocument();
            });
            expect(screen.getByTestId('layer-map-v2-exposure-layer')).toBeInTheDocument();
            expect(screen.getByTestId('layer-map-v2-exposure-layer-outline')).toBeInTheDocument();
        });

        it('returns null when no layers are active', async () => {
            mockedFetchExposureLayers.mockResolvedValue(createMockResponse([{ id: 'layer-1', name: 'Caul Bourne', isActive: false, geometry: mockGeometry1 }]));

            const { container } = renderWithProviders(<ExposureLayers scenarioId="scenario-1" selectedFocusAreaId="focus-area-1" mapReady={true} />);

            await waitFor(() => {
                expect(mockedFetchExposureLayers).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(container.querySelector('[data-testid="source"]')).toBeNull();
            });
        });
    });

    describe('Layer Filtering', () => {
        it('only renders active layers', async () => {
            mockedFetchExposureLayers.mockResolvedValue(
                createMockResponse([
                    { id: 'layer-1', name: 'Caul Bourne', isActive: true, geometry: mockGeometry1 },
                    { id: 'layer-2', name: 'River Medina', isActive: false, geometry: mockGeometry2 },
                ]),
            );

            renderWithProviders(<ExposureLayers scenarioId="scenario-1" selectedFocusAreaId="focus-area-1" mapReady={true} />);

            await waitFor(() => {
                const source = screen.getByTestId('source');
                expect(source).toHaveAttribute('data-features-count', '1');
            });
        });

        it('renders all active layers', async () => {
            mockedFetchExposureLayers.mockResolvedValue(
                createMockResponse([
                    { id: 'layer-1', name: 'Caul Bourne', isActive: true, geometry: mockGeometry1 },
                    { id: 'layer-2', name: 'River Medina', isActive: true, geometry: mockGeometry2 },
                ]),
            );

            renderWithProviders(<ExposureLayers scenarioId="scenario-1" selectedFocusAreaId="focus-area-1" mapReady={true} />);

            await waitFor(() => {
                const source = screen.getByTestId('source');
                expect(source).toHaveAttribute('data-features-count', '2');
            });
        });
    });

    describe('Focus Area Selection', () => {
        it('fetches data for selected focus area', async () => {
            mockedFetchExposureLayers.mockResolvedValue(createMockResponse([{ id: 'layer-1', name: 'Caul Bourne', isActive: true, geometry: mockGeometry1 }]));

            renderWithProviders(<ExposureLayers scenarioId="scenario-1" selectedFocusAreaId="focus-area-1" mapReady={true} />);

            await waitFor(() => {
                expect(mockedFetchExposureLayers).toHaveBeenCalledWith('scenario-1', 'focus-area-1');
            });
        });

        it('does not fetch when no focus area is selected', async () => {
            mockedFetchExposureLayers.mockResolvedValue(createMockResponse([{ id: 'layer-1', name: 'Caul Bourne', isActive: true, geometry: mockGeometry1 }]));

            const { container } = renderWithProviders(<ExposureLayers scenarioId="scenario-1" selectedFocusAreaId={null} mapReady={true} />);

            await new Promise((resolve) => {
                setTimeout(resolve, 50);
            });

            expect(mockedFetchExposureLayers).not.toHaveBeenCalled();
            expect(container.firstChild).toBeNull();
        });
    });

    describe('Focus Area Panel Mode', () => {
        it('fetches data without focus_area_id when in focus area panel (server handles all active focus areas)', async () => {
            mockedFetchExposureLayers.mockResolvedValue(createMockResponse([{ id: 'layer-1', name: 'Caul Bourne', isActive: true, geometry: mockGeometry1 }]));

            renderWithProviders(<ExposureLayers scenarioId="scenario-1" mapReady={true} isInFocusAreaPanel={true} />);

            await waitFor(() => {
                expect(mockedFetchExposureLayers).toHaveBeenCalledWith('scenario-1', null);
                expect(mockedFetchExposureLayers).toHaveBeenCalledTimes(1);
            });
        });

        it('renders layers returned by server for all active focus areas', async () => {
            mockedFetchExposureLayers.mockResolvedValue(
                createMockResponse([
                    { id: 'layer-1', name: 'Caul Bourne', isActive: true, geometry: mockGeometry1 },
                    { id: 'layer-2', name: 'River Medina', isActive: true, geometry: mockGeometry2 },
                ]),
            );

            renderWithProviders(<ExposureLayers scenarioId="scenario-1" mapReady={true} isInFocusAreaPanel={true} />);

            await waitFor(() => {
                const source = screen.getByTestId('source');
                expect(source).toHaveAttribute('data-features-count', '2');
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles empty response', async () => {
            mockedFetchExposureLayers.mockResolvedValue({
                featureCollection: { type: 'FeatureCollection', features: [] },
                groups: [],
            });

            const { container } = renderWithProviders(<ExposureLayers scenarioId="scenario-1" selectedFocusAreaId="focus-area-1" mapReady={true} />);

            await waitFor(() => {
                expect(mockedFetchExposureLayers).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(container.querySelector('[data-testid="source"]')).toBeNull();
            });
        });

        it('handles features without IDs', async () => {
            mockedFetchExposureLayers.mockResolvedValue({
                featureCollection: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            geometry: mockGeometry1,
                            properties: { name: 'Test Layer', isActive: true },
                        },
                    ],
                },
                groups: [],
            });

            const { container } = renderWithProviders(<ExposureLayers scenarioId="scenario-1" selectedFocusAreaId="focus-area-1" mapReady={true} />);

            await waitFor(() => {
                expect(mockedFetchExposureLayers).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(container.querySelector('[data-testid="source"]')).toBeNull();
            });
        });

        it('uses properties.id when feature.id is not set', async () => {
            mockedFetchExposureLayers.mockResolvedValue({
                featureCollection: {
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            geometry: mockGeometry1,
                            properties: { id: 'prop-id-1', name: 'Test Layer', isActive: true },
                        },
                    ],
                },
                groups: [],
            });

            renderWithProviders(<ExposureLayers scenarioId="scenario-1" selectedFocusAreaId="focus-area-1" mapReady={true} />);

            await waitFor(() => {
                const source = screen.getByTestId('source');
                expect(source).toHaveAttribute('data-features-count', '1');
            });
        });
    });
});
