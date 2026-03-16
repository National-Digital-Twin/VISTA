// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResourcesView } from './ResourcesView';
import type { ResourceType } from '@/api/resources';
import theme from '@/theme';

const mockWithdrawStock = vi.fn();
const mockRestockLocation = vi.fn();
const mockToggleVisibility = vi.fn();
let capturedMutationOptions: { onError?: (message: string) => void } | undefined;

vi.mock('../hooks/useResourceMutations', () => ({
    default: vi.fn((options: { onError?: (message: string) => void }) => {
        capturedMutationOptions = options;
        return {
            withdrawStock: mockWithdrawStock,
            restockLocation: mockRestockLocation,
            toggleVisibility: mockToggleVisibility,
            isMutating: false,
        };
    }),
}));

vi.mock('./ResourceUsageLog', () => ({
    default: ({ open, typeName }: { open: boolean; typeName?: string }) => (open ? <div data-testid="usage-log">{typeName}</div> : null),
}));

vi.mock('./StockActionDialog', () => ({
    default: ({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: (message: string, severity?: 'success' | 'error') => void }) =>
        open ? (
            <div data-testid="stock-action-dialog">
                <button onClick={onClose}>Close stock dialog</button>
                <button onClick={() => onSuccess('Stock updated')}>Trigger success</button>
            </div>
        ) : null,
}));

vi.mock('@/api/resources', () => ({
    fetchResourceInterventionLocation: vi.fn(),
}));

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderWithProviders = (component: ReactElement) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>{component}</ThemeProvider>
        </QueryClientProvider>,
    );
};

const createMockResourceType = (overrides?: Partial<ResourceType>): ResourceType => ({
    id: 'type-1',
    name: 'Sandbags',
    unit: 'bags',
    isActive: true,
    locations: [
        {
            id: 'loc-1',
            name: 'Depot A',
            geometry: { type: 'Point', coordinates: [-1.5, 51] },
            currentStock: 50,
            maxCapacity: 100,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        },
    ],
    ...overrides,
});

