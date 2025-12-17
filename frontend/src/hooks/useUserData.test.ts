import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserData } from './useUserData';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            user: '/api/user',
        },
    },
}));

const mockFetchWithUser = (fetchMock: ReturnType<typeof vi.fn>, user: Record<string, any>) => {
    fetchMock.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ content: user }),
    });
};

const renderAndWaitForLoad = async (fn: () => any) => {
    const result = renderHook(fn);
    await waitFor(() => {
        expect(result.result.current.loading).toBe(false);
    });
    return result.result;
};

describe('useUserData', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Data fetching', () => {
        it('fetches user data successfully', async () => {
            const mockUser = {
                email: 'john@example.com',
                displayName: 'John Doe',
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ content: mockUser }),
            });

            const { result } = renderHook(() => useUserData());

            expect(result.current.loading).toBe(true);

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user).toBeDefined();
            expect(result.current.user?.email).toBe('john@example.com');
        });

        it('applies mock data for missing fields', async () => {
            const mockUser = {
                email: 'test@example.com',
                displayName: 'Test User',
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ content: mockUser }),
            });

            const { result } = renderHook(() => useUserData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.memberSince).toBe('2025-06-02T12:00:00Z');
            expect(result.current.user?.addedBy).toBe('Application owner');
            expect(result.current.user?.userType).toBe('Admin');
            expect(result.current.user?.groups).toHaveLength(4);
        });

        it('falls back to test user on fetch error', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            const { result } = renderHook(() => useUserData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.email).toBe('test.user@example.com');
            expect(result.current.user?.displayName).toBe('Test user');
        });

        it('falls back to test user on non-ok response', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Unauthorized',
            });

            const { result } = renderHook(() => useUserData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.email).toBe('test.user@example.com');
        });
    });

    describe('Helper functions', () => {
        const testHelperFunction = async (mockUser: Record<string, any>, helperName: keyof ReturnType<typeof useUserData>, expectedValue: any) => {
            mockFetchWithUser(fetchMock, mockUser);
            const result = await renderAndWaitForLoad(() => useUserData());
            const helperFn = result.current[helperName];
            expect(typeof helperFn === 'function' ? helperFn() : helperFn).toBe(expectedValue);
        };

        it('getUserDisplayName returns displayName when available', async () => {
            await testHelperFunction({ displayName: 'Jane Doe', email: 'jane@example.com' }, 'getUserDisplayName', 'Jane Doe');
        });

        it('getUserDisplayName falls back to email username', async () => {
            await testHelperFunction({ email: 'testuser@example.com' }, 'getUserDisplayName', 'testuser');
        });

        it('getUserDisplayName returns User when no data', async () => {
            fetchMock.mockRejectedValue(new Error('Error'));
            const result = await renderAndWaitForLoad(() => useUserData());
            expect(result.current.getUserDisplayName()).toBe('Test user');
        });

        it('getUserEmailDomain extracts domain correctly', async () => {
            await testHelperFunction({ email: 'user@company.co.uk' }, 'getUserEmailDomain', 'company.co.uk');
        });

        it('getUserEmailDomain returns example.com when no email', async () => {
            await testHelperFunction({}, 'getUserEmailDomain', 'example.com');
        });

        it('getUserOrganisation extracts from email', async () => {
            await testHelperFunction({ email: 'user@testorg.gov' }, 'getUserOrganisation', 'testorg.gov');
        });

        it('getUserOrganisation returns default when no email', async () => {
            await testHelperFunction({}, 'getUserOrganisation', 'twinwell.gov.uk');
        });

        it('getUserMemberSince uses hardcoded date (mock data)', async () => {
            await testHelperFunction({ memberSince: '2024-06-15T14:30:00Z', email: 'test@example.com' }, 'getUserMemberSince', '2 Jun 2025');
        });

        it('getUserMemberSince handles invalid dates', async () => {
            await testHelperFunction({ memberSince: 'not-a-date', email: 'test@example.com' }, 'getUserMemberSince', '2 Jun 2025');
        });

        it('getUserAddedBy returns hardcoded default', async () => {
            await testHelperFunction({ addedBy: 'admin@example.com', email: 'test@example.com' }, 'getUserAddedBy', 'Application owner');
        });

        it('getUserType returns hardcoded Admin', async () => {
            await testHelperFunction({ userType: 'General', email: 'test@example.com' }, 'getUserType', 'Admin');
        });

        it('getUserGroups returns hardcoded groups', async () => {
            const mockUser = {
                email: 'test@example.com',
                groups: [
                    { name: 'Alpha', memberSince: '2024-01-01T00:00:00Z' },
                    { name: 'Beta', memberSince: '2024-06-15T00:00:00Z' },
                ],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ content: mockUser }),
            });

            const { result } = renderHook(() => useUserData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const groups = result.current.getUserGroups();
            expect(groups).toHaveLength(4);
            expect(groups[0].name).toBe('Resilience team');
        });

        it('getUserGroups always uses mock data', async () => {
            const mockUser = {
                email: 'test@example.com',
                groups: [{ name: 'Test', memberSince: '-' }],
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ content: mockUser }),
            });

            const { result } = renderHook(() => useUserData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const groups = result.current.getUserGroups();
            expect(groups).toHaveLength(4);
            expect(groups[0].memberSince).toBe('2 Jun 2025');
        });

        it('getUserGroups returns default groups when none provided', async () => {
            const mockUser = {
                email: 'test@example.com',
            };

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ content: mockUser }),
            });

            const { result } = renderHook(() => useUserData());

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            const groups = result.current.getUserGroups();
            expect(groups).toHaveLength(4);
            expect(groups[0].name).toBe('Resilience team');
        });
    });
});
