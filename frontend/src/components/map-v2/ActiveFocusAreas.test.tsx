// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import type { Geometry } from 'geojson';
import { type ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import ActiveFocusAreas from './ActiveFocusAreas';
import type { FocusArea } from '@/api/focus-areas';

vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children, data, id }: { children: ReactNode; data: unknown; id: string }) => (
        <div data-testid={`source-${id}`} data-geometry={JSON.stringify(data)}>
            {children}
        </div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

describe('ActiveFocusAreas', () => {
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
        const { container } = render(<ActiveFocusAreas focusAreas={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when no focus areas have geometry', () => {
        const focusAreas = [createFocusArea({ id: 'fa-1', geometry: null }), createFocusArea({ id: 'fa-2', geometry: null })];
        const { container } = render(<ActiveFocusAreas focusAreas={focusAreas} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders Source and Layers for focus areas with geometry', () => {
        const focusAreas = [createFocusArea(), createFocusArea({ id: 'fa-2', geometry: mockPolygon2 })];
        render(<ActiveFocusAreas focusAreas={focusAreas} />);

        expect(screen.getByTestId('source-active-focus-areas-highlight-source')).toBeInTheDocument();
        expect(screen.getByTestId('layer-active-focus-areas-highlight-fill-layer')).toBeInTheDocument();
        expect(screen.getByTestId('layer-active-focus-areas-highlight-line-layer')).toBeInTheDocument();
    });

    it('skips focus areas without geometry', () => {
        const focusAreas = [
            createFocusArea({ id: 'fa-1', geometry: mockPolygon }),
            createFocusArea({ id: 'fa-2', geometry: null }),
            createFocusArea({ id: 'fa-3', geometry: mockPolygon2 }),
        ];
        render(<ActiveFocusAreas focusAreas={focusAreas} />);

        const source = screen.getByTestId('source-active-focus-areas-highlight-source');
        const data = JSON.parse(source.dataset.geometry || '{}');
        expect(data.features).toHaveLength(2);
        expect(data.features.map((f: { properties: { id: string } }) => f.properties.id)).toEqual(['fa-1', 'fa-3']);
    });

    it('skips focus areas with unsupported geometry types', () => {
        const pointGeometry: Geometry = { type: 'Point', coordinates: [0, 0] };
        const focusAreas = [createFocusArea({ id: 'fa-1', geometry: mockPolygon }), createFocusArea({ id: 'fa-2', geometry: pointGeometry })];
        render(<ActiveFocusAreas focusAreas={focusAreas} />);

        const source = screen.getByTestId('source-active-focus-areas-highlight-source');
        const data = JSON.parse(source.dataset.geometry || '{}');
        expect(data.features).toHaveLength(1);
        expect(data.features[0].properties.id).toBe('fa-1');
    });

    it('includes isActive and isSelected properties in feature properties', () => {
        const focusAreas = [createFocusArea({ id: 'fa-1', isActive: true }), createFocusArea({ id: 'fa-2', isActive: false, geometry: mockPolygon2 })];
        render(<ActiveFocusAreas focusAreas={focusAreas} selectedFocusAreaId="fa-1" />);

        const source = screen.getByTestId('source-active-focus-areas-highlight-source');
        const data = JSON.parse(source.dataset.geometry || '{}');
        expect(data.features).toHaveLength(1);
        expect(data.features[0].properties).toEqual({
            id: 'fa-1',
            isSelected: true,
            isActive: true,
        });
    });

    it('renders only active focus areas with geometry', () => {
        const focusAreas = [createFocusArea({ id: 'fa-1', isActive: true }), createFocusArea({ id: 'fa-2', isActive: false, geometry: mockPolygon2 })];
        render(<ActiveFocusAreas focusAreas={focusAreas} />);

        const source = screen.getByTestId('source-active-focus-areas-highlight-source');
        const data = JSON.parse(source.dataset.geometry || '{}');
        expect(data.features).toHaveLength(1);
        expect(data.features[0].properties.id).toBe('fa-1');
    });

    it('renders mask when showMask is true and there are active focus areas', () => {
        const focusAreas = [createFocusArea({ id: 'fa-1', isActive: true })];
        render(<ActiveFocusAreas focusAreas={focusAreas} showMask={true} />);

        expect(screen.getByTestId('source-active-focus-areas-mask-source')).toBeInTheDocument();
        expect(screen.getByTestId('layer-active-focus-areas-mask-layer')).toBeInTheDocument();
    });

    it('does not render mask when showMask is false', () => {
        const focusAreas = [createFocusArea({ id: 'fa-1', isActive: true })];
        render(<ActiveFocusAreas focusAreas={focusAreas} showMask={false} />);

        expect(screen.queryByTestId('source-active-focus-areas-mask-source')).not.toBeInTheDocument();
        expect(screen.queryByTestId('layer-active-focus-areas-mask-layer')).not.toBeInTheDocument();
    });

    it('does not render mask when there are no active focus areas', () => {
        const focusAreas = [createFocusArea({ id: 'fa-1', isActive: false })];
        render(<ActiveFocusAreas focusAreas={focusAreas} showMask={true} />);

        expect(screen.queryByTestId('source-active-focus-areas-mask-source')).not.toBeInTheDocument();
        expect(screen.queryByTestId('layer-active-focus-areas-mask-layer')).not.toBeInTheDocument();
    });

    it('does not render mask when focus area geometry is not a Polygon', () => {
        const lineStringGeometry: Geometry = {
            type: 'LineString',
            coordinates: [
                [0, 0],
                [1, 1],
            ],
        };
        const focusAreas = [createFocusArea({ id: 'fa-1', isActive: true, geometry: lineStringGeometry })];
        render(<ActiveFocusAreas focusAreas={focusAreas} showMask={true} />);

        expect(screen.queryByTestId('source-active-focus-areas-mask-source')).not.toBeInTheDocument();
    });
});
