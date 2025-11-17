import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { MapRef } from 'react-map-gl/maplibre';
import useMapboxDraw from './useMapboxDraw';

const mockAddControl = vi.fn();
const mockMap = {
    addControl: mockAddControl,
};

const mockMapRef = {
    current: {
        getMap: () => mockMap,
    } as MapRef,
};

vi.mock('@mapbox/mapbox-gl-draw', () => {
    class MockMapboxDraw {
        changeMode = vi.fn();
        getMode = vi.fn();
        static modes = {};
        constructor() {
            // Constructor implementation
        }
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
        const { result } = renderHook(() => useMapboxDraw(mockMapRef, false));

        expect(result.current).toBeDefined();
        expect(result.current.current).toBeNull();
    });

    it('does not initialize draw when map is not ready', () => {
        renderHook(() => useMapboxDraw(mockMapRef, false));

        expect(mockAddControl).not.toHaveBeenCalled();
    });

    it('does not initialize draw when mapRef is null', () => {
        const nullMapRef = { current: null };
        renderHook(() => useMapboxDraw(nullMapRef, true));

        expect(mockAddControl).not.toHaveBeenCalled();
    });

    it('initializes draw when map is ready', async () => {
        const { result } = renderHook(() => useMapboxDraw(mockMapRef, true));

        await waitFor(() => {
            expect(mockAddControl).toHaveBeenCalled();
        });

        expect(result.current.current).not.toBeNull();
    });

    it('does not reinitialize draw if already initialized', async () => {
        const { result, rerender } = renderHook(({ isReady }) => useMapboxDraw(mockMapRef, isReady), {
            initialProps: { isReady: true },
        });

        await waitFor(() => {
            expect(mockAddControl).toHaveBeenCalledTimes(1);
        });

        const firstDrawInstance = result.current.current;

        rerender({ isReady: true });

        await waitFor(() => {
            expect(mockAddControl).toHaveBeenCalledTimes(1);
        });

        expect(result.current.current).toBe(firstDrawInstance);
    });
});
