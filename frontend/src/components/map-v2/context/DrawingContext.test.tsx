// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, act, fireEvent } from '@testing-library/react';
import type { Geometry } from 'geojson';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useMapboxDraw from '../hooks/useMapboxDraw';
import { DrawingProvider, useDrawingContext } from './DrawingContext';

type MockMapboxDraw = {
    add: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    changeMode: ReturnType<typeof vi.fn>;
    getMode: ReturnType<typeof vi.fn>;
    getSelectedIds: ReturnType<typeof vi.fn>;
};

type MockMap = {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    fire: ReturnType<typeof vi.fn>;
    getCanvas: ReturnType<typeof vi.fn>;
};

function createMockMap(): MockMap {
    return {
        on: vi.fn(),
        off: vi.fn(),
        fire: vi.fn(),
        getCanvas: vi.fn().mockReturnValue({ style: { cursor: '' } }),
    };
}

function createMockMapRef(mockMap: MockMap) {
    return {
        current: {
            getMap: () => mockMap,
        },
    };
}

vi.mock('../hooks/useMapboxDraw', () => ({
    default: vi.fn(() => ({
        current: {
            add: vi.fn(),
            delete: vi.fn(),
            changeMode: vi.fn(),
            getMode: vi.fn().mockReturnValue('simple_select'),
            getSelectedIds: vi.fn().mockReturnValue([]),
        } as MockMapboxDraw,
    })),
}));

vi.mock('../RadiusDialog', () => ({
    default: ({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (radius: number) => void }) =>
        open ? (
            <div data-testid="radius-dialog">
                <button onClick={onClose}>Cancel</button>
                <button onClick={() => onConfirm(5)}>Confirm</button>
            </div>
        ) : null,
}));

