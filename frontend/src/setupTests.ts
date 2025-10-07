import '@testing-library/jest-dom';

jest.mock('mapbox-gl-draw-geodesic', () => ({
    isCircle: jest.fn(),
    getCircleCenter: jest.fn(),
}));

jest.mock('./config/feature-flags', () => ({
    devTools: true,
    routing: true,
    uiNext: true,
    pageHeader: false,
    feedbackWidget: false,
    environmentallySensitiveAreas: true,
    assetTable: true,
}));

jest.mock('./config/app-config', () => ({
    map: {
        maptilerToken: '',
    },
    api: {
        url: '/vista',
    },
    services: {
        ontology: '/transparent-proxy',
        ndtpPython: '/ndtp-python/api/graphql/',
        user: '/ndtp-python/api/user/',
        signout: '/ndtp-python/api/auth/signout/',
    },
    configErrors: [],
}));

globalThis.URL.createObjectURL ??= jest.fn();

// Polyfill structuredClone for Jest test environment
globalThis.structuredClone ??= (obj: any) => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Object.prototype.toString.call(obj) === '[object Date]') {
        return new Date(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => globalThis.structuredClone(item));
    }
    if (typeof obj === 'object') {
        const cloned: any = {};
        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                cloned[key] = globalThis.structuredClone(obj[key]);
            }
        }
        return cloned;
    }
    return obj;
};
