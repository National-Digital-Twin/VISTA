import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('mapbox-gl-draw-geodesic', () => ({
    isCircle: vi.fn(),
    getCircleCenter: vi.fn(),
}));

vi.mock('./config/feature-flags', () => ({
    default: {
        devTools: true,
        routing: true,
        uiNext: true,
        pageHeader: false,
        feedbackWidget: false,
        environmentallySensitiveAreas: true,
        assetTable: true,
    },
}));

vi.mock('./config/app-config', () => ({
    default: {
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
    },
}));

globalThis.URL.createObjectURL ??= vi.fn();

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
