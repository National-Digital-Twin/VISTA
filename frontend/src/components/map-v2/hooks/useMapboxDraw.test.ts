import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { MapRef } from 'react-map-gl/maplibre';
import useMapboxDraw from './useMapboxDraw';

const mockAddControl = vi.fn();
const mockRemoveControl = vi.fn();
const mockDrawAdd = vi.fn();
const mockDrawGetAll = vi.fn(() => ({
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: {},
        },
    ],
}));
const mockMap = {
    addControl: mockAddControl,
    removeControl: mockRemoveControl,
};

const mockMapRef = {
    current: {
        getMap: () => mockMap,
    } as unknown as MapRef,
};

vi.mock('@mapbox/mapbox-gl-draw', () => {
    class MockMapboxDraw {
        changeMode = vi.fn();
        getMode = vi.fn();
        set = vi.fn();
        add = mockDrawAdd;
        getAll = mockDrawGetAll;
        static modes = {};
        constructor() {}
    }
    return {
        default: MockMapboxDraw,
        modes: {},
    };
});

vi.mock('@/vendor/mapbox-gl-draw-circle', () => ({
    CircleMode: {},
    DragCircleMode: {},
}));

describe('useMapboxDraw', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns a ref', () => {
        const { result } = renderHook(() => useMapboxDraw({ mapRef: mockMapRef, isReady: false }));

        expect(result.current).toBeDefined();
        expect(result.current.current).toBeNull();
    });

    it('does not initialize draw when map is not ready', () => {
        renderHook(() => useMapboxDraw({ mapRef: mockMapRef, isReady: false }));

        expect(mockAddControl).not.toHaveBeenCalled();
    });

    it('does not initialize draw when mapRef is null', () => {
        const nullMapRef = { current: null };
        renderHook(() => useMapboxDraw({ mapRef: nullMapRef, isReady: true }));

        expect(mockAddControl).not.toHaveBeenCalled();
    });

    it('initializes draw when map is ready', async () => {
        const { result } = renderHook(() => useMapboxDraw({ mapRef: mockMapRef, isReady: true }));

        await waitFor(() => {
            expect(mockAddControl).toHaveBeenCalled();
        });

        expect(result.current.current).not.toBeNull();
    });

    it('creates draw control only once even when rerendering', async () => {
        const { result, rerender } = renderHook<ReturnType<typeof useMapboxDraw>, { isReady: boolean }>(
            ({ isReady }) => useMapboxDraw({ mapRef: mockMapRef, isReady }),
            {
                initialProps: { isReady: true },
            },
        );

        await waitFor(() => {
            expect(mockAddControl).toHaveBeenCalledTimes(1);
        });

        const firstDrawInstance = result.current.current;

        // Rerender - should NOT recreate draw control
        rerender({ isReady: true });

        // Still only 1 call - draw control is stable
        expect(mockAddControl).toHaveBeenCalledTimes(1);
        expect(result.current.current).toBe(firstDrawInstance);
    });

    it('calls onDrawReady when draw control is created', async () => {
        const onDrawReady = vi.fn();

        renderHook(() => useMapboxDraw({ mapRef: mockMapRef, isReady: true, onDrawReady }));

        await waitFor(() => {
            expect(onDrawReady).toHaveBeenCalledWith(true);
        });
    });
});
