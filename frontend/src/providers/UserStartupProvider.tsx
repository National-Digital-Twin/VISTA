// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useEffect, type ReactNode } from 'react';
import config from '@/config/app-config';

type UserStartupProviderProps = {
    children: ReactNode;
};

const UserStartupProvider = ({ children }: UserStartupProviderProps) => {
    useEffect(() => {
        const resolveInvites = async () => {
            const url = config.services.resolveInvites;
            if (!url) {
                return;
            }

            try {
                await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                });
                // eslint-disable-next-line no-empty
            } catch {}
        };

        void resolveInvites();
    }, []);

    return children;
};

export default UserStartupProvider;
