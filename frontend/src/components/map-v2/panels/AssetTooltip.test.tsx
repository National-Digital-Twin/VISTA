// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AssetTooltip from './AssetTooltip';
import type { Asset } from '@/api/assets-by-type';
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
            state: 'Static' as const,
            elementType: 'asset' as const,
            ...overrides,
        } as unknown as Asset;
    };

    describe('rendering', () => {
        it('displays asset name', () => {
            const asset = createMockAsset();
            renderWithProviders(<AssetTooltip element={asset} />);

            expect(screen.getByText('Test Asset')).toBeInTheDocument();
        });

        it('falls back to ID when name is not available', () => {
            const asset = createMockAsset({ name: undefined });
            renderWithProviders(<AssetTooltip element={asset} />);
            expect(screen.getByText('asset1')).toBeInTheDocument();
        });

        it('displays "Unknown" when no name or ID available', () => {
            const asset = createMockAsset({ name: undefined, id: '' });
            renderWithProviders(<AssetTooltip element={asset} />);
            expect(screen.getByText('Name unknown')).toBeInTheDocument();
        });

        it('displays asset type name when assetCategories is provided', () => {
            const asset = createMockAsset({ type: '35a910f3-f611-4096-ac0b-0928c5612e32' });
            const assetCategories = [
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

            renderWithProviders(<AssetTooltip element={asset} assetCategories={assetCategories} />);

            expect(screen.getByText('Test Asset')).toBeInTheDocument();
            expect(screen.getByText(/hospital/i)).toBeInTheDocument();
        });
    });
});
