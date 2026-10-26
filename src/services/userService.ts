import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, deleteDoc, addDoc, orderBy, limit } from 'firebase/firestore';
import { createNotification } from './notificationService';
import { db } from '../firebaseConfig';
import { type User } from 'firebase/auth';
import { getEmailTemplate, type EmailType, type EmailData } from './emailTemplates';

export interface UserProfile {
    uid: string;
    username?: string; // Unique username for profile URLs (e.g., "junaid-siddiqui")
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role?: 'actor' | 'director' | 'crew' | 'writer' | 'service' | 'studio' | 'influencer' | 'content_creator' | 'other' |
    'voice_actor' | 'stunt_performer' | 'choreographer' | 'assistant_director' | 'script_supervisor' |
    'dialogue_writer' | 'lyricist' | 'cinematographer' | 'camera_operator' | 'focus_puller' | 'gaffer' | 'grip' |
    'sound_designer' | 'music_composer' | 'sound_recordist' | 'boom_operator' | 'foley_artist' |
    'production_designer' | 'art_director' | 'set_designer' | 'costume_designer' | 'makeup_artist' | 'hair_stylist' |
    'editor' | 'colorist' | 'vfx_artist' | 'motion_graphics' | 'producer' | 'line_producer' |
    'production_manager' | 'production_coordinator' | 'casting_director' | 'location_manager' | 'photographer' | 'custom';
    roles?: string[]; // Array of multiple professions (e.g., ["Director", "Writer", "Producer"])
    customRole?: string; // For when role is 'custom'
    logo?: string; // URL to company logo
    user_details?: {
        name?: string;
        verification_tier?: 'gold' | 'blue' | 'gray';
    };
    bio?: string;
    statusMessage?: string;
    availabilityStatus?: 'available' | 'working' | 'unavailable' | 'busy' | 'out_of_office' | 'on_set';
    phoneNumber?: string;
    location?: string;
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        linkedin?: string;
        website?: string;
        imdb?: string;
    };
    physicalAttributes?: {
        height?: string;
        weight?: string;
        eyeColor?: string;
        hairColor?: string;
        languages?: string[];
    };
    serviceDetails?: {
        servicesOffered?: string[];
        equipment?: string[];
        studioAmenities?: string[];
    };
    experience?: {
        id: string;
        title: string;
        role: string;
        year: string;
        description?: string;
        type?: 'movie' | 'tv' | 'theater' | 'commercial' | 'other';
    }[];
    skills?: string[];
    pastProjects?: {
        id: string;
        title: string;
        role: string;
        year: string;
        description?: string;
        link?: string;
    }[];
    underProductionProjects?: {
        id: string;
        title: string;
        role: string;
        status: string;
        description?: string;
        expectedRelease?: string;
    }[];
    gallery?: string[];
    privacySettings?: {
        profileVisibility?: 'public' | 'private' | 'connections';
        showreelsVisibility?: 'public' | 'private' | 'connections';
        contactVisibility?: 'public' | 'private' | 'connections';
    };
    createdAt: string;
    isConnected?: boolean;
    verification?: {
        isVerified: boolean;
        isMobileVerified: boolean;
        isEmailVerified: boolean;
        aadharCardUrl?: string;
        officeOwnerAadharCardUrl?: string; // For service providers/offices

        // Professional Proof (One of these is required)
        proofType?: 'union_card' | 'imdb' | 'invites' | 'content_creator';
        filmUnionCardUrl?: string;
        imdbUrl?: string;
        inviteCodes?: string[]; // IDs or codes of 2 recommending users
        contentLinks?: string[]; // YouTube or OTT work links

        status: 'none' | 'pending' | 'verified' | 'rejected';
        submittedAt?: string;
        rejectionReason?: string;
    };
    adminRole?: AdminRoleType; // Admin roles
    abuseReports?: number;
    accountStatus?: 'active' | 'suspended' | 'blocked';
    verification_tier?: 'gold' | 'blue' | 'gray'; // Added verification tier
    warningCount?: number;
    type?: 'user' | 'service'; // Differentiate between normal users and service providers/studios
    isOnline?: boolean;
    lastActive?: string | number | null;
}

