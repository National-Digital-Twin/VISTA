import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';
import config from '@/config/app-config';
export { default as GET_ROAD_ROUTE } from './graphql-queries/roadRoute.graphql';

const GRAPHQL_ENDPOINT = config.services.graphqlApi;

const httpLink = new HttpLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'same-origin',
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

const link = from([retryLink, httpLink]);

const client = new ApolloClient({
    link,
    cache,
});

export default client;
