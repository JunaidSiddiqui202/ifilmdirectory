import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import { subscribeToChats } from '../services/messagingService';
import { subscribeToNotifications, markNotificationAsRead, type NotificationData } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import PostMedia from '../components/PostMedia';
import { getUserProfile, type UserProfile } from '../services/userService';
import { formatTimeAgo } from '../utils/dateUtils';

type MainTab = 'messages' | 'notifications';
type ChatFilterTab = 'primary' | 'requests' | 'general';
type NotificationFilterTab = 'general' | 'jobs' | 'connections';

export default function MessagesList() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const { unreadMessagesCount, unreadNotificationsCount } = useUnread();

    // Primary Section Switcher ('messages' | 'notifications')
    const initialTab: MainTab = searchParams.get('tab') === 'notifications' ? 'notifications' : 'messages';
    const [mainTab, setMainTab] = useState<MainTab>(initialTab);

    // Messages State
    const [activeChatTab, setActiveChatTab] = useState<ChatFilterTab>('primary');
    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [chatsLoading, setChatsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Notifications State
    const [activeNotifTab, setActiveNotifTab] = useState<NotificationFilterTab>('general');
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [notifsLoading, setNotifsLoading] = useState(true);

    const mockChats = [
        { 
            id: 'ranveer-singh', 
            name: 'Ranveer Singh', 
            role: 'Lead Actor & Producer',
            message: 'Reviewed the storyboard. Let’s do a read-through tomorrow.', 
            time: '2h ago',
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', 
            isStory: true,
            unread: true
        },
        { 
            id: 'jonny-shaik', 
            name: 'Jonny Shaik', 
            role: 'Cinematographer (ISC)',
            message: 'Sent the ARRI Alexa 35 camera package specs for scene 4.', 
            time: '5h ago',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', 
            isStory: false,
            unread: false
        },
        { 
            id: 'vn-aditya', 
            name: 'V.N. Aditya', 
            role: 'Director',
            message: 'Great cut on the teaser reel! Sharing notes with the editor.', 
            time: 'Yesterday',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', 
            isStory: false,
            unread: false
        },
    ];

    // Synchronize tab state with URL parameter (?tab=messages / ?tab=notifications)
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'notifications' && mainTab !== 'notifications') {
            setMainTab('notifications');
        } else if (tabParam === 'messages' && mainTab !== 'messages') {
            setMainTab('messages');
        }
    }, [searchParams]);

    const handleTabChange = (newTab: MainTab) => {
        setMainTab(newTab);
        setSearchParams({ tab: newTab });
    };

    // Fetch user profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (currentUser) {
                try {
                    const profile = await getUserProfile(currentUser.uid);
                    setUserProfile(profile);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            }
        };
        fetchUserProfile();
    }, [currentUser]);

    // Subscribe to direct message chats
    useEffect(() => {
        if (!currentUser) {
            setRecentChats(mockChats);
            setChatsLoading(false);
            return;
        }

        setChatsLoading(true);
        const unsubscribe = subscribeToChats(async (dbChats) => {
            try {
                const userChats = dbChats.filter((c: any) => {
                    if (c.participants && Array.isArray(c.participants)) {
                        return c.participants.includes(currentUser.uid);
                    }
                    if (c.id && c.id.includes(currentUser.uid)) {
                        return true;
                    }
                    return false;
                });

                if (userChats.length > 0) {
                    const formattedPromises = userChats.map(async (c: any) => {
                        let otherUserId = c.id;

                        if (c.id.includes('_')) {
                            const participants = c.id.split('_');
                            otherUserId = participants.find((p: string) => p !== currentUser.uid) || c.id;
                        } else if (c.participants && Array.isArray(c.participants)) {
                            otherUserId = c.participants.find((p: string) => p !== currentUser.uid) || c.participants[0];
                        }

                        let userName = 'Filmmaker';
                        let userRole = 'Production Team';
                        let userImage = `https://ui-avatars.com/api/?name=Filmmaker&background=121316&color=F59E0B`;

                        try {
                            const profile = await getUserProfile(otherUserId);
                            if (profile) {
                                userName = profile.displayName || profile.email?.split('@')[0] || 'Filmmaker';
                                userRole = (profile as any).role || profile.bio?.slice(0, 24) || 'Filmmaker';
                                userImage = profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=121316&color=F59E0B`;
                            }
                        } catch (error) {
                            console.error(`Error fetching profile for ${otherUserId}:`, error);
                        }

                        const isUnread = Boolean(c.unreadBy && currentUser?.uid && Array.isArray(c.unreadBy) && c.unreadBy.includes(currentUser.uid));

                        let timeStr = 'Recent';
                        const ts = c.updatedAt || c.lastMessageTime;
                        if (ts) {
                            try {
                                const date = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
                                const now = new Date();
                                const diffMs = now.getTime() - date.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                if (diffMins < 1) timeStr = 'Just now';
                                else if (diffMins < 60) timeStr = `${diffMins}m ago`;
                                else {
                                    const diffHours = Math.floor(diffMins / 60);
                                    if (diffHours < 24) timeStr = `${diffHours}h ago`;
                                    else timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                }
                            } catch {
                                timeStr = 'Recent';
                            }
                        }

                        return {
                            id: c.id,
                            name: userName,
                            role: userRole,
                            message: c.lastMessage || 'Active project discussion',
                            time: timeStr,
                            image: userImage,
                            isStory: false,
                            unread: isUnread
                        };
                    });

                    const formatted = await Promise.all(formattedPromises);
                    setRecentChats(formatted);
                } else {
                    setRecentChats([]);
                }
            } catch (err) {
                console.error('Error processing chats:', err);
                setRecentChats([]);
            } finally {
                setChatsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Subscribe to notifications
    useEffect(() => {
        if (!currentUser) {
            const timer = setTimeout(() => {
                if (!currentUser) setNotifsLoading(false);
            }, 1500);
            return () => clearTimeout(timer);
        }

        const unsubscribe = subscribeToNotifications(
            currentUser.uid,
            (data) => {
                setNotifications(data || []);
                setNotifsLoading(false);
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
                setNotifsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    // Filter chats
    const filteredChats = recentChats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter notifications
    const filteredNotifications = notifications.filter(n => {
        if (activeNotifTab === 'jobs') return n.type === 'job';
        if (activeNotifTab === 'connections') return n.type === 'connection' || n.type === 'follow';
        return true;
    });

    const localUnreadNotifCount = notifications.filter(n => !n.isRead).length;
    const displayUnreadNotifs = unreadNotificationsCount || localUnreadNotifCount;

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
                return { icon: 'movie', color: 'text-amber-500 dark:text-amber-400 bg-amber-500/15 border-amber-500/25' };
            case 'connection':
            case 'follow':
                return { icon: 'person_add', color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/25' };
            case 'like':
                return { icon: 'favorite', color: 'text-rose-500 dark:text-rose-400 bg-rose-500/15 border-rose-500/25' };
            default:
                return { icon: 'notifications', color: 'text-sky-500 dark:text-sky-400 bg-sky-500/15 border-sky-500/25' };
        }
    };

    return (
        <div className="flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-24 font-display transition-colors">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto flex flex-col flex-1 px-3 sm:px-4">
                
                {/* Unified Cinema Top Header */}
                <div className="sticky top-0 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-xl z-20 border-b border-zinc-200 dark:border-white/5 pt-3 pb-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="p-1.5 -ml-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                                aria-label="Back"
                            >
                                <span className="material-symbols-outlined text-2xl">arrow_back</span>
                            </button>
                            <div className="md:hidden flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/home')}>
                                <Logo size="sm" showText={true} />
                            </div>
                            <h1 className="hidden md:flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                                <span className="material-symbols-outlined text-amber-500 text-xl">
                                    {mainTab === 'messages' ? 'chat_bubble' : 'notifications'}
                                </span>
                                <span>{mainTab === 'messages' ? 'Direct Messages' : 'Activity & Notifications'}</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {mainTab === 'messages' ? (
                                <button 
                                    onClick={() => navigate('/browse-profiles')}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-base text-white">edit_square</span>
                                    <span className="hidden sm:inline text-white">New Thread</span>
                                </button>
                            ) : (
                                localUnreadNotifCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08] transition-all active:scale-95"
                                    >
                                        Mark All Read
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Primary Segmented Switcher: [ Messages ] [ Notifications ] */}
                    <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-white/[0.04] rounded-2xl border border-zinc-200/80 dark:border-white/10">
                        <button
                            onClick={() => handleTabChange('messages')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                mainTab === 'messages'
                                    ? 'bg-white dark:bg-[#121316] text-zinc-900 dark:text-white shadow-sm border border-zinc-200/60 dark:border-white/10'
                                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">chat_bubble</span>
                            <span>Direct Messages</span>
                            {unreadMessagesCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-extrabold animate-pulse">
                                    {unreadMessagesCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => handleTabChange('notifications')}
                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                mainTab === 'notifications'
                                    ? 'bg-white dark:bg-[#121316] text-zinc-900 dark:text-white shadow-sm border border-zinc-200/60 dark:border-white/10'
                                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">notifications</span>
                            <span>Notifications</span>
                            {displayUnreadNotifs > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-extrabold">
                                    {displayUnreadNotifs}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ==================== 1. MESSAGES VIEW ==================== */}
                {mainTab === 'messages' && (
                    <div className="animate-in fade-in duration-200">
                        {/* Search Bar */}
                        <div className="py-3">
                            <div className="relative flex items-center bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-amber-500/50 shadow-sm dark:shadow-none transition-colors">
                                <span className="material-symbols-outlined text-zinc-400 mr-2 text-xl">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search filmmakers, crew, or discussions..."
                                    className="bg-transparent border-none outline-none text-sm w-full text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Active Filmmakers & Collaborators Reel */}
                        <div className="py-3 border-b border-zinc-200 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Production Circle</span>
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Active Now</span>
                            </div>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                                {/* Current User Status */}
                                <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-white/10 group-hover:border-amber-500/50 transition-colors">
                                            <PostMedia
                                                src={userProfile?.photoURL || currentUser?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
                                                fallbackType="USER_MALE"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#090A0C] shadow-sm">
                                            <span className="material-symbols-outlined text-[13px] font-bold text-white">add</span>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Your Status</span>
                                </div>

                                {/* Recent Collaborators */}
                                {(recentChats.length > 0 ? recentChats : mockChats).slice(0, 8).map((creator) => (
                                    <div 
                                        key={creator.id} 
                                        onClick={() => navigate(`/chat/${creator.id}`)}
                                        className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                                    >
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600">
                                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-[#090A0C]">
                                                    <PostMedia
                                                        src={creator.image}
                                                        fallbackType="USER_MALE"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#090A0C]" />
                                        </div>
                                        <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 max-w-[64px] truncate text-center">
                                            {creator.name.split(' ')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Message Sub-Tabs */}
                        <div className="py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setActiveChatTab('primary')}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                                    activeChatTab === 'primary'
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                Direct Messages
                            </button>
                            <button
                                onClick={() => setActiveChatTab('requests')}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                                    activeChatTab === 'requests'
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                Gigs & Inquiries
                            </button>
                            <button
                                onClick={() => setActiveChatTab('general')}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                                    activeChatTab === 'general'
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                Archive
                            </button>
                        </div>

                        {/* Chat Threads List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pt-1 pb-16">
                            {chatsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                                    <span className="text-xs text-zinc-500 tracking-wider uppercase font-semibold">Loading Filmmaker Comms...</span>
                                </div>
                            ) : filteredChats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#121316]/40 rounded-2xl border border-zinc-200 dark:border-white/5 my-6 shadow-sm dark:shadow-none">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                                        <span className="material-symbols-outlined text-3xl">forum</span>
                                    </div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">No Active Threads Found</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-6">
                                        Connect with directors, cinematographers, and producers from the Discover hub.
                                    </p>
                                    <button
                                        onClick={() => navigate('/browse-profiles')}
                                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        Explore Filmmakers
                                    </button>
                                </div>
                            ) : (
                                filteredChats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => navigate(`/chat/${chat.id}`)}
                                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 hover:border-amber-500/30 hover:bg-zinc-50 dark:hover:bg-[#16171b] cursor-pointer active:scale-[0.99] transition-all group shadow-sm dark:shadow-none"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                            <div className="relative shrink-0">
                                                <div className="w-13 h-13 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 group-hover:border-amber-500/40 transition-colors">
                                                    <PostMedia
                                                        src={chat.image}
                                                        fallbackType="USER_MALE"
                                                        className="w-12 h-12 object-cover rounded-full"
                                                    />
                                                </div>
                                                {chat.unread && (
                                                    <span className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-[#090A0C]" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1 pr-2">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                                        {chat.name}
                                                    </h3>
                                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">
                                                        {chat.time}
                                                    </span>
                                                </div>
                                                {chat.role && (
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400/90 font-bold mb-1 uppercase tracking-wide truncate">
                                                        {chat.role}
                                                    </p>
                                                )}
                                                <p className={`text-xs truncate ${chat.unread ? 'text-zinc-900 dark:text-zinc-200 font-semibold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                                    {chat.message}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pl-2 shrink-0">
                                            <span className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 text-lg transition-colors">
                                                chevron_right
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ==================== 2. NOTIFICATIONS VIEW ==================== */}
                {mainTab === 'notifications' && (
                    <div className="animate-in fade-in duration-200 pt-2 pb-16">
                        {/* Notification Filter Sub-Tabs */}
                        <div className="py-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-2">
                                {[
                                    { id: 'general' as const, label: 'All Activity' },
                                    { id: 'jobs' as const, label: 'Jobs & Auditions' },
                                    { id: 'connections' as const, label: 'Network & Circle' },
                                ].map((tab) => {
                                    const isActive = activeNotifTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveNotifTab(tab.id)}
                                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                                                isActive
                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
                                {filteredNotifications.length} {filteredNotifications.length === 1 ? 'alert' : 'alerts'}
                            </span>
                        </div>

                        {/* Notifications Stream */}
                        <div className="mt-2">
                            {notifsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="size-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-bold text-zinc-400 tracking-wide uppercase">
                                        Checking notifications...
                                    </p>
                                </div>
                            ) : filteredNotifications.length > 0 ? (
                                <div className="flex flex-col divide-y divide-zinc-200 dark:divide-white/[0.05] bg-white dark:bg-[#121316] rounded-2xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden shadow-sm dark:shadow-xl">
                                    {filteredNotifications.map((notification) => {
                                        const badge = getNotificationIcon(notification.type);

                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`flex items-start gap-3.5 sm:gap-4 p-4 text-left transition-all cursor-pointer group ${
                                                    notification.isRead
                                                        ? 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
                                                        : 'bg-amber-500/[0.06] hover:bg-amber-500/[0.1]'
                                                }`}
                                            >
                                                <div className="relative shrink-0">
                                                    {notification.image ? (
                                                        <div
                                                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cover bg-center border border-zinc-200 dark:border-white/10 group-hover:border-amber-500/40 transition-colors shadow-xs"
                                                            style={{ backgroundImage: `url(${notification.image})` }}
                                                        />
                                                    ) : (
                                                        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${badge.color}`}>
                                                            <span className="material-symbols-outlined text-lg sm:text-xl">
                                                                {badge.icon}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {!notification.isRead && (
                                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-[#121316]" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate">
                                                            {notification.title}
                                                        </p>
                                                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2 mb-1">
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
                                                            className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-400 transition-all shadow-sm active:scale-95"
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
                                <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] shadow-sm">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-500 dark:text-amber-400">
                                        <span className="material-symbols-outlined text-3xl">notifications_off</span>
                                    </div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                                        No notifications yet
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-5">
                                        When you receive casting callbacks, job matches, or collaborator alerts, they'll show up here.
                                    </p>
                                    <button
                                        onClick={() => navigate('/jobs')}
                                        className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all shadow-md shadow-amber-500/10 active:scale-95"
                                    >
                                        Explore Casting Calls
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
