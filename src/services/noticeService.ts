import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, query, orderBy, limit, deleteDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { createNotification } from './notificationService';

export interface NoticeItem {
    id?: string;
    title: string;
    content?: string;
    body?: string;
    type?: 'global' | 'guild' | 'direct';
    priority: 'normal' | 'urgent' | 'high' | 'policy';
    targetAudience?: 'all' | 'actors' | 'directors' | 'crew' | 'producers' | 'direct_user';
    targetGuild?: string;
    targetUserId?: string;
    targetUserName?: string;
    actionLink?: string;
    senderName?: string;
    senderEmail?: string;
    createdBy?: string;
    createdByName?: string;
    active?: boolean;
    isActive?: boolean;
    createdAt: any;
    expiresAt?: any;
}

export type PlatformNotice = NoticeItem;

export const noticeService = {
    // Send a new official platform notice
    sendNotice: async (noticeData: {
        title: string;
        body?: string;
        content?: string;
        priority: 'normal' | 'high' | 'urgent' | 'policy';
        targetAudience?: 'all' | 'actors' | 'directors' | 'crew' | 'producers' | 'direct_user';
        targetGuild?: string;
        targetUserId?: string;
        targetUserName?: string;
        actionLink?: string;
        createdBy?: string;
        createdByName?: string;
        senderName?: string;
        senderEmail?: string;
        type?: 'global' | 'guild' | 'direct';
    }): Promise<{ success: boolean; id?: string; error?: any }> => {
        try {
            const bodyText = noticeData.body || noticeData.content || '';
            const author = noticeData.createdByName || noticeData.senderName || 'Admin';

            const docRef = await addDoc(collection(db, 'notices'), {
                ...noticeData,
                body: bodyText,
                content: bodyText,
                createdByName: author,
                senderName: author,
                active: true,
                isActive: true,
                createdAt: Timestamp.now()
            });

            // If it's a direct notice to an individual user, dispatch an in-app notification directly
            if (noticeData.targetUserId) {
                try {
                    await createNotification({
                        userId: noticeData.targetUserId,
                        type: 'system',
                        title: `Official Notice: ${noticeData.title}`,
                        message: bodyText,
                        actionLink: noticeData.actionLink || '/notifications'
                    });
                } catch (notifErr) {
                    console.warn("Could not dispatch direct notification:", notifErr);
                }
            }

            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error creating notice:", error);
            return { success: false, error };
        }
    },

    // Get all notices
    getNotices: async (activeOnly: boolean = false): Promise<NoticeItem[]> => {
        try {
            let q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(50));
            if (activeOnly) {
                q = query(collection(db, 'notices'), where('active', '==', true), orderBy('createdAt', 'desc'), limit(50));
            }
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    body: data.body || data.content || '',
                    content: data.content || data.body || '',
                    isActive: data.isActive !== undefined ? data.isActive : data.active !== undefined ? data.active : true,
                    active: data.active !== undefined ? data.active : true,
                    createdByName: data.createdByName || data.senderName || 'Admin'
                };
            }) as NoticeItem[];
        } catch (error) {
            console.error("Error fetching notices:", error);
            return [];
        }
    },

    // Toggle active status
    toggleNoticeActive: async (noticeId: string, active: boolean) => {
        try {
            const noticeRef = doc(db, 'notices', noticeId);
            await updateDoc(noticeRef, { active, isActive: active });
            return { success: true };
        } catch (error) {
            console.error("Error updating notice status:", error);
            return { success: false, error };
        }
    },

    // Delete a notice
    deleteNotice: async (noticeId: string) => {
        try {
            await deleteDoc(doc(db, 'notices', noticeId));
            return { success: true };
        } catch (error) {
            console.error("Error deleting notice:", error);
            return { success: false, error };
        }
    }
};

export const sendNotice = noticeService.sendNotice;
export const getNotices = noticeService.getNotices;
export const toggleNoticeActive = noticeService.toggleNoticeActive;
export const deleteNotice = noticeService.deleteNotice;

export default noticeService;
