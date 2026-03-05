// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StockActionDialog } from './StockActionDialog';
import { fetchResourceInterventionLocation } from '@/api/resources';
import type { ResourceLocation } from '@/api/resources';
import theme from '@/theme';

vi.mock('@/api/resources', () => ({
    fetchResourceInterventionLocation: vi.fn(),
}));

const mockedFetchLocation = vi.mocked(fetchResourceInterventionLocation);

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

const mockLocation: ResourceLocation = {
    id: 'loc-1',
    name: 'Depot Alpha',
    geometry: { type: 'Point', coordinates: [-1.5, 51] },
    currentStock: 50,
    maxCapacity: 100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

describe('StockActionDialog', () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
        scenarioId: 'scenario-1',
        locationId: 'loc-1',
        withdrawStock: vi.fn(),
        restockLocation: vi.fn(),
        isMutating: false,
        onSuccess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when open is false', () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        const { container } = renderWithProviders(<StockActionDialog {...defaultProps} open={false} />);

        expect(container.innerHTML).toBe('');
    });

    it('renders loading state', () => {
        mockedFetchLocation.mockReturnValue(new Promise(() => {}));

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders location name and stock info', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
            expect(screen.getByText('Current Stock: 50 / 100')).toBeInTheDocument();
        });
    });

    it('defaults to Withdraw tab', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: 'Withdraw', selected: true })).toBeInTheDocument();
        });
    });

    it('defaults to Restock tab when stock is zero', async () => {
        mockedFetchLocation.mockResolvedValue({ ...mockLocation, currentStock: 0 });

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByRole('tab', { name: 'Restock', selected: true })).toBeInTheDocument();
        });
    });

    it('shows disabled field with helper text when no stock to withdraw', async () => {
        mockedFetchLocation.mockResolvedValue({ ...mockLocation, currentStock: 0 });

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Restock')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('tab', { name: 'Withdraw' }));

        await waitFor(() => {
            expect(screen.getByText('No stock available')).toBeInTheDocument();
            expect(screen.getByRole('spinbutton')).toBeDisabled();
        });
    });

    it('shows disabled field when at max capacity on restock tab', async () => {
        mockedFetchLocation.mockResolvedValue({ ...mockLocation, currentStock: 100, maxCapacity: 100 });

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('tab', { name: 'Restock' }));

        await waitFor(() => {
            expect(screen.getByText('At max capacity')).toBeInTheDocument();
            expect(screen.getByRole('spinbutton')).toBeDisabled();
        });
    });

    it('shows withdraw validation error when exceeding stock', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '999' } });

        await waitFor(() => {
            expect(screen.getByText('Insufficient stock. Available: 50')).toBeInTheDocument();
        });
    });

    it('shows restock validation error when exceeding capacity', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('tab', { name: 'Restock' }));
        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '999' } });

        await waitFor(() => {
            expect(screen.getByText('Exceeds capacity. Available space: 50')).toBeInTheDocument();
        });
    });

    it('clears quantity when switching tabs', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
        });

        const input = screen.getByRole('spinbutton');
        fireEvent.change(input, { target: { value: '10' } });
        expect(input).toHaveValue(10);

        fireEvent.click(screen.getByRole('tab', { name: 'Restock' }));

        expect(input).toHaveValue(null);
    });

    it('calls withdrawStock on submit', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '10' } });
        fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

        expect(defaultProps.withdrawStock).toHaveBeenCalledWith(
            { locationId: 'loc-1', quantity: 10 },
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
    });

    it('calls restockLocation on submit', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('tab', { name: 'Restock' }));
        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '10' } });
        fireEvent.click(screen.getByRole('button', { name: 'Restock' }));

        expect(defaultProps.restockLocation).toHaveBeenCalledWith(
            { locationId: 'loc-1', quantity: 10 },
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
    });

    it('calls onClose when cancel is clicked', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(defaultProps.onClose).toHaveBeenCalledOnce();
    });

    it('disables submit button when quantity is empty', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
    });

    it('disables buttons while mutating', async () => {
        mockedFetchLocation.mockResolvedValue(mockLocation);

        renderWithProviders(<StockActionDialog {...defaultProps} isMutating={true} />);

        await waitFor(() => {
            expect(screen.getByText('Depot Alpha')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        expect(screen.getByRole('spinbutton')).toBeDisabled();
    });
});
