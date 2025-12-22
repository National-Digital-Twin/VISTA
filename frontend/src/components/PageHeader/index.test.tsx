import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import PageHeader from './index';
import theme from '@/theme';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

const mockUseMediaQuery = vi.fn();

vi.mock('@mui/material', async () => {
    const actual = await vi.importActual('@mui/material');
    return {
        ...actual,
        useMediaQuery: () => mockUseMediaQuery(),
    };
});

vi.mock('./Logo', () => ({
    default: ({ appName, onMobileMenuClick }: { appName: string; onMobileMenuClick?: () => void }) => (
        <button
            type="button"
            data-testid="logo"
            onClick={onMobileMenuClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onMobileMenuClick?.();
                }
            }}
        >
            Logo: {appName}
        </button>
    ),
}));

vi.mock('./Navigation', () => ({
    default: ({ onNavigationClick }: { onNavigationClick?: (item: string) => void }) => (
        <div data-testid="navigation">
            <button onClick={() => onNavigationClick?.('Data room')}>Data room</button>
            <button onClick={() => onNavigationClick?.('Map')}>Map</button>
        </div>
    ),
}));

vi.mock('./Notifications', () => ({
    default: ({ onClick }: { onClick?: () => void }) => (
        <button data-testid="notifications" onClick={onClick}>
            Notifications
        </button>
    ),
}));

vi.mock('./UserMenu', () => ({
    default: ({ onMyProfileClick, onAdminSettingsClick, onPrivacyClick }: any) => (
        <div data-testid="user-menu">
            <button onClick={onMyProfileClick}>My Profile</button>
            <button onClick={onAdminSettingsClick}>Admin Settings</button>
            <button onClick={onPrivacyClick}>Privacy</button>
        </div>
    ),
}));

vi.mock('./MobileMenu', () => ({
    default: ({ isOpen, onClose: _onClose, appName }: { isOpen: boolean; onClose: () => void; appName: string }) =>
        isOpen ? <div data-testid="mobile-menu">MobileMenu: {appName}</div> : null,
}));

const mockUseActiveScenario = vi.fn();
vi.mock('@/hooks/useActiveScenario', () => ({
    useActiveScenario: () => mockUseActiveScenario(),
}));

const mockUseUserData = vi.fn();
vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
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

const renderWithProviders = (component: React.ReactElement, isMobile = false) => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);

    mockUseMediaQuery.mockReturnValue(isMobile);

    const queryClient = createTestQueryClient();
    return {
        ...render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider theme={theme}>{component}</ThemeProvider>
                </QueryClientProvider>
            </MemoryRouter>,
        ),
        navigate,
    };
};

