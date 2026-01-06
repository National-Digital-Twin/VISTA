import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import apolloClient from './apollo-client';
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
});