export type AdminRoleType = 'super_admin' | 'admin' | 'moderator' | 'commercial_manager' | 'user_manager' | 'ad_manager';

export const SUPER_ADMIN_EMAILS = [
    'junaid202@gmail.com',
    'junaid202@hotmail.com',
    'ifilmdirectory@gmail.com',
    'contact@ifilmdirectory.com'
];

export const isSuperAdmin = (email: string | null | undefined, profile?: UserProfile | null) => {
    if (profile?.adminRole === 'super_admin') return true;
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    return SUPER_ADMIN_EMAILS.some(e => e.toLowerCase().trim() === cleanEmail);
};

export const hasAdminPrivileges = (profile?: UserProfile | null, email?: string | null) => {
    if (isSuperAdmin(email, profile)) return true;
    if ((profile?.role as string) === 'admin') return true;
    const role = profile?.adminRole;
    return Boolean(role && ['super_admin', 'admin', 'moderator', 'commercial_manager', 'user_manager', 'ad_manager'].includes(role));
};

export const claimSuperAdmin = async (uid: string) => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            role: 'admin',
            adminRole: 'super_admin',
            verification_tier: 'gold',
            'verification.status': 'verified',
            'verification.isVerified': true
        });
        return true;
    } catch (error) {
        console.error("Error claiming super admin status:", error);
        throw error;
    }
};

export const createUserProfile = async (user: User, additionalData?: Record<string, unknown>) => {
    if (!user) return;

    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        // If user already has a profile, we're good
        if (userSnap.exists()) return;

        const email = user.email;
        const approvedData: Record<string, unknown> = {};

        // If user is Super Admin
        if (isSuperAdmin(email)) {
            approvedData.role = 'admin';
            approvedData.adminRole = 'super_admin';
            approvedData.verification_tier = 'gold';
        } else if (email) {
            // Check if user has an approved Access Request to link credentials
            try {
                const isApproved = await checkAccessApproval(email);
                if (isApproved) {
                    approvedData.verification_tier = 'blue';
                }
            } catch (approvalErr) {
                console.warn('Access approval check skipped:', approvalErr);
            }
        }

        // Create the user profile document so the user can enter the platform
        await createProfileDoc(user, { ...approvedData, ...additionalData });
    } catch (error) {
        console.error("Error creating user profile:", error);
        // Fallback attempt to ensure user has a profile document
        try {
            await createProfileDoc(user, additionalData);
        } catch (fallbackErr) {
            console.error("Fallback createProfileDoc failed:", fallbackErr);
        }
    }
};

// Internal helper to keep code clean
const createProfileDoc = async (user: User, additionalData?: Record<string, unknown>) => {
    const userRef = doc(db, 'users', user.uid);
    const { displayName, email, photoURL, uid } = user;
    const createdAt = new Date().toISOString();

    await setDoc(userRef, {
        uid,
        email,
        displayName,
        photoURL,
        createdAt,
        accountStatus: 'active',
        ...additionalData,
    });
};

export const checkAccessApproval = async (email: string): Promise<boolean> => {
    try {
        const { query, where, collection, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'access_requests'), where('email', '==', email.toLowerCase()), where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error("Error checking access approval:", error);
        return false;
    }
};

