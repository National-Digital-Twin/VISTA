// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import config from '@/config/app-config';

export type UserData = {
    id?: string;
    email?: string;
    name?: string;
    displayName?: string;
    organisation?: string;
    memberSince?: string;
    addedBy?: string;
    userType?: string;
    userSince?: string;
    groups?: Array<{ name: string; memberSince: string }>;
};

export type UsersListResponse = {
    users: UserData[];
};

const USERS_API_BASE_URL = config.services.users;

export const fetchCurrentUser = async (): Promise<UserData> => {
    const response = await fetch(config.services.user);

    if (!response.ok) {
        throw new Error(`Failed to fetch current user: ${response.statusText}`);
    }

    const json = await response.json();
    return json?.content;
};

export const fetchUserById = async (userId: string): Promise<UserData> => {
    const response = await fetch(USERS_API_BASE_URL);

    if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    const data: UserData[] = await response.json();
    const user = data.find((u) => u.id === userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.groups) {
        user.groups = user.groups.map((group) => {
            if (typeof group === 'string') {
                return {
                    name: group,
                    memberSince: user.userSince || user.memberSince || new Date().toISOString(),
                };
            }
            return group;
        });
    }

    return user;
};

export const fetchAllUsers = async (): Promise<UserData[]> => {
    const response = await fetch(USERS_API_BASE_URL);

    if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    return await response.json();
};
