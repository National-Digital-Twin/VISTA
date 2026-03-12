const config = {
    map: {
        maptilerToken: import.meta.env.VITE_MAP_TILER_TOKEN,
    },
    services: {
        ontology: import.meta.env.VITE_ONTOLOGY_SERVICE_URL || '/transparent-proxy',
        apiBaseUrl: import.meta.env.VITE_NDTP_PYTHON_API_BASE_URL || '/ndtp-python/api',
        user: '/ndtp-python/api/user/',
        users: '/ndtp-python/api/users/',
        signout: '/ndtp-python/api/auth/signout/',
        resolveInvites: '/ndtp-python/api/users/resolve-invites/',
    },
    configErrors: [] as string[],
};

export default config;
