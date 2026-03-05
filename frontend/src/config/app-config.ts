// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

const config = {
    map: {
        maptilerToken: import.meta.env.VITE_MAP_TILER_TOKEN,
    },
    services: {
        ontology: import.meta.env.VITE_ONTOLOGY_SERVICE_URL || '/transparent-proxy',
        apiBaseUrl: import.meta.env.VITE_NDTP_PYTHON_API_BASE_URL || '/ndtp-python/api',
        graphqlApi: '/ndtp-python/api/graphql/',
        user: '/ndtp-python/api/user/',
        users: '/ndtp-python/api/users/',
        signout: '/ndtp-python/api/auth/signout/',
        resolveInvites: '/ndtp-python/api/users/resolve-invites/',
    },
    configErrors: [] as string[],
};

export default config;
