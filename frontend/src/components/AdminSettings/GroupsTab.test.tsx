// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MouseEvent, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GroupsTab, {
    compareUsers,
    formatGroupCreated,
    getCurrentMemberIds,
    getEmptyMessage,
    getFieldValue,
    getRadioGroupValue,
    getUserOrganisation,
    mapUserDataToUser,
    userMatchesSearch,
} from './GroupsTab';
import { addGroupMember, createGroup, deleteGroup, removeGroupMember, updateGroup } from '@/api/groups';

const queryState = {
    groupsData: [] as any[],
    groupsLoading: false,
    groupsError: false,
    groupsErrorObj: null as Error | null,
    usersData: [] as any[],
    usersLoading: false,
};

const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined);

vi.mock('@tanstack/react-query', () => ({
    useQuery: ({ queryKey }: { queryKey: string[] }) => {
        if (queryKey[0] === 'groups') {
            return {
                data: queryState.groupsData,
                isLoading: queryState.groupsLoading,
                isError: queryState.groupsError,
                error: queryState.groupsErrorObj,
            };
        }
        return {
            data: queryState.usersData,
            isLoading: queryState.usersLoading,
            isError: false,
            error: null,
        };
    },
    useMutation: ({
        mutationFn,
        onSuccess,
        onError,
    }: {
        mutationFn: (vars: any) => Promise<any>;
        onSuccess?: (data: any, vars: any) => void;
        onError?: (error: Error) => void;
    }) => ({
        isPending: false,
        mutate: async (vars: any) => {
            try {
                const result = await mutationFn(vars);
                onSuccess?.(result, vars);
            } catch (error) {
                onError?.(error as Error);
            }
        },
    }),
    useQueryClient: () => ({
        invalidateQueries: mockInvalidateQueries,
    }),
}));

vi.mock('@/api/groups', () => ({
    fetchAllGroups: vi.fn(),
    createGroup: vi.fn(),
    deleteGroup: vi.fn(),
    updateGroup: vi.fn(),
    addGroupMember: vi.fn(),
    removeGroupMember: vi.fn(),
}));

vi.mock('@/api/users', () => ({
    fetchAllUsers: vi.fn(),
}));

vi.mock('@/components/AdminSettings/GroupMembersTable', () => ({
    GroupMembersTable: ({
        users,
        selectedUserIds,
        onUserCheckboxChange,
        onSelectAll,
        onUserClick,
        onNameMenuOpen,
        onOrganisationMenuOpen,
        onUserTypeMenuOpen,
        onMemberSinceMenuOpen,
        emptyMessage,
    }: {
        users: Array<{ id: string; name: string }>;
        selectedUserIds: Set<string>;
        onUserCheckboxChange: (id: string, checked: boolean) => void;
        onSelectAll: (checked: boolean) => void;
        onUserClick: (id: string) => void;
        onNameMenuOpen: (e: MouseEvent<HTMLElement>) => void;
        onOrganisationMenuOpen: (e: MouseEvent<HTMLElement>) => void;
        onUserTypeMenuOpen: (e: MouseEvent<HTMLElement>) => void;
        onMemberSinceMenuOpen?: (e: MouseEvent<HTMLElement>) => void;
        emptyMessage: string;
    }) => (
        <div>
            <div data-testid="users-empty-message">{emptyMessage}</div>
            {users.map((user) => (
                <div key={user.id}>
                    <button onClick={() => onUserClick(user.id)}>{user.name}</button>
                    <button onClick={() => onUserCheckboxChange(user.id, !selectedUserIds.has(user.id))}>toggle-{user.id}</button>
                </div>
            ))}
            <button onClick={() => onSelectAll(true)}>select-all</button>
            <button onClick={(e) => onNameMenuOpen(e)}>open-name-menu</button>
            <button onClick={(e) => onOrganisationMenuOpen(e)}>open-organisation-menu</button>
            <button onClick={(e) => onUserTypeMenuOpen(e)}>open-user-type-menu</button>
            {onMemberSinceMenuOpen && <button onClick={(e) => onMemberSinceMenuOpen(e)}>open-member-since-menu</button>}
        </div>
    ),
}));

