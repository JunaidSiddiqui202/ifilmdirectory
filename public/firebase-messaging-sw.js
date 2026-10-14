/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications when the app is closed or in background
 */

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyBnWPbHkMZfwCCIqJmCjWyxPPHJLBqVxmI",
    authDomain: "ifilmdirectory-94b82.firebaseapp.com",
    projectId: "ifilmdirectory-94b82",
    storageBucket: "ifilmdirectory-94b82.firebasestorage.app",
    messagingSenderId: "1029815074854",
    appId: "1:1029815074854:web:4b3f0f0e8c8e8e8e8e8e8e",
    measurementId: "G-XXXXXXXXXX"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

/**
 * Handle background messages
 * This runs when the app is in the background or closed
 */
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'iFilmDirectory';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        tag: payload.data?.type || 'default',
        requireInteraction: true,
        data: {
            click_action: payload.data?.click_action || '/',
            ...payload.data
        },
        // Sound will play automatically on mobile devices
        silent: false,
        // Show notification even if app is open
        renotify: true,
        // Custom actions
        actions: [
            {
                action: 'open',
                title: 'Open',
                icon: '/logo.png'
            },
            {
                action: 'close',
                title: 'Dismiss',
                icon: '/close-icon.png'
            }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Get the click action URL from notification data
    const clickAction = event.notification.data?.click_action || '/';

    // Open the app or focus existing window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.registration.scope) && 'focus' in client) {
                        client.focus();
                        client.postMessage({
                            type: 'NOTIFICATION_CLICKED',
                            data: event.notification.data
                        });
                        return client.navigate(clickAction);
                    }
                }
                // If app is not open, open it
                if (clients.openWindow) {
                    return clients.openWindow(clickAction);
                }
            })
    );
});

/**
 * Handle push events (for additional customization)
 */
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push event received:', event);
    // Firebase Messaging handles this automatically, but we can add custom logic here
});

console.log('[firebase-messaging-sw.js] Service Worker initialized');
