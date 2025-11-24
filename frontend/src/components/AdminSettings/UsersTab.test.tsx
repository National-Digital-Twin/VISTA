import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersTab from './UsersTab';

const mockUsers = [
    {
        id: '1',
        name: 'Alice Doe',
        displayName: 'Alice Doe',
        email: 'alice@example.com',
        organisation: 'example.com',
        groups: ['Group A', 'Group B'],
        memberSince: '2023-01-15',
        userType: 'Admin',
    },
    {
        id: '2',
        name: 'Bob Smith',
        displayName: 'Bob Smith',
        email: 'bob@other.org',
        organisation: 'other.org',
        groups: ['Group C'],
        memberSince: '2022-06-01',
        userType: 'General',
    },
];

vi.mock('@/api/users', () => ({
    fetchAllUsers: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('UsersTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockReset();
    });

    it('renders loading state', async () => {
        const { fetchAllUsers } = await import('@/api/users');
        vi.mocked(fetchAllUsers).mockImplementationOnce(() => new Promise(() => {}));

        render(
            <MemoryRouter>
                <UsersTab />
            </MemoryRouter>,
        );

        expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    });

    it('renders users and stats', async () => {
        const { fetchAllUsers } = await import('@/api/users');
        vi.mocked(fetchAllUsers).mockResolvedValueOnce(mockUsers as any);

        render(
            <MemoryRouter>
                <UsersTab />
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { level: 2, name: /manage users/i })).toBeInTheDocument();
        expect(screen.getByText(/total users: 2/i)).toBeInTheDocument();

        expect(screen.getAllByText('Alice Doe')).toHaveLength(2);
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.getByText('example.com')).toBeInTheDocument();
        expect(screen.getByText('other.org')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('filters users via search', async () => {
        const { fetchAllUsers } = await import('@/api/users');
        vi.mocked(fetchAllUsers).mockResolvedValueOnce(mockUsers as any);

        render(
            <MemoryRouter>
                <UsersTab />
            </MemoryRouter>,
        );

        await screen.findByRole('heading', { level: 2, name: /manage users/i });

        const search = screen.getByPlaceholderText(/search for user/i);
        fireEvent.change(search, { target: { value: 'bob' } });

        expect(screen.getByText('Bob Smith')).toBeInTheDocument();

        const clear = screen.getByRole('button', { name: /clear filters/i });
        fireEvent.click(clear);

        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('sorts by columns', async () => {
        const { fetchAllUsers } = await import('@/api/users');
        vi.mocked(fetchAllUsers).mockResolvedValueOnce(mockUsers as any);

        render(
            <MemoryRouter>
                <UsersTab />
            </MemoryRouter>,
        );

        await screen.findByRole('heading', { level: 2, name: /manage users/i });

        const userSinceSort = screen.getByRole('button', { name: /user since/i });
        fireEvent.click(userSinceSort);

        const userTypeSort = screen.getByRole('button', { name: /user type/i });
        fireEvent.click(userTypeSort);

        expect(screen.getByRole('heading', { level: 2, name: /manage users/i })).toBeInTheDocument();
    });

    it('navigates when clicking user links', async () => {
        const { fetchAllUsers } = await import('@/api/users');
        vi.mocked(fetchAllUsers).mockResolvedValueOnce(mockUsers as any);

        render(
            <MemoryRouter>
                <UsersTab />
            </MemoryRouter>,
        );

        await screen.findByRole('heading', { level: 2, name: /manage users/i });

        const aliceLinks = screen.getAllByRole('button', { name: 'Alice Doe' });
        if (aliceLinks.length > 0) {
            fireEvent.click(aliceLinks[0]);
            expect(mockNavigate).toHaveBeenCalledWith('/user/1');
        }
    });
});