vi.mock('@/components/SearchTextField', () => ({
    SearchTextField: ({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (value: string) => void }) => (
        <input aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    ),
}));

const mockGroups = [
    {
        id: 'g1',
        name: 'Group One',
        createdAt: '2024-01-05T10:00:00.000Z',
        createdBy: 'Admin User',
        members: [{ userId: 'u1', name: 'Admin User', createdAt: '2024-01-05T10:00:00.000Z' }],
    },
    {
        id: 'g2',
        name: 'Group Two',
        createdBy: 'Admin User',
        members: [{ userId: 'u2', name: 'Bob User', createdAt: '2024-01-10T12:00:00.000Z' }],
    },
];

const mockUsers = [
    {
        id: 'u1',
        name: 'Admin User',
        email: 'admin@example.com',
        organisation: 'example.com',
        userType: 'Admin',
        userSince: '2023-01-01',
    },
    {
        id: 'u2',
        name: 'Bob User',
        email: 'bob@other.org',
        organisation: 'other.org',
        userType: 'General',
        userSince: '2023-02-01',
    },
    {
        id: 'u3',
        name: 'Cara User',
        email: 'cara@other.org',
        organisation: 'other.org',
        userType: 'General',
        userSince: '2023-03-01',
    },
];

const renderTab = (ui: ReactNode = <GroupsTab />) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('GroupsTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryState.groupsData = mockGroups as any[];
        queryState.groupsLoading = false;
        queryState.groupsError = false;
        queryState.groupsErrorObj = null;
        queryState.usersData = mockUsers as any[];
        queryState.usersLoading = false;

        vi.mocked(createGroup).mockResolvedValue({ id: 'g3', name: 'New Group', members: [] } as any);
        vi.mocked(updateGroup).mockResolvedValue({ id: 'g1', name: 'Group One Updated', members: [] } as any);
        vi.mocked(deleteGroup).mockResolvedValue(undefined);
        vi.mocked(addGroupMember).mockResolvedValue(undefined);
        vi.mocked(removeGroupMember).mockResolvedValue(undefined);
        vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    });

    it('renders loading state while groups are loading', () => {
        queryState.groupsLoading = true;

        renderTab();

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders error state when groups query fails', () => {
        queryState.groupsError = true;
        queryState.groupsErrorObj = new Error('Failed to load groups from API');

        renderTab();

        expect(screen.getByText('Failed to load groups from API')).toBeInTheDocument();
    });

    it('renders groups list and empty prompt before selecting a group', () => {
        renderTab();

        expect(screen.getByText('Current groups')).toBeInTheDocument();
        expect(screen.getByText('Group One (1)')).toBeInTheDocument();
        expect(screen.getByText('Group Two (1)')).toBeInTheDocument();
        expect(screen.getByText('Select a group to view and manage its members')).toBeInTheDocument();
    });

    it('opens a group and supports sorting/filtering menus', async () => {
        renderTab();
        fireEvent.click(screen.getByText('Group One (1)'));

        expect(await screen.findByText('EDIT MEMBERS')).toBeInTheDocument();
        expect(screen.getByText(/Created:/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'open-name-menu' }));
        fireEvent.click(screen.getByLabelText('Z to A'));

        fireEvent.click(screen.getByRole('button', { name: 'open-organisation-menu' }));
        fireEvent.click(screen.getByLabelText('@example.com'));
    });

    it('edits members and saves via add/remove member APIs', async () => {
        renderTab();

        fireEvent.click(screen.getByText('Group One (1)'));
        fireEvent.click(await screen.findByText('EDIT MEMBERS'));

        fireEvent.click(screen.getByRole('button', { name: 'toggle-u2' }));
        fireEvent.click(screen.getByRole('button', { name: /^SAVE$/i }));

        await waitFor(() => {
            expect(addGroupMember).toHaveBeenCalledWith('g1', 'u2');
        });
        expect(removeGroupMember).not.toHaveBeenCalled();
    });

    it('creates a new group from create flow', async () => {
        renderTab();

        fireEvent.click(screen.getByText('Create new group'));
        fireEvent.change(screen.getByLabelText('New group name'), { target: { value: '  New Working Group  ' } });
        fireEvent.click(screen.getByRole('button', { name: /^SAVE$/i }));

        await waitFor(() => {
            expect(createGroup).toHaveBeenCalled();
        });
        const [nameArg, memberIdsArg] = vi.mocked(createGroup).mock.calls[0];
        expect(nameArg).toBe('New Working Group');
        expect(memberIdsArg).toContain('u1');
    });

    it('deletes a selected group after confirmation text', async () => {
        renderTab();

        fireEvent.click(screen.getByText('Group One (1)'));
        fireEvent.click(screen.getByText('DELETE GROUP'));

        const confirmInput = screen.getAllByRole('textbox').at(-1);
        expect(confirmInput).toBeDefined();
        if (!confirmInput) {
            throw new Error('Expected confirmation input to be present');
        }
        fireEvent.change(confirmInput, { target: { value: 'delete' } });
        fireEvent.click(screen.getByRole('button', { name: /confirm deletion/i }));

        await waitFor(() => {
            expect(deleteGroup).toHaveBeenCalledWith('g1');
        });
    });

    it('edits group name and saves updated name on Enter', async () => {
        renderTab();

        fireEvent.click(screen.getByText('Group One (1)'));
        fireEvent.click(screen.getByLabelText('Edit group name'));

        const input = screen.getByDisplayValue('Group One');
        fireEvent.change(input, { target: { value: 'Group One Updated' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(updateGroup).toHaveBeenCalledWith('g1', { name: 'Group One Updated' });
        });
    });

    it('shows create error helper text when create group fails', async () => {
        vi.mocked(createGroup).mockRejectedValue(new Error(JSON.stringify({ name: ['A group with this name already exists.'] })));

        renderTab();

        fireEvent.click(screen.getByText('Create new group'));
        fireEvent.change(screen.getByLabelText('New group name'), { target: { value: 'Group One' } });
        fireEvent.click(screen.getByRole('button', { name: /^SAVE$/i }));

        expect(await screen.findByText('A group with this name already exists.')).toBeInTheDocument();
    });

    it('shows validation error when edited group name is empty on blur', () => {
        renderTab();

        fireEvent.click(screen.getByText('Group One (1)'));
        fireEvent.click(screen.getByLabelText('Edit group name'));

        const input = screen.getByDisplayValue('Group One');
        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.blur(input);

        expect(screen.getByText('Name cannot be empty')).toBeInTheDocument();
    });

    it('shows users loading indicator for selected group members', () => {
        queryState.usersLoading = true;
        renderTab();

        fireEvent.click(screen.getByText('Group One (1)'));

        expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    });

    it('shows delete error snackbar when delete fails', async () => {
        vi.mocked(deleteGroup).mockRejectedValue(new Error('Delete request failed'));

        renderTab();
        fireEvent.click(screen.getByText('Group One (1)'));
        fireEvent.click(screen.getByText('DELETE GROUP'));

        const confirmInput = screen.getAllByRole('textbox').at(-1);
        if (!confirmInput) {
            throw new Error('Expected confirmation input to be present');
        }
        fireEvent.change(confirmInput, { target: { value: 'delete' } });
        fireEvent.click(screen.getByRole('button', { name: /confirm deletion/i }));

        expect(await screen.findByText('Delete request failed')).toBeInTheDocument();
    });

    it('shows save error snackbar when saving members fails', async () => {
        vi.mocked(addGroupMember).mockRejectedValue(new Error('Save members failed'));

        renderTab();
        fireEvent.click(screen.getByText('Group One (1)'));
        fireEvent.click(screen.getByText('EDIT MEMBERS'));
        fireEvent.click(screen.getByRole('button', { name: 'toggle-u2' }));
        fireEvent.click(screen.getByRole('button', { name: /^SAVE$/i }));

        expect(await screen.findByText('Save members failed')).toBeInTheDocument();
    });
});

