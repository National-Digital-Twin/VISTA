import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetDetailsPanel from './AssetDetailsPanel';
import type { Asset } from '@/api/assets-by-type';
import theme from '@/theme';
import { fetchAssetDetails } from '@/api/asset-details';

vi.mock('@/api/asset-details', () => ({
    fetchAssetDetails: vi.fn(),
}));

vi.mock('./StreetViewSection', () => ({
    default: ({ hasCoordinates, streetViewUrl }: { hasCoordinates: boolean; streetViewUrl: string | null }) => (
        <div data-testid="street-view-section">{hasCoordinates && streetViewUrl ? 'Street View Available' : 'No Street View'}</div>
    ),
}));

vi.mock('./ConnectedAssetsSection', () => ({
    default: ({ filteredDependents, filteredProviders }: { filteredDependents: any[]; filteredProviders: any[] }) => (
        <div data-testid="connected-assets-section">
            <div>Dependents: {filteredDependents.length}</div>
            <div>Providers: {filteredProviders.length}</div>
        </div>
    ),
}));

const mockedFetchAssetDetails = vi.mocked(fetchAssetDetails);

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
            const { container } = renderWithProviders(<AssetDetailsPanel selectedElement={null} onBack={vi.fn()} />);
            expect(container.firstChild).toBeNull();
        });

        it('displays loading state', async () => {
            const asset = createMockAsset();
            const neverResolvingPromise = new Promise<never>(() => {});
            mockedFetchAssetDetails.mockImplementation(() => neverResolvingPromise as Promise<any>);

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

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

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('Fetched Asset Name')).toBeInTheDocument();
                expect(screen.getByText('Asset Details')).toBeInTheDocument();
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

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText(/type1/i)).toBeInTheDocument();
                expect(screen.getByText('Test description')).toBeInTheDocument();
            });
        });
    });

    describe('back button', () => {
        it('calls onBack when back button is clicked', async () => {
            const asset = createMockAsset();
            const onBack = vi.fn();
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

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={onBack} />);

            await waitFor(() => {
                expect(screen.getByLabelText('Back to previous panel')).toBeInTheDocument();
            });

            const backButton = screen.getByLabelText('Back to previous panel');
            fireEvent.click(backButton);

            expect(onBack).toHaveBeenCalledTimes(1);
        });
    });

    describe('error handling', () => {
        it('displays error message when assetDetails fetch fails', async () => {
            const asset = createMockAsset();
            mockedFetchAssetDetails.mockRejectedValue(new Error('Failed to fetch'));

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

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

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('asset1')).toBeInTheDocument();
            });
        });
    });

    describe('Street View', () => {
        it('displays Street View section when coordinates are available', async () => {
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

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByTestId('street-view-section')).toBeInTheDocument();
                expect(screen.getByText('Street View Available')).toBeInTheDocument();
            });
        });

        it('displays no Street View when coordinates are missing', async () => {
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

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByTestId('street-view-section')).toBeInTheDocument();
                expect(screen.getByText('No Street View')).toBeInTheDocument();
            });
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

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

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

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('Dependents: 1')).toBeInTheDocument();
            });
        });
    });

    describe('asset state handling', () => {
        it('does not fetch assetDetails when selectedElement has no id', () => {
            const asset = createMockAsset({ id: '' });
            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            expect(mockedFetchAssetDetails).not.toHaveBeenCalled();
        });
    });
});
