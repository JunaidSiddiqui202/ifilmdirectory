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
    setDoc
} from 'firebase/firestore';
import { app } from '../firebaseConfig';

const db = getFirestore(app);

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: any; // Firestore Timestamp
    type: 'text' | 'audio';
    mediaUrl?: string;
    isRead?: boolean;
}

export const sendMessage = async (chatId: string, message: Omit<Message, 'id' | 'createdAt'>) => {
    try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const newMessage = {
            ...message,
            createdAt: serverTimestamp(),
            isRead: false
        };
        await addDoc(messagesRef, newMessage);

        // Update the chat document for the list view
        const chatRef = doc(db, 'chats', chatId);
        await setDoc(chatRef, {
            lastMessage: message.text || (message.type === 'audio' ? 'Voice message' : ''),
            lastMessageTime: serverTimestamp(),
            participants: [message.senderId], // Ideally we'd have both
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error sending message: ", error);
        throw error;
    }
};

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
