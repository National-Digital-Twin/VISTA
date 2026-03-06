// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PendingExposureOutlines from './PendingExposureOutlines';

vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children, ...props }: any) => (
        <div data-testid="source" data-props={JSON.stringify(props)}>
            {children}
        </div>
    ),
    Layer: (props: any) => <div data-testid="layer" data-props={JSON.stringify(props)} />,
}));

describe('PendingExposureOutlines', () => {
    it('renders nothing when no polygonal layers are provided', () => {
        const { container } = render(
            <PendingExposureOutlines
                layers={[
                    {
                        id: 'line-1',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [0, 0],
                                [1, 1],
                            ],
                        } as any,
                    },
                ]}
                highlightedLayerId={null}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('renders default layers for polygon features', () => {
        render(
            <PendingExposureOutlines
                layers={[
                    {
                        id: 'poly-1',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [1, 0],
                                    [1, 1],
                                    [0, 0],
                                ],
                            ],
                        } as any,
                    },
                ]}
                highlightedLayerId={null}
            />,
        );

        expect(screen.getByTestId('source')).toBeInTheDocument();
        expect(screen.getAllByTestId('layer')).toHaveLength(2);
    });

    it('renders highlight layers when highlightedLayerId is set', () => {
        render(
            <PendingExposureOutlines
                layers={[
                    {
                        id: 'poly-2',
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [0, 0],
                                        [1, 0],
                                        [1, 1],
                                        [0, 0],
                                    ],
                                ],
                            ],
                        } as any,
                    },
                ]}
                highlightedLayerId="poly-2"
            />,
        );

        expect(screen.getAllByTestId('layer')).toHaveLength(4);
    });
});
