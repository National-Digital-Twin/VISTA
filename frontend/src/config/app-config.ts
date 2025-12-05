// Vite fills in these environment variables for us

const config = {
    map: {
        maptilerToken: import.meta.env.VITE_MAP_TILER_TOKEN,
    },
    api: {
        url: import.meta.env.VITE_VISTA_API_URL || '/vista',
    },
    services: {
        ontology: import.meta.env.VITE_ONTOLOGY_SERVICE_URL || '/transparent-proxy',
        apiBaseUrl: import.meta.env.VITE_NDTP_PYTHON_API_BASE_URL || '/ndtp-python/api',
        user: '/ndtp-python/api/user/',
        users: '/ndtp-python/api/users/',
        signout: '/ndtp-python/api/auth/signout/',
    },
    configErrors: [] as string[],
};

if (!config.api.url) {
    config.configErrors.push(
        "No VITE_ONTOLOGY_SERVICE_URL is specified in .env - please check it's present. " + 'For local dev this is probably http://localhost:3030',
    );
}

if (!config.services.ontology) {
    config.configErrors.push(
        "No VITE_ONTOLOGY_SERVICE_URL is specified in .env - please check it's present. " +
            'For local dev this is probably http://localhost:3030. ' +
            'Note that these environment variables now all need a VITE_ prefix (see PR #95).',
    );
}

export default config;
