// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('./config/app-config', () => ({
    default: {
        map: {
            maptilerToken: '',
        },
        services: {
            ontology: '/transparent-proxy',
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
