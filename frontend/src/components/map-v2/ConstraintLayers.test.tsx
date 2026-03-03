import { render, screen } from '@testing-library/react';
import type { FeatureCollection } from 'geojson';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ConstraintLayers from './ConstraintLayers';
import type { ConstraintInterventionType } from '@/api/constraint-interventions';

vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children, data }: { children: React.ReactNode; data: FeatureCollection }) => (
        <div data-testid="source" data-features-count={data.features.length}>
            {children}
        </div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

const makeConstraintType = (overrides?: Partial<ConstraintInterventionType>): ConstraintInterventionType => ({
    id: overrides?.id ?? 'type-1',
    name: overrides?.name ?? 'Road Closure',
    constraintInterventions: overrides?.constraintInterventions ?? [
        {
            id: 'int-1',
            name: 'Closure A',
            isActive: true,
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                        [0, 0],
                    ],
                ],
            },
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
        },
    ],
});

describe('ConstraintLayers', () => {
    describe('Rendering', () => {
        it('returns null when map is not ready', () => {
            const { container } = render(<ConstraintLayers mapReady={false} constraintTypes={[makeConstraintType()]} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when constraintTypes is undefined', () => {
            const { container } = render(<ConstraintLayers mapReady={true} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when constraintTypes is empty', () => {
            const { container } = render(<ConstraintLayers mapReady={true} constraintTypes={[]} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when no active interventions', () => {
            const type = makeConstraintType({
                constraintInterventions: [
                    {
                        id: 'int-1',
                        name: 'Inactive',
                        isActive: false,
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [1, 0],
                                    [1, 1],
                                    [0, 1],
                                    [0, 0],
                                ],
                            ],
                        },
                        createdAt: '2025-01-01T00:00:00Z',
                        updatedAt: '2025-01-01T00:00:00Z',
                    },
                ],
            });
            const { container } = render(<ConstraintLayers mapReady={true} constraintTypes={[type]} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders source and layers when active interventions exist', () => {
            render(<ConstraintLayers mapReady={true} constraintTypes={[makeConstraintType()]} />);
            expect(screen.getByTestId('source')).toBeInTheDocument();
            expect(screen.getByTestId('layer-constraint-interventions-fill-layer')).toBeInTheDocument();
            expect(screen.getByTestId('layer-constraint-interventions-line-layer')).toBeInTheDocument();
        });
    });

    describe('Feature collection', () => {
        it('includes only active interventions with geometry', () => {
            const type = makeConstraintType({
                constraintInterventions: [
                    {
                        id: 'active-1',
                        name: 'Active',
                        isActive: true,
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [1, 0],
                                    [1, 1],
                                    [0, 1],
                                    [0, 0],
                                ],
                            ],
                        },
                        createdAt: '2025-01-01T00:00:00Z',
                        updatedAt: '2025-01-01T00:00:00Z',
                    },
                    {
                        id: 'inactive-1',
                        name: 'Inactive',
                        isActive: false,
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [1, 0],
                                    [1, 1],
                                    [0, 1],
                                    [0, 0],
                                ],
                            ],
                        },
                        createdAt: '2025-01-01T00:00:00Z',
                        updatedAt: '2025-01-01T00:00:00Z',
                    },
                ],
            });
            render(<ConstraintLayers mapReady={true} constraintTypes={[type]} />);
            expect(screen.getByTestId('source')).toHaveAttribute('data-features-count', '1');
        });

        it('collects features from multiple constraint types', () => {
            const types = [
                makeConstraintType({ id: 'type-1' }),
                makeConstraintType({
                    id: 'type-2',
                    constraintInterventions: [
                        {
                            id: 'int-2',
                            name: 'Closure B',
                            isActive: true,
                            geometry: {
                                type: 'LineString',
                                coordinates: [
                                    [0, 0],
                                    [1, 1],
                                ],
                            },
                            createdAt: '2025-01-01T00:00:00Z',
                            updatedAt: '2025-01-01T00:00:00Z',
                        },
                    ],
                }),
            ];
            render(<ConstraintLayers mapReady={true} constraintTypes={types} />);
            expect(screen.getByTestId('source')).toHaveAttribute('data-features-count', '2');
        });

        it('skips interventions without geometry', () => {
            const type = makeConstraintType({
                constraintInterventions: [
                    {
                        id: 'no-geom',
                        name: 'No Geometry',
                        isActive: true,
                        geometry: undefined as any,
                        createdAt: '2025-01-01T00:00:00Z',
                        updatedAt: '2025-01-01T00:00:00Z',
                    },
                    {
                        id: 'has-geom',
                        name: 'Has Geometry',
                        isActive: true,
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [1, 0],
                                    [1, 1],
                                    [0, 1],
                                    [0, 0],
                                ],
                            ],
                        },
                        createdAt: '2025-01-01T00:00:00Z',
                        updatedAt: '2025-01-01T00:00:00Z',
                    },
                ],
            });
            render(<ConstraintLayers mapReady={true} constraintTypes={[type]} />);
            expect(screen.getByTestId('source')).toHaveAttribute('data-features-count', '1');
        });
    });
});
