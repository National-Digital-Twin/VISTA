import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InvitesTab from './InvitesTab';

const mockInvites = [
    { id: 'i1', email: 'a@example.com', userType: 'Admin', groups: ['G1'], status: 'Pending', sentDate: '2025-01-01', daysAgo: 2 },
    { id: 'i2', email: 'b@example.com', userType: 'General', groups: ['G2'], status: 'Expired', sentDate: '2025-01-01', daysAgo: 10 },
];

vi.mock('@/api/invites', () => ({
    fetchAllInvites: vi.fn(),
    cancelInvite: vi.fn(),
    resendInvite: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
);

describe('InvitesTab', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        queryClient.clear();
        const { fetchAllInvites } = await import('@/api/invites');
        vi.mocked(fetchAllInvites).mockResolvedValue(mockInvites as any);
    });

    it('shows loading indicator', async () => {
        const { fetchAllInvites } = await import('@/api/invites');
        vi.mocked(fetchAllInvites).mockImplementationOnce(() => new Promise(() => {}));

        render(<InvitesTab />, { wrapper });

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders invites table', async () => {
        render(<InvitesTab />, { wrapper });

        expect(await screen.findByRole('heading', { name: /manage user invites/i })).toBeInTheDocument();
        expect(screen.getByText('a@example.com')).toBeInTheDocument();
        expect(screen.getByText('b@example.com')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('shows empty state when there are no invites', async () => {
        const { fetchAllInvites } = await import('@/api/invites');
        vi.mocked(fetchAllInvites).mockResolvedValueOnce([]);

        render(<InvitesTab />, { wrapper });

        expect(await screen.findByRole('heading', { name: /manage user invites/i })).toBeInTheDocument();
        expect(screen.getByText('No pending invites')).toBeInTheDocument();
    });

    it('sort triggers do not crash', async () => {
        render(<InvitesTab />, { wrapper });

        expect(await screen.findByText('a@example.com')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /email address/i }));
        fireEvent.click(screen.getByRole('button', { name: /user type/i }));
        fireEvent.click(screen.getByRole('button', { name: /group access/i }));
        fireEvent.click(screen.getByRole('button', { name: /invite status/i }));
        fireEvent.click(screen.getByRole('button', { name: /invite sent/i }));

        expect(screen.getByText('a@example.com')).toBeInTheDocument();
    });

    it('handles re-invite and remove actions with toasts', async () => {
        const { cancelInvite, resendInvite } = await import('@/api/invites');
        vi.mocked(cancelInvite).mockResolvedValue(undefined as any);
        vi.mocked(resendInvite).mockResolvedValue(undefined as any);

        render(<InvitesTab />, { wrapper });

        expect(await screen.findByText('a@example.com')).toBeInTheDocument();

        const actionButtons = screen.getAllByRole('button', { name: /invite actions/i });
        fireEvent.click(actionButtons[0]);
        expect(await screen.findByRole('menu')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('menuitem', { name: /re-invite user/i }));
        expect(resendInvite).toHaveBeenCalled();

        fireEvent.click(actionButtons[0]);
        fireEvent.click(screen.getByRole('menuitem', { name: /remove invite/i }));
        expect(cancelInvite).toHaveBeenCalled();

        fireEvent.click(actionButtons[1]);
        fireEvent.click(screen.getByRole('menuitem', { name: /re-invite user/i }));
        expect(resendInvite).toHaveBeenCalled();
    });
});