// High-performance client-side cache to slash Firestore reads and prevent quota limits
const profileCache = new Map<string, { profile: UserProfile; timestamp: number }>();
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let allUsersCache: { users: UserProfile[]; timestamp: number } | null = null;
const ALL_USERS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const getUserProfile = async (uid: string, bypassCache: boolean = false): Promise<UserProfile | null> => {
    if (!uid) return null;

    if (!bypassCache) {
        const cached = profileCache.get(uid);
        if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_TTL) {
            return cached.profile;
        }
    }

    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            profileCache.set(uid, { profile: data, timestamp: Date.now() });
            return data;
        }
        return null;
    } catch (err) {
        console.warn(`Error fetching user profile for ${uid}:`, err);
        return null;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    // Invalidate profile and all-users cache immediately on update
    profileCache.delete(uid);
    allUsersCache = null;

    const userRef = doc(db, 'users', uid);
    try {
        // Filter out undefined values as Firestore doesn't accept them
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined)
        );

        console.log(`[UserService] Saving profile for ${uid}:`, cleanData);

        // Use setDoc with merge: true instead of updateDoc
        // This is more robust as it works even if the document doesn't exist yet
        await setDoc(userRef, cleanData, { merge: true });

        console.log(`[UserService] Profile for ${uid} saved successfully.`);
    } catch (error) {
        console.error(`[UserService] Failed to save profile for ${uid}:`, error);
        throw error;
    }
};

export type AvailabilityStatusCode = 'available' | 'working' | 'unavailable';

export interface AvailabilityConfig {
    code: AvailabilityStatusCode;
    statusText: string;
    label: string;
    dotEmoji: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
    icon: string;
}

export const AVAILABILITY_STATUS_OPTIONS = [
    {
        value: 'available',
        statusText: 'Ready to accept projects',
        label: 'Available for Projects',
        emoji: '🟢'
    },
    {
        value: 'working',
        statusText: 'Currently working but accepting enquiries',
        label: 'Open to Upcoming Projects',
        emoji: '🟡'
    },
    {
        value: 'unavailable',
        statusText: 'Not accepting work',
        label: 'Currently Unavailable',
        emoji: '⚫'
    }
] as const;

export const getAvailabilityConfig = (status?: string): AvailabilityConfig => {
    const s = (status || 'available').toLowerCase().trim();

    // 2. Currently working but accepting enquiries
    if (s === 'working' || s === 'open_to_enquiries' || s === 'on_set') {
        return {
            code: 'working',
            statusText: 'Currently working but accepting enquiries',
            label: 'Open to Upcoming Projects',
            dotEmoji: '🟡',
            badgeBg: 'bg-amber-500/10 dark:bg-amber-500/15',
            badgeText: 'text-amber-700 dark:text-amber-300',
            badgeBorder: 'border-amber-500/30',
            dotColor: 'bg-amber-500',
            icon: 'schedule'
        };
    }

    // 3. Not accepting work
    if (s === 'unavailable' || s === 'busy' || s === 'out_of_office' || s === 'not_accepting') {
        return {
            code: 'unavailable',
            statusText: 'Not accepting work',
            label: 'Currently Unavailable',
            dotEmoji: '⚫',
            badgeBg: 'bg-zinc-100 dark:bg-white/10',
            badgeText: 'text-zinc-700 dark:text-zinc-300',
            badgeBorder: 'border-zinc-300 dark:border-white/15',
            dotColor: 'bg-zinc-500 dark:bg-zinc-400',
            icon: 'block'
        };
    }

    // 1. Ready to accept projects (Default)
    return {
        code: 'available',
        statusText: 'Ready to accept projects',
        label: 'Available for Projects',
        dotEmoji: '🟢',
        badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-500/30',
        dotColor: 'bg-emerald-500',
        icon: 'check_circle'
    };
};

export const isTestOrEmptyUser = (user: UserProfile): boolean => {
    const name = (user.displayName || '').trim().toLowerCase();
    if (!name) return true;
    if (
        name.startsWith('test') ||
        name.startsWith('dummy') ||
        name === 'asdf' ||
        name === 'qwerty' ||
        name.includes('test user') ||
        name.includes('vege c') ||
        name.includes('dart jet') ||
        name.includes('dart') ||
        (name.length < 2 && !user.photoURL) ||
        (!user.bio && !user.role && !user.photoURL && (!user.skills || user.skills.length === 0))
    ) {
        return true;
    }
    return false;
};

