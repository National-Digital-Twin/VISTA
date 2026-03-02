import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InspectorView from './InspectorView';
import type { Asset } from '@/api/assets-by-type';
import theme from '@/theme';

vi.mock('./AssetDetailsPanel', () => ({
    default: ({
        selectedElement,
        onBack,
        onClose,
        scenarioId,
        onConnectedAssetsVisibilityChange,
    }: {
        selectedElement: Asset | null;
        onBack?: () => void;
        onClose?: () => void;
        scenarioId?: string;
        onConnectedAssetsVisibilityChange?: (
            visible: boolean,
            dependents: Array<{ id: string; geom: string; type: { name: string } }>,
            providers: Array<{ id: string; geom: string; type: { name: string } }>,
        ) => void;
    }) => (
        <div data-testid="asset-details-panel">
            <div>Asset Details Panel</div>
            <div>Selected Element ID: {selectedElement?.id}</div>
            {onBack && <button onClick={onBack}>Back</button>}
            {onClose && <button onClick={onClose}>Close</button>}
            {scenarioId && <div>Scenario ID: {scenarioId}</div>}
            {onConnectedAssetsVisibilityChange && (
                <button
                    onClick={() =>
                        onConnectedAssetsVisibilityChange(
                            true,
                            [{ id: 'dep1', geom: 'POINT(0 0)', type: { name: 'Type1' } }],
                            [{ id: 'prov1', geom: 'POINT(0 0)', type: { name: 'Type2' } }],
                        )
                    }
                >
                    Toggle Connected Assets
                </button>
            )}
        </div>
    ),
}));

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

const createMockAsset = (overrides = {}): Asset => {
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
            classUri: 'https://example.com#Type1',
            backgroundColor: '#000000',
            color: '#ffffff',
            faIcon: '',
            iconFallbackText: 'A',
            alt: 'Test Asset',
        },
        state: 'Static',
        elementType: 'asset',
        ...overrides,
    };
};

