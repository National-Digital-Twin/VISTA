import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ConnectedAssetsPanel from '.';
import useProviders from '@/hooks/queries/useProviders';

vi.mock('@/api/apollo-client', () => ({
    default: {},
    GET_ROAD_ROUTE: {},
}));

vi.mock('@/hooks/queries/useProviders', () => ({
    default: vi.fn(),
}));

const mockUseProviders = useProviders as any;

const mockAssetData = {
    title: 'Test Asset',
    id: 'ASSET-123',
    type: 'Database',
    assetUri: 'asset-uri-1',
    isAsset: true,
    isDependency: false,
    dependent: { count: 3 },
    provider: 'provider-id',
};

const createWrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('ConnectedAssetsPanel', () => {
    beforeEach(() => {
        mockUseProviders.mockReturnValue({
            isLoading: false,
            isError: false,
            error: null,
            data: [
                {
                    uri: 'http://example.com/asset#provider1',
                    name: 'Provider 1',
                    assetType: 'Database',
                    dependentCriticalitySum: 5,
                    connectionStrength: 3,
                },
                {
                    uri: 'http://example.com/asset#provider2',
                    name: 'Provider 2',
                    assetType: 'Service',
                    dependentCriticalitySum: 8,
                    connectionStrength: 7,
                },
            ],
        });
    });

    it('renders title, ID and type', () => {
        render(<ConnectedAssetsPanel connectedAssetData={mockAssetData} hideConnectedAssets={vi.fn()} />, { wrapper: createWrapper });
        expect(screen.getByText('Test Asset')).toBeInTheDocument();
        expect(screen.getByText('ASSET-123')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
    });

    it('renders tabs with counts', () => {
        render(<ConnectedAssetsPanel connectedAssetData={mockAssetData} hideConnectedAssets={vi.fn()} />, { wrapper: createWrapper });
        expect(screen.getByText(/Dependant Assets \(3\)/)).toBeInTheDocument();
        expect(screen.getByText(/Provider Assets \(2\)/)).toBeInTheDocument();
    });

    it('renders Dependents by default', () => {
        render(<ConnectedAssetsPanel connectedAssetData={mockAssetData} hideConnectedAssets={vi.fn()} />, { wrapper: createWrapper });
        
        expect(screen.getByRole('tabpanel', { name: /dependant assets/i })).toBeInTheDocument();
        expect(screen.getByText('Loading dependent assets')).toBeInTheDocument();
    });

    it('renders Providers on tab switch', () => {
        render(<ConnectedAssetsPanel connectedAssetData={mockAssetData} hideConnectedAssets={vi.fn()} />, { wrapper: createWrapper });
        const providerTab = screen.getByText(/Provider Assets/);
        fireEvent.click(providerTab);
        
        expect(screen.getByRole('tabpanel', { name: /provider assets/i })).toBeInTheDocument();
        
        expect(screen.getByText('Provider 1')).toBeInTheDocument();
    });
});
