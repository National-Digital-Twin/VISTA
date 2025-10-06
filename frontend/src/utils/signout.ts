import config from '@/config/app-config';

async function clearServiceWorkerCaches() {
    // Clear service worker cache
    if ('caches' in globalThis) {
        await caches.keys().then((cacheNames) => {
            Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        });
    }
}

function clearLocalAndSessionStorage() {
    // Handle client-side storage
    localStorage.clear();
    sessionStorage.clear();
}

export const signout = async () => {
    await fetch(config.services.signout).then(
        async (response) => {
            if (response.ok) {
                const logoutLinks = await response.json();
                await clearServiceWorkerCaches();
                clearLocalAndSessionStorage();
                await fetch(logoutLinks.oAuthLogoutUrl, {
                    method: 'GET',
                    redirect: 'manual',
                    credentials: 'include',
                });
                document.location = logoutLinks.redirect;
            } else {
                document.location = '/';
            }
        },
        () => {
            document.location = '/';
        },
    );
};
