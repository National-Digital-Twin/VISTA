// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResourceUsageLog } from './ResourceUsageLog';
import { fetchResourceInterventionActions } from '@/api/resources';
import theme from '@/theme';

vi.mock('@/api/resources', () => ({
    fetchResourceInterventionActions: vi.fn(),
    getResourceInterventionActionsExportUrl: vi.fn(() => '/test/export'),
}));

const mockedFetchActions = vi.mocked(fetchResourceInterventionActions);

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

describe('ResourceUsageLog', () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        scenarioId: 'scenario-1',
        typeId: 'type-1',
        typeName: 'Sandbags',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders dialog with type name in title', async () => {
        mockedFetchActions.mockResolvedValue({ totalCount: 0, results: [], nextCursor: null });

        renderWithProviders(<ResourceUsageLog {...defaultProps} />);

        expect(screen.getByText('Sandbag Inventory Logs')).toBeInTheDocument();
    });

    it('renders generic title when typeName is not provided', async () => {
        mockedFetchActions.mockResolvedValue({ totalCount: 0, results: [], nextCursor: null });

        renderWithProviders(<ResourceUsageLog {...defaultProps} typeName={undefined} />);

        expect(screen.getByText('Inventory Logs')).toBeInTheDocument();
    });

    it('renders loading state', () => {
        mockedFetchActions.mockReturnValue(new Promise(() => {}));

        renderWithProviders(<ResourceUsageLog {...defaultProps} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders empty state when no actions', async () => {
        mockedFetchActions.mockResolvedValue({ totalCount: 0, results: [], nextCursor: null });

        renderWithProviders(<ResourceUsageLog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('No resource actions yet')).toBeInTheDocument();
        });
    });

    it('renders action data in table', async () => {
        mockedFetchActions.mockResolvedValue({
            totalCount: 1,
            results: [
                {
                    id: 'action-1',
                    locationId: 'loc-1',
                    locationName: 'Depot A',
                    resourceType: 'Sandbags',
                    actionType: 'withdraw',
                    quantity: 10,
                    user: { id: 'user-1', name: 'John Doe' },
                    createdAt: '2024-06-15T10:30:00Z',
                },
            ],
            nextCursor: null,
        });

        renderWithProviders(<ResourceUsageLog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot A')).toBeInTheDocument();
            expect(screen.getByText('Withdraw')).toBeInTheDocument();
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        const quantityCells = screen.getAllByText('10');
        expect(quantityCells.length).toBeGreaterThanOrEqual(1);
    });

    it('renders user id when user name is null', async () => {
        mockedFetchActions.mockResolvedValue({
            totalCount: 1,
            results: [
                {
                    id: 'action-1',
                    locationId: 'loc-1',
                    locationName: 'Depot A',
                    resourceType: 'Sandbags',
                    actionType: 'restock',
                    quantity: 20,
                    user: { id: 'user-1', name: null },
                    createdAt: '2024-06-15T10:30:00Z',
                },
            ],
            nextCursor: null,
        });

        renderWithProviders(<ResourceUsageLog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('user-1')).toBeInTheDocument();
            expect(screen.getByText('Restock')).toBeInTheDocument();
        });
    });

    it('does not render when open is false', () => {
        renderWithProviders(<ResourceUsageLog {...defaultProps} open={false} />);

        expect(screen.queryByText('Sandbag Inventory Logs')).not.toBeInTheDocument();
    });

    it('renders Export CSV button', async () => {
        mockedFetchActions.mockResolvedValue({ totalCount: 0, results: [], nextCursor: null });

        renderWithProviders(<ResourceUsageLog {...defaultProps} />);

        expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('Export CSV button is disabled when typeId is not provided', async () => {
        mockedFetchActions.mockResolvedValue({ totalCount: 0, results: [], nextCursor: null });

        renderWithProviders(<ResourceUsageLog {...defaultProps} typeId={undefined} />);

        expect(screen.getByText('Export CSV')).toBeDisabled();
    });

    it('Export CSV button triggers download when clicked', async () => {
        mockedFetchActions.mockResolvedValue({ totalCount: 0, results: [], nextCursor: null });

        renderWithProviders(<ResourceUsageLog {...defaultProps} />);

        const appendSpy = vi.spyOn(document.body, 'appendChild');
        const removeSpy = vi.spyOn(document.body, 'removeChild');

        screen.getByText('Export CSV').click();

        expect(appendSpy).toHaveBeenCalled();
        const link = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
        expect(link.tagName).toBe('A');
        expect(link.href).toContain('export');
        expect(removeSpy).toHaveBeenCalled();

        appendSpy.mockRestore();
        removeSpy.mockRestore();
    });
});