describe('PageHeader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseMediaQuery.mockReturnValue(false);
        mockUseActiveScenario.mockReturnValue({ data: null });
        mockUseUserData.mockReturnValue({ getUserType: () => 'General' });
    });

    it('renders PageHeader with app name', () => {
        renderWithProviders(<PageHeader appName="VISTA" />);

        expect(screen.getByTestId('logo')).toHaveTextContent('Logo: VISTA');
    });

    it('renders Logo component', () => {
        renderWithProviders(<PageHeader appName="VISTA" />);

        expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('renders Navigation component', () => {
        renderWithProviders(<PageHeader appName="VISTA" />);

        expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    it('renders Notifications component', () => {
        renderWithProviders(<PageHeader appName="VISTA" />);

        expect(screen.getByTestId('notifications')).toBeInTheDocument();
    });

    it('renders UserMenu component', () => {
        renderWithProviders(<PageHeader appName="VISTA" />);

        expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('navigates to /data-room when Data room is clicked', () => {
        const { navigate } = renderWithProviders(<PageHeader appName="VISTA" />);

        const dataRoomButton = screen.getByText('Data room');
        fireEvent.click(dataRoomButton);

        expect(navigate).toHaveBeenCalledWith('/data-room');
    });

    it('navigates to / when Map is clicked', () => {
        const { navigate } = renderWithProviders(<PageHeader appName="VISTA" />);

        const mapButton = screen.getByText('Map');
        fireEvent.click(mapButton);

        expect(navigate).toHaveBeenCalledWith('/');
    });

    it('navigates to /notifications when notifications is clicked', () => {
        const { navigate } = renderWithProviders(<PageHeader appName="VISTA" />);

        const notificationsButton = screen.getByTestId('notifications');
        fireEvent.click(notificationsButton);

        expect(navigate).toHaveBeenCalledWith('/notifications');
    });

    it('navigates to /profile when My Profile is clicked', () => {
        const { navigate } = renderWithProviders(<PageHeader appName="VISTA" />);

        const profileButton = screen.getByText('My Profile');
        fireEvent.click(profileButton);

        expect(navigate).toHaveBeenCalledWith('/profile');
    });

    it('navigates to /admin when Admin Settings is clicked', () => {
        const { navigate } = renderWithProviders(<PageHeader appName="VISTA" />);

        const adminButton = screen.getByText('Admin Settings');
        fireEvent.click(adminButton);

        expect(navigate).toHaveBeenCalledWith('/admin');
    });

    it('navigates to /privacy when Privacy is clicked', () => {
        const { navigate } = renderWithProviders(<PageHeader appName="VISTA" />);

        const privacyButton = screen.getByText('Privacy');
        fireEvent.click(privacyButton);

        expect(navigate).toHaveBeenCalledWith('/privacy');
    });

    it('opens mobile menu when logo is clicked on mobile', () => {
        renderWithProviders(<PageHeader appName="VISTA" />, true);

        const logo = screen.getByTestId('logo');
        fireEvent.click(logo);

        expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    });

    it('renders mobile menu when isMobileMenuOpen is true', () => {
        renderWithProviders(<PageHeader appName="VISTA" />, true);

        const logo = screen.getByTestId('logo');
        fireEvent.click(logo);

        expect(screen.getByTestId('mobile-menu')).toHaveTextContent('MobileMenu: VISTA');
    });

    it('does not render mobile menu when not on mobile', () => {
        renderWithProviders(<PageHeader appName="VISTA" />, false);

        expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    it('has correct AppBar styling', () => {
        const { container } = renderWithProviders(<PageHeader appName="VISTA" />);

        const appBar = container.querySelector('.MuiAppBar-root');
        expect(appBar).toBeInTheDocument();
    });

    it('logs unknown navigation item to console', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        renderWithProviders(<PageHeader appName="VISTA" />);

        const navigation = screen.getByTestId('navigation');
        const unknownButton = document.createElement('button');
        unknownButton.textContent = 'Unknown';
        unknownButton.onclick = () => {
            const event = new Event('click');
            const button = navigation.querySelector('button');
            if (button) {
                fireEvent(button, event);
            }
        };

        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    describe('Scenario Name Display', () => {
        it('displays scenario name when active scenario exists', () => {
            mockUseActiveScenario.mockReturnValue({
                data: { id: 'scenario-1', name: 'Flood in Newport', isActive: true },
            });

            renderWithProviders(<PageHeader appName="VISTA" />);

            expect(screen.getByText('Flood in Newport')).toBeInTheDocument();
        });

        it('does not display scenario name when no active scenario', () => {
            mockUseActiveScenario.mockReturnValue({ data: null });

            renderWithProviders(<PageHeader appName="VISTA" />);

            expect(screen.queryByText('Flood in Newport')).not.toBeInTheDocument();
        });

        it('does not display scenario name when active scenario has no name', () => {
            mockUseActiveScenario.mockReturnValue({
                data: { id: 'scenario-1', name: '', isActive: true },
            });

            renderWithProviders(<PageHeader appName="VISTA" />);

            const scenarioElements = screen.queryAllByText(/Flood|Newport|Scenario/);
            expect(scenarioElements.length).toBe(0);
        });

        it('displays scenario name as plain text for non-admin users', () => {
            mockUseActiveScenario.mockReturnValue({
                data: { id: 'scenario-1', name: 'Flood in Newport', isActive: true },
            });
            mockUseUserData.mockReturnValue({ getUserType: () => 'General' });

            renderWithProviders(<PageHeader appName="VISTA" />);

            const scenarioText = screen.getByText('Flood in Newport');
            expect(scenarioText).toBeInTheDocument();
            expect(scenarioText.tagName).toBe('H6');
        });

        it('displays scenario name as clickable link for admin users', () => {
            mockUseActiveScenario.mockReturnValue({
                data: { id: 'scenario-1', name: 'Flood in Newport', isActive: true },
            });
            mockUseUserData.mockReturnValue({ getUserType: () => 'Admin' });

            renderWithProviders(<PageHeader appName="VISTA" />);

            const scenarioLink = screen.getByText('Flood in Newport');
            expect(scenarioLink).toBeInTheDocument();
            expect(scenarioLink.closest('button')).toBeInTheDocument();
        });

        it('navigates to data-room with query parameter when admin clicks scenario name', () => {
            mockUseActiveScenario.mockReturnValue({
                data: { id: 'scenario-1', name: 'Flood in Newport', isActive: true },
            });
            mockUseUserData.mockReturnValue({ getUserType: () => 'Admin' });

            const { navigate } = renderWithProviders(<PageHeader appName="VISTA" />);

            const scenarioLink = screen.getByText('Flood in Newport');
            fireEvent.click(scenarioLink);

            expect(navigate).toHaveBeenCalledWith('/data-room?openScenarioModal=true');
        });

        it('does not navigate when non-admin clicks scenario name', () => {
            mockUseActiveScenario.mockReturnValue({
                data: { id: 'scenario-1', name: 'Flood in Newport', isActive: true },
            });
            mockUseUserData.mockReturnValue({ getUserType: () => 'General' });

            const { navigate } = renderWithProviders(<PageHeader appName="VISTA" />);

            const scenarioText = screen.getByText('Flood in Newport');
            fireEvent.click(scenarioText);

            expect(navigate).not.toHaveBeenCalled();
        });

        it('updates scenario name when active scenario changes', () => {
            const { rerender } = renderWithProviders(<PageHeader appName="VISTA" />);

            mockUseActiveScenario.mockReturnValue({
                data: { id: 'scenario-1', name: 'Flood in Newport', isActive: true },
            });

            rerender(
                <MemoryRouter>
                    <QueryClientProvider client={createTestQueryClient()}>
                        <ThemeProvider theme={theme}>
                            <PageHeader appName="VISTA" />
                        </ThemeProvider>
                    </QueryClientProvider>
                </MemoryRouter>,
            );

            expect(screen.getByText('Flood in Newport')).toBeInTheDocument();

            mockUseActiveScenario.mockReturnValue({
                data: { id: 'scenario-2', name: 'Landslide in Ventnor', isActive: true },
            });

            rerender(
                <MemoryRouter>
                    <QueryClientProvider client={createTestQueryClient()}>
                        <ThemeProvider theme={theme}>
                            <PageHeader appName="VISTA" />
                        </ThemeProvider>
                    </QueryClientProvider>
                </MemoryRouter>,
            );

            expect(screen.queryByText('Flood in Newport')).not.toBeInTheDocument();
            expect(screen.getByText('Landslide in Ventnor')).toBeInTheDocument();
        });
    });
});
