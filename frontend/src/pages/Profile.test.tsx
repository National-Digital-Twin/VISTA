import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithDynamicRoute } from '../test-utils/test-helpers';
import Profile from './Profile';
import { useProfileData } from '@/hooks/useProfileData';

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
            groups: [
                { name: 'Resilience team', memberSince: '2024-01-15' },
                { name: 'Tywnwell team', memberSince: '2024-01-20' },
            ],
        },
        loading: false,
        error: null,
        isOwnProfile: false,
        getUserDisplayName: () => 'John Doe',
        getUserEmail: () => 'john.doe@example.com',
        getUserOrganisation: () => 'Test Org',
        getUserMemberSince: () => '1 Jan 2024',
        getUserAddedBy: () => 'Admin User',
        getUserType: () => 'Administrator',
        getUserGroups: () => [
            { name: 'Resilience team', memberSince: '15 Jan 2024' },
            { name: 'Tywnwell team', memberSince: '20 Jan 2024' },
        ],
    };

    beforeEach(() => {
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

    describe('Group Membership', () => {
        it('renders group information', () => {
            renderWithUserId('user-123');

            expect(screen.getByText('Resilience team')).toBeInTheDocument();
            expect(screen.getByText('Tywnwell team')).toBeInTheDocument();
            expect(screen.getByText('15 Jan 2024')).toBeInTheDocument();
            expect(screen.getByText('20 Jan 2024')).toBeInTheDocument();
        });

        it('handles empty groups gracefully', () => {
            vi.mocked(useProfileData).mockReturnValue({
                ...mockProfileData,
                getUserGroups: () => [],
            });

            renderWithUserId('user-123');

            expect(screen.getByText('No group memberships')).toBeInTheDocument();
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
