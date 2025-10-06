import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import roadRoute from './graphql-queries/roadRoute.graphql';

import config from '@/config/app-config';

const PARALOG_PYTHON_BASE_URL = config.services.ndtpPython;

const httpLink = new HttpLink({ uri: PARALOG_PYTHON_BASE_URL });

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});

export const GET_ROAD_ROUTE = roadRoute;

export default client;
