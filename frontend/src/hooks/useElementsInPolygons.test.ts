import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useElementsInPolygons from './useElementsInPolygons';
import { isEmpty } from '@/utils/isEmpty';
import { findElement, getUniqueElements } from '@/utils';

vi.mock('mapbox-gl-draw-geodesic', () => ({
    isCircle: vi.fn(),
    getCircleCenter: vi.fn(),
}));

vi.mock('@/utils/isEmpty', () => ({
    isEmpty: vi.fn(),
}));

vi.mock('@/utils', () => ({
    findElement: vi.fn(),
    getUniqueElements: vi.fn(),
}));

describe('useElementsInPolygons', () => {
    let mockIsEmpty: any;
    let mockFindElement: any;
    let mockGetUniqueElements: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockIsEmpty = vi.mocked(isEmpty);
        mockFindElement = vi.mocked(findElement);
        mockGetUniqueElements = vi.mocked(getUniqueElements);
    });

    describe('findElementsInPolygons', () => {
        it('handles empty polygons', () => {
            const mockTarget = {
                getSource: vi.fn().mockReturnValue({
                    _data: { features: [] },
                }),
            };

            mockIsEmpty.mockReturnValue(true);
            mockGetUniqueElements.mockReturnValue([]);

            const { result } = renderHook(() => useElementsInPolygons());

            const elements = result.current.findElementsInPolygons({
                target: mockTarget,
                polygons: [],
                assets: [],
                dependencies: [],
            });

            expect(elements).toEqual([]);
        });

        it('handles missing target sources', () => {
            const mockTarget = {
                getSource: vi.fn().mockReturnValue({
                    _data: { features: [] },
                }),
            };

            mockIsEmpty.mockReturnValue(false);
            mockFindElement.mockReturnValue(null);
            mockGetUniqueElements.mockReturnValue([]);

            const { result } = renderHook(() => useElementsInPolygons());

            const elements = result.current.findElementsInPolygons({
                target: mockTarget,
                polygons: [
                    {
                        type: 'Feature',
                        geometry: {
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
                        },
                        properties: {},
                    },
                ],
                assets: [],
                dependencies: [],
            });

            expect(elements).toEqual([]);
        });
    });
});
