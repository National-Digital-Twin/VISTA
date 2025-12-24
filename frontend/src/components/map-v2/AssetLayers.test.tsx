import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetLayers from './AssetLayers';
import theme from '@/theme';
import type { Asset } from '@/api/assets-by-type';

const mockUseMap = vi.fn();
vi.mock('react-map-gl/maplibre', () => ({
    useMap: () => mockUseMap(),
    Source: ({ children }: { children: React.ReactNode }) => <div data-testid="source">{children}</div>,
    Layer: ({ id }: { id: string }) => <div data-testid="layer" data-layer-id={id} />,
}));

vi.mock('./hooks/usePreloadAssetIcons', () => ({
    isIconPreloaded: vi.fn(() => true),
}));

vi.mock('@/hooks/useFindIcon', () => ({
    default: vi.fn(() => ({
        backgroundColor: '#000000',
        color: '#ffffff',
        iconFallbackText: 'A',
    })),
}));

vi.mock('@/utils', () => ({
    findElement: vi.fn((elements, id) => elements.find((el: Asset) => el.id === id)),
}));

const mockCanvasContext = {
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(100) })),
    drawImage: vi.fn(),
};

let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
let originalImage: typeof Image;

beforeAll(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    originalImage = globalThis.Image;

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    globalThis.Image = class {
        onload: () => void = () => {};
        src: string = '';
        constructor() {
            setTimeout(() => this.onload(), 0);
        }
    } as unknown as typeof Image;
});

afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    globalThis.Image = originalImage;
});

