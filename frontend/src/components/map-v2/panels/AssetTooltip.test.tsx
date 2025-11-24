import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetTooltip from './AssetTooltip';
import Asset, { AssetState } from '@/models/Asset';
import theme from '@/theme';
import { fetchAssetInfo } from '@/api/combined';

vi.mock('@/api/combined', () => ({
    fetchAssetInfo: vi.fn(),
}));

const mockedFetchAssetInfo = vi.mocked(fetchAssetInfo);

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

describe('AssetTooltip', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
                criticality: 5,
                id: 'asset1',
                uri: 'https://example.com#asset1',
                elementType: 'asset',
            })),
            ...overrides,
        } as unknown as Asset;
    };

    describe('rendering', () => {
        it('displays asset title', async () => {
            const asset = createMockAsset();
            mockedFetchAssetInfo.mockResolvedValue({ name: 'Fetched Asset Name', assetType: 'https://example.com#Type1' });

            renderWithProviders(<AssetTooltip element={asset} />);

            await waitFor(() => {
                expect(screen.getByText('Fetched Asset Name')).toBeInTheDocument();
            });
        });

        it('displays asset type', async () => {
            const asset = createMockAsset();
            mockedFetchAssetInfo.mockResolvedValue({ name: 'Test Asset', assetType: 'https://example.com#Type1' });

            renderWithProviders(<AssetTooltip element={asset} />);

            await waitFor(() => {
                expect(screen.getByText(/type1/i)).toBeInTheDocument();
            });
        });

        it('falls back to asset name when assetInfo is not available', async () => {
            const asset = createMockAsset();
            mockedFetchAssetInfo.mockResolvedValue(null);

            renderWithProviders(<AssetTooltip element={asset} />);

            await waitFor(() => {
                expect(screen.getByText('Test Asset')).toBeInTheDocument();
            });
        });

        it('falls back to URI when name is not available', async () => {
            const asset = createMockAsset({ name: undefined });
            mockedFetchAssetInfo.mockResolvedValue(null);
            asset.getDetails = vi.fn(() => ({
                title: 'https://example.com#asset1',
                type: 'https://example.com#Type1',
                desc: '',
                criticality: 5,
                criticalityColor: undefined,
                id: 'asset1',
                uri: 'https://example.com#asset1',
                elementType: 'asset' as const,
            }));

            renderWithProviders(<AssetTooltip element={asset} />);

            await waitFor(
                () => {
                    expect(screen.getByText('https://example.com#asset1')).toBeInTheDocument();
                },
                { timeout: 3000 },
            );
        });
    });

    describe('asset state handling', () => {
        it('does not fetch assetInfo for Live assets', () => {
            const asset = createMockAsset({ state: AssetState.Live });
            renderWithProviders(<AssetTooltip element={asset} />);

            expect(mockedFetchAssetInfo).not.toHaveBeenCalled();
        });

        it('fetches assetInfo for Static assets', async () => {
            const asset = createMockAsset({ state: AssetState.Static });
            mockedFetchAssetInfo.mockResolvedValue({ name: 'Test Asset', assetType: 'https://example.com#Type1' });

            renderWithProviders(<AssetTooltip element={asset} />);

            await waitFor(() => {
                expect(mockedFetchAssetInfo).toHaveBeenCalledWith('https://example.com#asset1');
            });
        });
    });

    describe('caching', () => {
        it('uses cached data when available', async () => {
            const asset = createMockAsset();
            mockedFetchAssetInfo.mockResolvedValue({ name: 'Cached Asset', assetType: 'https://example.com#Type1' });

            const queryClient = createTestQueryClient();
            const { rerender } = render(
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme={theme}>
                        <AssetTooltip element={asset} />
                    </ThemeProvider>
                </QueryClientProvider>,
            );

            await waitFor(() => {
                expect(screen.getByText('Cached Asset')).toBeInTheDocument();
            });

            rerender(
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme={theme}>
                        <AssetTooltip element={asset} />
                    </ThemeProvider>
                </QueryClientProvider>,
            );

            expect(screen.getByText('Cached Asset')).toBeInTheDocument();
        });
    });
});
