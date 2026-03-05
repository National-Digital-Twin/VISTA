// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, fetchUserById, UserData } from '@/api/users';

type ProfileData = {
    user: UserData | null;
    loading: boolean;
    error: string | null;
    isOwnProfile: boolean;
    currentUserId: string | null;
    getUserDisplayName: () => string;
    getUserEmail: () => string;
    getUserOrganisation: () => string;
    getUserMemberSince: () => string;
    getUserAddedBy: () => string;
    getUserType: () => string;
    getUserGroups: () => Array<{ name: string; memberSince: string }>;
};

export function useProfileData(userId?: string): ProfileData {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            setLoading(true);
            setError(null);

            try {
                if (userId === undefined || userId === null) {
                    try {
                        const currentUser = await fetchCurrentUser();
                        setCurrentUserId(currentUser?.id || currentUser?.email || null);
                    } catch {
                        setCurrentUserId(null);
                    }
                    const apiUser = await fetchCurrentUser();

                    const groups = Array.isArray(apiUser?.groups)
                        ? apiUser.groups.map((group: string | { name: string; memberSince: string }) => {
                              if (typeof group === 'string') {
                                  return { name: group, memberSince: new Date().toISOString() };
                              }
                              return group;
                          })
                        : [];

                    const userWithMockData: UserData = {
                        ...apiUser,
                        memberSince: apiUser?.memberSince || new Date().toISOString(),
                        addedBy: apiUser?.addedBy || 'Application owner',
                        userType: apiUser?.userType || 'Administrator',
                        groups:
                            groups.length > 0
                                ? groups
                                : [
                                      { name: 'Resilience team', memberSince: new Date().toISOString() },
                                      { name: 'Tywnwell team', memberSince: new Date().toISOString() },
                                      { name: 'Resilience leads', memberSince: new Date().toISOString() },
                                      { name: 'Volunteers', memberSince: new Date().toISOString() },
                                  ],
                    };

                    setUser(userWithMockData);
                } else {
                    const [foundUser, currentUser] = await Promise.all([fetchUserById(userId), fetchCurrentUser().catch(() => null)]);
                    setCurrentUserId(currentUser?.id ?? currentUser?.email ?? null);

                    const transformedUser: UserData = {
                        ...foundUser,
                        displayName: foundUser.name,
                        memberSince: foundUser.userSince,
                        addedBy: 'Application owner',
                    };

                    setUser(transformedUser);
                }
            } catch {
                setUser({
                    email: 'test.user@example.com',
                    displayName: 'Test user',
                    memberSince: '2025-06-02T12:00:00Z',
                    addedBy: 'Application owner',
                    userType: 'Admin',
                    groups: [
                        { name: 'Resilience team', memberSince: '2025-06-02T12:00:00Z' },
                        { name: 'Tywnwell team', memberSince: '2025-06-02T12:00:00Z' },
                    ],
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [userId]);

    const getUserDisplayName = () => {
        return user?.displayName || user?.name || user?.email?.split('@')[0] || 'User';
    };

    const getUserEmail = () => {
        return user?.email || 'N/A';
    };

    const getUserOrganisation = () => {
        if (user?.organisation) {
            return user.organisation.replace('@', '');
        }

        if (user?.email) {
            const domain = user.email.split('@')[1];
            return domain || 'twinwell.gov.uk';
        }

        return 'twinwell.gov.uk';
    };

    const getUserMemberSince = () => {
        const memberSince = user?.memberSince || user?.userSince;

        if (!memberSince) {
            return 'N/A';
        }

        try {
            const date = new Date(memberSince);
            if (Number.isNaN(date.getTime())) {
                return 'N/A';
            }
            return format(date, 'd MMM yyyy');
        } catch {
            return 'N/A';
        }
    };

    const getUserAddedBy = () => {
        return user?.addedBy || 'Application owner';
    };

    const getUserType = () => {
        return user?.userType || 'General';
    };

    const getUserGroups = () => {
        const groups = user?.groups || [];

        return groups.map((group) => {
            let memberSinceString = 'N/A';

            if (group.memberSince) {
                try {
                    memberSinceString = format(new Date(group.memberSince), 'd MMM yyyy');
                } catch {
                    memberSinceString = 'N/A';
                }
            }

            return {
                name: group.name,
                memberSince: memberSinceString,
            };
        });
    };

    const isOwnProfile = !userId || (!!currentUserId && userId === currentUserId);

    return {
        user,
        loading,
        error,
        isOwnProfile,
        currentUserId,
        getUserDisplayName,
        getUserEmail,
        getUserOrganisation,
        getUserMemberSince,
        getUserAddedBy,
        getUserType,
        getUserGroups,
    };
}
