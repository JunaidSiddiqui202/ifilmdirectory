import {
    getFirestore,
    collection,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    where,
    limit,
    arrayRemove,
    arrayUnion
} from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { createNotification, markNotificationAsRead } from './notificationService';

const db = getFirestore(app);

import type { Timestamp, FieldValue } from 'firebase/firestore';

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp | { seconds: number; nanoseconds?: number } | null;
    type: 'text' | 'audio';
    mediaUrl?: string;
    isRead?: boolean;
    recipientId?: string;
}

export interface ChatThread {
    id: string;
    lastMessage?: string;
    lastMessageTime?: Timestamp | { seconds: number; nanoseconds?: number } | null;
    lastSenderId?: string;
    participants?: string[];
    unreadBy?: string[];
    updatedAt?: Timestamp | { seconds: number; nanoseconds?: number } | null;
    [key: string]: unknown;
}

/**
 * Send a message and automatically notify the recipient with real-time sound/alerts
 */
export const sendMessage = async (
    chatId: string, 
    message: Omit<Message, 'id' | 'createdAt'>,
    recipientId?: string,
    senderName?: string,
    senderPhoto?: string
) => {
    try {
        // 1. Atomically batch the parent chat metadata update and message document creation
        const { writeBatch } = await import('firebase/firestore');
        const batch = writeBatch(db);

        const chatRef = doc(db, 'chats', chatId);
        const chatUpdatePayload: Record<string, string | FieldValue | string[] | undefined> = {
            lastMessage: message.text || (message.type === 'audio' ? '🎤 Voice message' : 'Media file'),
            lastMessageTime: serverTimestamp(),
            lastSenderId: message.senderId,
            updatedAt: serverTimestamp()
        };

        if (recipientId && recipientId !== message.senderId) {
            chatUpdatePayload.participants = arrayUnion(message.senderId, recipientId);
            chatUpdatePayload.unreadBy = arrayUnion(recipientId);
        } else {
            chatUpdatePayload.participants = arrayUnion(message.senderId);
        }

        batch.set(chatRef, chatUpdatePayload, { merge: true });

        // 2. Add message to the verified parent chat within the exact same atomic transaction batch
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const messageDocRef = doc(messagesRef);
        const newMessage = {
            ...message,
            recipientId: recipientId || '',
            createdAt: serverTimestamp(),
            isRead: false
        };
        batch.set(messageDocRef, newMessage);

        // Commit both writes atomically: metadata cannot be updated without a corresponding message
        await batch.commit();

        // Dispatch in-app notification to the recipient so sound & toast trigger immediately
        if (recipientId && recipientId !== message.senderId) {
            try {
                await createNotification({
                    userId: recipientId,
                    type: 'message',
                    title: senderName ? `${senderName}` : 'New Message',
                    message: message.text || (message.type === 'audio' ? '🎤 Sent a voice message' : 'Sent you a message'),
                    actionLink: `/chat/${chatId}`,
                    image: senderPhoto || undefined,
                    metadata: { chatId, senderId: message.senderId }
                });
            } catch (notifErr) {
                console.warn('Could not dispatch message notification:', notifErr);
            }
        }
    } catch (error) {
        console.error("Error sending message: ", error);
        throw error;
    }
};

/**
 * Mark a chat as read by the current user
 */
export const markChatAsRead = async (chatId: string, userId: string) => {
    if (!chatId || !userId) return;
    try {
        // 1. Atomically remove user from unreadBy array on the chat document (allowed by firestore.rules)
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
            unreadBy: arrayRemove(userId)
        });

        // 2. Mark any unread message notifications corresponding to this chat as read
        const notifRef = collection(db, 'notifications');
        const q = query(
            notifRef,
            where('userId', '==', userId),
            where('isRead', '==', false)
        );
        const snapshot = await getDocs(q);
        const notificationUpdates = snapshot.docs
            .filter(docSnap => {
                const data = docSnap.data();
                return data.type === 'message' && (data.actionLink?.includes(chatId) || data.metadata?.chatId === chatId);
            })
            .map(docSnap => markNotificationAsRead(docSnap.id));

        await Promise.all(notificationUpdates);
    } catch (error) {
        console.error("Error marking chat as read:", error);
    }
};

/**
 * Get chats for display (scoped to caller's participation to comply with security rules and bound reads)
 */
export const getChats = async (userId?: string, limitCount: number = 50) => {
    try {
        const chatsRef = collection(db, 'chats');
        const q = userId
            ? query(chatsRef, where('participants', 'array-contains', userId), limit(limitCount))
            : query(chatsRef, limit(limitCount));
        const snapshot = await getDocs(q);
        const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatThread));
        chats.sort((a, b) => {
            const timeA = a.updatedAt?.seconds || a.lastMessageTime?.seconds || 0;
            const timeB = b.updatedAt?.seconds || b.lastMessageTime?.seconds || 0;
            return timeB - timeA;
        });
        return chats;
    } catch (error) {
        console.error("Error getting chats: ", error);
        return [];
    }
};

/**
 * Real-time subscription to chats for a specific user
 */
export const subscribeToChats = (
    callback: (chats: ChatThread[]) => void,
    userId?: string
) => {
    const chatsRef = collection(db, 'chats');
    const chatsQuery = userId 
        ? query(chatsRef, where('participants', 'array-contains', userId))
        : chatsRef;

    return onSnapshot(chatsQuery, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatThread));
        chats.sort((a, b) => {
            const timeA = a.updatedAt?.seconds || a.lastMessageTime?.seconds || 0;
            const timeB = b.updatedAt?.seconds || b.lastMessageTime?.seconds || 0;
            return timeB - timeA;
        });
        callback(chats);
    }, (err) => {
        console.warn('Error subscribing to chats:', err);
    });
};

/**
 * Real-time subscription to unread message count and notification count for a user
 */
export const subscribeToUnreadCounts = (
    userId: string,
    callback: (counts: { messages: number; notifications: number }) => void
) => {
    let unreadChatsCount = 0;
    let unreadMsgNotifsCount = 0;
    let unreadGeneralNotifsCount = 0;

    const emit = () => {
        const totalMessages = Math.max(unreadChatsCount, unreadMsgNotifsCount);
        callback({
            messages: totalMessages,
            notifications: unreadGeneralNotifsCount
        });
    };

    // 1. Listen for chats where this user is in unreadBy
    const chatsRef = collection(db, 'chats');
    const chatsQuery = query(chatsRef, where('unreadBy', 'array-contains', userId));
    const unsubChats = onSnapshot(chatsQuery, (snapshot) => {
        unreadChatsCount = snapshot.docs.length;
        emit();
    }, (err) => {
        console.warn('Chats unread listener note:', err);
    });

    // 2. Listen for notifications for this user
    const notifsRef = collection(db, 'notifications');
    const notifsQuery = query(notifsRef, where('userId', '==', userId), where('isRead', '==', false));
    const unsubNotifs = onSnapshot(notifsQuery, (snapshot) => {
        let msgCount = 0;
        let notifCount = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.type === 'message') {
                msgCount++;
            } else {
                notifCount++;
            }
        });
        unreadMsgNotifsCount = msgCount;
        unreadGeneralNotifsCount = notifCount;
        emit();
    }, (err) => {
        console.warn('Notifications unread listener note:', err);
    });

    return () => {
        unsubChats();
        unsubNotifs();
    };
};

/**
 * Subscribe to messages in a specific chat
 */
export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Message));
        callback(messages);
    });
};

export const clearChat = async (chatId: string) => {
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef);
        const snapshot = await getDocs(q);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error("Error clearing chat: ", error);
        throw error;
    }
};
