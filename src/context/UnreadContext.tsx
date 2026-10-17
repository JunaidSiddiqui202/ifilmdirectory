import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToUnreadCounts, markChatAsRead } from '../services/messagingService';

interface UnreadContextType {
    unreadMessagesCount: number;
    unreadNotificationsCount: number;
    hasUnreadMessages: boolean;
    hasUnreadNotifications: boolean;
    markChatRead: (chatId: string) => Promise<void>;
}

const UnreadContext = createContext<UnreadContextType>({
    unreadMessagesCount: 0,
    unreadNotificationsCount: 0,
    hasUnreadMessages: false,
    hasUnreadNotifications: false,
    markChatRead: async () => {}
});

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

    useEffect(() => {
        if (!currentUser?.uid) {
            setUnreadMessagesCount(0);
            setUnreadNotificationsCount(0);
            return;
        }

        const unsubscribe = subscribeToUnreadCounts(currentUser.uid, ({ messages, notifications }) => {
            setUnreadMessagesCount(messages);
            setUnreadNotificationsCount(notifications);
        });

        return () => unsubscribe();
    }, [currentUser?.uid]);

    const markChatRead = async (chatId: string) => {
        if (!currentUser?.uid || !chatId) return;
        await markChatAsRead(chatId, currentUser.uid);
        setUnreadMessagesCount(prev => Math.max(0, prev - 1));
    };

    return (
        <UnreadContext.Provider
            value={{
                unreadMessagesCount,
                unreadNotificationsCount,
                hasUnreadMessages: unreadMessagesCount > 0,
                hasUnreadNotifications: unreadNotificationsCount > 0,
                markChatRead
            }}
        >
            {children}
        </UnreadContext.Provider>
    );
};

export const useUnread = () => useContext(UnreadContext);
