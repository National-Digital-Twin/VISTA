import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Geometry } from 'geojson';

import FocusAreaOutline from './FocusAreaOutline';

vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children, data }: { children: ReactNode; data: unknown }) => (
        <div data-testid="source" data-geometry={JSON.stringify(data)}>
            {children}
        </div>
    ),
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

describe('FocusAreaOutline', () => {
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

    it('renders nothing when geometry is null', () => {
        const { container } = render(<FocusAreaOutline geometry={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders Source and Layers for valid Polygon', () => {
        render(<FocusAreaOutline geometry={mockPolygon} />);

        expect(screen.getByTestId('source')).toBeInTheDocument();
        expect(screen.getByTestId('layer-focus-area-outline-fill-layer')).toBeInTheDocument();
        expect(screen.getByTestId('layer-focus-area-outline-line-layer')).toBeInTheDocument();
    });

    it('renders nothing for unsupported geometry types', () => {
        const point: Geometry = { type: 'Point', coordinates: [0, 0] };
        const { container } = render(<FocusAreaOutline geometry={point} />);
        expect(container.firstChild).toBeNull();
    });

    it('passes geometry to Source data', () => {
        render(<FocusAreaOutline geometry={mockPolygon} />);

        const source = screen.getByTestId('source');
        const data = JSON.parse(source.dataset.geometry || '{}');

        expect(data.type).toBe('Feature');
        expect(data.geometry).toEqual(mockPolygon);
    });
});
