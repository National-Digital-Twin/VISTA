// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProfileData } from './useProfileData';
import { fetchCurrentUser, fetchUserById } from '@/api/users';

vi.mock('@/api/users');

const mockUserApi = (method: 'fetchCurrentUser' | 'fetchUserById', user: Record<string, any>) => {
    if (method === 'fetchCurrentUser') {
        vi.mocked(fetchCurrentUser).mockResolvedValue(user);
    } else {
        vi.mocked(fetchUserById).mockResolvedValue(user);
    }
};

const renderAndWaitForLoad = async (userId?: string) => {
    const result = renderHook(() => useProfileData(userId));
    await waitFor(() => {
        expect(result.result.current.loading).toBe(false);
    });
    return result.result;
};

describe('useProfileData', () => {
    beforeEach(() => {});

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Loading own profile (no userId)', () => {
        it('fetches current user successfully', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'john.doe@example.com',
                name: 'John Doe',
                displayName: 'John Doe',
                organisation: 'Test Org',
                memberSince: '2024-01-01T00:00:00Z',
                userType: 'Admin',
                groups: [{ name: 'Admin Group', memberSince: '2024-01-01T00:00:00Z' }],
            };

            vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData());

            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user).toBeDefined();
            expect(result.current.user?.email).toBe('john.doe@example.com');
            expect(result.current.isOwnProfile).toBe(true);
        });

        it('applies mock data for missing fields', async () => {
            const mockUser = {
                email: 'test@example.com',
                name: 'Test User',
            };

            vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.memberSince).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            expect(result.current.user?.addedBy).toBe('Application owner');
            expect(result.current.user?.userType).toBe('Administrator');
            expect(result.current.user?.groups).toHaveLength(4);
        });

        it('handles current user fetch failure gracefully', async () => {
            vi.mocked(fetchCurrentUser).mockRejectedValue(new Error('Unauthorized'));

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.email).toBe('test.user@example.com');
            expect(result.current.user?.displayName).toBe('Test user');
        });

        it('sets currentUserId from user id', async () => {
            const mockUser = {
                id: 'user-456',
                email: 'test@example.com',
            };

            vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.isOwnProfile).toBe(true);
        });

        it('falls back to email for currentUserId when no id', async () => {
            const mockUser = {
                email: 'test@example.com',
            };

            vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.isOwnProfile).toBe(true);
        });

        it('handles first currentUser fetch failure but continues', async () => {
            const mockUser = {
                email: 'test@example.com',
            };

            vi.mocked(fetchCurrentUser).mockRejectedValueOnce(new Error('401')).mockResolvedValueOnce(mockUser);

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user).toBeDefined();
        });
    });

    describe('Loading other user profile (with userId)', () => {
        it('fetches user by ID successfully', async () => {
            const mockUser = {
                id: 'other-user-123',
                email: 'other@example.com',
                name: 'Other User',
                userSince: '2023-05-15T00:00:00Z',
                userType: 'General',
                groups: [{ name: 'Users', memberSince: '2023-05-15T00:00:00Z' }],
            };

            vi.mocked(fetchUserById).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData('other-user-123'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(vi.mocked(fetchUserById)).toHaveBeenCalledWith('other-user-123');
            expect(result.current.user?.id).toBe('other-user-123');
            expect(result.current.user?.displayName).toBe('Other User');
            expect(result.current.user?.memberSince).toBe('2023-05-15T00:00:00Z');
            expect(result.current.isOwnProfile).toBe(false);
        });

        it('transforms userSince to memberSince', async () => {
            const mockUser = {
                id: 'user-789',
                name: 'Test',
                userSince: '2024-03-10T00:00:00Z',
            };

            vi.mocked(fetchUserById).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData('user-789'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.memberSince).toBe('2024-03-10T00:00:00Z');
        });

        it('adds application owner as addedBy', async () => {
            const mockUser = {
                id: 'user-999',
                name: 'Test',
            };

            vi.mocked(fetchUserById).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData('user-999'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.addedBy).toBe('Application owner');
        });

        it('falls back to test user on error', async () => {
            vi.mocked(fetchUserById).mockRejectedValue(new Error('Not found'));

            const { result } = renderHook(() => useProfileData('missing-user'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.email).toBe('test.user@example.com');
            expect(result.current.user?.displayName).toBe('Test user');
        });
    });

    describe('Helper functions', () => {
        const testHelperFunction = async (mockUser: Record<string, any>, helperName: string, expectedValue: any) => {
            mockUserApi('fetchCurrentUser', mockUser);
            const result = await renderAndWaitForLoad();
            const fn = result.current[helperName as keyof typeof result.current];
            expect(typeof fn === 'function' ? fn() : fn).toBe(expectedValue);
        };

        it('getUserDisplayName returns displayName when available', async () => {
            await testHelperFunction({ displayName: 'John Doe', name: 'John', email: 'john@example.com' }, 'getUserDisplayName', 'John Doe');
        });

        it('getUserDisplayName falls back to name', async () => {
            await testHelperFunction({ name: 'Jane Smith', email: 'jane@example.com' }, 'getUserDisplayName', 'Jane Smith');
        });

        it('getUserDisplayName falls back to email username', async () => {
            await testHelperFunction({ email: 'testuser@example.com' }, 'getUserDisplayName', 'testuser');
        });

        it('getUserEmail returns email or N/A', async () => {
            await testHelperFunction({ email: 'test@example.com' }, 'getUserEmail', 'test@example.com');
        });

        it('getUserOrganisation removes @ symbol', async () => {
            await testHelperFunction({ organisation: '@TestOrg', email: 'test@example.com' }, 'getUserOrganisation', 'TestOrg');
        });

        it('getUserOrganisation extracts from email domain', async () => {
            await testHelperFunction({ email: 'user@company.com' }, 'getUserOrganisation', 'company.com');
        });

        it('getUserOrganisation falls back to twinwell.gov.uk', async () => {
            await testHelperFunction({ email: 'test' }, 'getUserOrganisation', 'twinwell.gov.uk');
        });

        it('getUserMemberSince formats date correctly', async () => {
            await testHelperFunction({ memberSince: '2024-03-15T10:30:00Z', email: 'test@example.com' }, 'getUserMemberSince', '15 Mar 2024');
        });

        it('getUserMemberSince handles invalid dates', async () => {
            await testHelperFunction({ memberSince: 'invalid-date', email: 'test@example.com' }, 'getUserMemberSince', 'N/A');
        });

        it('getUserGroups formats dates correctly', async () => {
            const mockUser = {
                email: 'test@example.com',
                groups: [
                    { name: 'Group A', memberSince: '2024-01-15T00:00:00Z' },
                    { name: 'Group B', memberSince: '2024-02-20T00:00:00Z' },
                ],
            };

            vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const groups = result.current.getUserGroups();
            expect(groups).toHaveLength(2);
            expect(groups[0].memberSince).toBe('15 Jan 2024');
            expect(groups[1].memberSince).toBe('20 Feb 2024');
        });

        it('getUserGroups returns default groups when none provided', async () => {
            const mockUser = {
                email: 'test@example.com',
            };

            vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const groups = result.current.getUserGroups();
            expect(groups).toHaveLength(4);
            expect(groups[0].name).toBe('Resilience team');
        });
    });

    describe('isOwnProfile logic', () => {
        it('returns true when no userId provided', async () => {
            vi.mocked(fetchCurrentUser).mockResolvedValue({ email: 'test@example.com' });

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.isOwnProfile).toBe(true);
        });

        it('returns false when viewing different user', async () => {
            const currentUser = { id: 'user-123', email: 'me@example.com' };
            const otherUser = { id: 'user-456', email: 'other@example.com', name: 'Other' };

            vi.mocked(fetchCurrentUser).mockResolvedValue(currentUser);
            vi.mocked(fetchUserById).mockResolvedValue(otherUser);

            const { result } = renderHook(() => useProfileData('user-456'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.isOwnProfile).toBe(false);
        });

        it('checks if viewing own user by ID', async () => {
            const currentUser = { id: 'user-123', email: 'me@example.com' };

            vi.mocked(fetchCurrentUser).mockResolvedValue(currentUser);
            vi.mocked(fetchUserById).mockResolvedValue(currentUser);

            const { result } = renderHook(() => useProfileData('user-123'));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.isOwnProfile).toBe(true);
            expect(result.current.currentUserId).toBe('user-123');
        });
    });

    describe('Refetching on userId change', () => {
        it('refetches when userId changes', async () => {
            const mockCurrentUser = { id: 'current', email: 'current@example.com' };
            const mockOtherUser = { id: 'other', name: 'Other User', userSince: '2024-01-01' };

            vi.mocked(fetchCurrentUser).mockResolvedValue(mockCurrentUser);
            vi.mocked(fetchUserById).mockResolvedValue(mockOtherUser);

            const { result, rerender } = renderHook(({ userId }) => useProfileData(userId), {
                initialProps: { userId: undefined as string | undefined },
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.email).toBe('current@example.com');

            rerender({ userId: 'other' });

            await waitFor(() => {
                expect(result.current.user?.id).toBe('other');
            });

            expect(vi.mocked(fetchUserById)).toHaveBeenCalledWith('other');
        });
    });

    describe('Error states', () => {
        it('sets error to null initially', async () => {
            vi.mocked(fetchCurrentUser).mockResolvedValue({ email: 'test@example.com' });

            const { result } = renderHook(() => useProfileData());

            expect(result.current.error).toBeNull();
        });

        it('provides fallback test user on complete failure', async () => {
            vi.mocked(fetchCurrentUser).mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user).toBeDefined();
            expect(result.current.user?.email).toBe('test.user@example.com');
            expect(result.current.user?.groups).toHaveLength(2);
        });
    });

    describe('Edge cases', () => {
        it('handles user with no email', async () => {
            const mockUser = {
                id: 'user-no-email',
                name: 'No Email User',
            };

            vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.getUserEmail()).toBe('N/A');
            expect(result.current.getUserDisplayName()).toBe('No Email User');
        });

        it('handles empty string userId', async () => {
            const mockUser = { email: 'test@example.com' };
            vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData(''));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(vi.mocked(fetchUserById)).toHaveBeenCalledWith('');
        });

        it('handles null userId', async () => {
            const mockUser = { email: 'test@example.com' };
            vi.mocked(fetchCurrentUser).mockResolvedValue(mockUser);

            const { result } = renderHook(() => useProfileData(null as any));

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.isOwnProfile).toBe(true);
        });
    });
});
