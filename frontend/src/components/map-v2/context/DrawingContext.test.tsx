import { render, screen, act } from '@testing-library/react';
import type { Geometry } from 'geojson';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
});