describe('ResourcesView', () => {
    const defaultProps = {
        onClose: vi.fn(),
        scenarioId: 'scenario-1',
        isLoading: false,
        isError: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        capturedMutationOptions = undefined;
    });

    it('renders loading state', () => {
        renderWithProviders(<ResourcesView {...defaultProps} isLoading={true} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders error state', () => {
        renderWithProviders(<ResourcesView {...defaultProps} isError={true} />);

        expect(screen.getByText('Failed to load resources')).toBeInTheDocument();
    });

    it('renders resource types in accordions', () => {
        const resourceTypes = [createMockResourceType(), createMockResourceType({ id: 'type-2', name: 'Pumps', unit: 'units', locations: [] })];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        expect(screen.getByText('Sandbags (1)')).toBeInTheDocument();
        expect(screen.getByText('Pumps (0)')).toBeInTheDocument();
    });

    it('renders location names and stock info', () => {
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        expect(screen.getByText('Depot A')).toBeInTheDocument();
        expect(screen.getByText('50 / 100 bags')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();

        renderWithProviders(<ResourcesView {...defaultProps} onClose={onClose} resourceTypes={[]} />);

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onLocationSelect when location is clicked', () => {
        const onLocationSelect = vi.fn();
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} onLocationSelect={onLocationSelect} />);

        fireEvent.click(screen.getByText('Depot A'));

        expect(onLocationSelect).toHaveBeenCalledWith('loc-1');
    });

    it('renders header with title', () => {
        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={[]} />);

        expect(screen.getByText('Resources')).toBeInTheDocument();
    });

    it('renders stock progress bar for locations', () => {
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
    });

    it('renders manage stock button for each location', () => {
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        expect(screen.getByLabelText('Manage stock for Depot A')).toBeInTheDocument();
    });

    it('auto-expands active resource types on initial load', async () => {
        const resourceTypes = [
            createMockResourceType({ id: 'type-1', isActive: true }),
            createMockResourceType({ id: 'type-2', name: 'Pumps', isActive: false, locations: [] }),
        ];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        await waitFor(() => {
            expect(screen.getByText('Depot A')).toBeInTheDocument();
        });
    });

    it('opens stock action dialog from manage stock action button', () => {
        const resourceTypes = [createMockResourceType()];
        const onLocationSelect = vi.fn();

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} onLocationSelect={onLocationSelect} />);

        fireEvent.click(screen.getByLabelText('Manage stock for Depot A'));

        expect(onLocationSelect).toHaveBeenCalledWith('loc-1');
        expect(screen.getByTestId('stock-action-dialog')).toBeInTheDocument();
    });

    it('opens stock action dialog on row double click and closes with callback', () => {
        const resourceTypes = [createMockResourceType()];
        const onStockActionClose = vi.fn();

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} onStockActionClose={onStockActionClose} />);

        fireEvent.doubleClick(screen.getByText('Depot A'));
        expect(screen.getByTestId('stock-action-dialog')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Close stock dialog' }));
        expect(onStockActionClose).toHaveBeenCalled();
    });

    it('shows success snackbar when stock dialog reports success', () => {
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        fireEvent.click(screen.getByLabelText('Manage stock for Depot A'));
        fireEvent.click(screen.getByRole('button', { name: 'Trigger success' }));

        expect(screen.getByText('Stock updated')).toBeInTheDocument();
    });

    it('opens usage log dialog from inventory log button', () => {
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        fireEvent.click(screen.getByRole('button', { name: 'View inventory log →' }));

        expect(screen.getByTestId('usage-log')).toHaveTextContent('Sandbags');
    });

    it('toggles resource visibility using IconToggle', () => {
        const resourceTypes = [createMockResourceType({ isActive: true })];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);

        fireEvent.click(screen.getByLabelText('Hide Sandbags'));

        expect(mockToggleVisibility).toHaveBeenCalledWith(
            { resourceTypeId: 'type-1', isActive: false },
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
    });

    it('expands accordion for externally selected location', () => {
        const resourceTypes = [createMockResourceType({ isActive: false })];
        const { rerender } = renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} selectedLocationId={null} />);
        const summary = screen.getByRole('button', { name: 'Sandbags (1)' });

        expect(summary).toHaveAttribute('aria-expanded', 'false');

        rerender(
            <QueryClientProvider client={createTestQueryClient()}>
                <ThemeProvider theme={theme}>
                    <ResourcesView {...defaultProps} resourceTypes={resourceTypes} selectedLocationId="loc-1" />
                </ThemeProvider>
            </QueryClientProvider>,
        );

        expect(screen.getByRole('button', { name: 'Sandbags (1)' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('opens stock action dialog from controlled prop', () => {
        const resourceTypes = [createMockResourceType()];

        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} stockActionOpen={true} />);

        expect(screen.getByTestId('stock-action-dialog')).toBeInTheDocument();
    });

    it('shows snackbar when resource mutation error callback is invoked', () => {
        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={[createMockResourceType()]} />);

        act(() => {
            capturedMutationOptions?.onError?.('Mutation failed');
        });

        expect(screen.getByText('Mutation failed')).toBeInTheDocument();
    });

    it('expands an inactive type after successful visibility toggle', () => {
        const resourceTypes = [createMockResourceType({ isActive: false })];
        renderWithProviders(<ResourcesView {...defaultProps} resourceTypes={resourceTypes} />);
        const summary = screen.getByRole('button', { name: 'Sandbags (1)' });

        expect(summary).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(screen.getByLabelText('Show Sandbags'));

        const call = mockToggleVisibility.mock.calls[0];
        const options = call?.[1] as { onSuccess?: () => void } | undefined;
        act(() => {
            options?.onSuccess?.();
        });

        expect(screen.getByRole('button', { name: 'Sandbags (1)' })).toHaveAttribute('aria-expanded', 'true');
    });
});
