import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material/styles';
import ConnectedAssetsSection from './ConnectedAssetsSection';
import theme from '@/theme';

vi.mock('./ConnectedAssetsList', () => ({
    default: ({ connectedAssets }: { connectedAssets: any[] }) => (
        <div data-testid="connected-assets-list">
            {connectedAssets.map((asset) => (
                <div key={asset.uri}>{asset.name}</div>
            ))}
        </div>
    ),
}));

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ConnectedAssetsSection', () => {
    const mockDependents = [
        {
            uri: 'https://example.com#dep1',
            name: 'Dependent Asset 1',
            assetType: 'https://example.com#Type1',
            dependentCriticalitySum: 5,
            connectionStrength: 3,
        },
    ];

    const mockProviders = [
        {
            uri: 'https://example.com#prov1',
            name: 'Provider Asset 1',
            assetType: 'https://example.com#Type2',
            dependentCriticalitySum: 10,
            connectionStrength: 7,
        },
    ];

    const defaultProps = {
        filteredDependents: mockDependents,
        filteredProviders: mockProviders,
        isDependentsLoading: false,
        isDependentsError: false,
        dependentsError: null,
        isProvidersLoading: false,
        isProvidersError: false,
        providersError: null,
    };

    describe('rendering', () => {
        it('renders Connected Assets header', () => {
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} />);

            expect(screen.getByText('Connected Assets')).toBeInTheDocument();
        });

        it('renders tabs with correct labels and counts', () => {
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} />);

            expect(screen.getByText('Dependent Assets (1)')).toBeInTheDocument();
            expect(screen.getByText('Provider Assets (1)')).toBeInTheDocument();
        });

        it('displays dependent assets by default', () => {
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} />);

            expect(screen.getByText('Dependent Asset 1')).toBeInTheDocument();
        });
    });

    describe('tab switching', () => {
        it('switches to provider assets tab when clicked', () => {
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} />);

            const providerTab = screen.getByText('Provider Assets (1)');
            fireEvent.click(providerTab);

            expect(screen.getByText('Provider Asset 1')).toBeInTheDocument();
            expect(screen.queryByText('Dependent Asset 1')).not.toBeInTheDocument();
        });

        it('switches back to dependent assets tab', () => {
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} />);

            const providerTab = screen.getByText('Provider Assets (1)');
            fireEvent.click(providerTab);

            const dependentTab = screen.getByText('Dependent Assets (1)');
            fireEvent.click(dependentTab);

            expect(screen.getByText('Dependent Asset 1')).toBeInTheDocument();
            expect(screen.queryByText('Provider Asset 1')).not.toBeInTheDocument();
        });
    });

    describe('loading states', () => {
        it('displays loading indicator for dependents', () => {
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} isDependentsLoading={true} />);

            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('displays loading indicator for providers', () => {
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} isProvidersLoading={true} />);

            const providerTab = screen.getByText('Provider Assets (1)');
            fireEvent.click(providerTab);

            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
    });

    describe('error states', () => {
        it('displays error message for dependents', () => {
            const error = new Error('Failed to load dependents');
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} isDependentsError={true} dependentsError={error} />);

            expect(screen.getByText('Failed to load dependents')).toBeInTheDocument();
        });

        it('displays error message for providers', () => {
            const error = new Error('Failed to load providers');
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} isProvidersError={true} providersError={error} />);

            const providerTab = screen.getByText('Provider Assets (1)');
            fireEvent.click(providerTab);

            expect(screen.getByText('Failed to load providers')).toBeInTheDocument();
        });
    });

    describe('empty states', () => {
        it('displays empty message when no dependents', () => {
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} filteredDependents={[]} />);

            expect(screen.getByText('No dependent assets found.')).toBeInTheDocument();
        });

        it('displays empty message when no providers', () => {
            renderWithTheme(<ConnectedAssetsSection {...defaultProps} filteredProviders={[]} />);

            const providerTab = screen.getByText('Provider Assets (0)');
            fireEvent.click(providerTab);

            expect(screen.getByText('No provider assets found.')).toBeInTheDocument();
        });
    });
});