export const getAllUsers = async (bypassCache: boolean = false, maxLimit: number = 100): Promise<UserProfile[]> => {
    if (!bypassCache && allUsersCache && Date.now() - allUsersCache.timestamp < ALL_USERS_CACHE_TTL) {
        return allUsersCache.users.slice(0, maxLimit);
    }

    try {
        const q = query(collection(db, 'users'), limit(maxLimit));
        const querySnapshot = await getDocs(q);
        const rawUsers = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        const users = rawUsers.filter(u => !isTestOrEmptyUser(u));
        allUsersCache = { users, timestamp: Date.now() };
        return users;
    } catch (error) {
        console.error("Error getting users:", error);
        return allUsersCache?.users.slice(0, maxLimit) || [];
    }
};

export const getLatestUsers = async (limitCount: number = 8): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);
        const rawUsers = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        return rawUsers.filter(u => !isTestOrEmptyUser(u));
    } catch (error) {
        console.warn("Error getting latest users (might need index):", error);
        // Fallback to bounded fetch rather than full-collection pull
        const boundedUsers = await getAllUsers(false, limitCount * 2);
        return boundedUsers
            .sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                // If both dates are missing, sort by UID as secondary key to be consistent
                if (timeB === timeA) return b.uid.localeCompare(a.uid);
                return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
            })
            .slice(0, limitCount);
    }
};

// Username utility functions
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
        const normalizedUsername = username.toLowerCase().trim();
        const q = query(collection(db, 'users'), where('username', '==', normalizedUsername));
        const snapshot = await getDocs(q);
        return snapshot.empty; // true if available
    } catch (error) {
        console.error("Error checking username availability:", error);
        return false;
    }
};

export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
    try {
        const normalizedUsername = username.toLowerCase().trim();
        const q = query(collection(db, 'users'), where('username', '==', normalizedUsername));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error getting user by username:", error);
        return null;
    }
};

export const generateUsernameFromName = (displayName: string): string => {
    // Convert name to username format: "Junaid Siddiqui" -> "junaid-siddiqui"
    return displayName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .substring(0, 30); // Limit length
};

export const updateUserRole = async (uid: string, newRole: AdminRoleType | undefined) => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            adminRole: newRole || null,
            role: newRole ? 'admin' : 'user'
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
};

export const reportUserAbuse = async (uid: string) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const currentReports = userSnap.data().abuseReports || 0;
            await updateDoc(userRef, { abuseReports: currentReports + 1 });
        }
    } catch (error) {
        console.error("Error reporting abuse:", error);
        throw error;
    }
};

export const triggerEmail = async (to: string, type: EmailType, name: string, data?: EmailData) => {
    try {
        const emailjs = await import('@emailjs/browser');
        const template = getEmailTemplate(type, name, data);

        await emailjs.default.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_m19ckwn',
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_lopp3n9',
            {
                to_email: to,
                to_name: name,
                subject: template.subject,
                message_html: template.html,
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );

        console.log(`Success: Sent ${type} email to ${to} via EmailJS`);
    } catch (error) {
        console.error(`Failed to trigger ${type} email via EmailJS:`, error);
    }
};

export const updateUserStatus = async (uid: string, status: 'active' | 'suspended' | 'blocked') => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() as UserProfile;

        await updateDoc(userRef, { accountStatus: status });

        // Trigger Emails for status changes
        if (userData?.email && userData?.displayName) {
            if (status === 'suspended') {
                await triggerEmail(userData.email, 'suspended', userData.displayName);
            } else if (status === 'blocked') {
                await triggerEmail(userData.email, 'blocked', userData.displayName);
            }
        }
    } catch (error) {
        console.error("Error updating user status:", error);
        throw error;
    }
};
export interface AccessRequest {
    id: string;
    fullName: string;
    email: string;
    role: string;
    portfolioLink: string;
    unionCardFrontUrl?: string; // Front of proof
    unionCardBackUrl?: string;  // Back of proof
    status: 'pending' | 'approved' | 'rejected';
    referredBy?: string;
    submittedAt: string;
}

export const getAccessRequests = async (): Promise<AccessRequest[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'access_requests'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessRequest));
    } catch (error) {
        console.error("Error getting access requests:", error);
        return [];
    }
};