describe('AssetLayers', () => {
    const mockMapInstance = {
        on: vi.fn(),
        off: vi.fn(),
        queryRenderedFeatures: vi.fn(() => []),
        getLayer: vi.fn(() => true),
        getCanvas: vi.fn(() => ({ style: {} })),
        hasImage: vi.fn(() => false),
        addImage: vi.fn(),
        project: vi.fn(() => ({ x: 100, y: 100 })),
    };

    const mockMap = {
        getMap: vi.fn(() => mockMapInstance),
    };

    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        vi.clearAllMocks();

        mockUseMap.mockReturnValue({
            'map-v2': mockMap,
        } as any);
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>,
        );
    };

    const mockAsset: Asset = {
        id: 'asset1',
        type: '35a910f3-f611-4096-ac0b-0928c5612e32',
        lng: 0.5,
        lat: 0.5,
        geometry: {
            type: 'Point',
            coordinates: [0.5, 0.5],
        },
        styles: {
            alt: 'Hospital',
            backgroundColor: '#000000',
            color: '#ffffff',
            iconFallbackText: 'H',
        },
        dependent: { criticalitySum: 0 },
        elementType: 'asset' as const,
    } as Asset;

    const defaultProps = {
        assets: [] as Asset[],
        mapReady: true,
    };

    const renderWithAsset = (overrides?: Partial<React.ComponentProps<typeof AssetLayers>>) => {
        return renderWithProviders(<AssetLayers {...defaultProps} assets={[mockAsset]} {...overrides} />);
    };

    describe('Rendering', () => {
        it('returns null when map is not ready', () => {
            const { container } = renderWithProviders(<AssetLayers {...defaultProps} mapReady={false} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when there are no point features', () => {
            const { container } = renderWithProviders(<AssetLayers {...defaultProps} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders Source and Layer when map is ready and assets exist', () => {
            renderWithAsset();
            expect(screen.getByTestId('source')).toBeInTheDocument();
            expect(screen.getAllByTestId('layer').length).toBeGreaterThan(0);
        });

        it('renders three layers: unselected symbols, selection ring, and selected symbols', () => {
            renderWithAsset();
            const layers = screen.getAllByTestId('layer');
            expect(layers.length).toBe(3);

            const layerIds = layers.map((layer) => layer.dataset.layerId);
            expect(layerIds).toContain('map-v2-asset-symbol-layer');
            expect(layerIds).toContain('map-v2-asset-selection-ring-layer');
            expect(layerIds).toContain('map-v2-asset-symbol-layer-selected');
        });

        it('renders layers in correct order for z-index stacking', () => {
            renderWithAsset();
            const layers = screen.getAllByTestId('layer');
            const layerIds = layers.map((layer) => layer.dataset.layerId);

            // Order matters: unselected icons, then selection ring, then selected icon on top
            expect(layerIds[0]).toBe('map-v2-asset-symbol-layer');
            expect(layerIds[1]).toBe('map-v2-asset-selection-ring-layer');
            expect(layerIds[2]).toBe('map-v2-asset-symbol-layer-selected');
        });
    });

    describe('Multiple Assets', () => {
        it('renders single source for multiple assets', () => {
            const asset1 = {
                ...mockAsset,
                id: 'asset1',
                lng: 0.5,
                lat: 0.5,
            } as Asset;
            const asset2 = {
                ...mockAsset,
                id: 'asset2',
                lng: 0.6,
                lat: 0.6,
            } as Asset;

            renderWithProviders(<AssetLayers {...defaultProps} assets={[asset1, asset2]} />);

            // Should render one source containing all assets
            expect(screen.getAllByTestId('source').length).toBe(1);
            // Should still have three layers regardless of asset count
            expect(screen.getAllByTestId('layer').length).toBe(3);
        });

        it('handles assets with different styles', () => {
            const asset1 = {
                ...mockAsset,
                id: 'asset1',
                styles: { ...mockAsset.styles, backgroundColor: '#ff0000' },
            } as Asset;
            const asset2 = {
                ...mockAsset,
                id: 'asset2',
                styles: { ...mockAsset.styles, backgroundColor: '#00ff00' },
            } as Asset;

            renderWithProviders(<AssetLayers {...defaultProps} assets={[asset1, asset2]} />);

            expect(screen.getByTestId('source')).toBeInTheDocument();
            expect(screen.getAllByTestId('layer').length).toBe(3);
        });
    });

    describe('Selected Elements', () => {
        it('renders selection ring layer for selected assets', () => {
            const selectedElement: Asset = {
                id: mockAsset.id,
                type: mockAsset.type,
                elementType: 'asset',
            } as Asset;

            renderWithAsset({ selectedElements: [selectedElement] });

            const layers = screen.getAllByTestId('layer');
            const layerIds = layers.map((layer) => layer.dataset.layerId);

            // Selection ring layer should be present
            expect(layerIds).toContain('map-v2-asset-selection-ring-layer');
            // Selected symbol layer should be present (renders selected asset on top)
            expect(layerIds).toContain('map-v2-asset-symbol-layer-selected');
        });

        it('handles empty selected elements', () => {
            renderWithAsset({ selectedElements: [] });

            expect(screen.getByTestId('source')).toBeInTheDocument();
            // Still renders all three layers, just with filters applied
            expect(screen.getAllByTestId('layer').length).toBe(3);
        });

        it('renders selected asset above unselected assets', () => {
            const asset1 = { ...mockAsset, id: 'asset1' } as Asset;
            const asset2 = { ...mockAsset, id: 'asset2' } as Asset;
            const selectedElement = { id: 'asset1', type: mockAsset.type, elementType: 'asset' } as Asset;

            renderWithProviders(<AssetLayers {...defaultProps} assets={[asset1, asset2]} selectedElements={[selectedElement]} />);

            const layers = screen.getAllByTestId('layer');
            const layerIds = layers.map((layer) => layer.dataset.layerId);

            // Verify layer order: unselected first, then ring, then selected on top
            const unselectedIndex = layerIds.indexOf('map-v2-asset-symbol-layer');
            const ringIndex = layerIds.indexOf('map-v2-asset-selection-ring-layer');
            const selectedIndex = layerIds.indexOf('map-v2-asset-symbol-layer-selected');

            expect(unselectedIndex).toBeLessThan(ringIndex);
            expect(ringIndex).toBeLessThan(selectedIndex);
        });
    });

    describe('Map Click Handling', () => {
        const waitForEffect = () =>
            new Promise((resolve) => {
                setTimeout(resolve, 10);
            });

        it('sets up map click handler when map is ready', async () => {
            renderWithAsset({ mapReady: true });
            expect(screen.getByTestId('source')).toBeInTheDocument();
            await waitForEffect();
            expect(mockMapInstance.on).toHaveBeenCalledWith('click', 'map-v2-asset-symbol-layer', expect.any(Function));
        });

        it('does not set up click handler when map is not ready', () => {
            renderWithAsset({ mapReady: false });
            expect(screen.queryByTestId('source')).not.toBeInTheDocument();
            expect(mockMapInstance.on).not.toHaveBeenCalled();
        });

        it('cleans up click handler on unmount', async () => {
            const { unmount } = renderWithAsset({ mapReady: true });
            await waitForEffect();
            expect(mockMapInstance.on).toHaveBeenCalled();
            unmount();
            expect(mockMapInstance.off).toHaveBeenCalledWith('click', 'map-v2-asset-symbol-layer', expect.any(Function));
        });
    });

    describe('Edge Cases', () => {
        it('handles assets without coordinates', () => {
            const assetWithoutCoords = {
                ...mockAsset,
                lng: undefined,
                lat: undefined,
            } as Asset;

            const { container } = renderWithProviders(<AssetLayers {...defaultProps} assets={[assetWithoutCoords]} />);
            expect(container.firstChild).toBeNull();
        });

        it('handles duplicate IDs by deduplicating', () => {
            const asset1 = { ...mockAsset, id: 'same-id' } as Asset;
            const asset2 = { ...mockAsset, id: 'same-id', type: mockAsset.type } as Asset;

            renderWithProviders(<AssetLayers {...defaultProps} assets={[asset1, asset2]} />);

            expect(screen.getByTestId('source')).toBeInTheDocument();
        });

        it('handles empty assets array', () => {
            const { container } = renderWithProviders(<AssetLayers {...defaultProps} assets={[]} />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('CPS Icons', () => {
        it('generates CPS marker when showCpsIcons is true', async () => {
            renderWithAsset({ showCpsIcons: true, mapReady: true });
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 50);
            });

            expect(mockMapInstance.addImage).toHaveBeenCalledWith(
                'cps-marker',
                expect.objectContaining({
                    width: expect.any(Number),
                    height: expect.any(Number),
                    data: expect.any(Uint8ClampedArray),
                }),
                { pixelRatio: 1 },
            );
        });

        it('uses CPS marker for all assets when showCpsIcons is true', () => {
            const assets = [mockAsset, { ...mockAsset, id: 'asset2' }] as Asset[];
            renderWithAsset({ assets, showCpsIcons: true, mapReady: true });

            expect(screen.getByTestId('source')).toBeInTheDocument();
        });
    });
});
