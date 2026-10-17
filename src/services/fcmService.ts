/**
 * Firebase Cloud Messaging Service
 * Handles push notification registration and token management
 * Enhanced with WhatsApp-like notification features
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

// Your Firebase Cloud Messaging VAPID key (Web Push certificate)
// Get this from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';

// Track notification badge count
let notificationBadgeCount = 0;

/**
 * Request permission and register FCM token for the current user
 */
export const registerFCMToken = async (userId: string): Promise<string | null> => {
    try {
        // Check if browser supports notifications
        if (typeof window === 'undefined' || !('Notification' in window) || typeof window.Notification === 'undefined') {
            console.log('This browser does not support notifications');
            return null;
        }

        // Check current permission status
        let permission = window.Notification.permission;

        // Request notification permission if not already granted
        if (permission === 'default') {
            permission = await window.Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Register service worker for background notifications
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('Service Worker registered:', registration);
            } catch (swError) {
                console.error('Service Worker registration failed:', swError);
            }
        }

        // Get FCM token
        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY
        });

        if (token) {
            console.log('FCM Token obtained:', token);

            // Save token to user document
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                fcmToken: token,
                fcmTokenUpdatedAt: new Date().toISOString(),
                notificationsEnabled: true
            });

            console.log('FCM token saved to user profile');
            return token;
        } else {
            console.log('No registration token available');
            return null;
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
};

/**
 * Listen for foreground messages
 */
export const listenForMessages = (callback: (payload: any) => void) => {
    try {
        const messaging = getMessaging(app);

        onMessage(messaging, (payload) => {
            console.log('Message received in foreground:', payload);

            // Increment badge count
            notificationBadgeCount++;
            updateBadgeCount(notificationBadgeCount);

            // Show notification with enhanced options
            if (payload.notification) {
                const notificationOptions = {
                    body: payload.notification.body,
                    icon: payload.notification.icon || '/logo.png',
                    badge: '/logo.png',
                    vibrate: [200, 100, 200],
                    tag: payload.data?.type || 'default',
                    requireInteraction: true,
                    silent: false,
                    renotify: true,
                    data: payload.data,
                } as any; // Using 'as any' for browser-specific notification features

                if (typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined') {
                    // Show the notification
                    const notification = new window.Notification(
                        payload.notification.title || 'New Notification',
                        notificationOptions
                    );

                    // Handle notification click
                    notification.onclick = (event) => {
                        event.preventDefault();
                        const clickAction = payload.data?.click_action || '/';
                        window.focus();
                        window.location.href = clickAction;
                        notification.close();
                    };
                }

                // Play sound
                playNotificationSound();
            }

            callback(payload);
        });

        // Listen for service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data?.type === 'NOTIFICATION_CLICKED') {
                    console.log('Notification clicked from service worker:', event.data);
                    callback(event.data);
                }
            });
        }
    } catch (error) {
        console.error('Error setting up message listener:', error);
    }
};

/**
 * Play notification sound with fallback
 */
export const playNotificationSound = () => {
    try {
        // Try to play custom sound first
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.7;

        audio.play().catch((err) => {
            console.log('Custom sound failed, trying fallback:', err);

            // Fallback: Use Web Audio API to generate a simple notification beep
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800; // Frequency in Hz
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (beepError) {
                console.log('Beep sound also failed:', beepError);
            }
        });
    } catch (error) {
        console.log('Sound playback not available:', error);
    }
};

/**
 * Update notification badge count
 */
const updateBadgeCount = (count: number) => {
    try {
        if ('setAppBadge' in navigator) {
            (navigator as any).setAppBadge(count);
        }
    } catch (error) {
        console.log('Badge API not supported:', error);
    }
};

/**
 * Clear notification badge count
 */
export const clearBadgeCount = () => {
    notificationBadgeCount = 0;
    try {
        if ('clearAppBadge' in navigator) {
            (navigator as any).clearAppBadge();
        }
    } catch (error) {
        console.log('Badge API not supported:', error);
    }
};

/**
 * Check if notifications are supported and enabled
 */
export const checkNotificationSupport = (): {
    supported: boolean;
    permission: NotificationPermission;
} => {
    const supported = typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined';
    let permission: NotificationPermission = 'denied';
    if (supported) {
        try {
            permission = window.Notification.permission;
        } catch {
            permission = 'denied';
        }
    }

    return { supported, permission };
};

/**
 * Unregister FCM token (for logout)
 */
export const unregisterFCMToken = async (userId: string): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            fcmToken: null,
            fcmTokenUpdatedAt: new Date().toISOString(),
            notificationsEnabled: false
        });

        // Clear badge
        clearBadgeCount();

        console.log('FCM token removed from user profile');
    } catch (error) {
        console.error('Error removing FCM token:', error);
    }
};
