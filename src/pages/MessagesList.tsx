import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import { subscribeToChats } from '../services/messagingService';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import PostMedia from '../components/PostMedia';
import { getUserProfile, type UserProfile } from '../services/userService';

export default function MessagesList() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { hasUnreadNotifications } = useUnread();
    const [activeTab, setActiveTab] = useState<'primary' | 'requests' | 'general'>('primary');
    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    useEffect(() => {
        if (!currentUser) {
            setRecentChats(mockChats);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToChats(async (dbChats) => {
            try {
                // Filter to threads where current user is a participant
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
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [currentUser]);

    const filteredChats = recentChats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-24 font-display transition-colors">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-5xl mx-auto flex flex-col flex-1 px-4">
                
                {/* Cinema Top Header */}
                <div className="flex items-center justify-between py-4 sticky top-0 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-md z-20 border-b border-zinc-200 dark:border-white/5">
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
                            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Messages
                            </span>
                        </div>
                        <h1 className="hidden md:flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                            <span className="material-symbols-outlined text-amber-500 text-xl">chat_bubble</span>
                            <span>Direct Messages</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate('/notifications')} 
                            className="relative p-2 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-amber-500/30 transition-all"
                            aria-label="Notifications"
                            title="Notifications & Alerts"
                        >
                            <span className="material-symbols-outlined text-xl">notifications</span>
                            {hasUnreadNotifications && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-sm shadow-amber-500/50"></span>
                            )}
                        </button>
                        <button 
                            onClick={() => navigate('/browse-profiles')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/20"
                        >
                            <span className="material-symbols-outlined text-base text-white">edit_square</span>
                            <span className="hidden sm:inline text-white">New Thread</span>
                        </button>
                    </div>
                </div>

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

                {/* Filter Pills */}
                <div className="py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('primary')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                            activeTab === 'primary'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        Direct Messages
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                            activeTab === 'requests'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        Gigs & Inquiries
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-xs ${
                            activeTab === 'general'
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        Archive
                    </button>
                </div>

                {/* Chat Threads List */}
                <div className="flex-1 overflow-y-auto space-y-2 pt-1 pb-16">
                    {loading ? (
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

            <BottomNav />
        </div>
    );
}
