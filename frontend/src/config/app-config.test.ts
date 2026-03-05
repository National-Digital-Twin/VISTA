// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('app-config', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('exposes expected default service routes', async () => {
        const { default: config } = await vi.importActual<typeof import('./app-config')>('./app-config');

        expect(config.services.ontology).toBeTruthy();
        expect(config.services.apiBaseUrl).toBeTruthy();
        expect(config.services.graphqlApi).toBe('/ndtp-python/api/graphql/');
        expect(config.services.user).toBe('/ndtp-python/api/user/');
        expect(config.services.users).toBe('/ndtp-python/api/users/');
        expect(config.services.signout).toBe('/ndtp-python/api/auth/signout/');
        expect(config.services.resolveInvites).toBe('/ndtp-python/api/users/resolve-invites/');
    });

    it('starts with no config errors when defaults are valid', async () => {
        const { default: config } = await vi.importActual<typeof import('./app-config')>('./app-config');

        expect(config.configErrors).toEqual([]);
    });
});
