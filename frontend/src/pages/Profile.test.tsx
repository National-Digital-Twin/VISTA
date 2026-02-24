import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from './Profile';
import { useProfileData } from '@/hooks/useProfileData';
import { signout } from '@/api/auth';

vi.mock('@/api/auth', () => ({ signout: vi.fn().mockResolvedValue(undefined) }));

let queryClient: QueryClient;

const renderWithDynamicRoute = (ui: React.ReactElement, { path, initialEntries }: { path: string; initialEntries: string[] }) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path={path} element={children} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );

    return render(ui, { wrapper: Wrapper });
};

vi.mock('@/hooks/useProfileData');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderWithUserId = (userId: string | undefined) => {
    const path = userId ? `/user/${userId}` : '/profile';
    return renderWithDynamicRoute(<Profile />, {
        path: userId ? '/user/:userId' : '/profile',
        initialEntries: [path],
    });
};

describe('Profile', () => {
    const mockProfileData = {
        user: {
            id: 'user-123',
            email: 'john.doe@example.com',
            displayName: 'John Doe',
            organisation: 'Test Org',
            memberSince: '2024-01-01',
            addedBy: 'Admin User',
            userType: 'Administrator',
        },
        loading: false,
        error: null,
        isOwnProfile: false,
        currentUserId: 'admin-id',
        getUserDisplayName: () => 'John Doe',
        getUserEmail: () => 'john.doe@example.com',
        getUserOrganisation: () => 'Test Org',
        getUserMemberSince: () => '1 Jan 2024',
        getUserAddedBy: () => 'Admin User',
        getUserType: () => 'Administrator',
        getUserGroups: () => [],
    };

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        vi.clearAllMocks();
        vi.mocked(useProfileData).mockReturnValue(mockProfileData);
    });

    describe('Rendering', () => {
        it('renders all user information', () => {
            renderWithUserId('user-123');

            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('1 Jan 2024')).toBeInTheDocument();
            expect(screen.getByText('Admin User')).toBeInTheDocument();
            expect(screen.getByText('Administrator')).toBeInTheDocument();
            expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
            expect(screen.getByText('@Test Org')).toBeInTheDocument();
        });
    });

    describe('Loading State', () => {
        it('shows loading message while loading', () => {
            vi.mocked(useProfileData).mockReturnValue({
                ...mockProfileData,
                loading: true,
            });

            renderWithUserId('user-123');

            expect(screen.getByText('Loading user data...')).toBeInTheDocument();
        });
    });

    describe('Error State', () => {
        it('shows error message when loading fails', () => {
            vi.mocked(useProfileData).mockReturnValue({
                ...mockProfileData,
                loading: false,
                error: 'Failed to load user data',
            });

            renderWithUserId('user-123');

            expect(screen.getByText('Error loading profile')).toBeInTheDocument();
            expect(screen.getByText('Failed to load user data')).toBeInTheDocument();
        });

        it('renders go back button in error state', () => {
            vi.mocked(useProfileData).mockReturnValue({
                ...mockProfileData,
                loading: false,
                error: 'Failed to load user data',
            });

            renderWithUserId('user-123');

            const goBackButton = screen.getByText('Go Back');
            expect(goBackButton).toBeInTheDocument();
        });
    });

    describe('Remove User Functionality', () => {
        it('renders remove user button when viewing other user', () => {
            renderWithUserId('other-user');

            expect(screen.getByText('REMOVE USER')).toBeInTheDocument();
        });

        it('does not render remove user button when viewing own profile', () => {
            renderWithUserId(undefined);

            expect(screen.queryByText('REMOVE USER')).not.toBeInTheDocument();
        });

        it('opens confirmation modal when remove user is clicked', () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({}),
            });

            renderWithUserId('other-user');

            const removeButton = screen.getByText('REMOVE USER');
            fireEvent.click(removeButton);

            expect(screen.getByText('Are you sure?')).toBeInTheDocument();
        });

        it('shows "User removed" and navigates to users tab after confirming removal', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

            renderWithUserId('other-user');

            fireEvent.click(screen.getByText('REMOVE USER'));
            const confirmInput = screen.getByRole('textbox');
            fireEvent.change(confirmInput, { target: { value: 'delete' } });
            fireEvent.click(screen.getByText('CONFIRM REMOVAL'));

            await waitFor(() => {
                expect(screen.getByText('User removed')).toBeInTheDocument();
            });
            await waitFor(
                () => {
                    expect(mockNavigate).toHaveBeenCalledWith('/admin?tab=users');
                },
                { timeout: 2000 },
            );
        });

        it('calls signout when removing the current user (self)', async () => {
            vi.mocked(useProfileData).mockReturnValue({
                ...mockProfileData,
                currentUserId: 'user-123',
            });
            globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

            renderWithUserId('user-123');

            fireEvent.click(screen.getByText('REMOVE USER'));
            const confirmInput = screen.getByRole('textbox');
            fireEvent.change(confirmInput, { target: { value: 'delete' } });
            fireEvent.click(screen.getByText('CONFIRM REMOVAL'));

            await waitFor(() => {
                expect(signout).toHaveBeenCalled();
            });
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    describe('Navigation', () => {
        it('navigates to admin users tab when back is clicked with userId', () => {
            renderWithUserId('user-123');

            const backButtons = screen.getAllByRole('button');
            const backButton = backButtons.find((btn) => btn.innerHTML.includes('ArrowBackIcon')) as HTMLButtonElement;
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/admin?tab=users');
        });

        it('navigates to home when back is clicked without userId', () => {
            renderWithUserId(undefined);

            const backButtons = screen.getAllByRole('button');
            const backButton = backButtons.find((btn) => btn.innerHTML.includes('ArrowBackIcon')) as HTMLButtonElement;
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    describe('Action Buttons', () => {
        it('renders cancel and save buttons as disabled', () => {
            renderWithUserId('user-123');

            expect(screen.getByText('CANCEL')).toBeDisabled();
            expect(screen.getByText('SAVE CHANGES')).toBeDisabled();
        });
    });
});
