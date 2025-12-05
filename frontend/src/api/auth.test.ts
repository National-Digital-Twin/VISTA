import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signout } from './auth';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            signout: '/api/signout',
        },
    },
}));

describe('auth API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let cachesMock: {
        keys: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };
    let locationMock: Location;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;

        cachesMock = {
            keys: vi.fn(),
            delete: vi.fn(),
        };
        globalThis.caches = cachesMock as any;

        locationMock = globalThis.location;
        delete (globalThis as any).location;
        (globalThis as any).location = locationMock;

        vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('signout', () => {
        it('successfully signs out and redirects', async () => {
            const mockLogoutLinks = {
                oAuthLogoutUrl: 'https://oauth.example.com/logout',
                redirect: 'https://example.com/login',
            };

            const cacheNames = ['cache1', 'cache2'];
            cachesMock.keys.mockResolvedValue(cacheNames);
            cachesMock.delete.mockResolvedValue(true);

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLogoutLinks),
                })
                .mockResolvedValueOnce({
                    ok: true,
                });

            await signout();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/signout', {
                headers: { 'Content-Type': 'application/json' },
            });
            expect(fetchMock).toHaveBeenNthCalledWith(2, mockLogoutLinks.oAuthLogoutUrl, {
                method: 'GET',
                redirect: 'manual',
                credentials: 'include',
            });

            expect(cachesMock.keys).toHaveBeenCalled();
            expect(cachesMock.delete).toHaveBeenCalledTimes(2);
            expect(cachesMock.delete).toHaveBeenCalledWith('cache1');
            expect(cachesMock.delete).toHaveBeenCalledWith('cache2');

            expect(Storage.prototype.clear).toHaveBeenCalled();

            expect(document.location).toBe(locationMock);
        });

        it('clears caches when caches API is available', async () => {
            const mockLogoutLinks = {
                oAuthLogoutUrl: 'https://oauth.example.com/logout',
                redirect: 'https://example.com/login',
            };

            const cacheNames = ['cache1'];
            cachesMock.keys.mockResolvedValue(cacheNames);
            cachesMock.delete.mockResolvedValue(true);

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLogoutLinks),
                })
                .mockResolvedValueOnce({
                    ok: true,
                });

            await signout();

            expect(cachesMock.keys).toHaveBeenCalled();
            expect(cachesMock.delete).toHaveBeenCalledWith('cache1');
        });

        it('handles case when caches API is not available', async () => {
            const mockLogoutLinks = {
                oAuthLogoutUrl: 'https://oauth.example.com/logout',
                redirect: 'https://example.com/login',
            };

            delete (globalThis as any).caches;

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLogoutLinks),
                })
                .mockResolvedValueOnce({
                    ok: true,
                });

            await signout();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(localStorage.clear).toHaveBeenCalled();
            expect(sessionStorage.clear).toHaveBeenCalled();
        });

        it('handles empty cache list', async () => {
            const mockLogoutLinks = {
                oAuthLogoutUrl: 'https://oauth.example.com/logout',
                redirect: 'https://example.com/login',
            };

            cachesMock.keys.mockResolvedValue([]);

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLogoutLinks),
                })
                .mockResolvedValueOnce({
                    ok: true,
                });

            await signout();

            expect(cachesMock.keys).toHaveBeenCalled();
            expect(cachesMock.delete).not.toHaveBeenCalled();
        });

        it('redirects to home when signout API response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Unauthorized',
            });

            await signout();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith('/api/signout', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('redirects to home when signout API call fails', async () => {
            const networkError = new Error('Network error');
            fetchMock.mockRejectedValue(networkError);

            await signout();

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('redirects to home when JSON parsing fails', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            await signout();
        });

        it('still redirects even if OAuth logout call fails', async () => {
            const mockLogoutLinks = {
                oAuthLogoutUrl: 'https://oauth.example.com/logout',
                redirect: 'https://example.com/login',
            };

            cachesMock.keys.mockResolvedValue([]);

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLogoutLinks),
                })
                .mockRejectedValueOnce(new Error('OAuth logout failed'));

            await signout();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(Storage.prototype.clear).toHaveBeenCalled();
        });

        it('handles cache clearing failure gracefully', async () => {
            const mockLogoutLinks = {
                oAuthLogoutUrl: 'https://oauth.example.com/logout',
                redirect: 'https://example.com/login',
            };

            cachesMock.keys.mockRejectedValue(new Error('Cache error'));

            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: vi.fn().mockResolvedValue(mockLogoutLinks),
                })
                .mockResolvedValueOnce({
                    ok: true,
                });

            await signout();
        });

        it('handles all operations in correct order', async () => {
            const mockLogoutLinks = {
                oAuthLogoutUrl: 'https://oauth.example.com/logout',
                redirect: 'https://example.com/login',
            };

            const cacheNames = ['cache1'];
            cachesMock.keys.mockResolvedValue(cacheNames);
            cachesMock.delete.mockResolvedValue(true);

            const callOrder: string[] = [];

            fetchMock
                .mockImplementationOnce(async () => {
                    callOrder.push('signout-api');
                    return {
                        ok: true,
                        json: vi.fn().mockResolvedValue(mockLogoutLinks),
                    };
                })
                .mockImplementationOnce(async () => {
                    callOrder.push('oauth-logout');
                    return { ok: true };
                });

            cachesMock.keys.mockImplementation(async () => {
                callOrder.push('cache-keys');
                return cacheNames;
            });

            cachesMock.delete.mockImplementation(async () => {
                callOrder.push('cache-delete');
                return true;
            });

            const clearSpy = vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
                callOrder.push('storage-clear');
            });

            await signout();

            expect(callOrder).toContain('signout-api');
            expect(callOrder).toContain('cache-keys');
            expect(callOrder).toContain('cache-delete');
            expect(callOrder).toContain('storage-clear');
            expect(callOrder).toContain('oauth-logout');

            clearSpy.mockRestore();
        });
    });
});
