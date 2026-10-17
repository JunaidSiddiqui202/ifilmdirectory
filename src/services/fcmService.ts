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

let sharedAudioCtx: AudioContext | null = null;

/**
 * Unlock AudioContext on first user interaction to bypass browser autoplay policy
 */
export const unlockAudio = () => {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!sharedAudioCtx) {
            sharedAudioCtx = new AudioCtx();
        }
        if (sharedAudioCtx.state === 'suspended') {
            sharedAudioCtx.resume().catch(() => {});
        }
    } catch (e) {
        // Safe fail
    }
};

// Register one-time user interaction listeners to unlock sound
if (typeof window !== 'undefined') {
    const handleFirstInteraction = () => {
        unlockAudio();
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });
}

/**
 * Synthesizes a gentle, premium 2-tone chime (D5 -> A5) via Web Audio API
 */
export const playSynthesizedChime = () => {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = sharedAudioCtx || new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;

        // Tone 1: Gentle bell D5 (587.33 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Tone 2: Bright chime A5 (880 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(0.45, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.6);
    } catch (e) {
        console.warn('Web Audio synthesis prevented:', e);
    }
};

/**
 * Play notification sound with fallback to synthesized chime
 */
export const playNotificationSound = () => {
    try {
        unlockAudio();
        // 1. Try native wav audio file
        const audio = new Audio('/notification-sound.wav');
        audio.volume = 0.85;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay policy or file issue: fallback to synthesized chime
                playSynthesizedChime();
            });
        }
    } catch (error) {
        // Immediate fallback
        playSynthesizedChime();
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
