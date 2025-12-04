import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { FeatureCollection } from 'geojson';

import ExposureLayers from './ExposureLayers';
import theme from '@/theme';

const mockUseMap = vi.fn();
vi.mock('react-map-gl/maplibre', () => ({
    useMap: () => mockUseMap(),
    Source: ({ children, data }: { children: React.ReactNode; data: FeatureCollection }) => (
        <div data-testid="source" data-features-count={data.features.length}>
            {children}
        </div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

describe('ExposureLayers', () => {
    const mockPolygonFeature: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                id: '35a910f3-f611-4096-ac0b-0928c5612e32',
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
                    name: 'Caul Bourne',
                },
            },
            {
                type: 'Feature',
                id: 'e34e3c22-a28f-45e5-99b5-a24b55ba875f',
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
                    name: 'River Medina',
                },
            },
        ],
    };

    const defaultProps = {
        exposureLayers: mockPolygonFeature,
        selectedExposureLayerIds: {} as Record<string, boolean>,
        mapReady: true,
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
        mockUseMap.mockReturnValue({});
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
            const { container } = renderWithProviders(<ExposureLayers {...defaultProps} mapReady={false} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when there are no selected layers', () => {
            const { container } = renderWithProviders(<ExposureLayers {...defaultProps} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when filtered features is empty', () => {
            const { container } = renderWithProviders(<ExposureLayers {...defaultProps} selectedExposureLayerIds={{ 'non-existent-id': true }} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders Source and Layers when map is ready and layers are selected', () => {
            renderWithProviders(<ExposureLayers {...defaultProps} selectedExposureLayerIds={{ '35a910f3-f611-4096-ac0b-0928c5612e32': true }} />);
            expect(screen.getByTestId('source')).toBeInTheDocument();
            expect(screen.getByTestId('layer-map-v2-exposure-layer')).toBeInTheDocument();
            expect(screen.getByTestId('layer-map-v2-exposure-layer-outline')).toBeInTheDocument();
        });
    });

    describe('Layer Filtering', () => {
        it('filters layers by selected exposure layer IDs', () => {
            renderWithProviders(
                <ExposureLayers
                    {...defaultProps}
                    selectedExposureLayerIds={{ '35a910f3-f611-4096-ac0b-0928c5612e32': true, 'e34e3c22-a28f-45e5-99b5-a24b55ba875f': false }}
                />,
            );
            const source = screen.getByTestId('source');
            expect(source).toHaveAttribute('data-features-count', '1');
        });

        it('renders all selected layers', () => {
            renderWithProviders(
                <ExposureLayers
                    {...defaultProps}
                    selectedExposureLayerIds={{ '35a910f3-f611-4096-ac0b-0928c5612e32': true, 'e34e3c22-a28f-45e5-99b5-a24b55ba875f': true }}
                />,
            );
            const source = screen.getByTestId('source');
            expect(source).toHaveAttribute('data-features-count', '2');
        });

        it('handles multiple layers of the same type', () => {
            const multipleLayers: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    ...mockPolygonFeature.features,
                    {
                        type: 'Feature',
                        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [-1.2, 50.65],
                                    [-1.2, 50.66],
                                    [-1.19, 50.66],
                                    [-1.19, 50.65],
                                    [-1.2, 50.65],
                                ],
                            ],
                        },
                        properties: {
                            name: 'Layer 3',
                        },
                    },
                ],
            };

            renderWithProviders(
                <ExposureLayers
                    exposureLayers={multipleLayers}
                    selectedExposureLayerIds={{
                        '35a910f3-f611-4096-ac0b-0928c5612e32': true,
                        'e34e3c22-a28f-45e5-99b5-a24b55ba875f': true,
                        'a1b2c3d4-e5f6-7890-abcd-ef1234567890': true,
                    }}
                    mapReady={true}
                />,
            );
            const source = screen.getByTestId('source');
            expect(source).toHaveAttribute('data-features-count', '3');
        });
    });

    describe('Feature ID Handling', () => {
        it('handles features with id property', () => {
            renderWithProviders(<ExposureLayers {...defaultProps} selectedExposureLayerIds={{ '35a910f3-f611-4096-ac0b-0928c5612e32': true }} />);
            expect(screen.getByTestId('source')).toBeInTheDocument();
        });

        it('handles features with id in properties', () => {
            const featureWithPropertyId: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {
                            id: '11111111-2222-3333-4444-555555555555',
                            name: 'Test Layer',
                        },
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
            };

            renderWithProviders(
                <ExposureLayers
                    exposureLayers={featureWithPropertyId}
                    selectedExposureLayerIds={{ '11111111-2222-3333-4444-555555555555': true }}
                    mapReady={true}
                />,
            );
            expect(screen.getByTestId('source')).toBeInTheDocument();
        });

        it('filters out features without IDs', () => {
            const featureWithoutId: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {
                            name: 'Test Layer',
                        },
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
            };

            const { container } = renderWithProviders(
                <ExposureLayers exposureLayers={featureWithoutId} selectedExposureLayerIds={{ 'some-id': true }} mapReady={true} />,
            );

            expect(container.firstChild).toBeNull();
        });
    });

    describe('MultiPolygon Support', () => {
        it('handles MultiPolygon geometries', () => {
            const multiPolygonFeature: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [-1.4, 50.67],
                                        [-1.4, 50.68],
                                        [-1.39, 50.68],
                                        [-1.39, 50.67],
                                        [-1.4, 50.67],
                                    ],
                                ],
                            ],
                        },
                        properties: {
                            name: 'MultiPolygon Layer',
                        },
                    },
                ],
            };

            renderWithProviders(
                <ExposureLayers
                    exposureLayers={multiPolygonFeature}
                    selectedExposureLayerIds={{ 'f9e8d7c6-b5a4-3210-9876-543210fedcba': true }}
                    mapReady={true}
                />,
            );
            expect(screen.getByTestId('source')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles empty exposure layers', () => {
            const emptyLayers: FeatureCollection = {
                type: 'FeatureCollection',
                features: [],
            };

            const { container } = renderWithProviders(
                <ExposureLayers exposureLayers={emptyLayers} selectedExposureLayerIds={{ 'any-id': true }} mapReady={true} />,
            );
            expect(container.firstChild).toBeNull();
        });

        it('handles features with empty properties', () => {
            const featureWithEmptyProperties: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: '22222222-3333-4444-5555-666666666666',
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
                        properties: {},
                    },
                ],
            };

            renderWithProviders(
                <ExposureLayers
                    exposureLayers={featureWithEmptyProperties}
                    selectedExposureLayerIds={{ '22222222-3333-4444-5555-666666666666': true }}
                    mapReady={true}
                />,
            );
            expect(screen.getByTestId('source')).toBeInTheDocument();
        });
    });
});
