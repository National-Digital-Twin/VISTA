import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Geometry } from 'geojson';

import InactiveFocusAreas from './InactiveFocusAreas';
import type { FocusArea } from '@/api/focus-areas';

vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children, data }: { children: ReactNode; data: unknown }) => (
        <div data-testid="source" data-geometry={JSON.stringify(data)}>
            {children}
        </div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

describe('InactiveFocusAreas', () => {
    const mockPolygon: Geometry = {
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
    };

    const mockPolygon2: Geometry = {
        type: 'Polygon',
        coordinates: [
            [
                [2, 2],
                [3, 2],
                [3, 3],
                [2, 3],
                [2, 2],
            ],
        ],
    };

    const createFocusArea = (overrides?: Partial<FocusArea>): FocusArea => ({
        id: 'fa-1',
        name: 'Test Area',
        geometry: mockPolygon,
        filterMode: 'by_asset_type',
        isActive: true,
        isSystem: false,
        ...overrides,
    });

    it('renders nothing when focusAreas array is empty', () => {
        const { container } = render(<InactiveFocusAreas focusAreas={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders Source and Layers for focus areas with geometry', () => {
        const focusAreas = [createFocusArea(), createFocusArea({ id: 'fa-2', geometry: mockPolygon2 })];
        render(<InactiveFocusAreas focusAreas={focusAreas} />);

        expect(screen.getByTestId('source')).toBeInTheDocument();
        expect(screen.getByTestId('layer-inactive-focus-areas-line-layer')).toBeInTheDocument();
    });

    it('skips focus areas without geometry', () => {
        const focusAreas = [
            createFocusArea({ id: 'fa-1', geometry: mockPolygon }),
            createFocusArea({ id: 'fa-2', geometry: null }),
            createFocusArea({ id: 'fa-3', geometry: mockPolygon2 }),
        ];
        render(<InactiveFocusAreas focusAreas={focusAreas} />);

        const source = screen.getByTestId('source');
        const data = JSON.parse(source.dataset.geometry || '{}');
        expect(data.features).toHaveLength(2);
        expect(data.features.map((f: { properties: { id: string } }) => f.properties.id)).toEqual(['fa-1', 'fa-3']);
    });

    it('skips focus areas with unsupported geometry types', () => {
        const pointGeometry: Geometry = { type: 'Point', coordinates: [0, 0] };
        const focusAreas = [createFocusArea({ id: 'fa-1', geometry: mockPolygon }), createFocusArea({ id: 'fa-2', geometry: pointGeometry })];
        render(<InactiveFocusAreas focusAreas={focusAreas} />);

        const source = screen.getByTestId('source');
        const data = JSON.parse(source.dataset.geometry || '{}');
        expect(data.features).toHaveLength(1);
        expect(data.features[0].properties.id).toBe('fa-1');
    });

    it('includes isActive and isSelected properties in feature properties', () => {
        const focusAreas = [createFocusArea({ id: 'fa-1', isActive: true }), createFocusArea({ id: 'fa-2', isActive: false, geometry: mockPolygon2 })];
        render(<InactiveFocusAreas focusAreas={focusAreas} selectedFocusAreaId="fa-1" />);

        const source = screen.getByTestId('source');
        const data = JSON.parse(source.dataset.geometry || '{}');
        expect(data.features).toHaveLength(2);
        expect(data.features[0].properties).toEqual({
            id: 'fa-1',
            isSelected: true,
            isActive: true,
        });
        expect(data.features[1].properties).toEqual({
            id: 'fa-2',
            isSelected: false,
            isActive: false,
        });
    });

    it('renders all focus areas regardless of isActive status', () => {
        const focusAreas = [createFocusArea({ id: 'fa-1', isActive: true }), createFocusArea({ id: 'fa-2', isActive: false, geometry: mockPolygon2 })];
        render(<InactiveFocusAreas focusAreas={focusAreas} />);

        const source = screen.getByTestId('source');
        const data = JSON.parse(source.dataset.geometry || '{}');
        expect(data.features).toHaveLength(2);
    });

    it('renders with default line colors', () => {
        const focusAreas = [createFocusArea()];
        render(<InactiveFocusAreas focusAreas={focusAreas} />);

        expect(screen.getByTestId('layer-inactive-focus-areas-line-layer')).toBeInTheDocument();
    });
});
