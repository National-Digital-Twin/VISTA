import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCurrentUser, fetchUserById, fetchAllUsers, type UserData, type UsersListResponse } from './users';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            user: '/api/user',
        },
    },
}));

describe('users API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchCurrentUser', () => {
        it('successfully fetches current user data', async () => {
            const mockUser: UserData = {
                id: 'user-1',
                email: 'current@example.com',
                name: 'Current User',
                displayName: 'Current User',
                organisation: 'Test Org',
                memberSince: '2024-01-01',
                userType: 'Admin',
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ content: mockUser }),
            });

            const result = await fetchCurrentUser();

            expect(fetchMock).toHaveBeenCalledWith('/api/user');
            expect(result).toEqual(mockUser);
        });

        it('handles response with nested content structure', async () => {
            const mockUser: UserData = {
                id: 'user-1',
                email: 'test@example.com',
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ content: mockUser }),
            });

            const result = await fetchCurrentUser();

            expect(result).toEqual(mockUser);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Unauthorized',
            });

            await expect(fetchCurrentUser()).rejects.toThrow('Failed to fetch current user: Unauthorized');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchCurrentUser()).rejects.toThrow('Network error');
        });

        it('handles user with groups', async () => {
            const mockUser: UserData = {
                id: 'user-1',
                email: 'test@example.com',
                groups: [
                    { name: 'Admin', memberSince: '2024-01-01' },
                    { name: 'Users', memberSince: '2024-02-01' },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ content: mockUser }),
            });

            const result = await fetchCurrentUser();

            expect(result.groups).toHaveLength(2);
            expect(result.groups?.[0].name).toBe('Admin');
        });
    });

    describe('fetchUserById', () => {
        const mockUsersResponse: UsersListResponse = {
            users: [
                {
                    id: 'user-1',
                    email: 'user1@example.com',
                    name: 'User One',
                    displayName: 'User One',
                    organisation: 'Org 1',
                    userSince: '2024-01-01',
                    userType: 'Admin',
                    groups: [{ name: 'Admin', memberSince: '2024-01-01' }],
                },
                {
                    id: 'user-2',
                    email: 'user2@example.com',
                    name: 'User Two',
                    userType: 'General',
                },
            ],
        };

        it('successfully fetches user by ID', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockUsersResponse),
            });

            const result = await fetchUserById('user-1');

            expect(fetchMock).toHaveBeenCalledWith('/data/users.json');
            expect(result.id).toBe('user-1');
            expect(result.email).toBe('user1@example.com');
        });

        it('throws error when user not found', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockUsersResponse),
            });

            await expect(fetchUserById('non-existent')).rejects.toThrow('User not found');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(fetchUserById('user-1')).rejects.toThrow('Failed to fetch user: Not Found');
        });

        it('normalizes string groups to objects', async () => {
            const usersWithStringGroups: UsersListResponse = {
                users: [
                    {
                        id: 'user-3',
                        email: 'user3@example.com',
                        userSince: '2024-01-01',
                        groups: ['Admin', 'Users'] as any,
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(usersWithStringGroups),
            });

            const result = await fetchUserById('user-3');

            expect(result.groups).toBeDefined();
            expect(result.groups?.[0]).toHaveProperty('name');
            expect(result.groups?.[0]).toHaveProperty('memberSince');
            expect(result.groups?.[0].name).toBe('Admin');
            expect(result.groups?.[0].memberSince).toBe('2024-01-01');
        });

        it('uses memberSince fallback when normalizing groups', async () => {
            const usersWithMemberSince: UsersListResponse = {
                users: [
                    {
                        id: 'user-4',
                        email: 'user4@example.com',
                        memberSince: '2023-12-01',
                        groups: ['Group1'] as any,
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(usersWithMemberSince),
            });

            const result = await fetchUserById('user-4');

            expect(result.groups?.[0].memberSince).toBe('2023-12-01');
        });

        it('uses current date when no date available for groups', async () => {
            const usersWithNoDate: UsersListResponse = {
                users: [
                    {
                        id: 'user-5',
                        email: 'user5@example.com',
                        groups: ['Group1'] as any,
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(usersWithNoDate),
            });

            const result = await fetchUserById('user-5');

            expect(result.groups?.[0].memberSince).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });

        it('preserves existing object groups', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockUsersResponse),
            });

            const result = await fetchUserById('user-1');

            expect(result.groups?.[0]).toEqual({
                name: 'Admin',
                memberSince: '2024-01-01',
            });
        });

        it('handles user with no groups', async () => {
            const userNoGroups: UsersListResponse = {
                users: [
                    {
                        id: 'user-6',
                        email: 'user6@example.com',
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(userNoGroups),
            });

            const result = await fetchUserById('user-6');

            expect(result.groups).toBeUndefined();
        });
    });

    describe('fetchAllUsers', () => {
        const mockUsersResponse: UsersListResponse = {
            users: [
                {
                    id: 'user-1',
                    email: 'user1@example.com',
                    name: 'User One',
                    userType: 'Admin',
                },
                {
                    id: 'user-2',
                    email: 'user2@example.com',
                    name: 'User Two',
                    userType: 'General',
                },
                {
                    id: 'user-3',
                    email: 'user3@example.com',
                    name: 'User Three',
                    userType: 'General',
                },
            ],
        };

        it('successfully fetches all users', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockUsersResponse),
            });

            const result = await fetchAllUsers();

            expect(fetchMock).toHaveBeenCalledWith('/data/users.json');
            expect(result).toHaveLength(3);
            expect(result[0].id).toBe('user-1');
            expect(result[1].id).toBe('user-2');
            expect(result[2].id).toBe('user-3');
        });

        it('returns empty array when no users', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ users: [] }),
            });

            const result = await fetchAllUsers();

            expect(result).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(fetchAllUsers()).rejects.toThrow('Failed to fetch users: Internal Server Error');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Connection refused'));

            await expect(fetchAllUsers()).rejects.toThrow('Connection refused');
        });

        it('preserves all user properties', async () => {
            const detailedUser: UsersListResponse = {
                users: [
                    {
                        id: 'user-detailed',
                        email: 'detailed@example.com',
                        name: 'Detailed User',
                        displayName: 'Detailed Display',
                        organisation: 'Test Org',
                        memberSince: '2024-01-01',
                        addedBy: 'admin@example.com',
                        userType: 'Admin',
                        userSince: '2024-01-01',
                        groups: [{ name: 'Admin', memberSince: '2024-01-01' }],
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(detailedUser),
            });

            const result = await fetchAllUsers();

            expect(result[0]).toEqual(detailedUser.users[0]);
        });
    });
});