describe('InspectorView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders title when no element is selected', () => {
            renderWithProviders(<InspectorView selectedElement={null} />);
            expect(screen.getByText('Inspector')).toBeInTheDocument();
        });

        it('renders default message when no element is selected', () => {
            renderWithProviders(<InspectorView selectedElement={null} />);
            expect(screen.getByText('Select an asset on the map to inspect its details.')).toBeInTheDocument();
        });

        it('renders AssetDetailsPanel when element is selected', () => {
            const asset = createMockAsset();
            renderWithProviders(<InspectorView selectedElement={asset} />);
            expect(screen.getByTestId('asset-details-panel')).toBeInTheDocument();
            expect(screen.getByText('Asset Details Panel')).toBeInTheDocument();
            expect(screen.getByText('Selected Element ID: asset1')).toBeInTheDocument();
        });

        it('does not render close button when onClose is not provided and no element is selected', () => {
            renderWithProviders(<InspectorView selectedElement={null} />);
            expect(screen.queryByLabelText('Close panel')).not.toBeInTheDocument();
        });

        it('renders close button when onClose is provided and no element is selected', () => {
            const onClose = vi.fn();
            renderWithProviders(<InspectorView selectedElement={null} onClose={onClose} />);
            expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
        });
    });

    describe('Close Functionality', () => {
        it('calls onClose when close button is clicked and no element is selected', () => {
            const onClose = vi.fn();
            renderWithProviders(<InspectorView selectedElement={null} onClose={onClose} />);

            const closeButton = screen.getByLabelText('Close panel');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('passes onClose to AssetDetailsPanel when element is selected', () => {
            const asset = createMockAsset();
            const onClose = vi.fn();
            renderWithProviders(<InspectorView selectedElement={asset} onClose={onClose} />);

            const closeButton = screen.getByText('Close');
            fireEvent.click(closeButton);

            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Back Functionality', () => {
        it('passes onBack to AssetDetailsPanel when element is selected', () => {
            const asset = createMockAsset();
            const onBack = vi.fn();
            renderWithProviders(<InspectorView selectedElement={asset} onBack={onBack} />);

            const backButton = screen.getByText('Back');
            fireEvent.click(backButton);

            expect(onBack).toHaveBeenCalledTimes(1);
        });

        it('does not render back button when onBack is not provided', () => {
            const asset = createMockAsset();
            renderWithProviders(<InspectorView selectedElement={asset} />);
            expect(screen.queryByText('Back')).not.toBeInTheDocument();
        });
    });

    describe('Scenario ID', () => {
        it('passes scenarioId to AssetDetailsPanel when provided', () => {
            const asset = createMockAsset();
            const scenarioId = 'test-scenario-123';
            renderWithProviders(<InspectorView selectedElement={asset} scenarioId={scenarioId} />);

            expect(screen.getByText(`Scenario ID: ${scenarioId}`)).toBeInTheDocument();
        });

        it('does not render scenario ID when not provided', () => {
            const asset = createMockAsset();
            renderWithProviders(<InspectorView selectedElement={asset} />);
            expect(screen.queryByText(/Scenario ID:/)).not.toBeInTheDocument();
        });
    });

    describe('Connected Assets Visibility', () => {
        it('passes onConnectedAssetsVisibilityChange to AssetDetailsPanel when provided', () => {
            const asset = createMockAsset();
            const onConnectedAssetsVisibilityChange = vi.fn();
            renderWithProviders(<InspectorView selectedElement={asset} onConnectedAssetsVisibilityChange={onConnectedAssetsVisibilityChange} />);

            const toggleButton = screen.getByText('Toggle Connected Assets');
            fireEvent.click(toggleButton);

            expect(onConnectedAssetsVisibilityChange).toHaveBeenCalledWith(
                true,
                [{ id: 'dep1', geom: 'POINT(0 0)', type: { name: 'Type1' } }],
                [{ id: 'prov1', geom: 'POINT(0 0)', type: { name: 'Type2' } }],
            );
        });

        it('does not render toggle button when onConnectedAssetsVisibilityChange is not provided', () => {
            const asset = createMockAsset();
            renderWithProviders(<InspectorView selectedElement={asset} />);
            expect(screen.queryByText('Toggle Connected Assets')).not.toBeInTheDocument();
        });
    });

    describe('Element Selection Changes', () => {
        it('switches from default view to AssetDetailsPanel when element is selected', () => {
            const { rerender } = renderWithProviders(<InspectorView selectedElement={null} />);

            expect(screen.getByText('Select an asset on the map to inspect its details.')).toBeInTheDocument();
            expect(screen.queryByTestId('asset-details-panel')).not.toBeInTheDocument();

            const asset = createMockAsset();
            const queryClient = createTestQueryClient();
            rerender(
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme={theme}>
                        <InspectorView selectedElement={asset} />
                    </ThemeProvider>
                </QueryClientProvider>,
            );

            expect(screen.queryByText('Select an asset on the map to inspect its details.')).not.toBeInTheDocument();
            expect(screen.getByTestId('asset-details-panel')).toBeInTheDocument();
        });

        it('switches from AssetDetailsPanel to default view when element is deselected', () => {
            const asset = createMockAsset();
            const { rerender } = renderWithProviders(<InspectorView selectedElement={asset} />);

            expect(screen.getByTestId('asset-details-panel')).toBeInTheDocument();
            expect(screen.queryByText('Select an asset on the map to inspect its details.')).not.toBeInTheDocument();

            const queryClient = createTestQueryClient();
            rerender(
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme={theme}>
                        <InspectorView selectedElement={null} />
                    </ThemeProvider>
                </QueryClientProvider>,
            );

            expect(screen.getByText('Select an asset on the map to inspect its details.')).toBeInTheDocument();
            expect(screen.queryByTestId('asset-details-panel')).not.toBeInTheDocument();
        });

        it('updates AssetDetailsPanel when different element is selected', () => {
            const asset1 = createMockAsset({ id: 'asset1', name: 'Asset 1' });
            const asset2 = createMockAsset({ id: 'asset2', name: 'Asset 2' });

            const { rerender } = renderWithProviders(<InspectorView selectedElement={asset1} />);

            expect(screen.getByText('Selected Element ID: asset1')).toBeInTheDocument();

            const queryClient = createTestQueryClient();
            rerender(
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme={theme}>
                        <InspectorView selectedElement={asset2} />
                    </ThemeProvider>
                </QueryClientProvider>,
            );

            expect(screen.getByText('Selected Element ID: asset2')).toBeInTheDocument();
        });
    });

    describe('Props Passing', () => {
        it('passes all props to AssetDetailsPanel when element is selected', () => {
            const asset = createMockAsset();
            const onBack = vi.fn();
            const onClose = vi.fn();
            const scenarioId = 'test-scenario-123';
            const onConnectedAssetsVisibilityChange = vi.fn();

            renderWithProviders(
                <InspectorView
                    selectedElement={asset}
                    onBack={onBack}
                    onClose={onClose}
                    scenarioId={scenarioId}
                    onConnectedAssetsVisibilityChange={onConnectedAssetsVisibilityChange}
                />,
            );

            expect(screen.getByText('Back')).toBeInTheDocument();
            expect(screen.getByText('Close')).toBeInTheDocument();
            expect(screen.getByText(`Scenario ID: ${scenarioId}`)).toBeInTheDocument();
            expect(screen.getByText('Toggle Connected Assets')).toBeInTheDocument();
        });
    });
});
