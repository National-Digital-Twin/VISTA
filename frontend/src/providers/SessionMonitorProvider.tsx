import { useEffect, useRef, type ReactNode } from 'react';
import { signout } from '@/api/auth';
import config from '@/config/app-config';

const PING_INTERVAL_MS = 30000;
const PING_URL = `${config.services.apiBaseUrl.replace('/api', '')}/ping/`;

interface SessionMonitorProviderProps {
    children: ReactNode;
    enabled?: boolean;
}

const SessionMonitorProvider = ({ children, enabled = true }: SessionMonitorProviderProps) => {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const ping = async () => {
            if (!navigator.onLine) {
                return;
            }

            try {
                const response = await fetch(PING_URL, {
                    method: 'HEAD',
                    cache: 'no-store',
                    credentials: 'include',
                });

                if (response.status === 401 || response.status === 403) {
                    await signout();
                    return;
                }
            } catch {
                // eslint-disable-next-line no-empty
            }
        };

        ping();

        intervalRef.current = globalThis.setInterval(ping, PING_INTERVAL_MS);

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled]);

    return <>{children}</>;
};

export default SessionMonitorProvider;
