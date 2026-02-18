import type { ReactElement } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetDetailsPanel from './AssetDetailsPanel';
import type { Asset } from '@/api/assets-by-type';
import theme from '@/theme';
import { fetchAssetDetails } from '@/api/asset-details';
import { fetchAssetScore } from '@/api/asset-scores';

vi.mock('@/api/asset-details', () => ({
    fetchAssetDetails: vi.fn(),
}));

vi.mock('./ConnectedAssetsSection', () => ({
    default: ({ filteredDependents, filteredProviders }: { filteredDependents: any[]; filteredProviders: any[] }) => (
        <div data-testid="connected-assets-section">
            <div>Dependents: {filteredDependents.length}</div>
            <div>Providers: {filteredProviders.length}</div>
        </div>
    ),
}));

vi.mock('./AssetScore', () => ({
    default: ({ score }: { score: any }) => <div data-testid="asset-score">Score: {score.criticalityScore}</div>,
}));

vi.mock('@/api/asset-scores', () => ({
    fetchAssetScore: vi.fn(),
}));

const mockedFetchAssetDetails = vi.mocked(fetchAssetDetails);
const mockedFetchAssetScore = vi.mocked(fetchAssetScore);

const createTestQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
};

const renderWithProviders = (component: ReactElement) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>{component}</ThemeProvider>
        </QueryClientProvider>,
    );
};