describe('GroupsTab helper functions', () => {
    it('maps user data and normalizes defaults', () => {
        const user = mapUserDataToUser({
            id: 'u1',
            displayName: 'Fallback Name',
            email: 'alice@example.com',
            userType: 'Unknown',
        });

        expect(user).toEqual({
            id: 'u1',
            name: 'Fallback Name',
            email: 'alice@example.com',
            organisation: 'example.com',
            userSince: '',
            userType: 'General',
        });
    });

    it('resolves organisation from organisation field and email domain', () => {
        expect(getUserOrganisation({ organisation: '@nhs.uk' })).toBe('nhs.uk');
        expect(getUserOrganisation({ email: 'bob@org.gov' })).toBe('org.gov');
        expect(getUserOrganisation({})).toBe('');
    });

    it('matches users by search on multiple fields', () => {
        const user = {
            id: 'u2',
            name: 'Bob User',
            email: 'bob@other.org',
            organisation: 'other.org',
            userSince: '2023-01-01',
            userType: 'General' as const,
        };

        expect(userMatchesSearch(user, 'bob')).toBe(true);
        expect(userMatchesSearch(user, 'other.org')).toBe(true);
        expect(userMatchesSearch(user, 'general')).toBe(true);
        expect(userMatchesSearch(user, 'admin')).toBe(false);
    });

    it('reads field values and compares users in both sort directions', () => {
        const a = {
            id: 'u1',
            name: 'Alice',
            email: 'a@example.com',
            organisation: 'example.com',
            userSince: '2023-01-01',
            memberSince: '2023-03-01',
            userType: 'Admin' as const,
        };
        const b = {
            id: 'u2',
            name: 'Bob',
            email: 'b@example.com',
            organisation: 'other.org',
            userSince: '2023-01-01',
            memberSince: '2023-04-01',
            userType: 'General' as const,
        };

        expect(getFieldValue(a, 'name')).toBe('Alice');
        expect(getFieldValue(a, 'organisation')).toBe('example.com');
        expect(getFieldValue(a, 'userType')).toBe('Admin');
        expect(getFieldValue(a, 'memberSince')).toBe('2023-03-01');

        expect(compareUsers('name', 'asc')(a, b)).toBeLessThan(0);
        expect(compareUsers('name', 'desc')(a, b)).toBeGreaterThan(0);
    });

    it('formats group created string across edge cases', () => {
        expect(formatGroupCreated({ id: 'g', name: 'G', members: [], createdBy: 'Admin' })).toBe('Created by Admin');
        expect(formatGroupCreated({ id: 'g', name: 'G', members: [], createdBy: 'Admin', createdAt: 'not-a-date' })).toBe('Created by Admin');
        expect(formatGroupCreated({ id: 'g', name: 'G', members: [], createdBy: 'Admin', createdAt: '2024-01-05T10:00:00.000Z' })).toContain('Created:');
    });

    it('computes current member IDs and helper display messages', () => {
        const adminIds = new Set(['u1']);
        const group = {
            id: 'g1',
            name: 'Group',
            members: [{ userId: 'u2', name: null, createdAt: '2024-01-01' }],
        };

        expect(Array.from(getCurrentMemberIds(null, [], adminIds))).toEqual(['u1']);
        expect(new Set(getCurrentMemberIds(group as any, [], adminIds))).toEqual(new Set(['u1', 'u2']));

        expect(getEmptyMessage(false, false, 'Fallback')).toBe('Fallback');
        expect(getEmptyMessage(true, true, 'Fallback')).toBe('No results found. Try adjusting your search');
        expect(getEmptyMessage(true, false, 'Fallback')).toBe('No results found. Try adjusting your filters');
    });

    it('returns radio group value only for active field', () => {
        expect(getRadioGroupValue('name', 'name', 'asc')).toBe('asc');
        expect(getRadioGroupValue('organisation', 'name', 'desc')).toBe('');
    });
});
