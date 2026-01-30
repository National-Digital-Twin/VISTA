import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAllGroups, createGroup, deleteGroup, addGroupMember, removeGroupMember, type Group } from './groups';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

const GROUPS_BASE = '/ndtp-python/api/groups/';

describe('groups API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAllGroups', () => {
        const mockGroups: Group[] = [
            { id: 'g1', name: 'Admins', members: [{ name: 'Alice' }, { name: 'Bob' }] },
            { id: 'g2', name: 'Users', members: [{ name: 'Carol' }] },
        ];

        it('successfully fetches all groups', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockGroups),
            });

            const result = await fetchAllGroups();

            expect(fetchMock).toHaveBeenCalledWith(GROUPS_BASE);
            expect(result).toEqual(mockGroups);
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('g1');
            expect(result[0].name).toBe('Admins');
            expect(result[0].members).toHaveLength(2);
        });

        it('returns empty array when no groups', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchAllGroups();

            expect(result).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Forbidden',
            });

            await expect(fetchAllGroups()).rejects.toThrow('Failed to fetch groups: Forbidden');
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchAllGroups()).rejects.toThrow('Network error');
        });
    });

    describe('createGroup', () => {
        it('successfully creates a group with name and member ids', async () => {
            const created: Group = { id: 'g-new', name: 'New Group', members: [{ name: 'Alice' }] };
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(created),
            });

            const result = await createGroup('New Group', ['user-1']);

            expect(fetchMock).toHaveBeenCalledWith(GROUPS_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'New Group', memberIds: ['user-1'] }),
            });
            expect(result).toEqual(created);
        });

        it('trims group name', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ id: 'g1', name: ' Trimmed ', members: [] }),
            });

            await createGroup('  Trimmed  ', []);

            expect(fetchMock).toHaveBeenCalledWith(
                GROUPS_BASE,
                expect.objectContaining({
                    body: JSON.stringify({ name: 'Trimmed', memberIds: [] }),
                }),
            );
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                text: vi.fn().mockResolvedValue('Name already exists'),
            });

            await expect(createGroup('Duplicate', [])).rejects.toThrow('Name already exists');
        });

        it('throws generic error when response text is empty', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                text: vi.fn().mockResolvedValue(''),
            });

            await expect(createGroup('Test', [])).rejects.toThrow('Failed to create group');
        });
    });

    describe('deleteGroup', () => {
        it('successfully deletes a group', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await deleteGroup('g1');

            expect(fetchMock).toHaveBeenCalledWith(`${GROUPS_BASE}g1/`, {
                method: 'DELETE',
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(deleteGroup('g-missing')).rejects.toThrow('Failed to delete group: Not Found');
        });
    });

    describe('addGroupMember', () => {
        it('successfully adds a member to a group', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await addGroupMember('g1', 'user-1');

            expect(fetchMock).toHaveBeenCalledWith(`${GROUPS_BASE}g1/members/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'user-1' }),
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                text: vi.fn().mockResolvedValue('User already in group'),
            });

            await expect(addGroupMember('g1', 'user-1')).rejects.toThrow('User already in group');
        });
    });

    describe('removeGroupMember', () => {
        it('successfully removes a member from a group', async () => {
            fetchMock.mockResolvedValue({ ok: true });

            await removeGroupMember('g1', 'user-1');

            expect(fetchMock).toHaveBeenCalledWith(`${GROUPS_BASE}g1/members/user-1/`, {
                method: 'DELETE',
            });
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                text: vi.fn().mockResolvedValue('Member not found'),
            });

            await expect(removeGroupMember('g1', 'user-1')).rejects.toThrow('Member not found');
        });
    });
});
