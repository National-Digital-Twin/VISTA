import config from '@/config/app-config';

type LogoutLinks = {
    oAuthLogoutUrl: string;
    redirect: string;
};

async function clearServiceWorkerCaches(): Promise<void> {
    if ('caches' in globalThis) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
}

function clearLocalAndSessionStorage(): void {
    localStorage.clear();
    sessionStorage.clear();
}

export const signout = async (): Promise<void> => {
    try {
        const response = await fetch(config.services.signout, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Failed to sign out: ${response.statusText}`);
        }

        const logoutLinks: LogoutLinks = await response.json();

        await clearServiceWorkerCaches();
        clearLocalAndSessionStorage();

        await fetch(logoutLinks.oAuthLogoutUrl, {
            method: 'GET',
            redirect: 'manual',
            credentials: 'include',
        });

        document.location = logoutLinks.redirect;
    } catch {
        document.location = '/';
    }
};
