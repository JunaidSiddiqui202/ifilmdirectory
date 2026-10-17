import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, query, orderBy, limit, deleteDoc, Timestamp } from 'firebase/firestore';

const BAD_WORDS = [
    'abuse', 'idiot', 'stupid', 'hate', 'kill', 'murder', 'sex', 'porn', 'xxx',
    'damn', 'hell', 'ass', 'bastard', 'bitch', 'shit', 'fuck'
];

export interface ModerationResult {
    isSafe: boolean;
    flaggedWords: string[];
    cleanedText: string;
}

export interface ModerationLog {
    id?: string;
    adminId: string;
    adminEmail?: string;
    adminName?: string;
    actionType: 'remove_post' | 'remove_job' | 'remove_showreel' | 'remove_blog' | 'suspend_user' | 'issue_warning' | 'custom_takedown';
    action?: string;
    targetId: string;
    targetTitle?: string;
    targetType: 'post' | 'job' | 'showreel' | 'blog' | 'user';
    reason: string;
    timestamp: any;
}

export interface FlaggedItem {
    id: string;
    type: 'post' | 'job' | 'showreel' | 'blog';
    title?: string;
    content?: string;
    author?: string;
    authorId?: string;
    date?: any;
    reportCount?: number;
    flagReason?: string;
}

export const moderateContent = (text: string): ModerationResult => {
    if (!text) return { isSafe: true, flaggedWords: [], cleanedText: '' };

    let cleanedText = text;
    const flaggedWords: string[] = [];

    BAD_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(text)) {
            flaggedWords.push(word);
            cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
        }
    });

    return {
        isSafe: flaggedWords.length === 0,
        flaggedWords,
        cleanedText
    };
};

export const validateInput = (text: string): string | null => {
    const result = moderateContent(text);
    if (!result.isSafe) {
        return `Your content contains inappropriate language: ${result.flaggedWords.join(', ')}. Please remove it.`;
    }
    return null;
};

// Log a moderation action for audit trails
export const logModerationAction = async (logData: Omit<ModerationLog, 'id'>) => {
    try {
        await addDoc(collection(db, 'moderation_logs'), {
            ...logData,
            timestamp: logData.timestamp || Timestamp.now()
        });
    } catch (error) {
        console.error("Error logging moderation action:", error);
    }
};

// Fetch audit trail logs
export const getModerationLogs = async (limitCount: number = 50): Promise<ModerationLog[]> => {
    try {
        const q = query(
            collection(db, 'moderation_logs'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                action: data.action || data.actionType?.replace('_', ' ') || 'takedown',
                adminName: data.adminName || data.adminEmail || data.adminId || 'Admin'
            };
        }) as ModerationLog[];
    } catch (error) {
        console.error("Error fetching moderation logs:", error);
        return [];
    }
};

// Remove a community feed post
export const removePostByAdmin = async (postId: string, reason: string, adminId: string, adminEmail?: string, postTitle?: string) => {
    try {
        await deleteDoc(doc(db, 'posts', postId));
        await logModerationAction({
            adminId,
            adminEmail,
            actionType: 'remove_post',
            targetId: postId,
            targetTitle: postTitle || 'Community Post',
            targetType: 'post',
            reason,
            timestamp: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        console.error("Error removing post by admin:", error);
        throw error;
    }
};

// Remove a job listing
export const removeJobByAdmin = async (jobId: string, reason: string, adminId: string, adminEmail?: string, jobTitle?: string) => {
    try {
        await deleteDoc(doc(db, 'jobs', jobId));
        await logModerationAction({
            adminId,
            adminEmail,
            actionType: 'remove_job',
            targetId: jobId,
            targetTitle: jobTitle || 'Job / Audition Listing',
            targetType: 'job',
            reason,
            timestamp: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        console.error("Error removing job by admin:", error);
        throw error;
    }
};

// Remove a showreel
export const removeShowreelByAdmin = async (reelId: string, reason: string, adminId: string, adminEmail?: string, reelTitle?: string) => {
    try {
        await deleteDoc(doc(db, 'showreels', reelId));
        await logModerationAction({
            adminId,
            adminEmail,
            actionType: 'remove_showreel',
            targetId: reelId,
            targetTitle: reelTitle || 'Showreel Video',
            targetType: 'showreel',
            reason,
            timestamp: Timestamp.now()
        });
        return { success: true };
    } catch (error) {
        console.error("Error removing showreel by admin:", error);
        throw error;
    }
};

// Query recent posts for moderation inspection
export const getRecentPostsForModeration = async (limitCount: number = 30) => {
    try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("Error fetching posts for moderation:", e);
        return [];
    }
};

// Query recent jobs for moderation inspection
export const getRecentJobsForModeration = async (limitCount: number = 30) => {
    try {
        const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(limitCount));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("Error fetching jobs for moderation:", e);
        return [];
    }
};

// Query recent showreels for moderation inspection
export const getRecentShowreelsForModeration = async (limitCount: number = 30) => {
    try {
        const q = query(collection(db, 'showreels'), limit(limitCount));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("Error fetching showreels for moderation:", e);
        return [];
    }
};
