import { render, screen } from '@testing-library/react';
import type { Geometry } from 'geojson';
import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import FocusAreaMask from './FocusAreaMask';

vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children, data, id }: { children: ReactNode; data: unknown; id: string }) => (
        <div data-testid={`source-${id}`} data-geometry={JSON.stringify(data)}>
            {children}
        </div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

describe('FocusAreaMask', () => {
    const mockPolygonGeometry: Geometry = {
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

    describe('Rendering', () => {
        it('returns null when geometry is null', () => {
            const { container } = render(<FocusAreaMask geometry={null} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when geometry is not a Polygon', () => {
            const pointGeometry: Geometry = {
                type: 'Point',
                coordinates: [-1.4, 50.67],
            };
            const { container } = render(<FocusAreaMask geometry={pointGeometry} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null for MultiPolygon geometry', () => {
            const multiPolygonGeometry: Geometry = {
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
            };
            const { container } = render(<FocusAreaMask geometry={multiPolygonGeometry} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders mask Source and Layer when geometry is valid Polygon', () => {
            render(<FocusAreaMask geometry={mockPolygonGeometry} />);
            expect(screen.getByTestId('source-focus-area-mask-source')).toBeInTheDocument();
            expect(screen.getByTestId('layer-focus-area-mask-layer')).toBeInTheDocument();
        });

        it('renders focus highlight Source and Layers when geometry is valid Polygon', () => {
            render(<FocusAreaMask geometry={mockPolygonGeometry} />);
            expect(screen.getByTestId('source-focus-area-highlight-source')).toBeInTheDocument();
            expect(screen.getByTestId('layer-focus-area-highlight-fill-layer')).toBeInTheDocument();
            expect(screen.getByTestId('layer-focus-area-highlight-line-layer')).toBeInTheDocument();
        });
    });

    describe('Mask Geometry', () => {
        it('creates a mask with world bounds and focus area as hole', () => {
            render(<FocusAreaMask geometry={mockPolygonGeometry} />);
            const source = screen.getByTestId('source-focus-area-mask-source');
            const data = JSON.parse(source.dataset.geometry || '{}');

            expect(data.type).toBe('Feature');
            expect(data.geometry.type).toBe('Polygon');
            expect(data.geometry.coordinates).toHaveLength(2);

            const worldBounds = data.geometry.coordinates[0];
            expect(worldBounds[0]).toEqual([-180, -90]);
            expect(worldBounds[1]).toEqual([-180, 90]);
            expect(worldBounds[2]).toEqual([180, 90]);
            expect(worldBounds[3]).toEqual([180, -90]);
            expect(worldBounds[4]).toEqual([-180, -90]);

            const hole = data.geometry.coordinates[1];
            expect(hole).toHaveLength(mockPolygonGeometry.coordinates[0].length);
        });

        it('reverses the focus area coordinates for the hole', () => {
            render(<FocusAreaMask geometry={mockPolygonGeometry} />);
            const source = screen.getByTestId('source-focus-area-mask-source');
            const data = JSON.parse(source.dataset.geometry || '{}');

            const originalCoords = mockPolygonGeometry.coordinates[0];
            const hole = data.geometry.coordinates[1];

            expect(hole[0]).toEqual(originalCoords[originalCoords.length - 1]);
            expect(hole[hole.length - 1]).toEqual(originalCoords[0]);
        });
    });

    describe('Focus Highlight Geometry', () => {
        it('creates a focus feature with the original geometry', () => {
            render(<FocusAreaMask geometry={mockPolygonGeometry} />);
            const source = screen.getByTestId('source-focus-area-highlight-source');
            const data = JSON.parse(source.dataset.geometry || '{}');

            expect(data.type).toBe('Feature');
            expect(data.geometry).toEqual(mockPolygonGeometry);
        });
    });

    describe('Edge Cases', () => {
        it('returns null for polygon with empty coordinates array', () => {
            const emptyPolygon: Geometry = {
                type: 'Polygon',
                coordinates: [],
            };
            const { container } = render(<FocusAreaMask geometry={emptyPolygon} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null for polygon with empty outer ring', () => {
            const emptyRingPolygon: Geometry = {
                type: 'Polygon',
                coordinates: [[]],
            };
            const { container } = render(<FocusAreaMask geometry={emptyRingPolygon} />);
            expect(container.firstChild).toBeNull();
        });

        it('handles LineString geometry', () => {
            const lineGeometry: Geometry = {
                type: 'LineString',
                coordinates: [
                    [-1.4, 50.67],
                    [-1.39, 50.68],
                ],
            };
            const { container } = render(<FocusAreaMask geometry={lineGeometry} />);
            expect(container.firstChild).toBeNull();
        });
    });
});
