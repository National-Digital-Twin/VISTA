import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import config from '@/config/app-config';

type User = {
    email?: string;
    displayName?: string;
    memberSince?: string;
    addedBy?: string;
    userType?: string;
    groups?: Array<{
        name: string;
        memberSince: string;
    }>;
};

type UseUserDataReturn = {
    user: User | null;
    loading: boolean;
    getUserDisplayName: () => string;
    getUserEmailDomain: () => string;
    getUserOrganisation: () => string;
    getUserMemberSince: () => string;
    getUserAddedBy: () => string;
    getUserType: () => string;
    getUserGroups: () => Array<{ name: string; memberSince: string }>;
};

export function useUserData(): UseUserDataReturn {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch(config.services.user);

                if (!res.ok) {
                    throw new Error(`Error: ${res.statusText}`);
                }

                const json = await res.json();
                const apiUser = json?.content;

                const userWithMockData: User = {
                    ...apiUser,
                    memberSince: '2025-06-02T12:00:00Z',
                    addedBy: 'Application owner',
                    userType: 'General',
                    groups: [
                        { name: 'Resilience team', memberSince: '2025-06-02T12:00:00Z' },
                        { name: 'Tywnwell team', memberSince: '2025-06-02T12:00:00Z' },
                        { name: 'Resilience leads', memberSince: '2025-06-02T12:00:00Z' },
                        { name: 'Volunteers', memberSince: '2025-06-02T12:00:00Z' },
                    ],
                };

                setUser(userWithMockData);
            } catch {
                setUser({
                    email: 'test.user@example.com',
                    displayName: 'Test user',
                    memberSince: '2025-06-02T12:00:00Z',
                    addedBy: 'Application owner',
                    userType: 'General',
                    groups: [
                        { name: 'Resilience team', memberSince: '2025-06-02T12:00:00Z' },
                        { name: 'Tywnwell team', memberSince: '2025-06-02T12:00:00Z' },
                        { name: 'Resilience leads', memberSince: '2025-06-02T12:00:00Z' },
                        { name: 'Volunteers', memberSince: '2025-06-02T12:00:00Z' },
                    ],
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const getUserDisplayName = () => {
        return user?.displayName || user?.email?.split('@')[0] || 'User';
    };

    const getUserEmailDomain = () => {
        if (!user?.email) {
            return 'example.com';
        }
        const domain = user.email.split('@')[1];
        return domain || '';
    };

    const getUserOrganisation = () => {
        if (!user?.email) {
            return 'twinwell.gov.uk';
        }
        const domain = user.email.split('@')[1];
        return domain || 'twinwell.gov.uk';
    };

    const getUserMemberSince = () => {
        const memberSince = user?.memberSince || '2025-06-02T12:00:00Z';
        try {
            return format(new Date(memberSince), 'd MMM yyyy');
        } catch {
            return '2 Jun 2025';
        }
    };

    const getUserAddedBy = () => {
        return user?.addedBy || 'Application owner';
    };

    const getUserType = () => {
        return user?.userType || 'General';
    };

    const getUserGroups = () => {
        const groups = user?.groups || [
            { name: 'Resilience team', memberSince: '2025-06-02T12:00:00Z' },
            { name: 'Tywnwell team', memberSince: '2025-06-02T12:00:00Z' },
            { name: 'Resilience leads', memberSince: '2025-06-02T12:00:00Z' },
            { name: 'Volunteers', memberSince: '2025-06-02T12:00:00Z' },
        ];

        return groups.map((group) => ({
            ...group,
            memberSince:
                group.memberSince === '-'
                    ? '-'
                    : (() => {
                          try {
                              return format(new Date(group.memberSince), 'd MMM yyyy');
                          } catch {
                              return '-';
                          }
                      })(),
        }));
    };

    return {
        user,
        loading,
        getUserDisplayName,
        getUserEmailDomain,
        getUserOrganisation,
        getUserMemberSince,
        getUserAddedBy,
        getUserType,
        getUserGroups,
    };
}
