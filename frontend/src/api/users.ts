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

    // Normalize groups to always be objects with valid dates
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
