import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs,
    deleteDoc,
    doc,
    setDoc,
    updateDoc,
    where,
    arrayRemove,
    arrayUnion
} from 'firebase/firestore';
import { app } from '../firebaseConfig';
import { createNotification, markNotificationAsRead } from './notificationService';

const db = getFirestore(app);

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: any; // Firestore Timestamp
    type: 'text' | 'audio';
    mediaUrl?: string;
    isRead?: boolean;
    recipientId?: string;
}

export interface ChatThread {
    id: string;
    lastMessage?: string;
    lastMessageTime?: any;
    lastSenderId?: string;
    participants?: string[];
    unreadBy?: string[];
    updatedAt?: any;
    [key: string]: any;
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
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const newMessage = {
            ...message,
            recipientId: recipientId || '',
            createdAt: serverTimestamp(),
            isRead: false
        };
        await addDoc(messagesRef, newMessage);

        // Update the chat document for the list view with participants and unread tracking
        const chatRef = doc(db, 'chats', chatId);
        const chatUpdatePayload: any = {
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

        await setDoc(chatRef, chatUpdatePayload, { merge: true });

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
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
            unreadBy: arrayRemove(userId)
        }).catch(() => {});

        // Also mark any unread message notifications corresponding to this chat as read
        const notifRef = collection(db, 'notifications');
        const q = query(
            notifRef,
            where('userId', '==', userId),
            where('isRead', '==', false)
        );
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(async (docSnap) => {
            const data = docSnap.data();
            if (data.type === 'message' && (data.actionLink?.includes(chatId) || data.metadata?.chatId === chatId)) {
                await markNotificationAsRead(docSnap.id);
            }
        });
    } catch (error) {
        console.error("Error marking chat as read:", error);
    }
};

/**
 * Get all chats for display
 */
export const getChats = async () => {
    try {
        const chatsRef = collection(db, 'chats');
        const q = query(chatsRef, orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting chats: ", error);
        return [];
    }
};

/**
 * Real-time subscription to chats
 */
export const subscribeToChats = (callback: (chats: ChatThread[]) => void) => {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatThread));
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
