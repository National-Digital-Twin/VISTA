import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import AssetTooltip from './AssetTooltip';
import Asset, { AssetState } from '@/models/Asset';
import theme from '@/theme';

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
            secondaryCategory: 'Type1',
            getDetails: vi.fn((assetInfo: any) => ({
                title: assetInfo?.name || 'Test Asset',
                type: assetInfo?.assetType || 'https://example.com#Type1',
                criticality: 5,
                id: 'asset1',
                elementType: 'asset',
            })),
            ...overrides,
        } as unknown as Asset;
    };

    describe('rendering', () => {
        it('displays asset name', () => {
            const asset = createMockAsset();
            renderWithProviders(<AssetTooltip element={asset} />);

            expect(screen.getByText('Test Asset')).toBeInTheDocument();
        });

        it('displays asset type from secondaryCategory', () => {
            const asset = createMockAsset({ secondaryCategory: 'Type1' });
            renderWithProviders(<AssetTooltip element={asset} />);

            expect(screen.getByText(/type1/i)).toBeInTheDocument();
        });

        it('falls back to ID when name is not available', () => {
            const asset = createMockAsset({ name: undefined });
            asset.getDetails = vi.fn(() => ({
                title: 'asset1',
                type: 'https://example.com#Type1',
                desc: '',
                criticality: 5,
                criticalityColor: undefined,
                id: 'asset1',
                elementType: 'asset' as const,
            }));

            renderWithProviders(<AssetTooltip element={asset} />);

            expect(screen.getByText('asset1')).toBeInTheDocument();
        });

        it('displays "Unknown" when no name or ID available', () => {
            const asset = createMockAsset({ name: undefined, id: '' });
            asset.getDetails = vi.fn(() => ({
                title: undefined,
                type: 'https://example.com#Type1',
                desc: '',
                criticality: 5,
                criticalityColor: undefined,
                id: '',
                elementType: 'asset' as const,
            }));

            renderWithProviders(<AssetTooltip element={asset} />);

            expect(screen.getByText('Unknown')).toBeInTheDocument();
        });
    });
});
