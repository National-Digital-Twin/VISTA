import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InviteNewUser from './InviteNewUser';
import { sendInvite } from '@/api/invites';

const mockGroups = [
    { id: 'g1', name: 'Resilience team', members: [] },
    { id: 'g2', name: 'Tywnwell team', members: [] },
];

vi.mock('@/api/invites', () => ({
    sendInvite: vi.fn(),
}));

vi.mock('@/api/groups', () => ({
    fetchAllGroups: vi.fn(() => Promise.resolve(mockGroups)),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithRouter = (ui: React.ReactElement, { initialEntries = ['/'], route = '/*' }: { initialEntries?: string[]; route?: string } = {}) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path={route} element={children} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>
    );

    return render(ui, { wrapper: Wrapper });
};

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('InviteNewUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(sendInvite).mockResolvedValue({
            id: 'test-id',
            email: 'test@example.com',
            userType: 'Admin',
            groups: [],
            status: 'Pending',
            sentDate: '2024-01-01',
            daysAgo: 0,
        });
    });

    describe('Rendering', () => {
        it('renders all page elements', async () => {
            renderWithRouter(<InviteNewUser />);

            expect(screen.getByText('Invite new user')).toBeInTheDocument();
            expect(screen.getByLabelText('Admin')).toBeInTheDocument();
            expect(screen.getByLabelText('General')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter email address')).toBeInTheDocument();
            expect(screen.getByText('Group access')).toBeInTheDocument();
            expect(await screen.findByText('Resilience team')).toBeInTheDocument();
            expect(screen.getByText('CANCEL')).toBeInTheDocument();
            expect(screen.getByText('SEND INVITE')).toBeInTheDocument();
        });
    });

    describe('Form Validation', () => {
        it('disables send invite button when form is incomplete', () => {
            renderWithRouter(<InviteNewUser />);

            const sendButton = screen.getByText('SEND INVITE');
            expect(sendButton).toBeDisabled();

            const emailInput = screen.getByPlaceholderText('Enter email address');
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            expect(sendButton).toBeDisabled();

            fireEvent.change(emailInput, { target: { value: '' } });
            const adminRadio = screen.getByLabelText('Admin');
            fireEvent.click(adminRadio);
            expect(sendButton).toBeDisabled();
        });

        it('enables send invite button when form is valid', () => {
            renderWithRouter(<InviteNewUser />);

            const emailInput = screen.getByPlaceholderText('Enter email address');
            const adminRadio = screen.getByLabelText('Admin');
            const sendButton = screen.getByText('SEND INVITE');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(adminRadio);

            expect(sendButton).not.toBeDisabled();
        });
    });

    describe('User Type Selection', () => {
        it('allows selecting Admin user type', () => {
            renderWithRouter(<InviteNewUser />);

            const adminRadio = screen.getByLabelText('Admin');
            fireEvent.click(adminRadio);

            expect(adminRadio).toBeChecked();
        });

        it('allows selecting General user type', () => {
            renderWithRouter(<InviteNewUser />);

            const generalRadio = screen.getByLabelText('General');
            fireEvent.click(generalRadio);

            expect(generalRadio).toBeChecked();
        });

        it('switches between user types', () => {
            renderWithRouter(<InviteNewUser />);

            const adminRadio = screen.getByLabelText('Admin');
            const generalRadio = screen.getByLabelText('General');

            fireEvent.click(adminRadio);
            expect(adminRadio).toBeChecked();

            fireEvent.click(generalRadio);
            expect(generalRadio).toBeChecked();
            expect(adminRadio).not.toBeChecked();
        });
    });

    describe('Email Input', () => {
        it('updates email value when typing', () => {
            renderWithRouter(<InviteNewUser />);

            const emailInput = screen.getByPlaceholderText('Enter email address') as HTMLInputElement;
            fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

            expect(emailInput.value).toBe('user@example.com');
        });

        it('trims whitespace from email', async () => {
            renderWithRouter(<InviteNewUser />);

            const emailInput = screen.getByPlaceholderText('Enter email address');
            fireEvent.change(emailInput, { target: { value: '  user@example.com  ' } });

            const adminRadio = screen.getByLabelText('Admin');
            fireEvent.click(adminRadio);

            const sendButton = screen.getByText('SEND INVITE');
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(sendInvite).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: 'user@example.com',
                    }),
                );
            });
        });
    });

    describe('Group Selection', () => {
        it('renders available groups', async () => {
            renderWithRouter(<InviteNewUser />);

            expect(await screen.findByText('Resilience team')).toBeInTheDocument();
            expect(screen.getByText('Tywnwell team')).toBeInTheDocument();
        });
    });

    describe('Form Submission', () => {
        it('sends invite with correct data', async () => {
            renderWithRouter(<InviteNewUser />);

            const emailInput = screen.getByPlaceholderText('Enter email address');
            const adminRadio = screen.getByLabelText('Admin');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(adminRadio);

            const sendButton = screen.getByText('SEND INVITE');
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(sendInvite).toHaveBeenCalledWith({
                    userType: 'Admin',
                    email: 'test@example.com',
                    groups: [],
                });
            });
        });

        it('shows success message after sending invite', async () => {
            renderWithRouter(<InviteNewUser />);

            const emailInput = screen.getByPlaceholderText('Enter email address');
            const adminRadio = screen.getByLabelText('Admin');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(adminRadio);

            const sendButton = screen.getByText('SEND INVITE');
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(screen.getByText('Invite sent successfully!')).toBeInTheDocument();
            });
        });

        it('shows error message when invite fails', async () => {
            vi.mocked(sendInvite).mockRejectedValue(new Error('API Error'));

            renderWithRouter(<InviteNewUser />);

            const emailInput = screen.getByPlaceholderText('Enter email address');
            const adminRadio = screen.getByLabelText('Admin');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(adminRadio);

            const sendButton = screen.getByText('SEND INVITE');
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(screen.getByText('Failed to send invite. Please try again.')).toBeInTheDocument();
            });
        });

        it('validates email is provided before sending', async () => {
            renderWithRouter(<InviteNewUser />);

            const adminRadio = screen.getByLabelText('Admin');
            fireEvent.click(adminRadio);

            const sendButton = screen.getByText('SEND INVITE');
            expect(sendButton).toBeDisabled();
            expect(sendInvite).not.toHaveBeenCalled();
        });
    });

    describe('Navigation', () => {
        it('navigates to admin invites tab when cancel is clicked', () => {
            renderWithRouter(<InviteNewUser />);

            const cancelButton = screen.getByText('CANCEL');
            fireEvent.click(cancelButton);

            expect(mockNavigate).toHaveBeenCalledWith('/admin?tab=invites');
        });

        it('navigates back after successful invite', async () => {
            renderWithRouter(<InviteNewUser />);

            const emailInput = screen.getByPlaceholderText('Enter email address');
            const adminRadio = screen.getByLabelText('Admin');

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.click(adminRadio);

            const sendButton = screen.getByText('SEND INVITE');
            fireEvent.click(sendButton);

            await waitFor(
                () => {
                    expect(mockNavigate).toHaveBeenCalledWith('/admin?tab=invites');
                },
                { timeout: 2000 },
            );
        });
    });

    describe('Group Sorting', () => {
        it('displays sortable group table', async () => {
            renderWithRouter(<InviteNewUser />);

            expect(await screen.findByText('Groups')).toBeInTheDocument();
        });
    });
});