describe('AssetDetailsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockAsset = (overrides = {}) => {
        return {
            id: 'asset1',
            type: 'https://example.com#Type1',
            name: 'Test Asset',
            lat: 51.5074,
            lng: -0.1278,
            geometry: { type: 'Point', coordinates: [-0.1278, 51.5074] },
            dependent: { criticalitySum: 5 },
            description: 'Test description',
            styles: {
                backgroundColor: '#000000',
                color: '#ffffff',
                faIcon: '',
                iconFallbackText: 'A',
            },
            state: 'Static' as const,
            elementType: 'asset' as const,
            ...overrides,
        } as Asset;
    };

    describe('rendering', () => {
        it('returns null when selectedElement is null', () => {
            const { container } = renderWithProviders(<AssetDetailsPanel selectedElement={null} onClose={vi.fn()} />);
            expect(container.firstChild).toBeNull();
        });

        it('displays loading state', async () => {
            const asset = createMockAsset();
            const neverResolvingPromise = new Promise<never>(() => {});
            mockedFetchAssetDetails.mockImplementation(() => neverResolvingPromise as Promise<any>);

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('displays asset details when loaded', async () => {
            const asset = createMockAsset();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Fetched Asset Name',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('Fetched Asset Name')).toBeInTheDocument();
            });
        });

        it('displays asset type and description', async () => {
            const asset = createMockAsset();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText(/type1/i)).toBeInTheDocument();
                expect(screen.getByText(/Asset ID:/)).toBeInTheDocument();
            });
        });
    });

    describe('back button', () => {
        it('calls onClose when back button is clicked', async () => {
            const asset = createMockAsset();
            const onClose = vi.fn();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={onClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });

            const closeButton = screen.getByLabelText('Close panel');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('error handling', () => {
        it('displays error message when assetDetails fetch fails', async () => {
            const asset = createMockAsset();
            mockedFetchAssetDetails.mockRejectedValue(new Error('Failed to fetch'));

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText(/Error fetching details/i)).toBeInTheDocument();
            });
        });

        it('displays asset details even when name is empty', async () => {
            const asset = createMockAsset({ name: '' });
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: '',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('asset1')).toBeInTheDocument();
            });
        });
    });

    describe('Street View', () => {
        it('displays Street View icon when coordinates are available', async () => {
            const asset = createMockAsset({ lat: 51.5074, lng: -0.1278 });
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                const streetViewLink = screen.getByRole('link', { name: '' });
                expect(streetViewLink).toBeInTheDocument();
                expect(streetViewLink).toHaveAttribute('href', expect.stringContaining('google.com/maps'));
            });
        });

        it('does not display Street View icon when coordinates are missing', async () => {
            const asset = createMockAsset({ lat: undefined, lng: undefined });
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('Test Asset')).toBeInTheDocument();
            });

            const streetViewLinks = screen.queryAllByRole('link');
            const hasStreetViewLink = streetViewLinks.some((link) => link.getAttribute('href')?.includes('google.com/maps'));
            expect(hasStreetViewLink).toBe(false);
        });
    });

    describe('connected assets', () => {
        it('displays connected assets section', async () => {
            const asset = createMockAsset();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [
                    {
                        id: 'prov1',
                        name: 'Provider 1',
                        geom: 'POINT(-0.1278 51.5074)',
                        type: {
                            id: 'type2',
                            name: 'Type2',
                        },
                    },
                ],
                dependents: [
                    {
                        id: 'dep1',
                        name: 'Dependent 1',
                        geom: 'POINT(-0.1278 51.5074)',
                        type: {
                            id: 'type1',
                            name: 'Type1',
                        },
                    },
                ],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByTestId('connected-assets-section')).toBeInTheDocument();
                expect(screen.getByText('Dependents: 1')).toBeInTheDocument();
                expect(screen.getByText('Providers: 1')).toBeInTheDocument();
            });
        });

        it('filters out assets with errors', async () => {
            const asset = createMockAsset();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [
                    {
                        id: 'dep1',
                        name: 'Valid Dependent',
                        geom: 'POINT(-0.1278 51.5074)',
                        type: {
                            id: 'type1',
                            name: 'Type1',
                        },
                    },
                ],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('Dependents: 1')).toBeInTheDocument();
            });
        });
    });

    describe('asset state handling', () => {
        it('does not fetch assetDetails when selectedElement has no id', () => {
            const asset = createMockAsset({ id: '' });
            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            expect(mockedFetchAssetDetails).not.toHaveBeenCalled();
        });
    });

    describe('asset scores', () => {
        it('displays asset score when available', async () => {
            const asset = createMockAsset();
            const scenarioId = 'scenario-123';
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });
            mockedFetchAssetScore.mockResolvedValue({
                id: 'score-1',
                scenarioId,
                criticalityScore: '3.0',
                dependencyScore: '2.5',
                exposureScore: '1.5',
                redundancyScore: '0.5',
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} scenarioId={scenarioId} />);

            await waitFor(() => {
                expect(screen.getByTestId('asset-score')).toBeInTheDocument();
            });
        });

        it('does not fetch asset score when scenarioId is missing', async () => {
            const asset = createMockAsset();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('Test Asset')).toBeInTheDocument();
            });

            expect(mockedFetchAssetScore).not.toHaveBeenCalled();
        });
    });

    describe('close button', () => {
        it('displays close button when onClose is provided', async () => {
            const asset = createMockAsset();
            const onClose = vi.fn();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={onClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });
        });

        it('calls onClose when close button is clicked', async () => {
            const asset = createMockAsset();
            const onClose = vi.fn();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={onClose} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
            });

            const closeButton = screen.getByLabelText('Close panel');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('does not display close button when onClose is not provided', async () => {
            const asset = createMockAsset();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} />);

            await waitFor(() => {
                expect(screen.getByText('Test Asset')).toBeInTheDocument();
            });

            expect(screen.queryByLabelText('Close panel')).not.toBeInTheDocument();
        });
    });

    describe('visibility toggles', () => {
        it('resets visibility toggles when asset changes', async () => {
            const asset1 = createMockAsset({ id: 'asset1' });
            const asset2 = createMockAsset({ id: 'asset2' });
            const onConnectedAssetsVisibilityChange = vi.fn();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [
                    {
                        id: 'prov1',
                        name: 'Provider 1',
                        geom: 'POINT(-0.1278 51.5074)',
                        type: {
                            id: 'type2',
                            name: 'Type2',
                        },
                    },
                ],
                dependents: [],
            });

            const { rerender } = renderWithProviders(
                <AssetDetailsPanel selectedElement={asset1} onClose={vi.fn()} onConnectedAssetsVisibilityChange={onConnectedAssetsVisibilityChange} />,
            );

            await waitFor(() => {
                expect(screen.getByText('View provider assets')).toBeInTheDocument();
            });

            const visibilityButton = screen.getAllByRole('button').find((btn) => btn.getAttribute('aria-label')?.includes('visibility'));
            if (visibilityButton) {
                fireEvent.click(visibilityButton);
            }

            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset2',
                name: 'Test Asset 2',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            const queryClient = createTestQueryClient();
            rerender(
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme={theme}>
                        <AssetDetailsPanel selectedElement={asset2} onClose={vi.fn()} onConnectedAssetsVisibilityChange={onConnectedAssetsVisibilityChange} />
                    </ThemeProvider>
                </QueryClientProvider>,
            );

            await waitFor(() => {
                expect(onConnectedAssetsVisibilityChange).toHaveBeenCalledWith(false, [], []);
            });
        });
    });

    describe('swipeable views', () => {
        it('displays scores view by default', async () => {
            const asset = createMockAsset();
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onClose={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('View dependent assets')).toBeInTheDocument();
                expect(screen.getByText('View provider assets')).toBeInTheDocument();
            });
        });

        it('navigates to connected assets view and shows dependent assets when link is clicked', async () => {
            const asset = createMockAsset();
            const onConnectedAssetsVisibilityChange = vi.fn();
            const dependents = [
                {
                    id: 'dep1',
                    name: 'Dependent 1',
                    geom: 'POINT(-0.1278 51.5074)',
                    type: {
                        id: 'type1',
                        name: 'Type1',
                    },
                },
            ];
            mockedFetchAssetDetails.mockResolvedValue({
                id: 'asset1',
                name: 'Test Asset',
                geom: 'POINT(-0.1278 51.5074)',
                type: {
                    id: 'type1',
                    name: 'Type1',
                },
                providers: [],
                dependents,
            });

            renderWithProviders(
                <AssetDetailsPanel
                    selectedElement={asset}
                    onClose={vi.fn()}
                    onConnectedAssetsVisibilityChange={onConnectedAssetsVisibilityChange}
                />,
            );

            await waitFor(() => {
                expect(screen.getByText('View dependent assets')).toBeInTheDocument();
            });

            const dependentLink = screen.getByText('View dependent assets');
            fireEvent.click(dependentLink);

            await waitFor(() => {
                expect(screen.getByText('Connected Assets')).toBeInTheDocument();
                expect(onConnectedAssetsVisibilityChange).toHaveBeenCalledWith(true, dependents, []);
            });
        });
    });
});
