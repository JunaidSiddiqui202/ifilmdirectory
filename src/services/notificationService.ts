import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    Timestamp,
    getDocs
} from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

export interface NotificationData {
    id: string;
    userId: string;
    type: 'like' | 'comment' | 'follow' | 'job' | 'system' | 'connection';
    title: string;
    message: string;
    createdAt: Timestamp;
    isRead: boolean;
    image?: string;
    actionLink?: string;
    metadata?: any;
}

export const subscribeToNotifications = (
    userId: string,
    callback: (notifications: NotificationData[]) => void,
    onError?: (error: any) => void
) => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, { includeMetadataChanges: false }, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as NotificationData));
        callback(notifications);
    }, (error) => {
        console.warn("Notification subscription error (likely missing index):", error);

        // Fallback: If index is missing, try query without orderBy and sort manually
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
            console.log("Using fallback notification fetch without server-side sorting...");
            const fallbackQ = query(
                notificationsRef,
                where('userId', '==', userId)
            );

            return onSnapshot(fallbackQ, (fallbackSnapshot) => {
                const notifications = fallbackSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as NotificationData));

                // Manual sort by createdAt desc
                notifications.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
                    return timeB - timeA;
                });

                callback(notifications);
            }, (fallbackError) => {
                console.error("Critical notification failure:", fallbackError);
                if (onError) onError(fallbackError);
            });
        }

        if (onError) onError(error);
    });
};

export const markNotificationAsRead = async (notificationId: string) => {
    try {
        const docRef = doc(db, 'notifications', notificationId);
        await updateDoc(docRef, { isRead: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
};

export const createNotification = async (notification: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>) => {
    try {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
            ...notification,
            createdAt: serverTimestamp(),
            isRead: false
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

/**
 * Notifies all platform admins when a new access request is submitted.
 */
export const notifyAdminsOfNewRequest = async (fullName: string, email: string) => {
    try {
        // Find all users who are marked as admins in Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('adminRole', 'in', ['super_admin', 'user_manager']));
        const snapshot = await getDocs(q);

        const adminUids = new Set<string>();
        snapshot.docs.forEach(doc => adminUids.add(doc.id));

        /** 
         * FALLBACK: Explicitly check for known super admin emails. 
         * This is useful if they haven't been assigned an adminRole 
         * in the Firestore document yet but are in the SUPER_ADMIN_EMAILS list.
         */
        const superAdminEmails = ['junaid202@gmail.com', 'junaid202@hotmail.com', 'contact@ifilmdirectory.com'];
        for (const adminEmail of superAdminEmails) {
            const emailQ = query(usersRef, where('email', '==', adminEmail));
            const emailSnapshot = await getDocs(emailQ);
            emailSnapshot.forEach(doc => adminUids.add(doc.id));
        }

        // Send notification to each admin
        const notificationPromises = Array.from(adminUids).map(adminUid =>
            createNotification({
                userId: adminUid,
                type: 'system',
                title: 'New Access Request',
                message: `${fullName} (${email}) has requested platform access.`,
                actionLink: '/-admin' // Link to admin dashboard
            })
        );

        if (notificationPromises.length > 0) {
            await Promise.all(notificationPromises);
            console.log(`[Notification] Alerted ${notificationPromises.length} admins about new request from ${email}`);
        } else {
            console.warn('[Notification] No admins found to notify for access request.');
        }
    } catch (error) {
        console.error("Error in notifyAdminsOfNewRequest:", error);
    }
};
