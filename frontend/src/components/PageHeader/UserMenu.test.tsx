// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserMenu from './UserMenu';
import theme from '@/theme';

const mockUseUserData = vi.fn();
const templateName = 'John Doe';
const templateEmail = 'example.com';
const templateUserType = 'Admin';

vi.mock('@/hooks/useUserData', () => ({
    useUserData: () => mockUseUserData(),
}));

vi.mock('@/api/auth', () => ({
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
            getUserDisplayName: () => templateName,
            getUserEmailDomain: () => templateEmail,
            getUserType: () => templateUserType,
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
            expect(screen.getByText(templateName)).toBeInTheDocument();
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
            expect(screen.getByText(templateEmail)).toBeInTheDocument();
        });
    });

    it('displays loading state when user data is loading', async () => {
        mockUseUserData.mockReturnValue({
            getUserDisplayName: () => templateName,
            getUserEmailDomain: () => templateEmail,
            getUserType: () => templateUserType,
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

    it('does not display admin settings for general user', async () => {
        mockUseUserData.mockReturnValue({
            getUserDisplayName: () => templateName,
            getUserEmailDomain: () => templateEmail,
            getUserType: () => 'General',
            loading: true,
        });
        renderWithProviders(<UserMenu />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        expect(screen.queryByText('Admin settings')).not.toBeInTheDocument();
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

    it('calls onRequestsClick when User guide is clicked', async () => {
        const onRequestsClick = vi.fn();
        renderWithProviders(<UserMenu onRequestsClick={onRequestsClick} />);

        const icon = screen.getByTestId('AccountCircleOutlinedIcon');
        const button = icon.closest('button');
        if (button) {
            fireEvent.click(button);
        }

        await waitFor(() => {
            const userGuideItem = screen.getByText('User guide');
            fireEvent.click(userGuideItem);
        });

        expect(onRequestsClick).toHaveBeenCalledTimes(1);
    });

    it('calls signout when Sign Out is clicked', async () => {
        const { signout } = await vi.importMock<typeof import('@/api/auth')>('@/api/auth');
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
            expect(screen.getByText('User guide')).toBeInTheDocument();
            expect(screen.getByText('Admin Settings')).toBeInTheDocument();
            expect(screen.getByText('Privacy notice')).toBeInTheDocument();
            expect(screen.getByText('Sign Out')).toBeInTheDocument();
        });
    });
});
