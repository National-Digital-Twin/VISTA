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
            } catch {
                // eslint-disable-next-line no-empty
            }
        };

        void resolveInvites();
    }, []);

    return <>{children}</>;
};

export default UserStartupProvider;
