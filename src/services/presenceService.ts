import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { UserProfile } from './userService';

// Threshold in milliseconds to consider a user online (5 minutes)
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Parses any Firestore timestamp or ISO string into epoch milliseconds
 */
export const parseLastActiveMillis = (lastActive: any): number => {
    if (!lastActive) return 0;
    if (typeof lastActive === 'number') return lastActive;
    if (typeof lastActive === 'string') {
        const parsed = new Date(lastActive).getTime();
        return isNaN(parsed) ? 0 : parsed;
    }
    if (lastActive?.toDate && typeof lastActive.toDate === 'function') {
        return lastActive.toDate().getTime();
    }
    if (lastActive?.seconds) {
        return lastActive.seconds * 1000;
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

/**
 * Updates a user's presence in Firestore
 */
export const updateUserPresence = async (uid: string, isOnline: boolean): Promise<void> => {
    if (!uid) return;
    try {
        const userRef = doc(db, 'users', uid);
        const data = {
            isOnline,
            lastActive: new Date().toISOString()
        };
        // Use setDoc merge so it never fails if document does not exist yet
        await setDoc(userRef, data, { merge: true });
    } catch (err) {
        console.warn(`[PresenceService] Could not update presence for ${uid}:`, err);
    }
};

/**
 * Initializes real-time presence heartbeat for authenticated user
 */
export const initUserPresence = (uid: string): (() => void) => {
    if (!uid) return () => {};

    // 1. Mark online immediately
    updateUserPresence(uid, true);

    // 2. Setup periodic heartbeat every 60 seconds while active
    const HEARTBEAT_INTERVAL = 60 * 1000;
    const intervalId = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
            updateUserPresence(uid, true);
        }
    }, HEARTBEAT_INTERVAL);

    // 3. Listen to page visibility changes
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            updateUserPresence(uid, true);
        }
    };

    // 4. Window focus
    const handleFocus = () => {
        updateUserPresence(uid, true);
    };

    // 5. Unload / closing tab
    const handleBeforeUnload = () => {
        // Attempt fast update before page unloads
        updateUserPresence(uid, false);
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('beforeunload', handleBeforeUnload);
    }

    // Return cleanup function
    return () => {
        clearInterval(intervalId);
        if (typeof window !== 'undefined') {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
        updateUserPresence(uid, false);
    };
};
