import { ThemeProvider } from '@mui/material/styles';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MobileMenu from './MobileMenu';
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

describe('MobileMenu', () => {
    const mockNavigationItems = [
        { to: '/data-room', label: 'Data room' },
        { to: '/', label: 'Map' },
    ];

    const setupMockUseNavigation = (overrides = {}) => {
        mockUseNavigation.mockReturnValue({
            navigationItems: mockNavigationItems,
            isActive: (path: string) => path === '/',
            handleNavigationClick: vi.fn(),
            isMobile: true,
            ...overrides,
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        setupMockUseNavigation();
    });

    it('renders drawer when open', () => {
        renderWithProviders(<MobileMenu isOpen={true} onClose={vi.fn()} appName="VISTA" />);

        const drawer = screen.getByRole('presentation');
        expect(drawer).toBeInTheDocument();
    });

    it('does not render drawer when closed', () => {
        const { container } = renderWithProviders(<MobileMenu isOpen={false} onClose={vi.fn()} appName="VISTA" />);

        const drawer = container.querySelector('[role="presentation"]');
        expect(drawer).not.toBeInTheDocument();
    });

    it('renders logo in header', () => {
        renderWithProviders(<MobileMenu isOpen={true} onClose={vi.fn()} appName="VISTA" />);

        const logo = screen.getByAltText('VISTA Logo');
        expect(logo).toBeInTheDocument();
    });

    it('renders close button when on mobile', () => {
        setupMockUseNavigation({ isMobile: true });
        renderWithProviders(<MobileMenu isOpen={true} onClose={vi.fn()} appName="VISTA" />);

        const closeIcon = screen.getByTestId('CloseIcon');
        const closeButton = closeIcon.closest('button');
        expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        setupMockUseNavigation({ isMobile: true });
        const onClose = vi.fn();
        renderWithProviders(<MobileMenu isOpen={true} onClose={onClose} appName="VISTA" />);

        const closeIcon = screen.getByTestId('CloseIcon');
        const closeButton = closeIcon.closest('button');
        if (closeButton) {
            fireEvent.click(closeButton);
            expect(onClose).toHaveBeenCalledTimes(1);
        }
    });

    it('calls onClose when logo is clicked', () => {
        const onClose = vi.fn();
        renderWithProviders(<MobileMenu isOpen={true} onClose={onClose} appName="VISTA" />);

        const logoButton = screen.getByAltText('VISTA Logo').closest('button');
        if (logoButton) {
            fireEvent.click(logoButton);
            expect(onClose).toHaveBeenCalledTimes(1);
        }
    });

    it('renders navigation items', () => {
        renderWithProviders(<MobileMenu isOpen={true} onClose={vi.fn()} appName="VISTA" />);

        expect(screen.getByText('Data room')).toBeInTheDocument();
        expect(screen.getByText('Map')).toBeInTheDocument();
    });

    it('calls onNavigationClick when navigation item is clicked', () => {
        const onNavigationClick = vi.fn();
        renderWithProviders(<MobileMenu isOpen={true} onClose={vi.fn()} onNavigationClick={onNavigationClick} appName="VISTA" />);

        const dataRoomItem = screen.getByText('Data room');
        fireEvent.click(dataRoomItem);

        expect(onNavigationClick).toHaveBeenCalledWith('Data room');
    });

    it('calls handleNavigationClick from useNavigation when item is clicked', () => {
        const handleNavigationClick = vi.fn();
        setupMockUseNavigation({ handleNavigationClick });

        renderWithProviders(<MobileMenu isOpen={true} onClose={vi.fn()} appName="VISTA" />);

        const mapItem = screen.getByText('Map');
        fireEvent.click(mapItem);

        expect(handleNavigationClick).toHaveBeenCalledWith({ to: '/', label: 'Map' });
    });

    it('calls onClose when navigation item is clicked', () => {
        const onClose = vi.fn();
        renderWithProviders(<MobileMenu isOpen={true} onClose={onClose} appName="VISTA" />);

        const dataRoomItem = screen.getByText('Data room');
        fireEvent.click(dataRoomItem);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('highlights active navigation item', () => {
        setupMockUseNavigation({
            isActive: (path: string) => path === '/',
        });

        renderWithProviders(<MobileMenu isOpen={true} onClose={vi.fn()} appName="VISTA" />);

        const mapItem = screen.getByText('Map').closest('[role="button"]');
        expect(mapItem).toHaveClass('Mui-selected');
    });
});
