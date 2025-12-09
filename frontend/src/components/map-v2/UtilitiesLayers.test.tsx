import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import type { FeatureCollection } from 'geojson';

import UtilitiesLayers from './UtilitiesLayers';
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

describe('UtilitiesLayers', () => {
    const mockLineStringFeature: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                id: 'road-route',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [-1.4, 50.67],
                        [-1.39, 50.68],
                    ],
                },
                properties: {
                    name: 'Route 1',
                },
            },
            {
                type: 'Feature',
                id: 'road-route',
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [-1.3, 50.66],
                        [-1.29, 50.67],
                    ],
                },
                properties: {
                    name: 'Route 2',
                },
            },
        ],
    };

    const defaultProps = {
        utilities: mockLineStringFeature,
        selectedUtilityIds: {} as Record<string, boolean>,
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
            const { container } = renderWithProviders(<UtilitiesLayers {...defaultProps} mapReady={false} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when there are no selected utilities', () => {
            const { container } = renderWithProviders(<UtilitiesLayers {...defaultProps} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when filtered features is empty', () => {
            const { container } = renderWithProviders(<UtilitiesLayers {...defaultProps} selectedUtilityIds={{ 'non-existent-id': true }} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders Source and Layer when map is ready and utilities are selected', () => {
            renderWithProviders(<UtilitiesLayers {...defaultProps} selectedUtilityIds={{ 'road-route': true }} />);
            expect(screen.getByTestId('source')).toBeInTheDocument();
            expect(screen.getByTestId('layer-map-v2-utilities-layer')).toBeInTheDocument();
        });
    });

    describe('Layer Filtering', () => {
        it('filters utilities by selected utility IDs', () => {
            renderWithProviders(<UtilitiesLayers {...defaultProps} selectedUtilityIds={{ 'road-route': true }} />);
            const source = screen.getByTestId('source');
            expect(source).toHaveAttribute('data-features-count', '2');
        });

        it('renders all selected utilities', () => {
            const multipleUtilities: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    ...mockLineStringFeature.features,
                    {
                        type: 'Feature',
                        id: 'other-utility',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [-1.2, 50.65],
                                [-1.19, 50.66],
                            ],
                        },
                        properties: {
                            name: 'Other Utility',
                        },
                    },
                ],
            };

            renderWithProviders(
                <UtilitiesLayers utilities={multipleUtilities} selectedUtilityIds={{ 'road-route': true, 'other-utility': true }} mapReady={true} />,
            );
            const source = screen.getByTestId('source');
            expect(source).toHaveAttribute('data-features-count', '3');
        });

        it('filters out unselected utilities', () => {
            const multipleUtilities: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    ...mockLineStringFeature.features,
                    {
                        type: 'Feature',
                        id: 'other-utility',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [-1.2, 50.65],
                                [-1.19, 50.66],
                            ],
                        },
                        properties: {
                            name: 'Other Utility',
                        },
                    },
                ],
            };

            renderWithProviders(<UtilitiesLayers utilities={multipleUtilities} selectedUtilityIds={{ 'road-route': true }} mapReady={true} />);
            const source = screen.getByTestId('source');
            expect(source).toHaveAttribute('data-features-count', '2');
        });
    });

    describe('Feature ID Handling', () => {
        it('handles features with id property', () => {
            renderWithProviders(<UtilitiesLayers {...defaultProps} selectedUtilityIds={{ 'road-route': true }} />);
            expect(screen.getByTestId('source')).toBeInTheDocument();
        });

        it('handles features with id in properties', () => {
            const featureWithPropertyId: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {
                            id: 'utility-from-properties',
                            name: 'Test Utility',
                        },
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [-1.4, 50.67],
                                [-1.39, 50.68],
                            ],
                        },
                    },
                ],
            };

            renderWithProviders(<UtilitiesLayers utilities={featureWithPropertyId} selectedUtilityIds={{ 'utility-from-properties': true }} mapReady={true} />);
            expect(screen.getByTestId('source')).toBeInTheDocument();
        });

        it('filters out features without IDs', () => {
            const featureWithoutId: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {
                            name: 'Test Utility',
                        },
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [-1.4, 50.67],
                                [-1.39, 50.68],
                            ],
                        },
                    },
                ],
            };

            const { container } = renderWithProviders(
                <UtilitiesLayers utilities={featureWithoutId} selectedUtilityIds={{ 'some-id': true }} mapReady={true} />,
            );

            expect(container.firstChild).toBeNull();
        });
    });

    describe('Edge Cases', () => {
        it('handles empty utilities', () => {
            const emptyUtilities: FeatureCollection = {
                type: 'FeatureCollection',
                features: [],
            };

            const { container } = renderWithProviders(<UtilitiesLayers utilities={emptyUtilities} selectedUtilityIds={{ 'any-id': true }} mapReady={true} />);
            expect(container.firstChild).toBeNull();
        });

        it('handles features with empty properties', () => {
            const featureWithEmptyProperties: FeatureCollection = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: 'utility-no-props',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [-1.4, 50.67],
                                [-1.39, 50.68],
                            ],
                        },
                        properties: {},
                    },
                ],
            };

            renderWithProviders(<UtilitiesLayers utilities={featureWithEmptyProperties} selectedUtilityIds={{ 'utility-no-props': true }} mapReady={true} />);
            expect(screen.getByTestId('source')).toBeInTheDocument();
        });
    });
});
