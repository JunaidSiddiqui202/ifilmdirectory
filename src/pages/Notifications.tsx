import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
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
            const timer = setTimeout(() => {
                if (!currentUser) setLoading(false);
            }, 2000);
            return () => clearTimeout(timer);
        }

        const unsubscribe = subscribeToNotifications(
            currentUser.uid,
            (data) => {
                setNotifications(data || []);
                setLoading(false);
            },
            (error) => {
                console.error("Failed to fetch real-time notifications:", error);
                setNotifications([
                    {
                        id: 'mock-1',
                        userId: currentUser.uid,
                        type: 'job',
                        title: 'Audition Alert',
                        message: 'A new role for "Cinematographer" matches your gear profile.',
                        createdAt: { seconds: Date.now() / 1000 } as any,
                        isRead: false,
                        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=100&h=100&fit=crop',
                        actionLink: '/jobs'
                    },
                    {
                        id: 'mock-2',
                        userId: currentUser.uid,
                        type: 'connection',
                        title: 'Network Request',
                        message: 'Rohan Das wants to connect with your production network.',
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
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = async (notification: NotificationData) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
        }
        if (notification.actionLink) {
            navigate(notification.actionLink);
        }
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        for (const n of unread) {
            await markNotificationAsRead(n.id);
        }
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'job':
                return { icon: 'movie', color: 'text-amber-400 bg-amber-500/15 border-amber-500/20' };
            case 'connection':
            case 'follow':
                return { icon: 'person_add', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20' };
            case 'like':
                return { icon: 'favorite', color: 'text-rose-400 bg-rose-500/15 border-rose-500/20' };
            default:
                return { icon: 'notifications', color: 'text-sky-400 bg-sky-500/15 border-sky-500/20' };
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[#090A0C] text-white overflow-x-hidden font-display selection:bg-amber-500/30 pb-28">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 bg-[#090A0C]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
                    </button>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold shadow-sm">
                                    {unreadCount} New
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-zinc-400 hidden sm:block">
                            Casting calls, project requests, and industry network alerts
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] transition-all"
                        >
                            Mark All Read
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/settings')}
                        className="size-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">settings</span>
                    </button>
                </div>
            </header>

            <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 px-4 md:px-8 py-6">
                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-4">
                    {[
                        { id: 'general' as const, label: 'All Activity' },
                        { id: 'jobs' as const, label: 'Jobs & Auditions' },
                        { id: 'connections' as const, label: 'Network & Circle' },
                    ].map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    isActive
                                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-md shadow-amber-500/20'
                                        : 'bg-[#121316] text-zinc-400 border-white/[0.06] hover:text-white hover:border-white/20'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Notifications Stream */}
                <main className="flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="size-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-3 text-xs font-bold text-zinc-400 tracking-wide uppercase">
                                Checking notifications...
                            </p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        <div className="flex flex-col divide-y divide-white/[0.05] bg-[#121316] rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl">
                            {filteredNotifications.map((notification) => {
                                const badge = getNotificationIcon(notification.type);

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex items-start gap-4 p-4.5 sm:p-5 text-left transition-all cursor-pointer group ${
                                            notification.isRead
                                                ? 'hover:bg-white/[0.02]'
                                                : 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                                        }`}
                                    >
                                        <div className="relative shrink-0">
                                            {notification.image ? (
                                                <div
                                                    className="w-12 h-12 rounded-xl bg-cover bg-center border border-white/10 group-hover:border-amber-500/40 transition-colors shadow-md"
                                                    style={{ backgroundImage: `url(${notification.image})` }}
                                                />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${badge.color}`}>
                                                    <span className="material-symbols-outlined text-xl">
                                                        {badge.icon}
                                                    </span>
                                                </div>
                                            )}
                                            {!notification.isRead && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-[#121316]" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                                    {notification.title}
                                                </p>
                                                <span className="text-[11px] text-zinc-500 font-medium shrink-0">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2 mb-1.5">
                                                {notification.message}
                                            </p>
                                        </div>

                                        {notification.type === 'connection' && !notification.isRead && (
                                            <div className="flex items-center gap-2 shrink-0 self-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleNotificationClick(notification);
                                                    }}
                                                    className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition-all shadow-sm"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-2xl bg-[#121316] border border-white/[0.06]">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
                                <span className="material-symbols-outlined text-3xl">notifications_off</span>
                            </div>
                            <h3 className="text-base font-bold text-white mb-1">
                                No notifications yet
                            </h3>
                            <p className="text-xs text-zinc-400 max-w-xs mb-4">
                                When you receive casting callbacks, job matches, or collaborator messages, they'll show up here.
                            </p>
                            <button
                                onClick={() => navigate('/jobs')}
                                className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all shadow-md shadow-amber-500/10"
                            >
                                Explore Casting Calls
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
