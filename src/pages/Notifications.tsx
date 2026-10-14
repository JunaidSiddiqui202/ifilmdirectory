import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markNotificationAsRead, type NotificationData } from '../services/notificationService';
import { formatTimeAgo } from '../utils/dateUtils';

type TabType = 'general' | 'jobs' | 'connections';

export default function Notifications() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            // Give Firebase Auth a moment to initialize
            const timer = setTimeout(() => {
                if (!currentUser) setLoading(false);
            }, 2000);
            return () => clearTimeout(timer);
        }

        const unsubscribe = subscribeToNotifications(
            currentUser.uid,
            (data) => {
                setNotifications(data);
                setLoading(false);
            },
            (error) => {
                console.error("Failed to fetch real-time notifications:", error);

                // FALLBACK: If index is missing or query fails, show mock data
                // so the user isn't stuck on a loader.
                setNotifications([
                    {
                        id: 'mock-1',
                        userId: currentUser.uid,
                        type: 'job',
                        title: 'New Job Alert (Sample)',
                        message: 'A new role for "Lead Actor" matches your profile.',
                        createdAt: { seconds: Date.now() / 1000 } as any,
                        isRead: false,
                        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=100&h=100&fit=crop',
                        actionLink: '/jobs'
                    },
                    {
                        id: 'mock-2',
                        userId: currentUser.uid,
                        type: 'connection',
                        title: 'Connection (Sample)',
                        message: 'Rohan Das wants to connect with you.',
                        createdAt: { seconds: (Date.now() - 3600000) / 1000 } as any,
                        isRead: false,
                        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
                        actionLink: `/profile/${currentUser.uid}`
                    }
                ]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'jobs') return n.type === 'job';
        if (activeTab === 'connections') return n.type === 'connection' || n.type === 'follow';
        return true; // General shows all
    });

    const handleNotificationClick = async (notification: NotificationData) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
        }
        if (notification.actionLink) {
            navigate(notification.actionLink);
        }
    };

    return (
        <div className="relative flex h-auto min-h-[100dvh] w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark pb-24">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex size-12 shrink-0 items-center justify-start">
                    <HamburgerMenu />
                </div>
                <h2 className="text-zinc-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                    Notifications
                </h2>
                <div className="flex w-12 items-center justify-end">
                    <button
                        onClick={() => navigate('/settings')}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors"
                    >
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex w-full border-b border-zinc-200 dark:border-zinc-800 bg-background-light dark:bg-background-dark sticky top-[60px] z-10">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'general'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setActiveTab('jobs')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'jobs'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                        }`}
                >
                    Jobs
                </button>
                <button
                    onClick={() => setActiveTab('connections')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'connections'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                        }`}
                >
                    Network
                </button>
            </div>

            {/* Notifications List */}
            <div className="flex flex-col">
                {loading ? (
                    <div className="flex justify-center p-10">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                        <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`flex items-start gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800/50 text-left transition-colors ${notification.isRead
                                ? 'bg-transparent'
                                : 'bg-primary/5 dark:bg-primary/10'
                                }`}
                        >
                            <div className="relative shrink-0">
                                {notification.image ? (
                                    <div
                                        className="w-12 h-12 rounded-full bg-cover bg-center"
                                        style={{ backgroundImage: `url(${notification.image})` }}
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">
                                            {notification.type === 'job' ? 'work' :
                                                notification.type === 'like' ? 'favorite' :
                                                    notification.type === 'connection' ? 'person_add' :
                                                        'notifications'}
                                        </span>
                                    </div>
                                )}
                                {!notification.isRead && (
                                    <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-zinc-900" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">
                                    {notification.title}
                                </p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-1">
                                    {notification.message}
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                    {formatTimeAgo(notification.createdAt)}
                                </p>
                            </div>
                            {notification.type === 'connection' && !notification.isRead && (
                                <div className="flex flex-col gap-2 shrink-0">
                                    <div className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full text-center">
                                        Accept
                                    </div>
                                    <div className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-full text-center">
                                        Ignore
                                    </div>
                                </div>
                            )}
                        </button>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-zinc-400">notifications_off</span>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                            No notifications yet
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs">
                            When you get job alerts, likes, or connection requests, they'll show up here.
                        </p>
                    </div>
                )}
            </div>
            </div>

            <BottomNav />
        </div>
    );
}
