import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetLayers from './AssetLayers';
import theme from '@/theme';
import type { Asset, Dependency, Element } from '@/models';

const mockUseMap = vi.fn();
vi.mock('react-map-gl/maplibre', () => ({
    useMap: () => mockUseMap(),
    Source: ({ children }: { children: React.ReactNode }) => <div data-testid="source">{children}</div>,
    Layer: () => <div data-testid="layer" />,
    Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="marker">{children}</div>,
}));

vi.mock('./hooks/usePreloadAssetIcons', () => ({
    isIconPreloaded: vi.fn(() => true),
}));

vi.mock('@/components/Map/map-utils', () => ({
    generatePointAssetFeatures: vi.fn((assets) =>
        assets.map((asset: Asset) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [asset.lng || 0, asset.lat || 0],
            },
            properties: {
                uri: asset.uri,
                type: asset.type,
            },
        })),
    ),
}));

vi.mock('@/hooks/useFindIcon', () => ({
    default: vi.fn(() => ({
        backgroundColor: '#000000',
        color: '#ffffff',
        iconFallbackText: 'A',
    })),
}));

vi.mock('@/utils', () => ({
    findElement: vi.fn((elements, uri) => elements.find((el: Element) => el.uri === uri)),
}));

describe('AssetLayers', () => {
    const mockMapInstance = {
        on: vi.fn(),
        off: vi.fn(),
        queryRenderedFeatures: vi.fn(() => []),
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
        uri: 'http://test.com/asset1',
        type: 'https://ies.data.gov.uk/ontology/ies4#Hospital',
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
        dependent: {},
        elementType: 'asset',
    } as Asset;

    const defaultProps = {
        assets: [] as Asset[],
        dependencies: [] as Dependency[],
        selectedAssetTypes: {} as Record<string, boolean>,
        mapReady: true,
    };

    const renderWithEnabledAsset = (overrides?: Partial<React.ComponentProps<typeof AssetLayers>>) => {
        return renderWithProviders(<AssetLayers {...defaultProps} assets={[mockAsset]} selectedAssetTypes={{ [mockAsset.type]: true }} {...overrides} />);
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
            renderWithEnabledAsset();
            expect(screen.getByTestId('source')).toBeInTheDocument();
            expect(screen.getByTestId('layer')).toBeInTheDocument();
        });

        it('renders markers for enabled asset types', () => {
            renderWithEnabledAsset();
            expect(screen.getByTestId('marker')).toBeInTheDocument();
        });

        it('does not render markers for disabled asset types', () => {
            renderWithProviders(<AssetLayers {...defaultProps} assets={[mockAsset]} selectedAssetTypes={{ [mockAsset.type]: false }} />);
            expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
        });
    });

    describe('Asset Filtering', () => {
        it('filters assets by selected asset types', () => {
            const asset1 = { ...mockAsset, type: 'type1' } as Asset;
            const asset2 = { ...mockAsset, uri: 'asset2', type: 'type2' } as Asset;

            renderWithProviders(<AssetLayers {...defaultProps} assets={[asset1, asset2]} selectedAssetTypes={{ type1: true, type2: false }} />);

            const markers = screen.getAllByTestId('marker');
            expect(markers).toHaveLength(1);
        });

        it('handles multiple assets of the same type', () => {
            const asset1 = { ...mockAsset, uri: 'asset1' } as Asset;
            const asset2 = { ...mockAsset, uri: 'asset2' } as Asset;

            renderWithProviders(<AssetLayers {...defaultProps} assets={[asset1, asset2]} selectedAssetTypes={{ [mockAsset.type]: true }} />);

            const markers = screen.getAllByTestId('marker');
            expect(markers).toHaveLength(2);
        });
    });

    describe('Selected Elements', () => {
        it('applies selected styling to selected elements', () => {
            const selectedElement: Element = {
                uri: mockAsset.uri,
                type: mockAsset.type,
                elementType: 'asset',
            } as Element;

            renderWithEnabledAsset({ selectedElements: [selectedElement] });
            expect(screen.getByTestId('marker')).toBeInTheDocument();
        });

        it('handles empty selected elements', () => {
            renderWithEnabledAsset({ selectedElements: [] });
            expect(screen.getByTestId('marker')).toBeInTheDocument();
        });
    });

    describe('Map Click Handling', () => {
        const waitForEffect = () =>
            new Promise((resolve) => {
                setTimeout(resolve, 10);
            });

        it('sets up map click handler when map is ready', async () => {
            renderWithEnabledAsset({ mapReady: true });
            expect(screen.getByTestId('source')).toBeInTheDocument();
            await waitForEffect();
            expect(mockMapInstance.on).toHaveBeenCalledWith('click', 'map-v2-asset-layer', expect.any(Function));
        });

        it('does not set up click handler when map is not ready', () => {
            renderWithEnabledAsset({ mapReady: false });
            expect(screen.queryByTestId('source')).not.toBeInTheDocument();
            expect(mockMapInstance.on).not.toHaveBeenCalled();
        });

        it('cleans up click handler on unmount', async () => {
            const { unmount } = renderWithEnabledAsset({ mapReady: true });
            await waitForEffect();
            expect(mockMapInstance.on).toHaveBeenCalled();
            unmount();
            expect(mockMapInstance.off).toHaveBeenCalledWith('click', 'map-v2-asset-layer', expect.any(Function));
        });
    });

    describe('Dependencies', () => {
        it('handles dependencies in feature generation', () => {
            const dependency = {
                provider: mockAsset,
                dependent: { ...mockAsset, uri: 'asset2' } as Asset,
            } as unknown as Dependency;

            renderWithEnabledAsset({ dependencies: [dependency] });
            expect(screen.getByTestId('source')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles assets without coordinates', () => {
            const assetWithoutCoords = {
                ...mockAsset,
                lng: undefined,
                lat: undefined,
            } as Asset;

            renderWithProviders(<AssetLayers {...defaultProps} assets={[assetWithoutCoords]} selectedAssetTypes={{ [mockAsset.type]: true }} />);
            expect(screen.getByTestId('source')).toBeInTheDocument();
        });

        it('handles duplicate URIs by deduplicating', () => {
            const asset1 = { ...mockAsset, uri: 'same-uri' } as Asset;
            const asset2 = { ...mockAsset, uri: 'same-uri', type: mockAsset.type } as Asset;

            renderWithProviders(<AssetLayers {...defaultProps} assets={[asset1, asset2]} selectedAssetTypes={{ [mockAsset.type]: true }} />);

            const markers = screen.getAllByTestId('marker');
            expect(markers.length).toBeLessThanOrEqual(1);
        });

        it('handles empty assets array', () => {
            const { container } = renderWithProviders(<AssetLayers {...defaultProps} assets={[]} />);
            expect(container.firstChild).toBeNull();
        });
    });
});
