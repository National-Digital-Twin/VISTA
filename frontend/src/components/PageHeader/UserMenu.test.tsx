import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import UserMenu from './UserMenu';
import theme from '@/theme';

const mockUseUserData = vi.fn();

vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

vi.mock('@/utils/signout', () => ({
    signout: vi.fn(),
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

describe('UserMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUserData.mockReturnValue({
            getUserDisplayName: () => 'John Doe',
            getUserEmailDomain: () => 'example.com',
            loading: false,
        });
    });

    it('renders user menu button', () => {
        renderWithProviders(<UserMenu />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        expect(button).toBeInTheDocument();
    });

    it('opens menu when button is clicked', async () => {
        renderWithProviders(<UserMenu />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        expect(button).toBeInTheDocument();
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            expect(screen.getByRole('menu')).toBeInTheDocument();
        });
    });

    it('displays user display name in menu', async () => {
        renderWithProviders(<UserMenu />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });

    it('displays user email domain in menu', async () => {
        renderWithProviders(<UserMenu />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            expect(screen.getByText('example.com')).toBeInTheDocument();
        });
    });

    it('displays loading state when user data is loading', async () => {
        mockUseUserData.mockReturnValue({
            getUserDisplayName: () => 'John Doe',
            getUserEmailDomain: () => 'example.com',
            loading: true,
        });
        renderWithProviders(<UserMenu />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            expect(screen.getAllByText('Loading...')).toHaveLength(2);
        });
    });

    it('calls onMyProfileClick when My Profile is clicked', async () => {
        const onMyProfileClick = vi.fn();
        renderWithProviders(<UserMenu onMyProfileClick={onMyProfileClick} />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            const profileItem = screen.getByText('My Profile');
            fireEvent.click(profileItem);
        });

        expect(onMyProfileClick).toHaveBeenCalledTimes(1);
    });

    it('calls onAdminSettingsClick when Admin Settings is clicked', async () => {
        const onAdminSettingsClick = vi.fn();
        renderWithProviders(<UserMenu onAdminSettingsClick={onAdminSettingsClick} />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            const adminItem = screen.getByText('Admin Settings');
            fireEvent.click(adminItem);
        });

        expect(onAdminSettingsClick).toHaveBeenCalledTimes(1);
    });

    it('calls onPrivacyClick when Privacy notice is clicked', async () => {
        const onPrivacyClick = vi.fn();
        renderWithProviders(<UserMenu onPrivacyClick={onPrivacyClick} />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            const privacyItem = screen.getByText('Privacy notice');
            fireEvent.click(privacyItem);
        });

        expect(onPrivacyClick).toHaveBeenCalledTimes(1);
    });

    it('calls signout when Sign Out is clicked', async () => {
        const { signout } = await vi.importMock<typeof import('@/utils/signout')>('@/utils/signout');
        renderWithProviders(<UserMenu />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            const signOutItem = screen.getByText('Sign Out');
            fireEvent.click(signOutItem);
        });

        expect(signout).toHaveBeenCalledTimes(1);
    });

    it('closes menu after clicking menu item', async () => {
        const onMyProfileClick = vi.fn();
        renderWithProviders(<UserMenu onMyProfileClick={onMyProfileClick} />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            const profileItem = screen.getByText('My Profile');
            fireEvent.click(profileItem);
        });

        await waitFor(() => {
            expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        });
    });

    it('renders all menu items', async () => {
        renderWithProviders(<UserMenu />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            expect(screen.getByText('My Profile')).toBeInTheDocument();
            expect(screen.getByText('Admin Settings')).toBeInTheDocument();
            expect(screen.getByText('Privacy notice')).toBeInTheDocument();
            expect(screen.getByText('Sign Out')).toBeInTheDocument();
        });
    });
});