export const updateAccessRequestStatus = async (id: string, status: 'approved' | 'rejected', email?: string, name?: string) => {
    try {
        const requestRef = doc(db, 'access_requests', id);
        const updateData: Record<string, unknown> = { status };

        if (status === 'approved') {
            updateData.approvedAt = new Date().toISOString();

            // Trigger Email if provided
            if (email) {
                await triggerEmail(email, 'invite', name || 'Artist');
            }
        }

        await updateDoc(requestRef, updateData);
    } catch (error) {
        console.error("Error updating access request status:", error);
        throw error;
    }
};
export const deleteUserAccount = async (uid: string) => {
    try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'users', uid));
        // Note: This only deletes FROM FIRESTORE. 
        // Real deletion from Firebase Auth requires a backend function or Admin SDK.
    } catch (error) {
        console.error("Error deleting user account:", error);
        throw error;
    }
};

export const issueWarning = async (uid: string) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const currentWarnings = userData?.warningCount || 0;
        await updateDoc(userRef, { warningCount: currentWarnings + 1 });

        // Trigger Warning Email
        if (userData?.email && userData?.displayName) {
            await triggerEmail(userData.email, 'warning', userData.displayName);
        }

        return currentWarnings + 1;
    } catch (error) {
        console.error("Error issuing warning:", error);
        throw error;
    }
};

export const followUser = async (followerId: string, followingId: string) => {
    try {
        await addDoc(collection(db, 'follows'), {
            followerId,
            followingId,
            createdAt: new Date().toISOString()
        });

        const followerProfile = await getUserProfile(followerId);
        await createNotification({
            userId: followingId,
            type: 'connection',
            title: 'New Follower',
            message: `${followerProfile?.displayName || 'Someone'} started following you.`,
            image: followerProfile?.photoURL || undefined,
            actionLink: `/profile/${followerId}`
        });

        return true;
    } catch (error) {
        console.error("Error following user:", error);
        throw error;
    }
};

export const unfollowUser = async (followerId: string, followingId: string) => {
    try {
        const q = query(collection(db, 'follows'),
            where('followerId', '==', followerId),
            where('followingId', '==', followingId));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);
        return true;
    } catch (error) {
        console.error("Error unfollowing user:", error);
        throw error;
    }
};

export const isFollowing = async (followerId: string, followingId: string) => {
    try {
        const q = query(collection(db, 'follows'),
            where('followerId', '==', followerId),
            where('followingId', '==', followingId));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
};

export const getFollowersCount = async (uid: string) => {
    try {
        const q = query(collection(db, 'follows'), where('followingId', '==', uid));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error getting followers count:", error);
        return 0;
    }
};

export const getFollowingCount = async (uid: string) => {
    try {
        const q = query(collection(db, 'follows'), where('followerId', '==', uid));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error("Error getting following count:", error);
        return 0;
    }
};

export const getFollowers = async (uid: string, limitCount: number = 50): Promise<UserProfile[]> => {
    try {
        const q = query(
            collection(db, 'follows'),
            where('followingId', '==', uid),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        const followerIds = snapshot.docs.map(doc => doc.data().followerId);

        // Fetch profiles with concurrency control for these IDs
        const profiles = await Promise.all(followerIds.map(id => getUserProfile(id)));
        return profiles.filter(p => p !== null) as UserProfile[];
    } catch (error) {
        console.error("Error getting followers:", error);
        return [];
    }
};

export const getFollowing = async (uid: string, limitCount: number = 50): Promise<UserProfile[]> => {
    try {
        const q = query(
            collection(db, 'follows'),
            where('followerId', '==', uid),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        const followingIds = snapshot.docs.map(doc => doc.data().followingId);

        // Fetch profiles with concurrency control for these IDs
        const profiles = await Promise.all(followingIds.map(id => getUserProfile(id)));
        return profiles.filter(p => p !== null) as UserProfile[];
    } catch (error) {
        console.error("Error getting following:", error);
        return [];
    }
};