const mockGeometry: Geometry = {
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

type TestEntity = {
    id: string;
    geometry: Geometry;
    isActive: boolean;
};

const createMockEntity = (overrides?: Partial<TestEntity>): TestEntity => ({
    id: 'entity-1',
    geometry: mockGeometry,
    isActive: true,
    ...overrides,
});

let capturedContext: ReturnType<typeof useDrawingContext> | null = null;
const startDrawingRefs: ReturnType<typeof useDrawingContext>['startDrawing'][] = [];
const mockedUseMapboxDraw = vi.mocked(useMapboxDraw);

function TestConsumer({ captureContext = false, trackRefs = false }: Readonly<{ captureContext?: boolean; trackRefs?: boolean }>) {
    const context = useDrawingContext();
    if (captureContext) {
        capturedContext = context;
    }
    if (trackRefs) {
        startDrawingRefs.push(context.startDrawing);
    }
    return (
        <div>
            <span data-testid="drawing-mode">{context.drawingMode ?? 'null'}</span>
            <span data-testid="draw-ready">{context.drawReady ? 'true' : 'false'}</span>
            <span data-testid="map-ready">{context.mapReady ? 'true' : 'false'}</span>
            <span data-testid="drawing-sync-complete">{context.drawingSyncComplete ? 'true' : 'false'}</span>
        </div>
    );
}

function renderWithProvider(children: ReactNode, options?: { mapReady?: boolean; scenarioId?: string }) {
    const mockMap = createMockMap();
    const mockMapRef = createMockMapRef(mockMap);

    return {
        ...render(
            <DrawingProvider mapRef={mockMapRef as any} mapReady={options?.mapReady ?? false} scenarioId={options?.scenarioId ?? 'scenario-1'}>
                {children}
            </DrawingProvider>,
        ),
        mockMap,
        mockMapRef,
    };
}

describe('DrawingContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedContext = null;
        startDrawingRefs.length = 0;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('provides initial context values', () => {
        renderWithProvider(<TestConsumer />);

        expect(screen.getByTestId('drawing-mode')).toHaveTextContent('null');
        expect(screen.getByTestId('map-ready')).toHaveTextContent('false');
        expect(screen.getByTestId('drawing-sync-complete')).toHaveTextContent('true');
    });

    it('reflects mapReady prop', () => {
        renderWithProvider(<TestConsumer />, { mapReady: true });

        expect(screen.getByTestId('map-ready')).toHaveTextContent('true');
    });

    it('throws error when useDrawingContext is used outside provider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => render(<TestConsumer />)).toThrow('useDrawingContext must be used within a DrawingProvider');

        consoleError.mockRestore();
    });

    it('sets drawingMode to polygon when startDrawing is called', async () => {
        renderWithProvider(<TestConsumer captureContext />, { mapReady: true });

        await act(async () => {
            capturedContext?.startDrawing('polygon');
        });

        expect(screen.getByTestId('drawing-mode')).toHaveTextContent('polygon');
    });

    it('sets drawingMode to circle when startDrawing is called', async () => {
        renderWithProvider(<TestConsumer captureContext />, { mapReady: true });

        await act(async () => {
            capturedContext?.startDrawing('circle');
        });

        expect(screen.getByTestId('drawing-mode')).toHaveTextContent('circle');
    });

    it('sets drawingMode to line and uses line draw mode', async () => {
        const drawRef = {
            current: {
                add: vi.fn(),
                delete: vi.fn(),
                changeMode: vi.fn(),
                getMode: vi.fn().mockReturnValue('simple_select'),
                getSelectedIds: vi.fn().mockReturnValue([]),
            } as MockMapboxDraw,
        };
        mockedUseMapboxDraw.mockImplementation(() => drawRef as any);

        renderWithProvider(<TestConsumer captureContext />, { mapReady: true });

        await act(async () => {
            capturedContext?.startDrawing('line');
        });

        expect(drawRef.current.changeMode).toHaveBeenCalledWith('draw_line_string');
        expect(screen.getByTestId('drawing-mode')).toHaveTextContent('line');
    });

    it('accepts a drawing config with entities', async () => {
        const entities = [createMockEntity()];

        renderWithProvider(<TestConsumer captureContext />, { mapReady: true });

        await act(async () => {
            capturedContext?.setDrawingConfig({
                featureType: 'focus_area',
                entities,
                getEntityId: (e) => e.id,
                getEntityGeometry: (e) => e.geometry,
                shouldRenderEntity: (e) => e.isActive,
                onCreate: vi.fn(),
                onUpdate: vi.fn(),
            });
        });

        expect(capturedContext?.drawRef.current).toBeDefined();
    });

    it('clears config when null is passed', async () => {
        const entities = [createMockEntity()];

        renderWithProvider(<TestConsumer captureContext />, { mapReady: true });

        await act(async () => {
            capturedContext?.setDrawingConfig({
                featureType: 'focus_area',
                entities,
                getEntityId: (e) => e.id,
                getEntityGeometry: (e) => e.geometry,
                shouldRenderEntity: (e) => e.isActive,
                onCreate: vi.fn(),
                onUpdate: vi.fn(),
            });
        });

        await act(async () => {
            capturedContext?.setDrawingConfig(null);
        });

        expect(screen.getByTestId('drawing-mode')).toHaveTextContent('null');
    });

    it('resets drawing mode when config changes', async () => {
        renderWithProvider(<TestConsumer captureContext />, { mapReady: true });

        await act(async () => {
            capturedContext?.startDrawing('polygon');
        });

        expect(screen.getByTestId('drawing-mode')).toHaveTextContent('polygon');

        await act(async () => {
            capturedContext?.setDrawingConfig({
                featureType: 'exposure_layer',
                entities: [],
                getEntityId: (e: TestEntity) => e.id,
                getEntityGeometry: (e: TestEntity) => e.geometry,
                shouldRenderEntity: () => true,
                onCreate: vi.fn(),
                onUpdate: vi.fn(),
            });
        });

        expect(screen.getByTestId('drawing-mode')).toHaveTextContent('null');
    });

    it('provides stable function references', async () => {
        const { rerender } = renderWithProvider(<TestConsumer trackRefs />, { mapReady: true });

        rerender(
            <DrawingProvider mapRef={{ current: { getMap: () => createMockMap() } } as any} mapReady={true} scenarioId="scenario-1">
                <TestConsumer trackRefs />
            </DrawingProvider>,
        );

        expect(startDrawingRefs.length).toBeGreaterThan(1);
    });

    it('syncs entities into draw and removes stale entities when draw becomes ready', async () => {
        const drawRef = {
            current: {
                add: vi.fn(),
                delete: vi.fn(),
                changeMode: vi.fn(),
                getMode: vi.fn().mockReturnValue('simple_select'),
                getSelectedIds: vi.fn().mockReturnValue([]),
            } as MockMapboxDraw,
        };
        let drawOptions: any;
        mockedUseMapboxDraw.mockImplementation((opts: any) => {
            drawOptions = opts;
            return drawRef as any;
        });

        renderWithProvider(<TestConsumer captureContext />, { mapReady: true });

        const entities = [createMockEntity({ id: 'entity-1' }), createMockEntity({ id: 'entity-2', isActive: false })];
        await act(async () => {
            capturedContext?.setDrawingConfig({
                featureType: 'focus_area',
                entities,
                getEntityId: (e) => e.id,
                getEntityGeometry: (e) => e.geometry,
                shouldRenderEntity: (e) => e.isActive,
                onCreate: vi.fn(),
                onUpdate: vi.fn(),
            });
        });

        await act(async () => {
            drawOptions.onDrawReady(true);
        });

        expect(drawRef.current.add).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'entity-1',
                properties: expect.objectContaining({ featureType: 'focus_area' }),
            }),
        );

        await act(async () => {
            capturedContext?.setDrawingConfig(null);
        });

        expect(drawRef.current.delete).toHaveBeenCalledWith('entity-1');
    });

    it('handles draw create/update/selection events through map listeners', async () => {
        const handlers: Record<string, (event: any) => void> = {};
        const mockMap = {
            on: vi.fn((event: string, handler: (event: any) => void) => {
                handlers[event] = handler;
            }),
            off: vi.fn(),
            fire: vi.fn(),
            getCanvas: vi.fn().mockReturnValue({ style: { cursor: '' } }),
        };
        const drawRef = {
            current: {
                add: vi.fn(),
                delete: vi.fn(),
                changeMode: vi.fn(),
                getMode: vi.fn().mockReturnValue('simple_select'),
                getSelectedIds: vi.fn().mockReturnValue([]),
            } as MockMapboxDraw,
        };
        let drawOptions: any;
        mockedUseMapboxDraw.mockImplementation((opts: any) => {
            drawOptions = opts;
            return drawRef as any;
        });

        const onCreate = vi.fn();
        const onUpdate = vi.fn();
        const onSelect = vi.fn();

        render(
            <DrawingProvider mapRef={createMockMapRef(mockMap as any) as any} mapReady={true} scenarioId="scenario-1">
                <TestConsumer captureContext />
            </DrawingProvider>,
        );

        await act(async () => {
            capturedContext?.setDrawingConfig({
                featureType: 'focus_area',
                entities: [createMockEntity({ id: 'entity-1' })],
                selectedEntityId: 'entity-1',
                getEntityId: (e) => e.id,
                getEntityGeometry: (e) => e.geometry,
                shouldRenderEntity: () => true,
                onCreate,
                onUpdate,
                onSelect,
            });
        });

        await act(async () => {
            drawOptions.onDrawReady(true);
        });

        act(() => {
            handlers['draw.create']({
                features: [{ id: 'temp-1', geometry: mockGeometry }],
            });
        });
        expect(onCreate).toHaveBeenCalledWith(mockGeometry);

        act(() => {
            handlers['draw.update']({
                features: [{ id: 'entity-1', geometry: { ...mockGeometry, coordinates: [[[0, 0]]] } }],
            });
        });
        expect(onUpdate).toHaveBeenCalledWith('entity-1', { ...mockGeometry, coordinates: [[[0, 0]]] });

        act(() => {
            handlers['draw.selectionchange']({
                features: [{ id: 'entity-1' }],
            });
        });
        expect(onSelect).toHaveBeenCalledWith('entity-1');

        act(() => {
            handlers['draw.selectionchange']({ features: [] });
        });
        expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('creates a circle from click and radius confirmation', async () => {
        const handlers: Record<string, (event: any) => void> = {};
        const mockMap = {
            on: vi.fn((event: string, handler: (event: any) => void) => {
                handlers[event] = handler;
            }),
            off: vi.fn(),
            fire: vi.fn(),
            getCanvas: vi.fn().mockReturnValue({ style: { cursor: '' } }),
        };
        const drawRef = {
            current: {
                add: vi.fn(),
                delete: vi.fn(),
                changeMode: vi.fn(),
                getMode: vi.fn().mockReturnValue('simple_select'),
                getSelectedIds: vi.fn().mockReturnValue([]),
            } as MockMapboxDraw,
        };
        mockedUseMapboxDraw.mockImplementation(() => drawRef as any);

        render(
            <DrawingProvider mapRef={createMockMapRef(mockMap as any) as any} mapReady={true} scenarioId="scenario-1">
                <TestConsumer captureContext />
            </DrawingProvider>,
        );

        await act(async () => {
            capturedContext?.setDrawingConfig({
                featureType: 'focus_area',
                entities: [createMockEntity({ id: 'entity-1' })],
                getEntityId: (e) => e.id,
                getEntityGeometry: (e) => e.geometry,
                shouldRenderEntity: () => true,
                onCreate: vi.fn(),
                onUpdate: vi.fn(),
            });
            capturedContext?.startDrawing('circle');
        });

        act(() => {
            handlers.click({ lngLat: { lng: -1.4, lat: 50.67 } });
        });

        expect(screen.getByTestId('radius-dialog')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

        expect(drawRef.current.changeMode).toHaveBeenCalledWith('simple_select');
        expect(mockMap.fire).toHaveBeenCalledWith(
            'draw.create',
            expect.objectContaining({
                features: expect.any(Array),
            }),
        );
    });

    it('cancels drawing on Escape key', async () => {
        const drawRef = {
            current: {
                add: vi.fn(),
                delete: vi.fn(),
                changeMode: vi.fn(),
                getMode: vi.fn().mockReturnValue('simple_select'),
                getSelectedIds: vi.fn().mockReturnValue([]),
            } as MockMapboxDraw,
        };
        mockedUseMapboxDraw.mockImplementation(() => drawRef as any);

        renderWithProvider(<TestConsumer captureContext />, { mapReady: true });

        await act(async () => {
            capturedContext?.startDrawing('polygon');
        });
        expect(screen.getByTestId('drawing-mode')).toHaveTextContent('polygon');

        fireEvent.keyDown(globalThis as unknown as Window, { key: 'Escape' });

        expect(drawRef.current.changeMode).toHaveBeenCalledWith('simple_select');
        expect(screen.getByTestId('drawing-mode')).toHaveTextContent('null');
    });
});
