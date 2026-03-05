// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navigation from './Navigation';
import theme from '@/theme';

const mockUseNavigation = vi.fn();

vi.mock('@/hooks/useNavigation', () => ({
    useNavigation: () => mockUseNavigation(),
}));

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <MemoryRouter>
            <ThemeProvider theme={theme}>{component}</ThemeProvider>
        </MemoryRouter>,
    );
};

describe('Navigation', () => {
    const mockNavigationItems = [
        { to: '/data-room', label: 'Data room' },
        { to: '/', label: 'Map' },
    ];

    const setupMockUseNavigation = (overrides = {}) => {
        mockUseNavigation.mockReturnValue({
            navigationItems: mockNavigationItems,
            isActive: (path: string) => path === '/',
            handleNavigationClick: vi.fn(),
            isMobile: false,
            ...overrides,
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        setupMockUseNavigation();
    });

    it('renders navigation buttons for each item', () => {
        renderWithProviders(<Navigation />);

        expect(screen.getByText('Data room')).toBeInTheDocument();
        expect(screen.getByText('Map')).toBeInTheDocument();
    });

    it('calls onNavigationClick when a button is clicked', () => {
        const onNavigationClick = vi.fn();
        renderWithProviders(<Navigation onNavigationClick={onNavigationClick} />);

        const dataRoomButton = screen.getByText('Data room');
        fireEvent.click(dataRoomButton);

        expect(onNavigationClick).toHaveBeenCalledWith('Data room');
    });

    it('calls handleNavigationClick from useNavigation when clicked', () => {
        const handleNavigationClick = vi.fn();
        setupMockUseNavigation({ handleNavigationClick });

        renderWithProviders(<Navigation />);

        const mapButton = screen.getByText('Map');
        fireEvent.click(mapButton);

        expect(handleNavigationClick).toHaveBeenCalledWith({ to: '/', label: 'Map' });
    });

    it('highlights active navigation item', () => {
        setupMockUseNavigation({
            isActive: (path: string) => path === '/',
        });

        renderWithProviders(<Navigation />);

        const mapButton = screen.getByText('Map');
        expect(mapButton).toHaveStyle({ fontWeight: 600 });
    });

    it('does not highlight inactive navigation item', () => {
        setupMockUseNavigation({
            isActive: (path: string) => path === '/',
        });

        renderWithProviders(<Navigation />);

        const dataRoomButton = screen.getByText('Data room');
        expect(dataRoomButton).toHaveStyle({ fontWeight: 500 });
    });

    it('returns null when on mobile', () => {
        setupMockUseNavigation({ isMobile: true });

        const { container } = renderWithProviders(<Navigation />);

        expect(container.firstChild).toBeNull();
    });

    it('renders navigation buttons with correct styling', () => {
        renderWithProviders(<Navigation />);

        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
            expect(button).toHaveStyle({ textTransform: 'uppercase' });
        });
    });
});
