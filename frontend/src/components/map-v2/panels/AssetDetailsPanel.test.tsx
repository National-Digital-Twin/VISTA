import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetDetailsPanel from './AssetDetailsPanel';
import Asset, { AssetState } from '@/models/Asset';
import theme from '@/theme';
import { fetchAssetInfo } from '@/api/combined';
import { useDependents, useProviders } from '@/hooks';

vi.mock('@/api/combined', () => ({
    fetchAssetInfo: vi.fn(),
}));

vi.mock('@/hooks', () => ({
    useDependents: vi.fn(),
    useProviders: vi.fn(),
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

const mockedFetchAssetInfo = vi.mocked(fetchAssetInfo);
const mockedUseDependents = vi.mocked(useDependents);
const mockedUseProviders = vi.mocked(useProviders);

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
        mockedUseDependents.mockReturnValue({
            isLoading: false,
            isError: false,
            error: null,
            data: [],
        });
        mockedUseProviders.mockReturnValue({
            isLoading: false,
            isError: false,
            error: null,
            data: [],
        });
    });

    const createMockAsset = (overrides = {}) => {
        return {
            uri: 'https://example.com#asset1',
            id: 'asset1',
            type: 'https://example.com#Type1',
            name: 'Test Asset',
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
            state: AssetState.Static,
            elementType: 'asset' as const,
            getDetails: vi.fn((assetInfo: any) => ({
                title: assetInfo?.name || 'Test Asset',
                type: assetInfo?.assetType || 'https://example.com#Type1',
                desc: assetInfo?.desc || 'Test description',
                criticality: 5,
                id: 'asset1',
                uri: 'https://example.com#asset1',
                elementType: 'asset',
            })),
            ...overrides,
        } as unknown as Asset;
    };

    describe('rendering', () => {
        it('returns null when selectedElement is null', () => {
            const { container } = renderWithProviders(<AssetDetailsPanel selectedElement={null} onBack={vi.fn()} />);
            expect(container.firstChild).toBeNull();
        });

        it('displays loading state', async () => {
            const asset = createMockAsset();
            const neverResolvingPromise = new Promise(() => {});
            mockedFetchAssetInfo.mockImplementation(() => neverResolvingPromise);

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('displays asset details when loaded', async () => {
            const asset = createMockAsset();
            mockedFetchAssetInfo.mockResolvedValue({
                name: 'Fetched Asset Name',
                assetType: 'https://example.com#Type1',
                desc: 'Fetched description',
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('Fetched Asset Name')).toBeInTheDocument();
                expect(screen.getByText('Asset Details')).toBeInTheDocument();
            });
        });

        it('displays asset type and description', async () => {
            const asset = createMockAsset();
            mockedFetchAssetInfo.mockResolvedValue({
                name: 'Test Asset',
                assetType: 'https://example.com#Type1',
                desc: 'Test description',
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
            mockedFetchAssetInfo.mockResolvedValue({
                name: 'Test Asset',
                assetType: 'https://example.com#Type1',
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
        it('displays error message when assetInfo fetch fails', async () => {
            const asset = createMockAsset();
            mockedFetchAssetInfo.mockRejectedValue(new Error('Failed to fetch'));

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText(/Error fetching details/i)).toBeInTheDocument();
            });
        });

        it('displays warning when details are empty', async () => {
            const asset = createMockAsset();
            asset.getDetails = vi.fn(() => null as any);
            mockedFetchAssetInfo.mockResolvedValue(null);

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText(/Unable to retrieve details/i)).toBeInTheDocument();
            });
        });
    });

    describe('Street View', () => {
        it('displays Street View section when coordinates are available', async () => {
            const asset = createMockAsset({ lat: 51.5074, lng: -0.1278 });
            mockedFetchAssetInfo.mockResolvedValue({
                name: 'Test Asset',
                assetType: 'https://example.com#Type1',
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByTestId('street-view-section')).toBeInTheDocument();
                expect(screen.getByText('Street View Available')).toBeInTheDocument();
            });
        });

        it('displays no Street View when coordinates are missing', async () => {
            const asset = createMockAsset({ lat: undefined, lng: undefined });
            mockedFetchAssetInfo.mockResolvedValue({
                name: 'Test Asset',
                assetType: 'https://example.com#Type1',
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
            mockedFetchAssetInfo.mockResolvedValue({
                name: 'Test Asset',
                assetType: 'https://example.com#Type1',
            });
            mockedUseDependents.mockReturnValue({
                isLoading: false,
                isError: false,
                error: null,
                data: [
                    {
                        uri: 'https://example.com#dep1',
                        name: 'Dependent 1',
                        type: 'https://example.com#Type1',
                        dependentCriticalitySum: 5,
                        connectionStrength: 3,
                    },
                ],
            });
            mockedUseProviders.mockReturnValue({
                isLoading: false,
                isError: false,
                error: null,
                data: [
                    {
                        uri: 'https://example.com#prov1',
                        name: 'Provider 1',
                        type: 'https://example.com#Type2',
                        dependentCriticalitySum: 10,
                        connectionStrength: 7,
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
            mockedFetchAssetInfo.mockResolvedValue({
                name: 'Test Asset',
                assetType: 'https://example.com#Type1',
            });
            mockedUseDependents.mockReturnValue({
                isLoading: false,
                isError: false,
                error: null,
                data: [
                    {
                        uri: 'https://example.com#dep1',
                        name: 'Valid Dependent',
                        type: 'https://example.com#Type1',
                        dependentCriticalitySum: 5,
                        connectionStrength: 3,
                    },
                    {
                        error: new Error('Failed to load'),
                    },
                ],
            });
            mockedUseProviders.mockReturnValue({
                isLoading: false,
                isError: false,
                error: null,
                data: [],
            });

            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            await waitFor(() => {
                expect(screen.getByText('Dependents: 1')).toBeInTheDocument();
            });
        });
    });

    describe('asset state handling', () => {
        it('does not fetch assetInfo for Live assets', () => {
            const asset = createMockAsset({ state: AssetState.Live });
            renderWithProviders(<AssetDetailsPanel selectedElement={asset} onBack={vi.fn()} />);

            expect(mockedFetchAssetInfo).not.toHaveBeenCalled();
        });
    });
});
