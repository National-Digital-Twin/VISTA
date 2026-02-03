import config from '@/config/app-config';

export type GroupMember = {
    name: string | null;
    userId: string;
    createdBy?: string;
};

export type Group = {
    id: string;
    name: string;
    members: GroupMember[];
};

const GROUPS_API_BASE_URL = `${config.services.apiBaseUrl}/groups/`;

export const fetchAllGroups = async (): Promise<Group[]> => {
    const response = await fetch(GROUPS_API_BASE_URL);

    if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.statusText}`);
    }

    return response.json();
};

export const createGroup = async (name: string, memberIds: string[]): Promise<Group> => {
    const response = await fetch(GROUPS_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), memberIds }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to create group: ${response.statusText}`);
    }

    return response.json();
};

export const deleteGroup = async (groupId: string): Promise<void> => {
    const response = await fetch(`${GROUPS_API_BASE_URL}${groupId}/`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to delete group: ${response.statusText}`);
    }
};

const getGroupMembersUrl = (groupId: string) => `${GROUPS_API_BASE_URL}${groupId}/members/`;
const getGroupMemberUrl = (groupId: string, userId: string) => `${GROUPS_API_BASE_URL}${groupId}/members/${userId}/`;

export const addGroupMember = async (groupId: string, userId: string): Promise<void> => {
    const response = await fetch(getGroupMembersUrl(groupId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to add member: ${response.statusText}`);
    }
};

export const removeGroupMember = async (groupId: string, userId: string): Promise<void> => {
    const response = await fetch(getGroupMemberUrl(groupId, userId), {
        method: 'DELETE',
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to remove member: ${response.statusText}`);
    }
};
