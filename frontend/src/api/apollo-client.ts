import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { ErrorLink } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { signout } from './auth';
import config from '@/config/app-config';
export { default as GET_ROAD_ROUTE } from './graphql-queries/roadRoute.graphql';

const GRAPHQL_ENDPOINT = config.services.graphqlApi;

const httpLink = new HttpLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'same-origin',
});

const errorLink = new ErrorLink(({ error }) => {
    let shouldLogout = false;

    if (CombinedGraphQLErrors.is(error)) {
        for (const err of error.errors) {
            const status =
                (err.extensions as { statusCode?: number; http?: { status?: number } })?.statusCode ||
                (err.extensions as { http?: { status?: number } })?.http?.status;
            if (status === 401 || status === 403) {
                shouldLogout = true;
            }
        }
    } else {
        const networkErr = error as { statusCode?: number; result?: { statusCode?: number }; response?: { status?: number } };
        const status = networkErr.statusCode || networkErr.result?.statusCode || networkErr.response?.status;
        if (status === 401 || status === 403) {
            shouldLogout = true;
        }
    }

    if (shouldLogout) {
        signout();
    }
});

const retryLink = new RetryLink({
    delay: {
        initial: 300,
        max: Infinity,
        jitter: true,
    },
    attempts: {
        max: 3,
        retryIf: (error) => {
            return !!error && !(error as { graphQLErrors?: unknown }).graphQLErrors;
        },
    },
});

const cache = new InMemoryCache({
    typePolicies: {
        Query: {
            fields: {
                roadRoute: {
                    keyArgs: ['routeInput', ['startLat', 'startLon', 'endLat', 'endLon', 'vehicle']],
                    merge: false,
                },
            },
        },
    },
});

const link = errorLink.concat(retryLink).concat(httpLink);

const client = new ApolloClient({
    link,
    cache,
});

export default client;
