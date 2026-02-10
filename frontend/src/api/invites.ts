import config from '@/config/app-config';

export type InviteData = {
    userType: 'Admin' | 'General';
    email: string;
    groups: string[];
};

export type Invite = {
    id: string;
    email: string;
    userType: 'Admin' | 'General';
    groups: string[];
    status: 'Pending' | 'Accepted' | 'Expired';
    sentDate: string;
    daysAgo: number;
};

const calculateDaysAgo = (date: Date | string): number => {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    return Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
};

export const sendInvite = async (inviteData: InviteData): Promise<void> => {
    const body = {
        email: inviteData.email.trim(),
        user_type: inviteData.userType.toLowerCase() as 'admin' | 'general',
        group_ids: inviteData.groups,
    };

    const response = await fetch(config.services.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to send invite: ${response.statusText}`);
    }
};

type BackendInviteResponse = {
    user_id: string;
    emailAddress: string;
    userType: 'admin' | 'general';
    groups: string[];
    status: 'pending' | 'expired' | 'accepted';
    createdAt: string;
};

const formatUserType = (userType: 'admin' | 'general'): 'Admin' | 'General' => {
    return userType === 'admin' ? 'Admin' : 'General';
};

const formatStatus = (status: 'pending' | 'expired' | 'accepted'): 'Pending' | 'Expired' | 'Accepted' => {
    switch (status) {
        case 'pending':
            return 'Pending';
        case 'expired':
            return 'Expired';
        case 'accepted':
            return 'Accepted';
    }
};

export const fetchAllInvites = async (): Promise<Invite[]> => {
    const response = await fetch(`${config.services.users}pending-invites/`, {
        credentials: 'include',
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to fetch invites: ${response.statusText}`);
    }

    const data: BackendInviteResponse[] = await response.json();

    return data.map((item) => {
        const createdAt = new Date(item.createdAt);
        const sentDate = createdAt.toISOString().split('T')[0];
        const daysAgo = calculateDaysAgo(createdAt);

        return {
            id: item.user_id,
            email: item.emailAddress,
            userType: formatUserType(item.userType),
            groups: item.groups || [],
            status: formatStatus(item.status),
            sentDate,
            daysAgo,
        };
    });
};

export const cancelInvite = async (userId: string): Promise<void> => {
    const response = await fetch(`${config.services.users}${userId}/`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to cancel invite: ${response.statusText}`);
    }
};

export const resendInvite = async (inviteId: string): Promise<Invite> => {
    // TODO: Replace with actual API endpoint
    // const response = await fetch(`${config.services.invites}/${inviteId}/resend`, {
    //     method: 'POST',
    // });

    await new Promise((resolve) => {
        setTimeout(resolve, 1000);
    });

    const invite: Invite = {
        id: inviteId,
        email: 'example@example.com',
        userType: 'General',
        groups: [],
        status: 'Pending',
        sentDate: new Date().toISOString().split('T')[0],
        daysAgo: 0,
    };

    return invite;
};
