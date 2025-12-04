import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetInfoPanel from './AssetInfoPanel';
import type { Asset } from '@/api/assets-by-type';
import theme from '@/theme';
import type { AssetCategory } from '@/api/asset-categories';

const createTestQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
};

const renderWithProviders = (component: React.ReactElement) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>{component}</ThemeProvider>
        </QueryClientProvider>,
    );
};

describe('AssetInfoPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockAsset = (overrides = {}): Asset => {
        return {
            id: 'asset1',
            type: '35a910f3-f611-4096-ac0b-0928c5612e32',
            name: 'Test Asset 1',
            lat: 51.5074,
            lng: -0.1278,
            geometry: { type: 'Point', coordinates: [-0.1278, 51.5074] },
            dependent: { criticalitySum: 5 },
            styles: {
                backgroundColor: '#000000',
                color: '#ffffff',
                faIcon: '',
                iconFallbackText: 'A',
            },
            state: 'Static' as const,
            elementType: 'asset' as const,
            ...overrides,
        } as unknown as Asset;
    };

    const mockAssetCategories: AssetCategory[] = [
        {
            id: 'cat1',
            name: 'Healthcare',
            subCategories: [
                {
                    id: 'subcat1',
                    name: 'Healthcare Facilities',
                    assetTypes: [
                        {
                            id: '35a910f3-f611-4096-ac0b-0928c5612e32',
                            name: 'Hospital',
                        },
                    ],
                },
            ],
        },
    ];

    describe('Rendering', () => {
        it('does not render when open is false', () => {
            renderWithProviders(<AssetInfoPanel open={false} assets={[]} />);

            expect(screen.queryByText('Asset Information')).not.toBeInTheDocument();
        });

        it('renders title when open', () => {
            renderWithProviders(<AssetInfoPanel open={true} assets={[]} />);

            expect(screen.getByText('Asset Information')).toBeInTheDocument();
        });

        it('displays empty state message when no assets', () => {
            renderWithProviders(<AssetInfoPanel open={true} assets={[]} />);

            expect(screen.getByText(/No assets are currently displayed/i)).toBeInTheDocument();
        });

        it('displays asset table when assets are provided', () => {
            const assets = [createMockAsset()];
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            expect(screen.getByText('Asset ID')).toBeInTheDocument();
            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByText('Type')).toBeInTheDocument();
            expect(screen.getByText('Longitude')).toBeInTheDocument();
            expect(screen.getByText('Latitude')).toBeInTheDocument();
        });
    });

    describe('Asset Table', () => {
        it('displays asset data correctly', () => {
            const assets = [createMockAsset()];
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            expect(screen.getByText('asset1')).toBeInTheDocument();
            expect(screen.getByText('Test Asset 1')).toBeInTheDocument();
            expect(screen.getByText('Hospital')).toBeInTheDocument();
            expect(screen.getByText('-0.127800')).toBeInTheDocument();
            expect(screen.getByText('51.507400')).toBeInTheDocument();
        });

        it('displays multiple assets', () => {
            const assets = [createMockAsset({ id: 'asset1', name: 'Asset 1' }), createMockAsset({ id: 'asset2', name: 'Asset 2', lat: 52, lng: -1 })];
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            expect(screen.getByText('Asset 1')).toBeInTheDocument();
            expect(screen.getByText('Asset 2')).toBeInTheDocument();
        });

        it('displays "N/A" for missing asset name', () => {
            const assets = [createMockAsset({ name: undefined })];
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            expect(screen.getByText('N/A')).toBeInTheDocument();
        });

        it('displays "N/A" for missing coordinates', () => {
            const assets = [createMockAsset({ lat: undefined, lng: undefined })];
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            const naElements = screen.getAllByText('N/A');
            expect(naElements.length).toBeGreaterThan(0);
        });

        it('displays "Unknown" for type when assetCategories is not provided', () => {
            const assets = [createMockAsset()];
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} />);

            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });

        it('displays "Unknown" for type when type ID is not found in assetCategories', () => {
            const assets = [createMockAsset({ type: 'unknown-type-id' })];
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });
    });

    describe('Pagination', () => {
        it('displays pagination when assets exceed rowsPerPage', () => {
            const assets = Array.from({ length: 25 }, (_, i) =>
                createMockAsset({
                    id: `asset${i + 1}`,
                    name: `Asset ${i + 1}`,
                }),
            );
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            expect(screen.getByText('Showing 20 of 25 assets')).toBeInTheDocument();
        });

        it('does not display pagination when assets are less than rowsPerPage', () => {
            const assets = [createMockAsset()];
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
        });

        it('does not display pagination when assets equal rowsPerPage', () => {
            const assets = Array.from({ length: 20 }, (_, i) =>
                createMockAsset({
                    id: `asset${i + 1}`,
                    name: `Asset ${i + 1}`,
                }),
            );
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
            expect(screen.getByText('Showing 20 of 20 assets')).toBeInTheDocument();
        });

        it('handles page changes', () => {
            const assets = Array.from({ length: 25 }, (_, i) =>
                createMockAsset({
                    id: `asset${i + 1}`,
                    name: `Asset ${i + 1}`,
                }),
            );
            renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} />);

            const nextButton = screen.getByRole('button', { name: /next page/i });
            fireEvent.click(nextButton);

            expect(screen.getByText('Showing 5 of 25 assets')).toBeInTheDocument();
        });
    });

    describe('Full Screen Mode', () => {
        it('applies full screen styles when isFullScreen is true', () => {
            const assets = [createMockAsset()];
            const { container } = renderWithProviders(<AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} isFullScreen={true} />);

            const paper = container.querySelector('.MuiPaper-root');
            expect(paper).toHaveStyle({ width: '100%', height: '100%' });
        });

        it('applies compact styles when isFullScreen is false', () => {
            const assets = [createMockAsset()];
            const { container } = renderWithProviders(
                <AssetInfoPanel open={true} assets={assets} assetCategories={mockAssetCategories} isFullScreen={false} />,
            );

            const paper = container.querySelector('.MuiPaper-root');
            expect(paper).toHaveStyle({ minWidth: '220px', maxWidth: '300px' });
        });
    });

    describe('Ref Forwarding', () => {
        it('forwards ref to Paper element', () => {
            const ref = React.createRef<HTMLDivElement>();
            renderWithProviders(<AssetInfoPanel open={true} assets={[]} ref={ref} />);

            expect(ref.current).toBeInstanceOf(HTMLDivElement);
        });
    });
});
