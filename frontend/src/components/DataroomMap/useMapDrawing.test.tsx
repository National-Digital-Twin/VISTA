// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useMapDrawing from './useMapDrawing';
import useMapboxDraw from '@/components/map-v2/hooks/useMapboxDraw';

vi.mock('@/components/map-v2/hooks/useMapboxDraw', () => ({
    default: vi.fn(),
}));

const mockedUseMapboxDraw = vi.mocked(useMapboxDraw);

describe('useMapDrawing', () => {
    beforeEach(() => {
        mockedUseMapboxDraw.mockReset();
    });

    it('starts and clears drawing modes via drawRef', () => {
        const drawRef = {
            current: {
                deleteAll: vi.fn(),
                changeMode: vi.fn(),
            },
        } as any;

        mockedUseMapboxDraw.mockReturnValue(drawRef);

        const mapRef = createRef<any>();
        mapRef.current = { getMap: () => null };

        const { result } = renderHook(() =>
            useMapDrawing({
                mapRef,
                mapReady: true,
            }),
        );

        act(() => {
            result.current.startDrawing();
        });
        expect(drawRef.current.deleteAll).toHaveBeenCalled();
        expect(drawRef.current.changeMode).toHaveBeenCalledWith('draw_polygon');
        expect(result.current.isDrawing).toBe(true);

        act(() => {
            result.current.clearDrawing();
        });
        expect(drawRef.current.changeMode).toHaveBeenCalledWith('simple_select');
        expect(result.current.isDrawing).toBe(false);
    });

    it('stops drawing on Escape key', () => {
        const drawRef = {
            current: {
                deleteAll: vi.fn(),
                changeMode: vi.fn(),
            },
        } as any;
        mockedUseMapboxDraw.mockReturnValue(drawRef);

        const mapRef = createRef<any>();
        mapRef.current = { getMap: () => null };

        const { result } = renderHook(() =>
            useMapDrawing({
                mapRef,
                mapReady: true,
            }),
        );

        act(() => {
            result.current.startDrawing();
        });
        expect(result.current.isDrawing).toBe(true);

        act(() => {
            globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });

        expect(drawRef.current.changeMode).toHaveBeenCalledWith('simple_select');
        expect(result.current.isDrawing).toBe(false);
    });

    it('registers map draw listeners and calls onDrawComplete', () => {
        const handlers: Record<string, (event: any) => void> = {};
        const map = {
            on: vi.fn((event: string, handler: (event: any) => void) => {
                handlers[event] = handler;
            }),
            off: vi.fn(),
        };
        const mapRef = createRef<any>();
        mapRef.current = {
            getMap: () => map,
        };

        const drawRef = {
            current: {
                deleteAll: vi.fn(),
                changeMode: vi.fn(),
            },
        } as any;
        let drawOptions: any;
        mockedUseMapboxDraw.mockImplementation((options: any) => {
            drawOptions = options;
            return drawRef;
        });

        const onDrawComplete = vi.fn();
        const { result, unmount } = renderHook(() =>
            useMapDrawing({
                mapRef,
                mapReady: true,
                onDrawComplete,
            }),
        );

        act(() => {
            drawOptions.onDrawReady(true);
        });
        expect(map.on).toHaveBeenCalledWith('draw.create', expect.any(Function));
        expect(map.on).toHaveBeenCalledWith('draw.update', expect.any(Function));
        expect(map.on).toHaveBeenCalledWith('draw.modechange', expect.any(Function));

        act(() => {
            result.current.startDrawing();
        });
        expect(result.current.isDrawing).toBe(true);

        act(() => {
            handlers['draw.create']({
                features: [
                    {
                        geometry: { type: 'Polygon', coordinates: [] },
                    },
                ],
            });
        });
        expect(onDrawComplete).toHaveBeenCalledWith({ type: 'Polygon', coordinates: [] });
        expect(result.current.isDrawing).toBe(false);

        act(() => {
            handlers['draw.update']({
                features: [
                    {
                        geometry: { type: 'Point', coordinates: [1, 2] },
                    },
                ],
            });
        });
        expect(onDrawComplete).toHaveBeenCalledWith({ type: 'Point', coordinates: [1, 2] });

        act(() => {
            handlers['draw.modechange']({ mode: 'simple_select' });
        });
        expect(result.current.isDrawing).toBe(false);

        unmount();
        expect(map.off).toHaveBeenCalledWith('draw.create', expect.any(Function));
        expect(map.off).toHaveBeenCalledWith('draw.update', expect.any(Function));
        expect(map.off).toHaveBeenCalledWith('draw.modechange', expect.any(Function));
    });
});
