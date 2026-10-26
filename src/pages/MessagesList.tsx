import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import HamburgerMenu from '../components/HamburgerMenu';
import SEO from '../components/SEO';
import { subscribeToChats } from '../services/messagingService';
import { subscribeToNotifications, markNotificationAsRead, type NotificationData } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import { useTheme } from '../context/ThemeContext';
import PostMedia from '../components/PostMedia';
import { getUserProfile, type UserProfile } from '../services/userService';
import { formatTimeAgo } from '../utils/dateUtils';

type MainTab = 'messages' | 'notifications';
type ChatFilterTab = 'all' | 'unread' | 'collaborations' | 'archived';
type NotificationFilterTab = 'all' | 'jobs' | 'network' | 'system';

export default function MessagesList() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { unreadMessagesCount, unreadNotificationsCount } = useUnread();

    // Primary Section Switcher ('messages' | 'notifications')
    const initialTab: MainTab = searchParams.get('tab') === 'notifications' ? 'notifications' : 'messages';
    const [mainTab, setMainTab] = useState<MainTab>(initialTab);

    // Messages State
    const [activeChatTab, setActiveChatTab] = useState<ChatFilterTab>('all');
    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [chatsLoading, setChatsLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Notifications State
    const [activeNotifTab, setActiveNotifTab] = useState<NotificationFilterTab>('all');
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [notifsLoading, setNotifsLoading] = useState(true);

    const mockChats = [
        { 
            id: 'ranveer-singh', 
            name: 'Ranveer Singh', 
            role: 'Lead Actor & Producer',
            message: 'Reviewed the storyboard. Let’s do a read-through tomorrow at 11 AM.', 
            time: '2h ago',
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop', 
            isOnline: true,
            isVerified: true,
            unread: true
        },
        { 
            id: 'jonny-shaik', 
            name: 'Jonny Shaik', 
            role: 'Cinematographer (ISC)',
            message: 'Sent the ARRI Alexa 35 camera package specs and anamorphic lens list for scene 4.', 
            time: '5h ago',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', 
            isOnline: false,
            isVerified: true,
            unread: false
        },
        { 
            id: 'vn-aditya', 
            name: 'V.N. Aditya', 
            role: 'Film Director',
            message: 'Great cut on the teaser reel! Sharing final grade notes with the colorist.', 
            time: 'Yesterday',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop', 
            isOnline: true,
            isVerified: true,
            unread: false
        },
        { 
            id: 'ananya-sen', 
            name: 'Ananya Sen', 
            role: 'Costume & Production Designer',
            message: 'Fabric swatches for the 1980s period drama shoot have arrived.', 
            time: '2d ago',
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', 
            isOnline: false,
            isVerified: false,
            unread: false
        }
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
                        let isVerified = false;

                        try {
                            const profile = await getUserProfile(otherUserId);
                            if (profile) {
                                userName = profile.displayName || profile.email?.split('@')[0] || 'Filmmaker';
                                userRole = (profile as any).role || profile.bio?.slice(0, 24) || 'Filmmaker';
                                userImage = profile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=121316&color=F59E0B`;
                                isVerified = Boolean(profile.verification?.isVerified);
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
                            isOnline: true,
                            isVerified,
                            unread: isUnread
                        };
                    });

                    const formatted = await Promise.all(formattedPromises);
                    setRecentChats(formatted);
                } else {
                    setRecentChats(mockChats);
                }
            } catch (err) {
                console.error('Error processing chats:', err);
                setRecentChats(mockChats);
            } finally {
                setChatsLoading(false);
            }
        }, currentUser.uid);

        return () => unsubscribe();
    }, [currentUser]);

    // Subscribe to notifications
    useEffect(() => {
        if (!currentUser) {
            const timer = setTimeout(() => {
                if (!currentUser) setNotifsLoading(false);
            }, 1000);
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
                        title: 'Audition Call Alert',
                        message: 'A new role for "Cinematographer" matches your camera package gear profile.',
                        createdAt: { seconds: Date.now() / 1000 } as any,
                        isRead: false,
                        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=120&h=120&fit=crop',
                        actionLink: '/jobs'
                    },
                    {
                        id: 'mock-2',
                        userId: currentUser.uid,
                        type: 'connection',
                        title: 'Production Network Request',
                        message: 'Rohan Das (Gaffer & Lighting Tech) wants to connect with your crew network.',
                        createdAt: { seconds: (Date.now() - 3600000) / 1000 } as any,
                        isRead: false,
                        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
                        actionLink: `/profile/${currentUser.uid}`
                    },
                    {
                        id: 'mock-3',
                        userId: currentUser.uid,
                        type: 'like',
                        title: 'Project Endorsement',
                        message: 'V.N. Aditya endorsed your showreel for "Best Dynamic Visual Tone".',
                        createdAt: { seconds: (Date.now() - 86400000) / 1000 } as any,
                        isRead: true,
                        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop',
                        actionLink: '/showcase'
                    }
                ]);
                setNotifsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    // Filter chats by tab and query
    const filteredChats = recentChats.filter(chat => {
        const matchesQuery = 
            chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (chat.role && chat.role.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesQuery) return false;
        if (activeChatTab === 'unread') return chat.unread;
        if (activeChatTab === 'collaborations') return chat.role?.toLowerCase().includes('director') || chat.role?.toLowerCase().includes('producer');
        if (activeChatTab === 'archived') return false;
        return true;
    });

    // Filter notifications
    const filteredNotifications = notifications.filter(n => {
        if (activeNotifTab === 'jobs') return n.type === 'job';
        if (activeNotifTab === 'network') return n.type === 'connection' || n.type === 'follow';
        if (activeNotifTab === 'system') return n.type !== 'job' && n.type !== 'connection' && n.type !== 'follow';
        return true;
    });

    const localUnreadNotifCount = notifications.filter(n => !n.isRead).length;
    const displayUnreadNotifs = unreadNotificationsCount || localUnreadNotifCount;
    const totalUnreadMessages = unreadMessagesCount || recentChats.filter(c => c.unread).length;

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
                return { icon: 'star', color: 'text-purple-500 dark:text-purple-400 bg-purple-500/15 border-purple-500/25' };
            default:
                return { icon: 'notifications', color: 'text-sky-500 dark:text-sky-400 bg-sky-500/15 border-sky-500/25' };
        }
    };

    return (
        <div className="flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#0B0C0E] text-zinc-900 dark:text-white pb-28 font-display transition-colors">
            <SEO 
                title="Cinema Comms & Activity | iFilmDirectory" 
                description="Secure real-time messaging, production circle chats, casting alerts, and industry network notifications."
            />

            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto flex flex-col flex-1 px-3 sm:px-5">
                
                {/* Unified Cinema Top Navigation Bar */}
                <header className="sticky top-0 bg-white/95 dark:bg-[#0B0C0E]/95 backdrop-blur-xl z-30 border-b border-zinc-200/80 dark:border-white/[0.08] pt-3.5 pb-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* Left: Back / Brand */}
                        <div className="flex items-center gap-2.5">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-all active:scale-95"
                                aria-label="Go Back"
                                title="Back"
                            >
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                            </button>
                            <div className="cursor-pointer select-none" onClick={() => navigate('/home')}>
                                <Logo size="sm" showText={true} />
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            {/* Theme Toggle (Mobile only since desktop sidebar already has theme toggle) */}
                            <button
                                onClick={toggleDarkMode}
                                className="flex md:hidden size-9 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 transition-colors"
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>

                            {mainTab === 'messages' ? (
                                <button 
                                    onClick={() => navigate('/browse-profiles')}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/25 active:scale-95"
                                    title="Start a new message"
                                >
                                    <span className="material-symbols-outlined text-base">edit_square</span>
                                    <span className="hidden sm:inline">New Message</span>
                                </button>
                            ) : (
                                localUnreadNotifCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs font-bold px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-all active:scale-95"
                                    >
                                        Mark All Read
                                    </button>
                                )
                            )}

                            <HamburgerMenu />
                        </div>
                    </div>

                    {/* Section Switcher: Direct Messages vs Activity & Notifications */}
                    <div className="mt-3 grid grid-cols-2 p-1 bg-zinc-100/90 dark:bg-white/[0.04] rounded-2xl border border-zinc-200/90 dark:border-white/[0.08]">
                        <button
                            onClick={() => handleTabChange('messages')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                mainTab === 'messages'
                                    ? 'bg-white dark:bg-[#15171C] text-zinc-900 dark:text-white shadow-sm border border-zinc-200/70 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base text-amber-500">forum</span>
                            <span>Direct Messages</span>
                            {totalUnreadMessages > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black animate-pulse">
                                    {totalUnreadMessages}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => handleTabChange('notifications')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                                mainTab === 'notifications'
                                    ? 'bg-white dark:bg-[#15171C] text-zinc-900 dark:text-white shadow-sm border border-zinc-200/70 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base text-amber-500">notifications</span>
                            <span>Notifications</span>
                            {displayUnreadNotifs > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-black">
                                    {displayUnreadNotifs}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* ==================== 1. MESSAGES VIEW ==================== */}
                {mainTab === 'messages' && (
                    <div className="animate-in fade-in duration-200 space-y-4 pt-3">
                        
                        {/* Live Filter & Search Bar */}
                        <div className="relative flex items-center bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-white/[0.08] rounded-2xl px-3.5 py-2.5 focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/10 shadow-xs transition-all">
                            <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 mr-2.5 text-xl">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations by crew name, role, or message..."
                                className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')} 
                                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            )}
                        </div>

                        {/* Production Circle Reels (Active Filmmakers) */}
                        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200/80 dark:border-white/[0.06] shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                        Production Circle
                                    </span>
                                </div>
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                    Live On Set
                                </span>
                            </div>

                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 pt-0.5">
                                {/* Current User Broadcast Avatar */}
                                <div 
                                    onClick={() => navigate(currentUser ? `/profile/${currentUser.uid}` : '/login')}
                                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                                >
                                    <div className="relative">
                                        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-dashed border-amber-500/60 group-hover:border-amber-500 p-0.5 transition-colors">
                                            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 dark:bg-black">
                                                <PostMedia
                                                    src={userProfile?.photoURL || currentUser?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop"}
                                                    fallbackType="USER_MALE"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 size-5 bg-amber-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-[#121316] shadow-sm">
                                            <span className="material-symbols-outlined text-[13px] font-bold">add</span>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                                        My Status
                                    </span>
                                </div>

                                {/* Active Filmmakers / Crew */}
                                {(recentChats.length > 0 ? recentChats : mockChats).slice(0, 10).map((creator) => (
                                    <div 
                                        key={creator.id} 
                                        onClick={() => navigate(`/chat/${creator.id}`)}
                                        className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                                    >
                                        <div className="relative">
                                            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 shadow-sm group-hover:scale-105 transition-transform">
                                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-[#121316] bg-zinc-900">
                                                    <PostMedia
                                                        src={creator.image}
                                                        fallbackType="USER_MALE"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            {creator.isOnline && (
                                                <div className="absolute bottom-0 right-0 size-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#121316] shadow-xs" />
                                            )}
                                        </div>
                                        <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 max-w-[68px] truncate text-center group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                                            {creator.name.split(' ')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Filter Tabs for Chat Threads */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {[
                                { id: 'all' as const, label: 'All Threads', count: recentChats.length },
                                { id: 'unread' as const, label: 'Unread', count: totalUnreadMessages },
                                { id: 'collaborations' as const, label: 'Directors & Heads' },
                                { id: 'archived' as const, label: 'Archived' },
                            ].map((tab) => {
                                const isActive = activeChatTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveChatTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                                            isActive
                                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/[0.06] hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                                isActive ? 'bg-black/20 text-white' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Chat Threads Stream */}
                        <div className="space-y-2.5">
                            {chatsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="size-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                                    <span className="text-xs text-zinc-500 tracking-wider uppercase font-bold">
                                        Syncing Filmmaker Messages...
                                    </span>
                                </div>
                            ) : filteredChats.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-sm">
                                    <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                                        <span className="material-symbols-outlined text-3xl">chat</span>
                                    </div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1.5">
                                        {searchQuery ? 'No matching conversations' : 'No Active Threads Yet'}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
                                        {searchQuery 
                                            ? `No threads match "${searchQuery}". Try searching for another name or role.`
                                            : 'Reach out to directors, cinematographers, and production teams from the Talent Directory to kickstart conversations.'
                                        }
                                    </p>
                                    <button
                                        onClick={() => navigate('/browse-profiles')}
                                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition-all shadow-lg shadow-amber-500/25 active:scale-95"
                                    >
                                        Explore Filmmakers
                                    </button>
                                </div>
                            ) : (
                                filteredChats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => navigate(`/chat/${chat.id}`)}
                                        className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200/90 dark:border-white/[0.06] hover:border-amber-500/40 hover:bg-amber-500/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-all shadow-xs hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                            {/* Avatar with Online Badge */}
                                            <div className="relative shrink-0">
                                                <div className="size-13 sm:size-14 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 group-hover:border-amber-500/50 transition-colors shadow-xs">
                                                    <PostMedia
                                                        src={chat.image}
                                                        fallbackType="USER_MALE"
                                                        className="size-full object-cover"
                                                    />
                                                </div>
                                                {chat.isOnline && (
                                                    <span className="absolute bottom-0 right-0 size-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#121316] shadow-xs" />
                                                )}
                                                {chat.unread && (
                                                    <span className="absolute -top-0.5 -right-0.5 size-3.5 bg-amber-500 rounded-full border-2 border-white dark:border-[#121316] animate-pulse" />
                                                )}
                                            </div>

                                            {/* Thread Info */}
                                            <div className="min-w-0 flex-1 pr-2">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                                            {chat.name}
                                                        </h3>
                                                        {chat.isVerified && (
                                                            <span className="material-symbols-outlined text-amber-500 text-xs shrink-0 filled" title="Verified Professional">
                                                                verified
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">
                                                        {chat.time}
                                                    </span>
                                                </div>

                                                {chat.role && (
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-1 truncate">
                                                        {chat.role}
                                                    </p>
                                                )}

                                                <p className={`text-xs truncate leading-relaxed ${
                                                    chat.unread 
                                                        ? 'text-zinc-950 dark:text-zinc-100 font-bold' 
                                                        : 'text-zinc-600 dark:text-zinc-400 font-normal'
                                                }`}>
                                                    {chat.message}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 pl-2 shrink-0">
                                            <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all text-xl">
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
                    <div className="animate-in fade-in duration-200 space-y-4 pt-3">
                        {/* Notification Filter Sub-Tabs */}
                        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-2">
                                {[
                                    { id: 'all' as const, label: 'All Activity' },
                                    { id: 'jobs' as const, label: 'Casting & Jobs' },
                                    { id: 'network' as const, label: 'Network & Circle' },
                                    { id: 'system' as const, label: 'System & Alerts' },
                                ].map((tab) => {
                                    const isActive = activeNotifTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveNotifTab(tab.id)}
                                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                                                isActive
                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/[0.06] hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 shrink-0">
                                {filteredNotifications.length} {filteredNotifications.length === 1 ? 'alert' : 'alerts'}
                            </span>
                        </div>

                        {/* Notifications Stream */}
                        <div>
                            {notifsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="size-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-bold text-zinc-400 tracking-wide uppercase">
                                        Loading Activity Stream...
                                    </p>
                                </div>
                            ) : filteredNotifications.length > 0 ? (
                                <div className="flex flex-col divide-y divide-zinc-200/90 dark:divide-white/[0.05] bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200/90 dark:border-white/[0.08] overflow-hidden shadow-xs">
                                    {filteredNotifications.map((notification) => {
                                        const badge = getNotificationIcon(notification.type);

                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 text-left transition-all cursor-pointer group ${
                                                    notification.isRead
                                                        ? 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
                                                        : 'bg-amber-500/[0.05] hover:bg-amber-500/[0.09]'
                                                }`}
                                            >
                                                <div className="relative shrink-0">
                                                    {notification.image ? (
                                                        <div
                                                            className="size-11 sm:size-12 rounded-2xl bg-cover bg-center border border-zinc-200 dark:border-white/10 group-hover:border-amber-500/40 transition-colors shadow-xs"
                                                            style={{ backgroundImage: `url(${notification.image})` }}
                                                        />
                                                    ) : (
                                                        <div className={`size-11 sm:size-12 rounded-2xl flex items-center justify-center border ${badge.color}`}>
                                                            <span className="material-symbols-outlined text-xl">
                                                                {badge.icon}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {!notification.isRead && (
                                                        <span className="absolute -top-1 -right-1 size-3 bg-amber-500 rounded-full border-2 border-white dark:border-[#121316] shadow-xs" />
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
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2 mb-1.5">
                                                        {notification.message}
                                                    </p>
                                                </div>

                                                {notification.actionLink && (
                                                    <div className="flex items-center gap-2 shrink-0 self-center">
                                                        <span className="material-symbols-outlined text-zinc-400 group-hover:text-amber-500 text-lg group-hover:translate-x-0.5 transition-transform">
                                                            arrow_forward
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] shadow-xs">
                                    <div className="size-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-500 dark:text-amber-400">
                                        <span className="material-symbols-outlined text-3xl">notifications_off</span>
                                    </div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                                        No Notifications Found
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-5 leading-relaxed">
                                        When you receive casting callbacks, job matches, or collaborator alerts, they will appear here.
                                    </p>
                                    <button
                                        onClick={() => navigate('/jobs')}
                                        className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all shadow-md shadow-amber-500/15 active:scale-95"
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
