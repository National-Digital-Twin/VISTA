import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createMockMap, mockAssets, mockDependencies } from '../test-utils/test-helpers';
import useMapInteractions from './useMapInteractions';
import { findElement } from '@/utils';
import { isEmpty } from '@/utils/isEmpty';

vi.mock('@/utils', () => ({
    findElement: vi.fn(),
}));

vi.mock('@/utils/isEmpty', () => ({
    isEmpty: vi.fn(),
}));

vi.mock('@/components/Map/layers', () => ({
    FLOOD_AREA_POLYGON_ID: 'flood-area-polygon',
    FLOOD_AREA_POLYGON_OUTLINE_ID: 'flood-area-polygon-outline',
    LINEAR_ASSET_LAYER: { id: 'linear-asset-layer' },
    pointAssetCxnLayer: { id: 'point-asset-layer' },
}));

describe('useMapInteractions', () => {
    let mockFindElement: any;
    let mockIsEmpty: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockFindElement = vi.mocked(findElement);
        mockIsEmpty = vi.mocked(isEmpty);
    });

    describe('initialization', () => {
        it('returns interactive layers and handlers', () => {
            const mockMap = createMockMap();
            const mockOnElementClick = vi.fn();

            const { result } = renderHook(() =>
                useMapInteractions({
                    map: mockMap,
                    assets: mockAssets,
                    dependencies: mockDependencies,
                    onElementClick: mockOnElementClick,
                }),
            );

            expect(result.current.interactiveLayers).toEqual(['point-asset-layer', 'linear-asset-layer', 'flood-area-polygon']);
            expect(result.current.selectedFloodZones).toEqual([]);
            expect(typeof result.current.handleOnClick).toBe('function');
        });
    });

    describe('handleOnClick', () => {
        it('handles flood zone clicks', () => {
            const mockMap = createMockMap();
            const mockOnElementClick = vi.fn();

            const { result } = renderHook(() =>
                useMapInteractions({
                    map: mockMap,
                    assets: mockAssets,
                    dependencies: mockDependencies,
                    onElementClick: mockOnElementClick,
                }),
            );

            const mockEvent = {
                originalEvent: { stopPropagation: vi.fn(), shiftKey: false },
                features: [
                    {
                        id: 'flood1',
                        properties: { layer: { id: 'flood-area-polygon' } },
                    },
                ],
            };

            result.current.handleOnClick(mockEvent);

            expect(mockEvent.originalEvent.stopPropagation).toHaveBeenCalled();
        });

        it('handles other element clicks', () => {
            const mockMap = createMockMap();
            const mockOnElementClick = vi.fn();

            mockFindElement.mockReturnValue({ uri: 'foundElement' });

            const { result } = renderHook(() =>
                useMapInteractions({
                    map: mockMap,
                    assets: mockAssets,
                    dependencies: mockDependencies,
                    onElementClick: mockOnElementClick,
                }),
            );

            const mockEvent = {
                originalEvent: { stopPropagation: vi.fn(), shiftKey: false },
                features: [
                    {
                        id: 'point1',
                        properties: {
                            layer: { id: 'point-asset-layer' },
                            uri: 'asset1',
                        },
                    },
                ],
            };

            result.current.handleOnClick(mockEvent);

            expect(mockFindElement).toHaveBeenCalledWith([...mockAssets, ...mockDependencies], 'asset1');
            expect(mockOnElementClick).toHaveBeenCalledWith(false, [{ uri: 'foundElement' }]);
        });

        it('handles empty features', () => {
            const mockMap = createMockMap();
            const mockOnElementClick = vi.fn();

            mockIsEmpty.mockReturnValue(true);

            const { result } = renderHook(() =>
                useMapInteractions({
                    map: mockMap,
                    assets: mockAssets,
                    dependencies: mockDependencies,
                    onElementClick: mockOnElementClick,
                }),
            );

            const mockEvent = {
                originalEvent: { stopPropagation: vi.fn(), shiftKey: false },
                features: [],
            };

            result.current.handleOnClick(mockEvent);

            expect(mockOnElementClick).toHaveBeenCalledWith(false, []);
        });

        it('handles multi-select with shift key', () => {
            const mockMap = createMockMap();
            const mockOnElementClick = vi.fn();

            mockFindElement.mockReturnValue({ uri: 'foundElement' });

            const { result } = renderHook(() =>
                useMapInteractions({
                    map: mockMap,
                    assets: mockAssets,
                    dependencies: mockDependencies,
                    onElementClick: mockOnElementClick,
                }),
            );

            const mockEvent = {
                originalEvent: { stopPropagation: vi.fn(), shiftKey: true },
                features: [
                    {
                        id: 'point1',
                        properties: {
                            layer: { id: 'point-asset-layer' },
                            uri: 'asset1',
                        },
                    },
                ],
            };

            result.current.handleOnClick(mockEvent);

            expect(mockOnElementClick).toHaveBeenCalledWith(true, [{ uri: 'foundElement' }]);
        });
    });
});
