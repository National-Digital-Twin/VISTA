import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Feature, Geometry } from 'geojson';

import useFocusAreas from './useFocusAreas';
import { fetchFocusAreas, createFocusArea, updateFocusArea, type FocusArea } from '@/api/focus-areas';

vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: vi.fn(),
    createFocusArea: vi.fn(),
    updateFocusArea: vi.fn(),
}));

const mockedFetchFocusAreas = vi.mocked(fetchFocusAreas);
const mockedCreateFocusArea = vi.mocked(createFocusArea);
const mockedUpdateFocusArea = vi.mocked(updateFocusArea);

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

const createMockFocusArea = (overrides?: Partial<FocusArea>): FocusArea => ({
    id: 'focus-area-1',
    name: 'Test Focus Area',
    isActive: true,
    geometry: mockGeometry,
    ...overrides,
});

function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

function createWrapper(queryClient: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

type MockMapboxDraw = {
    add: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    changeMode: ReturnType<typeof vi.fn>;
    getMode: ReturnType<typeof vi.fn>;
};

type MockMap = {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
};

function createMockDrawRef(): { current: MockMapboxDraw } {
    return {
        current: {
            add: vi.fn(),
            delete: vi.fn(),
            changeMode: vi.fn(),
            getMode: vi.fn().mockReturnValue('simple_select'),
        },
    };
}

function createMockMapRef(mockMap: MockMap): { current: { getMap: () => MockMap } } {
    return {
        current: {
            getMap: () => mockMap,
        },
    };
}

function createMockMap(): MockMap {
    return {
        on: vi.fn(),
        off: vi.fn(),
    };
}

describe('useFocusAreas', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = createQueryClient();
        vi.clearAllMocks();
        mockedFetchFocusAreas.mockResolvedValue([]);
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('initialization', () => {
        it('returns isDrawing as false initially', () => {
            const mockMap = createMockMap();
            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: createMockDrawRef() as any,
                        mapReady: false,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            expect(result.current.isDrawing).toBe(false);
        });

        it('returns drawingMode as null initially', () => {
            const mockMap = createMockMap();
            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: createMockDrawRef() as any,
                        mapReady: false,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            expect(result.current.drawingMode).toBe(null);
        });

        it('returns startDrawing function', () => {
            const mockMap = createMockMap();
            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: createMockDrawRef() as any,
                        mapReady: false,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            expect(typeof result.current.startDrawing).toBe('function');
        });

        it('returns createCircleAtPoint function', () => {
            const mockMap = createMockMap();
            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: createMockDrawRef() as any,
                        mapReady: false,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            expect(typeof result.current.createCircleAtPoint).toBe('function');
        });
    });

    describe('startDrawing', () => {
        it('sets isDrawing to true and drawingMode to "polygon" when called with "polygon"', () => {
            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.startDrawing('polygon');
            });

            expect(result.current.isDrawing).toBe(true);
            expect(result.current.drawingMode).toBe('polygon');
            expect(mockDrawRef.current.changeMode).toHaveBeenCalledWith('draw_polygon');
        });

        it('sets isDrawing to true and drawingMode to "circle" when called with "circle"', () => {
            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.startDrawing('circle');
            });

            expect(result.current.isDrawing).toBe(true);
            expect(result.current.drawingMode).toBe('circle');
            expect(mockDrawRef.current.changeMode).toHaveBeenCalledWith('drag_circle');
        });

        it('does nothing if drawRef is null', () => {
            const mockMap = createMockMap();
            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: { current: null } as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.startDrawing('polygon');
            });

            expect(result.current.isDrawing).toBe(false);
            expect(result.current.drawingMode).toBe(null);
        });
    });

    describe('focus areas query', () => {
        it('fetches focus areas when scenarioId is provided', async () => {
            const mockFocusAreas = [createMockFocusArea()];
            mockedFetchFocusAreas.mockResolvedValue(mockFocusAreas);

            const mockMap = createMockMap();
            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: createMockDrawRef() as any,
                        mapReady: false,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalledWith('scenario-123');
            });
        });

        it('does not fetch focus areas when scenarioId is undefined', () => {
            const mockMap = createMockMap();
            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: undefined,
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: createMockDrawRef() as any,
                        mapReady: false,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            expect(mockedFetchFocusAreas).not.toHaveBeenCalled();
        });
    });

    describe('sync focus areas to MapboxDraw', () => {
        it('adds active focus areas to draw when map is ready', async () => {
            const mockFocusAreas = [createMockFocusArea({ id: 'fa-1', isActive: true }), createMockFocusArea({ id: 'fa-2', isActive: true })];
            mockedFetchFocusAreas.mockResolvedValue(mockFocusAreas);

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();

            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockDrawRef.current.add).toHaveBeenCalledTimes(2);
            });
        });

        it('does not add inactive focus areas to draw', async () => {
            const mockFocusAreas = [createMockFocusArea({ id: 'fa-1', isActive: true }), createMockFocusArea({ id: 'fa-2', isActive: false })];
            mockedFetchFocusAreas.mockResolvedValue(mockFocusAreas);

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();

            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockDrawRef.current.add).toHaveBeenCalledTimes(1);
            });

            expect(mockDrawRef.current.add).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'fa-1',
                }),
            );
        });

        it('does not add focus areas when map is not ready', async () => {
            const mockFocusAreas = [createMockFocusArea({ id: 'fa-1', isActive: true })];
            mockedFetchFocusAreas.mockResolvedValue(mockFocusAreas);

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();

            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: false,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalled();
            });

            expect(mockDrawRef.current.add).not.toHaveBeenCalled();
        });
    });

    describe('draw event handlers', () => {
        it('registers draw event handlers when map is ready', async () => {
            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();

            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockMap.on).toHaveBeenCalledWith('draw.create', expect.any(Function));
                expect(mockMap.on).toHaveBeenCalledWith('draw.modechange', expect.any(Function));
                expect(mockMap.on).toHaveBeenCalledWith('draw.update', expect.any(Function));
            });
        });

        it('does not register event handlers when map is not ready', () => {
            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();

            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: false,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            expect(mockMap.on).not.toHaveBeenCalled();
        });

        it('unregisters event handlers on cleanup', async () => {
            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();

            const { unmount } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockMap.on).toHaveBeenCalled();
            });

            unmount();

            expect(mockMap.off).toHaveBeenCalledWith('draw.create', expect.any(Function));
            expect(mockMap.off).toHaveBeenCalledWith('draw.modechange', expect.any(Function));
            expect(mockMap.off).toHaveBeenCalledWith('draw.update', expect.any(Function));
        });
    });

    describe('handleDrawCreate', () => {
        it('calls createFocusArea mutation when feature is created', async () => {
            mockedCreateFocusArea.mockResolvedValue(createMockFocusArea({ id: 'new-fa' }));

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            let createHandler: (event: { features: Feature[] }) => void;

            mockMap.on.mockImplementation((event: string, handler: any) => {
                if (event === 'draw.create') {
                    createHandler = handler;
                }
            });

            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockMap.on).toHaveBeenCalledWith('draw.create', expect.any(Function));
            });

            const mockFeature: Feature = {
                type: 'Feature',
                id: 'temp-123',
                properties: {},
                geometry: mockGeometry,
            };

            act(() => {
                createHandler({ features: [mockFeature] });
            });

            await waitFor(() => {
                expect(mockedCreateFocusArea).toHaveBeenCalledWith('scenario-123', {
                    geometry: mockGeometry,
                    isActive: true,
                });
            });
        });

        it('sets isDrawing to false when feature is created', async () => {
            mockedCreateFocusArea.mockResolvedValue(createMockFocusArea({ id: 'new-fa' }));

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            let createHandler: (event: { features: Feature[] }) => void;

            mockMap.on.mockImplementation((event: string, handler: any) => {
                if (event === 'draw.create') {
                    createHandler = handler;
                }
            });

            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockMap.on).toHaveBeenCalled();
            });

            act(() => {
                result.current.startDrawing('polygon');
            });

            expect(result.current.isDrawing).toBe(true);

            const mockFeature: Feature = {
                type: 'Feature',
                id: 'temp-123',
                properties: {},
                geometry: mockGeometry,
            };

            act(() => {
                createHandler({ features: [mockFeature] });
            });

            expect(result.current.isDrawing).toBe(false);
        });

        it('does not call mutation if no scenarioId', async () => {
            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            let createHandler: (event: { features: Feature[] }) => void;

            mockMap.on.mockImplementation((event: string, handler: any) => {
                if (event === 'draw.create') {
                    createHandler = handler;
                }
            });

            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: undefined,
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockMap.on).toHaveBeenCalled();
            });

            const mockFeature: Feature = {
                type: 'Feature',
                id: 'temp-123',
                properties: {},
                geometry: mockGeometry,
            };

            act(() => {
                createHandler({ features: [mockFeature] });
            });

            expect(mockedCreateFocusArea).not.toHaveBeenCalled();
        });
    });

    describe('handleModeChange', () => {
        it('sets isDrawing to false when mode changes to simple_select', async () => {
            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            let modeChangeHandler: () => void;

            mockMap.on.mockImplementation((event: string, handler: any) => {
                if (event === 'draw.modechange') {
                    modeChangeHandler = handler;
                }
            });

            mockDrawRef.current.getMode.mockReturnValue('simple_select');

            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockMap.on).toHaveBeenCalled();
            });

            act(() => {
                result.current.startDrawing('polygon');
            });

            expect(result.current.isDrawing).toBe(true);

            act(() => {
                modeChangeHandler();
            });

            expect(result.current.isDrawing).toBe(false);
        });
    });

    describe('handleDrawUpdate', () => {
        it('calls updateFocusArea mutation when geometry changes', async () => {
            const existingFocusArea = createMockFocusArea({ id: 'fa-1', isActive: true });
            mockedFetchFocusAreas.mockResolvedValue([existingFocusArea]);
            mockedUpdateFocusArea.mockResolvedValue(existingFocusArea);

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            let updateHandler: (event: { features: Feature[] }) => void;

            mockMap.on.mockImplementation((event: string, handler: any) => {
                if (event === 'draw.update') {
                    updateHandler = handler;
                }
            });

            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockDrawRef.current.add).toHaveBeenCalled();
            });

            const newGeometry: Geometry = {
                type: 'Polygon',
                coordinates: [
                    [
                        [-1.5, 50.7],
                        [-1.5, 50.8],
                        [-1.4, 50.8],
                        [-1.4, 50.7],
                        [-1.5, 50.7],
                    ],
                ],
            };

            const updatedFeature: Feature = {
                type: 'Feature',
                id: 'fa-1',
                properties: {},
                geometry: newGeometry,
            };

            act(() => {
                updateHandler({ features: [updatedFeature] });
            });

            await waitFor(() => {
                expect(mockedUpdateFocusArea).toHaveBeenCalledWith('scenario-123', 'fa-1', {
                    geometry: newGeometry,
                });
            });
        });

        it('does not call mutation if geometry has not changed', async () => {
            const existingFocusArea = createMockFocusArea({ id: 'fa-1', isActive: true });
            mockedFetchFocusAreas.mockResolvedValue([existingFocusArea]);

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            let updateHandler: (event: { features: Feature[] }) => void;

            mockMap.on.mockImplementation((event: string, handler: any) => {
                if (event === 'draw.update') {
                    updateHandler = handler;
                }
            });

            renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockDrawRef.current.add).toHaveBeenCalled();
            });

            const sameFeature: Feature = {
                type: 'Feature',
                id: 'fa-1',
                properties: {},
                geometry: mockGeometry,
            };

            act(() => {
                updateHandler({ features: [sameFeature] });
            });

            expect(mockedUpdateFocusArea).not.toHaveBeenCalled();
        });
    });

    describe('scenario change', () => {
        it('clears loaded focus areas when scenario changes', async () => {
            const focusArea1 = createMockFocusArea({ id: 'fa-1', isActive: true });
            const focusArea2 = createMockFocusArea({ id: 'fa-2', isActive: true });

            mockedFetchFocusAreas.mockResolvedValueOnce([focusArea1]).mockResolvedValueOnce([focusArea2]);

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();

            const { rerender } = renderHook(
                ({ scenarioId }) =>
                    useFocusAreas({
                        scenarioId,
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                {
                    wrapper: createWrapper(queryClient),
                    initialProps: { scenarioId: 'scenario-1' },
                },
            );

            await waitFor(() => {
                expect(mockDrawRef.current.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'fa-1' }));
            });

            rerender({ scenarioId: 'scenario-2' });

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalledWith('scenario-2');
            });
        });
    });

    describe('createCircleAtPoint', () => {
        it('creates a circle geometry and calls mutation', async () => {
            mockedCreateFocusArea.mockResolvedValue(createMockFocusArea({ id: 'new-circle' }));

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();

            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.startDrawing('circle');
            });

            expect(result.current.isDrawing).toBe(true);
            expect(result.current.drawingMode).toBe('circle');

            act(() => {
                result.current.createCircleAtPoint([-1.4, 50.67], 5);
            });

            expect(result.current.isDrawing).toBe(false);
            expect(result.current.drawingMode).toBe(null);
            expect(mockDrawRef.current.changeMode).toHaveBeenCalledWith('simple_select');

            await waitFor(() => {
                expect(mockedCreateFocusArea).toHaveBeenCalledWith('scenario-123', {
                    geometry: expect.objectContaining({
                        type: 'Polygon',
                    }),
                    isActive: true,
                });
            });
        });

        it('resets drawing state when called', () => {
            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();

            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            act(() => {
                result.current.startDrawing('circle');
            });

            expect(result.current.isDrawing).toBe(true);
            expect(result.current.drawingMode).toBe('circle');

            act(() => {
                result.current.createCircleAtPoint([-1.4, 50.67], 2.5);
            });

            expect(result.current.isDrawing).toBe(false);
            expect(result.current.drawingMode).toBe(null);
        });
    });

    describe('drawingMode reset', () => {
        it('resets drawingMode to null when draw.create event fires', async () => {
            mockedCreateFocusArea.mockResolvedValue(createMockFocusArea({ id: 'new-fa' }));

            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            let createHandler: (event: { features: Feature[] }) => void;

            mockMap.on.mockImplementation((event: string, handler: any) => {
                if (event === 'draw.create') {
                    createHandler = handler;
                }
            });

            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockMap.on).toHaveBeenCalled();
            });

            act(() => {
                result.current.startDrawing('polygon');
            });

            expect(result.current.drawingMode).toBe('polygon');

            const mockFeature: Feature = {
                type: 'Feature',
                id: 'temp-123',
                properties: {},
                geometry: mockGeometry,
            };

            act(() => {
                createHandler({ features: [mockFeature] });
            });

            expect(result.current.drawingMode).toBe(null);
        });

        it('resets drawingMode to null when mode changes to simple_select', async () => {
            const mockMap = createMockMap();
            const mockDrawRef = createMockDrawRef();
            let modeChangeHandler: () => void;

            mockMap.on.mockImplementation((event: string, handler: any) => {
                if (event === 'draw.modechange') {
                    modeChangeHandler = handler;
                }
            });

            mockDrawRef.current.getMode.mockReturnValue('simple_select');

            const { result } = renderHook(
                () =>
                    useFocusAreas({
                        scenarioId: 'scenario-123',
                        mapRef: createMockMapRef(mockMap) as any,
                        drawRef: mockDrawRef as any,
                        mapReady: true,
                    }),
                { wrapper: createWrapper(queryClient) },
            );

            await waitFor(() => {
                expect(mockMap.on).toHaveBeenCalled();
            });

            act(() => {
                result.current.startDrawing('circle');
            });

            expect(result.current.drawingMode).toBe('circle');

            act(() => {
                modeChangeHandler();
            });

            expect(result.current.drawingMode).toBe(null);
        });
    });
});
