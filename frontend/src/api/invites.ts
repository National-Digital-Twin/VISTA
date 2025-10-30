export interface InviteData {
    userType: 'Admin' | 'General';
    email: string;
    groups: string[];
}

export interface Invite {
    id: string;
    email: string;
    userType: 'Admin' | 'General';
    groups: string[];
    status: 'Pending' | 'Accepted' | 'Expired';
    sentDate: string;
    daysAgo: number;
}

export interface InvitesListResponse {
    invites: Invite[];
}

export const sendInvite = async (inviteData: InviteData): Promise<Invite> => {
    // TODO: Replace with actual API endpoint
    // const response = await fetch(`${config.services.invites}`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(inviteData),
    // });
    console.error('Not yet implemented:', inviteData);

    await new Promise((resolve) => {
        setTimeout(resolve, 1000);
    });

    const invite: Invite = {
        id: Math.random().toString(36).substring(2, 11),
        email: inviteData.email,
        userType: inviteData.userType,
        groups: inviteData.groups,
        status: 'Pending',
        sentDate: new Date().toISOString().split('T')[0],
        daysAgo: 0,
    };

    return invite;
};

export const fetchAllInvites = async (): Promise<Invite[]> => {
    // TODO: Replace with actual API endpoint
    // const response = await fetch(`${config.services.invites}`);
    console.error('Not yet implemented');

    const response = await fetch('/data/invites.json');

    if (!response.ok) {
        throw new Error(`Failed to fetch invites: ${response.statusText}`);
    }

    const data: InvitesListResponse = await response.json();

    const now = new Date();
    return data.invites.map((invite) => ({
        ...invite,
        daysAgo: Math.floor((now.getTime() - new Date(invite.sentDate).getTime()) / (1000 * 60 * 60 * 24)),
    }));
};

export const cancelInvite = async (inviteId: string): Promise<void> => {
    // TODO: Replace with actual API endpoint
    // const response = await fetch(`${config.services.invites}/${inviteId}`, {
    //     method: 'DELETE',
    // });
    console.error('Not yet implemented:', inviteId);

    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });
};

export const resendInvite = async (inviteId: string): Promise<Invite> => {
    // TODO: Replace with actual API endpoint
    // const response = await fetch(`${config.services.invites}/${inviteId}/resend`, {
    //     method: 'POST',
    // });
    console.error('Not yet implemented:', inviteId);

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
