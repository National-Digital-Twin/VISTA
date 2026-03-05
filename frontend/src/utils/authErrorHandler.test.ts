// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from './apiError';
import { handleAuthError } from './authErrorHandler';
import { signout } from '@/api/auth';

vi.mock('@/api/auth', () => ({
    signout: vi.fn(),
}));

const mockedSignout = vi.mocked(signout);

const delay = (ms: number): Promise<void> => {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
};

const createQueryClientWithErrorHandler = () => {
    return new QueryClient({
        queryCache: new QueryCache({
            onError: handleAuthError,
        }),
        mutationCache: new MutationCache({
            onError: handleAuthError,
        }),
    });
};

describe('authErrorHandler', () => {
    beforeEach(() => {
        mockedSignout.mockClear();
    });

    describe('Response errors', () => {
        it('calls signout for 401 Response', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const response = new Response('Unauthorized', { status: 401 });
            const queryFn = () => {
                throw response;
            };

            try {
                await queryClient.fetchQuery({
                    queryKey: ['test'],
                    queryFn,
                });
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(50);

            expect(mockedSignout).toHaveBeenCalled();
        });

        it('calls signout for 403 Response', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const response = new Response('Forbidden', { status: 403 });
            const queryFn = () => {
                throw response;
            };

            try {
                await queryClient.fetchQuery({
                    queryKey: ['test'],
                    queryFn,
                });
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(50);

            expect(mockedSignout).toHaveBeenCalled();
        });

        it('does not call signout for 200 Response', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const queryFn = () => {
                throw new Response('OK', { status: 200 });
            };

            try {
                await queryClient.fetchQuery({
                    queryKey: ['test'],
                    queryFn,
                });
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(10);

            expect(mockedSignout).not.toHaveBeenCalled();
        });
    });

    describe('ApiError', () => {
        it('calls signout for 401 ApiError', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const error = new ApiError('Unauthorized', 401, 'Unauthorized');
            const queryFn = () => {
                throw error;
            };

            try {
                await queryClient.fetchQuery({
                    queryKey: ['test'],
                    queryFn,
                });
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(50);

            expect(mockedSignout).toHaveBeenCalled();
        });

        it('calls signout for 403 ApiError', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const error = new ApiError('Forbidden', 403, 'Forbidden');
            const queryFn = () => {
                throw error;
            };

            try {
                await queryClient.fetchQuery({
                    queryKey: ['test'],
                    queryFn,
                });
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(50);

            expect(mockedSignout).toHaveBeenCalled();
        });
    });

    describe('Error objects with status property', () => {
        it('calls signout for error with status 401', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const error = { status: 401, message: 'Unauthorized' };
            const queryFn = () => {
                throw error;
            };

            try {
                await queryClient.fetchQuery({
                    queryKey: ['test'],
                    queryFn,
                });
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(50);

            expect(mockedSignout).toHaveBeenCalled();
        });

        it('calls signout for error with statusCode 403', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const error = { statusCode: 403, message: 'Forbidden' };
            const queryFn = () => {
                throw error;
            };

            try {
                await queryClient.fetchQuery({
                    queryKey: ['test'],
                    queryFn,
                });
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(50);

            expect(mockedSignout).toHaveBeenCalled();
        });
    });

    describe('Other errors', () => {
        it('does not call signout for generic Error', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const error = new Error('Network error');
            const queryFn = () => {
                throw error;
            };

            try {
                await queryClient.fetchQuery({
                    queryKey: ['test'],
                    queryFn,
                });
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(10);

            expect(mockedSignout).not.toHaveBeenCalled();
        });

        it('does not call signout for non-auth status codes', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const error = { status: 500, message: 'Internal Server Error' };
            const queryFn = () => {
                throw error;
            };

            try {
                await queryClient.fetchQuery({
                    queryKey: ['test'],
                    queryFn,
                });
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(10);

            expect(mockedSignout).not.toHaveBeenCalled();
        });
    });

    describe('Mutation errors', () => {
        it('calls signout for 401 mutation error', async () => {
            const queryClient = createQueryClientWithErrorHandler();
            const error = new ApiError('Unauthorized', 401, 'Unauthorized');
            const mutationFn = async () => {
                throw error;
            };

            try {
                await queryClient
                    .getMutationCache()
                    .build(queryClient, {
                        mutationFn,
                    })
                    .execute(undefined);
                // eslint-disable-next-line no-empty
            } catch {}

            await delay(50);

            expect(mockedSignout).toHaveBeenCalled();
        });
    });
});
