// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FocusAreaSelector from './FocusAreaSelector';
import { fetchFocusAreas, type FocusArea } from '@/api/focus-areas';
import theme from '@/theme';

vi.mock('@/api/focus-areas', () => ({
    fetchFocusAreas: vi.fn(),
}));

const mockedFetchFocusAreas = vi.mocked(fetchFocusAreas);

describe('FocusAreaSelector', () => {
    let queryClient: QueryClient;

    const defaultProps = {
        scenarioId: 'scenario-123',
        selectedFocusAreaId: null,
        onFocusAreaSelect: vi.fn(),
    };

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
        vi.clearAllMocks();
    });

    const renderWithProviders = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <ThemeProvider theme={theme}>{component}</ThemeProvider>
            </QueryClientProvider>,
        );
    };

    const createMockFocusArea = (overrides?: Partial<FocusArea>): FocusArea => ({
        id: 'focus-area-1',
        name: 'Test Focus Area',
        geometry: null,
        filterMode: 'by_asset_type',
        isActive: true,
        isSystem: false,
        ...overrides,
    });

    describe('Rendering', () => {
        it('renders with default label', async () => {
            mockedFetchFocusAreas.mockResolvedValue([]);
            renderWithProviders(<FocusAreaSelector {...defaultProps} />);

            expect(screen.getByLabelText('Select focus area')).toBeInTheDocument();
        });

        it('renders with custom label', async () => {
            mockedFetchFocusAreas.mockResolvedValue([]);
            renderWithProviders(<FocusAreaSelector {...defaultProps} label="Focus area" />);

            expect(screen.getByLabelText('Focus area')).toBeInTheDocument();
        });

        it('renders focus areas as options', async () => {
            const focusAreas = [createMockFocusArea({ id: 'fa-1', name: 'Area One' }), createMockFocusArea({ id: 'fa-2', name: 'Area Two' })];
            mockedFetchFocusAreas.mockResolvedValue(focusAreas);

            renderWithProviders(<FocusAreaSelector {...defaultProps} />);

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalledWith('scenario-123');
            });

            const select = screen.getByRole('combobox');
            await userEvent.click(select);

            expect(screen.getByRole('option', { name: 'Area One' })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: 'Area Two' })).toBeInTheDocument();
        });

        it('displays selected focus area name', async () => {
            const focusAreas = [createMockFocusArea({ id: 'fa-1', name: 'Selected Area' })];
            mockedFetchFocusAreas.mockResolvedValue(focusAreas);

            renderWithProviders(<FocusAreaSelector {...defaultProps} selectedFocusAreaId="fa-1" />);

            await waitFor(() => {
                expect(screen.getByRole('combobox')).toHaveTextContent('Selected Area');
            });
        });
    });

    describe('Selection', () => {
        it('calls onFocusAreaSelect when option is selected', async () => {
            const onFocusAreaSelect = vi.fn();
            const focusAreas = [createMockFocusArea({ id: 'fa-1', name: 'Area One' })];
            mockedFetchFocusAreas.mockResolvedValue(focusAreas);

            renderWithProviders(<FocusAreaSelector {...defaultProps} onFocusAreaSelect={onFocusAreaSelect} />);

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalled();
            });

            const select = screen.getByRole('combobox');
            await userEvent.click(select);
            await userEvent.click(screen.getByRole('option', { name: 'Area One' }));

            expect(onFocusAreaSelect).toHaveBeenCalledWith('fa-1');
        });
    });

    describe('Disabled state', () => {
        it('is disabled when disabled prop is true', async () => {
            mockedFetchFocusAreas.mockResolvedValue([]);
            renderWithProviders(<FocusAreaSelector {...defaultProps} disabled />);

            const select = screen.getByRole('combobox');
            expect(select).toHaveAttribute('aria-disabled', 'true');
        });

        it('is disabled while loading', async () => {
            const pendingPromise = new Promise<never>(() => {});
            mockedFetchFocusAreas.mockReturnValue(pendingPromise);
            renderWithProviders(<FocusAreaSelector {...defaultProps} />);

            const select = screen.getByRole('combobox');
            expect(select).toHaveAttribute('aria-disabled', 'true');
        });
    });

    describe('Edge cases', () => {
        it('shows empty value when selectedFocusAreaId does not match any focus area', async () => {
            const focusAreas = [createMockFocusArea({ id: 'fa-1', name: 'Area One' })];
            mockedFetchFocusAreas.mockResolvedValue(focusAreas);

            renderWithProviders(<FocusAreaSelector {...defaultProps} selectedFocusAreaId="non-existent" />);

            await waitFor(() => {
                expect(mockedFetchFocusAreas).toHaveBeenCalled();
            });

            const select = screen.getByRole('combobox');
            expect(select).not.toHaveTextContent('Area One');
        });

        it('does not fetch when scenarioId is undefined', () => {
            mockedFetchFocusAreas.mockResolvedValue([]);
            renderWithProviders(<FocusAreaSelector {...defaultProps} scenarioId={undefined} />);

            expect(mockedFetchFocusAreas).not.toHaveBeenCalled();
        });
    });
});
