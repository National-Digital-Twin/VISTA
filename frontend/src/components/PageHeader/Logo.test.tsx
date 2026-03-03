import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Logo from './Logo';
import theme from '@/theme';

const mockUseMediaQuery = vi.fn();

vi.mock('@mui/material', async () => {
    const actual = await vi.importActual('@mui/material');
    return {
        ...actual,
        useMediaQuery: () => mockUseMediaQuery(),
    };
});

const renderWithProviders = (component: React.ReactElement, isMobile = false) => {
    mockUseMediaQuery.mockReturnValue(isMobile);
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('Logo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseMediaQuery.mockReturnValue(false);
    });

    it('renders the logo image with correct alt text', () => {
        renderWithProviders(<Logo appName="VISTA" />, false);

        const logo = screen.getByAltText('VISTA Logo');
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', '/logo.svg');
    });

    it('renders mobile logo when on mobile', () => {
        renderWithProviders(<Logo appName="VISTA" />, true);

        const logo = screen.getByAltText('VISTA Logo');
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', '/logo-mobile.svg');
    });

    it('renders mobile menu button when on mobile', () => {
        const handleMobileMenuClick = vi.fn();
        renderWithProviders(<Logo appName="VISTA" onMobileMenuClick={handleMobileMenuClick} />, true);

        const menuButton = screen.getByLabelText('mobile menu');
        expect(menuButton).toBeInTheDocument();

        fireEvent.click(menuButton);
        expect(handleMobileMenuClick).toHaveBeenCalledTimes(1);
    });

    it('does not render mobile menu button when not on mobile', () => {
        renderWithProviders(<Logo appName="VISTA" onMobileMenuClick={vi.fn()} />, false);

        expect(screen.queryByLabelText('mobile menu')).not.toBeInTheDocument();
    });

    it('renders mobile menu button when on mobile even if onMobileMenuClick is not provided', () => {
        renderWithProviders(<Logo appName="VISTA" />, true);

        const menuButton = screen.getByLabelText('mobile menu');
        expect(menuButton).toBeInTheDocument();
    });

    it('renders logo with correct styling', () => {
        renderWithProviders(<Logo appName="VISTA" />, false);

        const logo = screen.getByAltText('VISTA Logo');
        expect(logo).toHaveStyle({
            height: '1.25rem',
            objectFit: 'contain',
        });
    });
});
