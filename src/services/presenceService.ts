import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { UserProfile } from './userService';

// Threshold in milliseconds to consider a user online (5 minutes)
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Parses any Firestore timestamp or ISO string into epoch milliseconds
 */
export const parseLastActiveMillis = (lastActive: unknown): number => {
    if (!lastActive) return 0;
    if (typeof lastActive === 'number') return lastActive;
    if (typeof lastActive === 'string') {
        const parsed = new Date(lastActive).getTime();
        return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof lastActive === 'object' && lastActive !== null) {
        const obj = lastActive as { toDate?: () => Date; seconds?: number };
        if (obj.toDate && typeof obj.toDate === 'function') {
            return obj.toDate().getTime();
        }
        if (typeof obj.seconds === 'number') {
            return obj.seconds * 1000;
        }
    }
    return 0;
};

/**
 * Determines whether a user profile is currently online
 */
export const isUserOnline = (user?: Partial<UserProfile> | null): boolean => {
    if (!user) return false;
    
    // Explicitly marked offline
    if (user.isOnline === false) return false;

    const lastActiveMillis = parseLastActiveMillis(user.lastActive);
    if (!lastActiveMillis) {
        // If isOnline is true but no lastActive timestamp is present, fallback to false for safety
        return false;
    }

    const diff = Date.now() - lastActiveMillis;
    return diff >= 0 && diff < ONLINE_THRESHOLD_MS;
};

/**
 * Returns a human-friendly presence status description
 */
export const getUserPresenceInfo = (user?: Partial<UserProfile> | null): {
    isOnline: boolean;
    statusText: string;
    badgeColor: string;
    dotClass: string;
} => {
    if (!user) {
        return { isOnline: false, statusText: 'Offline', badgeColor: 'zinc', dotClass: 'bg-zinc-400' };
    }

    const online = isUserOnline(user);
    if (online) {
        return {
            isOnline: true,
            statusText: 'Online now',
            badgeColor: 'emerald',
            dotClass: 'bg-emerald-500 animate-pulse'
        };
    }

    const lastActiveMillis = parseLastActiveMillis(user.lastActive);
    if (!lastActiveMillis) {
        return { isOnline: false, statusText: 'Offline', badgeColor: 'zinc', dotClass: 'bg-zinc-400' };
    }

    const diffMinutes = Math.floor((Date.now() - lastActiveMillis) / 60000);
    if (diffMinutes < 1) {
        return { isOnline: true, statusText: 'Active just now', badgeColor: 'emerald', dotClass: 'bg-emerald-500' };
    }
    if (diffMinutes < 60) {
        return { isOnline: false, statusText: `Active ${diffMinutes}m ago`, badgeColor: 'amber', dotClass: 'bg-amber-400' };
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return { isOnline: false, statusText: `Active ${diffHours}h ago`, badgeColor: 'zinc', dotClass: 'bg-zinc-500' };
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return { isOnline: false, statusText: `Active ${diffDays}d ago`, badgeColor: 'zinc', dotClass: 'bg-zinc-600' };
    }

    return { isOnline: false, statusText: 'Offline', badgeColor: 'zinc', dotClass: 'bg-zinc-600' };
};

// Minimum interval between Firestore presence writes across tabs or events (2 minutes)
export const PRESENCE_WRITE_THROTTLE_MS = 2 * 60 * 1000;

/**
 * Updates a user's presence in Firestore with cross-tab and event rate-limiting
 */
export const updateUserPresence = async (uid: string, isOnline: boolean, force: boolean = false): Promise<void> => {
    if (!uid) return;

    const storageKey = `ifilmdirectory_presence_${uid}`;
    const now = Date.now();

    if (!force && isOnline) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const lastWritten = parseInt(window.localStorage.getItem(storageKey) || '0', 10);
                if (now - lastWritten < PRESENCE_WRITE_THROTTLE_MS) {
                    // Suppress write; another tab or recent event already refreshed presence
                    return;
                }
            }
        } catch {
            // LocalStorage inaccessible (incognito / security restrictions)
        }
    }

    try {
        const userRef = doc(db, 'users', uid);
        const data = {
            isOnline,
            lastActive: new Date().toISOString()
        };
        // Use setDoc merge so it never fails if document does not exist yet
        await setDoc(userRef, data, { merge: true });

        if (typeof window !== 'undefined' && window.localStorage && isOnline) {
            try {
                window.localStorage.setItem(storageKey, String(now));
            } catch {
                // Ignore storage errors
            }
        }
    } catch (err) {
        console.warn(`[PresenceService] Could not update presence for ${uid}:`, err);
    }
};

/**
 * Initializes real-time presence heartbeat for authenticated user with tab deduplication
 */
export const initUserPresence = (uid: string): (() => void) => {
    if (!uid) return () => {};

    // 1. Initial heartbeat (throttled across tabs)
    updateUserPresence(uid, true);

    // 2. Setup periodic heartbeat every 2 minutes while page is actively visible
    const HEARTBEAT_INTERVAL = 2 * 60 * 1000;
    const intervalId = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
            updateUserPresence(uid, true);
        }
    }, HEARTBEAT_INTERVAL);

    // 3. Listen to page visibility changes (throttled to avoid rapid tab switching write amplification)
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            updateUserPresence(uid, true);
        }
    };

    // 4. Window focus (throttled)
    const handleFocus = () => {
        if (document.visibilityState === 'visible') {
            updateUserPresence(uid, true);
        }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
    }

    // Return cleanup function
    return () => {
        clearInterval(intervalId);
        if (typeof window !== 'undefined') {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        }
    };
};
