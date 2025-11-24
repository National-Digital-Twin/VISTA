import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import ConnectedAssetsList from './ConnectedAssetsList';
import theme from '@/theme';

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ConnectedAssetsList', () => {
    const mockAssets = [
        {
            uri: 'https://example.com#asset1',
            name: 'Test Asset 1',
            assetType: 'https://example.com#Type1',
            dependentCriticalitySum: 5,
            connectionStrength: 3,
        },
        {
            uri: 'https://example.com#asset2',
            name: 'Test Asset 2',
            assetType: 'https://example.com#Type2',
            dependentCriticalitySum: 10,
            connectionStrength: 7,
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

        it('displays criticality and connection strength in grid layout', () => {
            renderWithTheme(<ConnectedAssetsList connectedAssets={mockAssets} />);

            expect(screen.getAllByText('Criticality')).toHaveLength(2);
            expect(screen.getAllByText('Connection Strength')).toHaveLength(2);
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
            expect(screen.getByText('7')).toBeInTheDocument();
        });

        it('displays N/D for missing values', () => {
            const assetsWithMissingValues = [
                {
                    uri: 'https://example.com#asset1',
                    name: 'Test Asset',
                    assetType: 'https://example.com#Type1',
                    dependentCriticalitySum: null as any,
                    connectionStrength: undefined as any,
                },
            ];

            renderWithTheme(<ConnectedAssetsList connectedAssets={assetsWithMissingValues} />);

            expect(screen.getAllByText('N/D')).toHaveLength(2);
        });
    });

    describe('error handling', () => {
        it('displays error message for assets with errors', () => {
            const assetsWithError = [
                {
                    uri: 'https://example.com#asset1',
                    error: new Error('Failed to load asset'),
                    name: '',
                    assetType: '',
                    dependentCriticalitySum: 0,
                    connectionStrength: 0,
                },
            ];

            renderWithTheme(<ConnectedAssetsList connectedAssets={assetsWithError} />);

            expect(screen.getByText('Failed to load asset')).toBeInTheDocument();
        });

        it('handles mix of valid assets and errors', () => {
            const mixedAssets = [
                {
                    uri: 'https://example.com#asset1',
                    name: 'Valid Asset',
                    assetType: 'https://example.com#Type1',
                    dependentCriticalitySum: 5,
                    connectionStrength: 3,
                },
                {
                    uri: 'https://example.com#asset2',
                    error: new Error('Error loading asset'),
                    name: '',
                    assetType: '',
                    dependentCriticalitySum: 0,
                    connectionStrength: 0,
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
