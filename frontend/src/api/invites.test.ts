import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendInvite, fetchAllInvites, cancelInvite, resendInvite, type InviteData } from './invites';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            users: '/ndtp-python/api/users/',
        },
    },
}));

describe('invites API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('sendInvite', () => {
        beforeEach(() => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ user_id: 'test-user-uuid-123' }),
                text: () => Promise.resolve(''),
            });
        });

        it('successfully sends an invite with all data', async () => {
            const inviteData: InviteData = {
                userType: 'Admin',
                email: 'newuser@example.com',
                groups: ['Admin', 'Users'],
            };

            const result = await sendInvite(inviteData);

            expect(fetchMock).toHaveBeenCalledWith(
                '/ndtp-python/api/users/',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'newuser@example.com',
                        user_type: 'admin',
                        group_ids: ['Admin', 'Users'],
                    }),
                }),
            );
            expect(result.id).toBe('test-user-uuid-123');
            expect(result.email).toBe('newuser@example.com');
            expect(result.userType).toBe('Admin');
            expect(result.groups).toEqual(['Admin', 'Users']);
            expect(result.status).toBe('Pending');
            expect(result.daysAgo).toBe(0);
        });

        it('sends General user invite', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ user_id: 'test-user-uuid-456' }),
                text: () => Promise.resolve(''),
            });

            const inviteData: InviteData = {
                userType: 'General',
                email: 'general@example.com',
                groups: [],
            };

            const result = await sendInvite(inviteData);

            expect(result.id).toBe('test-user-uuid-456');
            expect(result.userType).toBe('General');
            expect(result.groups).toEqual([]);
        });

        it('throws error when API response is missing user_id', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
            });

            const inviteData: InviteData = {
                userType: 'General',
                email: 'test@example.com',
                groups: [],
            };

            await expect(sendInvite(inviteData)).rejects.toThrow('Invalid response from server: missing user_id');
        });

        it('sets sentDate to current date', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            const inviteData: InviteData = {
                userType: 'Admin',
                email: 'test@example.com',
                groups: [],
            };

            const result = await sendInvite(inviteData);

            expect(result.sentDate).toBe('2024-06-15');
        });

        it('includes multiple groups in invite', async () => {
            const inviteData: InviteData = {
                userType: 'Admin',
                email: 'multi@example.com',
                groups: ['Group1', 'Group2', 'Group3'],
            };

            const result = await sendInvite(inviteData);

            expect(result.groups).toHaveLength(3);
            expect(result.groups).toContain('Group1');
            expect(result.groups).toContain('Group2');
            expect(result.groups).toContain('Group3');
        });

        it('throws when response is not ok', async () => {
            fetchMock.mockResolvedValue({ ok: false, text: () => Promise.resolve('User already exists') });

            const inviteData: InviteData = {
                userType: 'Admin',
                email: 'test@example.com',
                groups: [],
            };

            await expect(sendInvite(inviteData)).rejects.toThrow('User already exists');
        });
    });

    describe('fetchAllInvites', () => {
        const mockBackendInvitesResponse = [
            {
                user_id: 'invite-1',
                emailAddress: 'invite1@example.com',
                userType: 'admin',
                groups: ['Admin'],
                status: 'pending',
                createdAt: '2024-06-10T10:00:00.000Z',
            },
            {
                user_id: 'invite-2',
                emailAddress: 'invite2@example.com',
                userType: 'general',
                groups: [],
                status: 'accepted',
                createdAt: '2024-06-01T10:00:00.000Z',
            },
            {
                user_id: 'invite-3',
                emailAddress: 'invite3@example.com',
                userType: 'general',
                groups: ['Users'],
                status: 'expired',
                createdAt: '2024-05-01T10:00:00.000Z',
            },
        ];

        it('successfully fetches all invites', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockBackendInvitesResponse),
            });

            const result = await fetchAllInvites();

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/users/pending-invites/', {
                credentials: 'include',
            });
            expect(result).toHaveLength(3);
        });

        it('calculates daysAgo correctly', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockBackendInvitesResponse),
            });

            const result = await fetchAllInvites();

            expect(result[0].daysAgo).toBe(5);
            expect(result[1].daysAgo).toBe(14);
            expect(result[2].daysAgo).toBe(45);
        });

        it('preserves all invite properties', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockBackendInvitesResponse),
            });

            const result = await fetchAllInvites();

            expect(result[0]).toMatchObject({
                id: 'invite-1',
                email: 'invite1@example.com',
                userType: 'Admin',
                groups: ['Admin'],
                status: 'Pending',
                sentDate: '2024-06-10',
            });
        });

        it('returns empty array when no invites', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchAllInvites();

            expect(result).toEqual([]);
        });

        it('throws when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Forbidden',
                text: () => Promise.resolve(''),
            });

            await expect(fetchAllInvites()).rejects.toThrow('Failed to fetch invites: Forbidden');
        });

        it('throws on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchAllInvites()).rejects.toThrow('Network error');
        });

        it('handles invites with different statuses', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockBackendInvitesResponse),
            });

            const result = await fetchAllInvites();

            expect(result.find((i) => i.status === 'Pending')).toBeDefined();
            expect(result.find((i) => i.status === 'Accepted')).toBeDefined();
            expect(result.find((i) => i.status === 'Expired')).toBeDefined();
        });

        it('calculates daysAgo as 0 for today', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            const todayInvite = [
                {
                    user_id: 'today',
                    emailAddress: 'today@example.com',
                    userType: 'general',
                    groups: [],
                    status: 'pending',
                    createdAt: '2024-06-15T10:00:00.000Z',
                },
            ];

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(todayInvite),
            });

            const result = await fetchAllInvites();

            expect(result[0].daysAgo).toBe(0);
        });
    });

    describe('cancelInvite', () => {
        beforeEach(() => {
            fetchMock.mockResolvedValue({ ok: true });
        });

        it('successfully cancels an invite', async () => {
            await cancelInvite('user-uuid-123');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/users/user-uuid-123/', {
                method: 'DELETE',
                credentials: 'include',
            });
        });

        it('throws when response is not ok', async () => {
            fetchMock.mockResolvedValue({ ok: false, statusText: 'Forbidden' });

            await expect(cancelInvite('user-uuid-456')).rejects.toThrow();
        });

        it('handles different user IDs', async () => {
            await cancelInvite('user-1');
            await cancelInvite('user-2');

            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/users/user-1/', expect.any(Object));
            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/users/user-2/', expect.any(Object));
        });
    });

    describe('resendInvite', () => {
        it('successfully resends an invite', async () => {
            const promise = resendInvite('invite-789');
            await vi.advanceTimersByTimeAsync(1000);
            const result = await promise;

            expect(result.id).toBe('invite-789');
            expect(result.status).toBe('Pending');
            expect(result.daysAgo).toBe(0);
        });

        it('returns invite with current date', async () => {
            const mockDate = new Date('2024-07-01T10:00:00Z');
            vi.setSystemTime(mockDate);

            const promise = resendInvite('invite-abc');
            await vi.advanceTimersByTimeAsync(1000);
            const result = await promise;

            expect(result.sentDate).toBe('2024-07-01');
        });

        it('returns default invite data', async () => {
            const promise = resendInvite('any-id');
            await vi.advanceTimersByTimeAsync(1000);
            const result = await promise;

            expect(result).toMatchObject({
                email: 'example@example.com',
                userType: 'General',
                groups: [],
                status: 'Pending',
            });
        });

        it('preserves the invite ID', async () => {
            const inviteId = 'original-invite-id';
            const promise = resendInvite(inviteId);
            await vi.advanceTimersByTimeAsync(1000);
            const result = await promise;

            expect(result.id).toBe(inviteId);
        });

        it('resolves after specified delay', async () => {
            const promise = resendInvite('invite-xyz');

            let resolved = false;
            promise.then(() => {
                resolved = true;
            });

            await vi.advanceTimersByTimeAsync(900);
            expect(resolved).toBe(false);

            await vi.advanceTimersByTimeAsync(100);
            await promise;
            expect(resolved).toBe(true);
        });
    });
});
