// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import UserStartupProvider from './UserStartupProvider';

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            resolveInvites: '/ndtp-python/api/users/resolve-invites/',
        },
    },
}));

describe('UserStartupProvider', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders children', () => {
        const { getByText } = render(
            <UserStartupProvider>
                <div>Child content</div>
            </UserStartupProvider>,
        );

        expect(getByText('Child content')).toBeInTheDocument();
    });

    it('posts resolve-invites on mount', async () => {
        fetchMock.mockResolvedValue({ ok: true, status: 200 });

        render(
            <UserStartupProvider>
                <div>Test</div>
            </UserStartupProvider>,
        );

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/api/users/resolve-invites/', {
                method: 'POST',
                credentials: 'include',
            });
        });
    });

    it('swallows fetch errors without crashing', async () => {
        fetchMock.mockRejectedValue(new Error('Network error'));

        expect(() =>
            render(
                <UserStartupProvider>
                    <div>Still renders</div>
                </UserStartupProvider>,
            ),
        ).not.toThrow();

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });
});
