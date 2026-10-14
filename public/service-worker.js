/**
 * iFilmDirectory Service Worker KILL SWITCH
 * This script is designed to automatically unregister itself and clear all caches
 * for any user who still has a legacy service worker installed.
 * 
 * Why? To fix the "Blank Screen" issue caused by stale caches without user intervention.
 */

self.addEventListener('install', (event) => {
    console.log('[SW Kill Switch] Installing and skipping wait...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW Kill Switch] Activating and unregistering globally...');

    event.waitUntil(
        Promise.all([
            // 1. Clear all named caches
            caches.keys().then((keys) => {
                return Promise.all(keys.map((key) => caches.delete(key)));
            }),
            // 2. Unregister this worker
            self.registration.unregister(),
            // 3. Claim clients and reload them
            self.clients.matchAll({ type: 'window' }).then((clients) => {
                clients.forEach((client) => {
                    if (client.url && 'navigate' in client) {
                        client.navigate(client.url);
                    }
                });
            })
        ]).then(() => {
            console.log('[SW Kill Switch] Done. Cache cleared and SW unregistered.');
        })
    );
});

// Fallback: If any fetch happens, also try to bypass cache
self.addEventListener('fetch', (event) => {
    // Just serve from network, don't use cache
    event.respondWith(fetch(event.request));
});
