// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { signout } from '@/api/auth';

export const handleAuthError = async (error: unknown): Promise<void> => {
    let status: number | undefined;

    if (error instanceof Response) {
        status = error.status;
    } else if (error && typeof error === 'object') {
        if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
            status = (error as { status: number }).status;
        } else {
            status = (error as { status?: number; statusCode?: number }).status || (error as { statusCode?: number }).statusCode;
        }
    }

    if (status === 401 || status === 403) {
        await signout();
    }
};
