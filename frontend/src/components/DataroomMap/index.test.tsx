// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DataroomMap from './index';

const mapDrawingState = {
    isDrawing: false,
    startDrawing: vi.fn(),
    clearDrawing: vi.fn(),
};

vi.mock('./useMapDrawing', () => ({
    default: vi.fn(() => mapDrawingState),
}));

vi.mock('./DataroomMapControls', () => ({
    default: ({ drawing, visibilityToggle }: { drawing?: { onDraw: () => void }; visibilityToggle?: { onToggle: () => void } }) => (
        <div>
            {drawing && <button onClick={drawing.onDraw}>draw</button>}
            {visibilityToggle && <button onClick={visibilityToggle.onToggle}>toggle visibility</button>}
        </div>
    ),
}));

vi.mock('@/components/LoadingOverlay', () => ({
    default: ({ isLoading }: { isLoading: boolean }) => <div data-testid="loading-overlay">{isLoading ? 'loading' : 'idle'}</div>,
}));

vi.mock('react-map-gl/maplibre', () => ({
    __esModule: true,
    default: ({ children, onLoad, onMove }: { children: ReactNode; onLoad?: () => void; onMove?: (event: { viewState: any }) => void }) => (
        <div>
            <button onClick={() => onLoad?.()}>map load</button>
            <button
                onClick={() =>
                    onMove?.({
                        viewState: {
                            longitude: -1.4,
                            latitude: 50.67,
                            zoom: 10,
                            bearing: 0,
                            pitch: 0,
                            padding: { top: 0, right: 0, bottom: 0, left: 0 },
                        },
                    })
                }
            >
                map move
            </button>
            {children}
        </div>
    ),
    Layer: () => <div data-testid="map-layer" />,
}));

describe('DataroomMap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mapDrawingState.isDrawing = false;
    });

    it('renders map layer and only shows children after load', () => {
        render(
            <DataroomMap>
                <div>Map child content</div>
            </DataroomMap>,
        );

        expect(screen.getByTestId('map-layer')).toBeInTheDocument();
        expect(screen.queryByText('Map child content')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'map load' }));

        expect(screen.getByText('Map child content')).toBeInTheDocument();
    });

    it('handles draw action by clearing old geometry and starting drawing', () => {
        const onClearDrawnArea = vi.fn();
        render(<DataroomMap drawingEnabled onClearDrawnArea={onClearDrawnArea} />);

        fireEvent.click(screen.getByRole('button', { name: 'draw' }));

        expect(mapDrawingState.clearDrawing).toHaveBeenCalledOnce();
        expect(onClearDrawnArea).toHaveBeenCalledOnce();
        expect(mapDrawingState.startDrawing).toHaveBeenCalledOnce();
    });

    it('triggers drawing state callback and forwards visibility/loading props', () => {
        const onDrawingChange = vi.fn();
        const onToggle = vi.fn();
        const { rerender } = render(
            <DataroomMap onDrawingChange={onDrawingChange} isLoading={true} visibilityToggle={{ visible: true, onToggle, tooltip: 'Toggle assets' }} />,
        );

        expect(onDrawingChange).toHaveBeenCalledWith(false);
        expect(screen.getByTestId('loading-overlay')).toHaveTextContent('loading');

        fireEvent.click(screen.getByRole('button', { name: 'toggle visibility' }));
        expect(onToggle).toHaveBeenCalledOnce();

        mapDrawingState.isDrawing = true;
        rerender(<DataroomMap onDrawingChange={onDrawingChange} />);

        expect(onDrawingChange).toHaveBeenCalledWith(true);
    });
});
