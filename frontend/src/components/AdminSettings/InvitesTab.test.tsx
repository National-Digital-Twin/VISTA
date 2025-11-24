import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InvitesTab from './InvitesTab';

const mockInvites = [
    { id: 'i1', email: 'a@example.com', userType: 'Admin', groups: ['G1'], status: 'Pending', daysAgo: 2 },
    { id: 'i2', email: 'b@example.com', userType: 'General', groups: ['G2'], status: 'Expired', daysAgo: 10 },
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

describe('InvitesTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading indicator', async () => {
        const { fetchAllInvites } = await import('@/api/invites');
        vi.mocked(fetchAllInvites).mockImplementationOnce(() => new Promise(() => {}));

        render(
            <MemoryRouter>
                <InvitesTab />
            </MemoryRouter>,
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders invites table', async () => {
        const { fetchAllInvites } = await import('@/api/invites');
        vi.mocked(fetchAllInvites).mockResolvedValueOnce(mockInvites as any);

        render(
            <MemoryRouter>
                <InvitesTab />
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: /manage user invites/i })).toBeInTheDocument();
        expect(screen.getByText('a@example.com')).toBeInTheDocument();
        expect(screen.getByText('b@example.com')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('sort triggers do not crash', async () => {
        const { fetchAllInvites } = await import('@/api/invites');
        vi.mocked(fetchAllInvites).mockResolvedValueOnce(mockInvites as any);

        render(
            <MemoryRouter>
                <InvitesTab />
            </MemoryRouter>,
        );

        expect(await screen.findByText('a@example.com')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /email address/i }));
        fireEvent.click(screen.getByRole('button', { name: /user type/i }));
        fireEvent.click(screen.getByRole('button', { name: /group access/i }));
        fireEvent.click(screen.getByRole('button', { name: /invite status/i }));
        fireEvent.click(screen.getByRole('button', { name: /invite sent/i }));

        expect(screen.getByText('a@example.com')).toBeInTheDocument();
    });

    it('handles cancel and reminder actions with toasts', async () => {
        const { fetchAllInvites, cancelInvite, resendInvite } = await import('@/api/invites');
        vi.mocked(fetchAllInvites).mockResolvedValue(mockInvites as any);
        vi.mocked(cancelInvite).mockResolvedValue(undefined as any);
        vi.mocked(resendInvite).mockResolvedValue(undefined as any);

        render(
            <MemoryRouter>
                <InvitesTab />
            </MemoryRouter>,
        );

        expect(await screen.findByText('a@example.com')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(cancelInvite).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /send reminder/i }));
        expect(resendInvite).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /re-invite user/i }));
        expect(resendInvite).toHaveBeenCalled();
    });
});
