// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { ApolloClient, InMemoryCache } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import apolloClient, { shouldLogoutFromApolloError, shouldRetryApolloError } from './apollo-client';
import { signout } from './auth';

vi.mock('./auth', () => ({
    signout: vi.fn(),
}));

const mockedSignout = vi.mocked(signout);

describe('apollo-client', () => {
    beforeEach(() => {
        mockedSignout.mockClear();
    });

    it('creates Apollo client instance', () => {
        expect(apolloClient).toBeInstanceOf(ApolloClient);
        expect(apolloClient.cache).toBeInstanceOf(InMemoryCache);
    });

    it('has error link configured', () => {
        const link = apolloClient.link;
        expect(link).toBeDefined();
    });

    it('detects GraphQL auth errors for logout', () => {
        vi.spyOn(CombinedGraphQLErrors, 'is').mockReturnValue(true);
        const error = {
            errors: [{ extensions: { statusCode: 401 } }],
        };

        expect(shouldLogoutFromApolloError(error)).toBe(true);
    });

    it('does not logout for non-auth GraphQL errors', () => {
        vi.spyOn(CombinedGraphQLErrors, 'is').mockReturnValue(true);
        const error = {
            errors: [{ extensions: { statusCode: 500 } }],
        };

        expect(shouldLogoutFromApolloError(error)).toBe(false);
    });

    it('detects network auth errors for logout', () => {
        vi.spyOn(CombinedGraphQLErrors, 'is').mockReturnValue(false);

        expect(shouldLogoutFromApolloError({ statusCode: 403 })).toBe(true);
        expect(shouldLogoutFromApolloError({ result: { statusCode: 401 } })).toBe(true);
        expect(shouldLogoutFromApolloError({ response: { status: 403 } })).toBe(true);
        expect(shouldLogoutFromApolloError({ statusCode: 500 })).toBe(false);
    });

    it('uses retry predicate only for non-GraphQL errors', () => {
        expect(shouldRetryApolloError(new Error('network'))).toBe(true);
        expect(shouldRetryApolloError({ graphQLErrors: [{}] })).toBe(false);
        expect(shouldRetryApolloError(null)).toBe(false);
    });
});
