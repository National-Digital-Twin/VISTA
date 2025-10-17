import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendInvite, fetchAllInvites, cancelInvite, resendInvite, type InviteData, type Invite, type InvitesListResponse } from './invites';

describe('invites API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    describe('sendInvite', () => {
        it('successfully sends an invite with all data', async () => {
            const inviteData: InviteData = {
                userType: 'Admin',
                email: 'newuser@example.com',
                groups: ['Admin', 'Users'],
            };

            const promise = sendInvite(inviteData);
            await vi.advanceTimersByTimeAsync(1000);
            const result = await promise;

            expect(consoleErrorSpy).toHaveBeenCalledWith('Not yet implemented:', inviteData);
            expect(result).toHaveProperty('id');
            expect(result.email).toBe('newuser@example.com');
            expect(result.userType).toBe('Admin');
            expect(result.groups).toEqual(['Admin', 'Users']);
            expect(result.status).toBe('Pending');
            expect(result.daysAgo).toBe(0);
        });

        it('sends General user invite', async () => {
            const inviteData: InviteData = {
                userType: 'General',
                email: 'general@example.com',
                groups: [],
            };

            const promise = sendInvite(inviteData);
            await vi.advanceTimersByTimeAsync(1000);
            const result = await promise;

            expect(result.userType).toBe('General');
            expect(result.groups).toEqual([]);
        });

        it('generates unique ID for each invite', async () => {
            const inviteData: InviteData = {
                userType: 'General',
                email: 'test@example.com',
                groups: [],
            };

            const promise1 = sendInvite(inviteData);
            await vi.advanceTimersByTimeAsync(1000);
            const result1 = await promise1;

            const promise2 = sendInvite(inviteData);
            await vi.advanceTimersByTimeAsync(1000);
            const result2 = await promise2;

            expect(result1.id).not.toBe(result2.id);
        });

        it('sets sentDate to current date', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            const inviteData: InviteData = {
                userType: 'Admin',
                email: 'test@example.com',
                groups: [],
            };

            const promise = sendInvite(inviteData);
            await vi.advanceTimersByTimeAsync(1000);
            const result = await promise;

            expect(result.sentDate).toBe('2024-06-15');
        });

        it('includes multiple groups in invite', async () => {
            const inviteData: InviteData = {
                userType: 'Admin',
                email: 'multi@example.com',
                groups: ['Group1', 'Group2', 'Group3'],
            };

            const promise = sendInvite(inviteData);
            await vi.advanceTimersByTimeAsync(1000);
            const result = await promise;

            expect(result.groups).toHaveLength(3);
            expect(result.groups).toContain('Group1');
            expect(result.groups).toContain('Group2');
            expect(result.groups).toContain('Group3');
        });
    });

    describe('fetchAllInvites', () => {
        const mockInvitesResponse: InvitesListResponse = {
            invites: [
                {
                    id: 'invite-1',
                    email: 'invite1@example.com',
                    userType: 'Admin',
                    groups: ['Admin'],
                    status: 'Pending',
                    sentDate: '2024-06-10',
                    daysAgo: 0,
                },
                {
                    id: 'invite-2',
                    email: 'invite2@example.com',
                    userType: 'General',
                    groups: [],
                    status: 'Accepted',
                    sentDate: '2024-06-01',
                    daysAgo: 0,
                },
                {
                    id: 'invite-3',
                    email: 'invite3@example.com',
                    userType: 'General',
                    groups: ['Users'],
                    status: 'Expired',
                    sentDate: '2024-05-01',
                    daysAgo: 0,
                },
            ],
        };

        it('successfully fetches all invites', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockInvitesResponse),
            });

            const result = await fetchAllInvites();

            expect(fetchMock).toHaveBeenCalledWith('/data/invites.json');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Not yet implemented');
            expect(result).toHaveLength(3);
        });

        it('calculates daysAgo correctly', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockInvitesResponse),
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
                json: vi.fn().mockResolvedValue(mockInvitesResponse),
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
                json: vi.fn().mockResolvedValue({ invites: [] }),
            });

            const result = await fetchAllInvites();

            expect(result).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Forbidden',
            });

            await expect(fetchAllInvites()).rejects.toThrow('Failed to fetch invites: Forbidden');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchAllInvites()).rejects.toThrow('Network error');
        });

        it('handles invites with different statuses', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockInvitesResponse),
            });

            const result = await fetchAllInvites();

            expect(result.find((i) => i.status === 'Pending')).toBeDefined();
            expect(result.find((i) => i.status === 'Accepted')).toBeDefined();
            expect(result.find((i) => i.status === 'Expired')).toBeDefined();
        });

        it('calculates daysAgo as 0 for today', async () => {
            const mockDate = new Date('2024-06-15T10:00:00Z');
            vi.setSystemTime(mockDate);

            const todayInvite: InvitesListResponse = {
                invites: [
                    {
                        id: 'today',
                        email: 'today@example.com',
                        userType: 'General',
                        groups: [],
                        status: 'Pending',
                        sentDate: '2024-06-15',
                        daysAgo: 999,
                    },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(todayInvite),
            });

            const result = await fetchAllInvites();

            expect(result[0].daysAgo).toBe(0);
        });
    });

    describe('cancelInvite', () => {
        it('successfully cancels an invite', async () => {
            const promise = cancelInvite('invite-123');
            await vi.advanceTimersByTimeAsync(500);
            await promise;

            expect(consoleErrorSpy).toHaveBeenCalledWith('Not yet implemented:', 'invite-123');
        });

        it('resolves after delay', async () => {
            const promise = cancelInvite('invite-456');

            let resolved = false;
            promise.then(() => {
                resolved = true;
            });

            await vi.advanceTimersByTimeAsync(400);
            expect(resolved).toBe(false);

            await vi.advanceTimersByTimeAsync(100);
            await promise;
            expect(resolved).toBe(true);
        });

        it('handles different invite IDs', async () => {
            const promise1 = cancelInvite('invite-1');
            await vi.advanceTimersByTimeAsync(500);
            await promise1;

            const promise2 = cancelInvite('invite-2');
            await vi.advanceTimersByTimeAsync(500);
            await promise2;

            expect(consoleErrorSpy).toHaveBeenCalledWith('Not yet implemented:', 'invite-1');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Not yet implemented:', 'invite-2');
        });
    });

    describe('resendInvite', () => {
        it('successfully resends an invite', async () => {
            const promise = resendInvite('invite-789');
            await vi.advanceTimersByTimeAsync(1000);
            const result = await promise;

            expect(consoleErrorSpy).toHaveBeenCalledWith('Not yet implemented:', 'invite-789');
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
