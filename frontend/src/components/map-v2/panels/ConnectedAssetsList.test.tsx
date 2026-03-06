// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';
import ConnectedAssetsList from './ConnectedAssetsList';
import theme from '@/theme';

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ConnectedAssetsList', () => {
    const mockAssets = [
        {
            id: 'asset1',
            name: 'Test Asset 1',
            assetType: 'https://example.com#Type1',
        },
        {
            id: 'asset2',
            name: 'Test Asset 2',
            assetType: 'https://example.com#Type2',
        },
    ];

    describe('rendering', () => {
        it('renders list of assets', () => {
            renderWithTheme(<ConnectedAssetsList connectedAssets={mockAssets} />);

            expect(screen.getByText('Test Asset 1')).toBeInTheDocument();
            expect(screen.getByText('Test Asset 2')).toBeInTheDocument();
        });

        it('displays asset type without label', () => {
            renderWithTheme(<ConnectedAssetsList connectedAssets={mockAssets} />);

            expect(screen.queryByText('Type')).not.toBeInTheDocument();
        });
    });

    describe('error handling', () => {
        it('displays error message for assets with errors', () => {
            const assetsWithError = [
                {
                    id: 'asset1',
                    error: new Error('Failed to load asset'),
                    name: '',
                    assetType: '',
                },
            ];

            renderWithTheme(<ConnectedAssetsList connectedAssets={assetsWithError} />);

            expect(screen.getByText('Failed to load asset')).toBeInTheDocument();
        });

        it('handles mix of valid assets and errors', () => {
            const mixedAssets = [
                {
                    id: 'asset1',
                    name: 'Valid Asset',
                    assetType: 'https://example.com#Type1',
                },
                {
                    id: 'asset2',
                    error: new Error('Error loading asset'),
                    name: '',
                    assetType: '',
                },
            ];

            renderWithTheme(<ConnectedAssetsList connectedAssets={mixedAssets} />);

            expect(screen.getByText('Valid Asset')).toBeInTheDocument();
            expect(screen.getByText('Error loading asset')).toBeInTheDocument();
        });
    });

    describe('empty state', () => {
        it('renders empty list without errors', () => {
            renderWithTheme(<ConnectedAssetsList connectedAssets={[]} />);

            expect(screen.queryByText('Test Asset 1')).not.toBeInTheDocument();
        });
    });
});
