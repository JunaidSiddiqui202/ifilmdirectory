import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { collection, query, where, getDocs, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

type SavedType = 'all' | 'jobs' | 'posts' | 'showreels';

interface SavedItem {
    id: string;
    type: 'job' | 'post' | 'showreel';
    data: any;
    savedAt: any;
}

export default function SavedItems() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState<SavedType>('all');
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [removingId, setRemovingId] = useState<string | null>(null);

    // High fidelity seed data for demo presentation
    const demoItems: SavedItem[] = [
        {
            id: 'seed-1',
            type: 'job',
            data: {
                id: 'job-1',
                title: 'Lead Cinematographer',
                company: 'Dharma Productions',
                location: 'Mumbai, Maharashtra',
                salary: '₹18L - ₹25L/yr',
                jobType: 'Full Time',
                department: 'Camera Department',
                logo: 'https://images.unsplash.com/photo-1492691523567-6170c24dac02?w=300&h=300&fit=crop'
            },
            savedAt: new Date().toISOString()
        },
        {
            id: 'seed-2',
            type: 'showreel',
            data: {
                id: 'show-1',
                title: 'Cinematography Reel 2025',
                creator: 'Arjun Mehra',
                role: 'Director of Photography',
                views: 12400,
                duration: '2:45',
                thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&h=400&fit=crop'
            },
            savedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'seed-3',
            type: 'post',
            data: {
                id: 'post-1',
                title: 'Anamorphic Lens Selection for High-Speed Sequences',
                content: 'Breaking down our tests between Cooke Anamorphic/i Full Frame Plus vs Arri Master Anamorphics for night car chases in Mumbai...',
                author: 'Karan Singh',
                authorRole: 'Camera Operator',
                likes: 184,
                comments: 32,
                image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&h=400&fit=crop'
            },
            savedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 'seed-4',
            type: 'job',
            data: {
                id: 'job-2',
                title: 'Senior Colorist & DI Supervisor',
                company: 'Red Chillies VFX',
                location: 'Hyderabad / Remote',
                salary: '₹15L - ₹22L/yr',
                jobType: 'Contract',
                department: 'Post Production',
                logo: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&h=300&fit=crop'
            },
            savedAt: new Date(Date.now() - 259200000).toISOString()
        }
    ];

    useEffect(() => {
        const fetchSavedItems = async () => {
            if (!currentUser) {
                setSavedItems(demoItems);
                setLoading(false);
                return;
            }

            setLoading(true);
            let realItems: SavedItem[] = [];

            try {
                const [jobsRes, postsRes] = await Promise.allSettled([
                    getDocs(query(collection(db, 'saved_jobs'), where('userId', '==', currentUser.uid))),
                    getDocs(query(collection(db, 'saved_posts'), where('userId', '==', currentUser.uid)))
                ]);

                // Resolve Jobs
                if (jobsRes.status === 'fulfilled') {
                    const jobsSnap = jobsRes.value;
                    const jobPromises = jobsSnap.docs.map(async (saveDoc) => {
                        const saveData = saveDoc.data();
                        if (!saveData.jobId) return null;
                        try {
                            const snap = await getDoc(doc(db, 'jobs', saveData.jobId));
                            if (snap.exists()) {
                                return {
                                    id: saveDoc.id,
                                    type: 'job' as const,
                                    data: { id: snap.id, ...snap.data() },
                                    savedAt: saveData.savedAt
                                };
                            }
                        } catch (e) {
                            console.error("SavedItems: Job resolution error", e);
                        }
                        return null;
                    });
                    const resolvedJobs = await Promise.all(jobPromises);
                    realItems = [...realItems, ...resolvedJobs.filter((i): i is any => i !== null)];
                }

                // Resolve Posts/Reels
                if (postsRes.status === 'fulfilled') {
                    const postsSnap = postsRes.value;
                    const postPromises = postsSnap.docs.map(async (saveDoc) => {
                        const saveData = saveDoc.data();
                        if (!saveData.postId) return null;
                        try {
                            const collectionName = saveData.type === 'showreel' ? 'showreels' : 'posts';
                            let snap = await getDoc(doc(db, collectionName, saveData.postId));

                            if (!snap.exists()) {
                                const fallbackCollection = collectionName === 'posts' ? 'showreels' : 'posts';
                                snap = await getDoc(doc(db, fallbackCollection, saveData.postId));
                            }

                            if (snap.exists()) {
                                return {
                                    id: saveDoc.id,
                                    type: (saveData.type || (collectionName === 'showreels' ? 'showreel' : 'post')) as 'post' | 'showreel',
                                    data: { id: snap.id, ...snap.data() },
                                    savedAt: saveData.savedAt
                                };
                            }
                        } catch (e) {
                            console.error("SavedItems: Post/Reel resolution error", e);
                        }
                        return null;
                    });
                    const resolvedPosts = await Promise.all(postPromises);
                    realItems = [...realItems, ...resolvedPosts.filter((i): i is any => i !== null)];
                }

            } catch (error) {
                console.error("SavedItems: General fetch error", error);
            } finally {
                const merged = realItems.length > 0 ? [...realItems] : [...demoItems];
                merged.sort((a, b) => {
                    const getTime = (val: any) => {
                        if (!val) return 0;
                        if (val.toDate) return val.toDate().getTime();
                        if (typeof val === 'object' && val.seconds) return val.seconds * 1000;
                        if (val instanceof Date) return val.getTime();
                        return new Date(val).getTime();
                    };
                    return getTime(b.savedAt) - getTime(a.savedAt);
                });

                setSavedItems(merged);
                setLoading(false);
            }
        };

        fetchSavedItems();
    }, [currentUser]);

    const handleRemoveSaved = async (e: React.MouseEvent, item: SavedItem) => {
        e.stopPropagation();
        setRemovingId(item.id);

        try {
            if (!item.id.startsWith('seed-') && currentUser) {
                const collName = item.type === 'job' ? 'saved_jobs' : 'saved_posts';
                await deleteDoc(doc(db, collName, item.id));
            }
            setSavedItems(prev => prev.filter(i => i.id !== item.id));
        } catch (err) {
            console.error("Failed to remove saved item:", err);
        } finally {
            setRemovingId(null);
        }
    };

    const handleNavigate = (item: SavedItem) => {
        if (item.type === 'job') {
            navigate(`/job/${item.data.id}`);
        } else if (item.type === 'showreel') {
            navigate(`/showreel/view1?id=${item.data.id}`);
        } else if (item.type === 'post') {
            if (item.data.jobId) {
                navigate(`/job/${item.data.jobId}`);
            } else if (item.data.blogId) {
                navigate('/blogs-events');
            } else {
                navigate(`/showcase?id=${item.data.id}`);
            }
        }
    };

    const counts = {
        all: savedItems.length,
        jobs: savedItems.filter(i => i.type === 'job').length,
        posts: savedItems.filter(i => i.type === 'post').length,
        showreels: savedItems.filter(i => i.type === 'showreel').length,
    };

    const filteredItems = savedItems.filter(item => {
        const matchesTab = activeTab === 'all' || item.type === (activeTab === 'jobs' ? 'job' : activeTab === 'posts' ? 'post' : 'showreel');
        if (!matchesTab) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();

        const title = (item.type === 'job' ? item.data.title : (item.type === 'showreel' ? item.data.title : item.data.title || item.data.content)) || '';
        const subtitle = (item.type === 'job' ? item.data.company : (item.type === 'showreel' ? item.data.creator : item.data.author)) || '';

        return title.toLowerCase().includes(q) || subtitle.toLowerCase().includes(q);
    });

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-36 md:pb-24 overflow-x-hidden font-display transition-colors">
            <SEO
                title="Saved Items - iFilmDirectory"
                description="Access your bookmarked casting calls, cinema showreels, technique breakdowns, and industry posts."
            />

            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex flex-col flex-1 px-4 sm:px-6">

                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-30 flex items-center justify-between py-3.5 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/5">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <HamburgerMenu />
                        <Logo size="sm" showText={true} />
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            onClick={toggleDarkMode}
                            type="button"
                            className="p-2 rounded-xl bg-zinc-100 dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-amber-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                            aria-label="Toggle Theme"
                        >
                            <span className="material-symbols-outlined text-lg">
                                {isDarkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                    </div>
                </header>

                {/* Hero / Page Banner */}
                <div className="pt-6 sm:pt-8 pb-4">
                    <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-white dark:via-[#121316] to-zinc-50 dark:to-[#0d0e11] border border-amber-500/20 p-5 sm:p-7 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-sm">bookmarks</span>
                                    <span>Personal Vault</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
                                    <span>Saved Film Assets</span>
                                </h1>
                                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                                    Your bookmarked casting calls, trade craft reels, and technical guild discussions in one organized repository.
                                </p>
                            </div>

                            {/* Search Filter Box */}
                            <div className="relative w-full md:w-72 shrink-0">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="Filter by title or creator..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 rounded-2xl text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 pb-4 overflow-x-auto scrollbar-none">
                    {(['all', 'jobs', 'posts', 'showreels'] as const).map((tab) => {
                        const count = counts[tab];
                        const label = tab === 'all' ? 'All Items' : tab === 'jobs' ? 'Casting & Jobs' : tab === 'posts' ? 'Discussions' : 'Showreels';
                        const icon = tab === 'all' ? 'category' : tab === 'jobs' ? 'work' : tab === 'posts' ? 'article' : 'play_circle';

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                                    activeTab === tab
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/40 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">{icon}</span>
                                <span>{label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                    activeTab === tab
                                        ? 'bg-white/20 text-white'
                                        : 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Grid */}
                <main className="flex-1 pb-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                            <div className="size-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                Loading your bookmarked items...
                            </p>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map((item) => {
                                const isJob = item.type === 'job';
                                const isShowreel = item.type === 'showreel';

                                const imageSrc = isJob
                                    ? item.data.logo
                                    : isShowreel
                                    ? item.data.thumbnail
                                    : (item.data.image || item.data.mediaUrls?.[0]);

                                const title = isJob
                                    ? item.data.title
                                    : isShowreel
                                    ? item.data.title
                                    : (item.data.title || item.data.content);

                                const creatorOrCompany = isJob
                                    ? item.data.company
                                    : isShowreel
                                    ? (item.data.creator || item.data.userName)
                                    : (item.data.author || item.data.userName);

                                const subtitleRole = isJob
                                    ? (item.data.location || item.data.department)
                                    : isShowreel
                                    ? (item.data.role || 'Showreel')
                                    : (item.data.authorRole || 'Film Discussion');

                                const isRemoving = removingId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleNavigate(item)}
                                        className="bg-white dark:bg-[#121316] rounded-3xl p-4 sm:p-5 border border-zinc-200 dark:border-white/[0.08] shadow-sm hover:shadow-md hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                                    >
                                        <div>
                                            {/* Card Top Pill & Quick Actions */}
                                            <div className="flex items-center justify-between gap-2 mb-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                                        isJob
                                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                            : isShowreel
                                                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                        <span className="material-symbols-outlined text-xs">
                                                            {isJob ? 'work' : isShowreel ? 'play_circle' : 'article'}
                                                        </span>
                                                        <span>{isJob ? 'Casting / Job' : isShowreel ? 'Showreel' : 'Guild Post'}</span>
                                                    </span>

                                                    {isJob && item.data.jobType && (
                                                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                                            • {item.data.jobType}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Remove Bookmark Button */}
                                                <button
                                                    onClick={(e) => handleRemoveSaved(e, item)}
                                                    disabled={isRemoving}
                                                    className="size-7 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                                                    title="Remove from saved"
                                                >
                                                    <span className="material-symbols-outlined text-base">
                                                        {isRemoving ? 'hourglass_top' : 'bookmark_remove'}
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Media + Title Block */}
                                            <div className="flex items-start gap-3.5 mb-3">
                                                <div className="size-14 sm:size-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 shrink-0 overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-white/10 relative">
                                                    {imageSrc ? (
                                                        <img
                                                            src={imageSrc}
                                                            alt={title}
                                                            className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creatorOrCompany || 'Cinema')}&background=random`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-amber-500 text-2xl">
                                                            {isJob ? 'business_center' : isShowreel ? 'movie' : 'format_quote'}
                                                        </span>
                                                    )}

                                                    {isShowreel && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                                            <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-zinc-900 dark:text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                                                        {title}
                                                    </h3>
                                                    <p className="text-zinc-600 dark:text-zinc-300 font-semibold text-xs mt-0.5 truncate">
                                                        {creatorOrCompany}
                                                    </p>
                                                    <p className="text-zinc-400 text-[11px] truncate">
                                                        {subtitleRole}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Body snippet for posts */}
                                            {!isJob && !isShowreel && item.data.content && (
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                                                    {item.data.content}
                                                </p>
                                            )}
                                        </div>

                                        {/* Card Footer: Meta Info & Jump Action */}
                                        <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                                            <div>
                                                {isJob && item.data.salary ? (
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                        {item.data.salary}
                                                    </span>
                                                ) : isShowreel && item.data.views ? (
                                                    <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                                        <span className="material-symbols-outlined text-xs">visibility</span>
                                                        <span>{item.data.views.toLocaleString()} views</span>
                                                    </span>
                                                ) : (
                                                    <span>
                                                        Saved on {(() => {
                                                            const val = item.savedAt;
                                                            if (!val) return 'Recently';
                                                            if (val.toDate) return val.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                            if (typeof val === 'object' && val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                            return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                        })()}
                                                    </span>
                                                )}
                                            </div>

                                            <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                                <span>View</span>
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] p-10 sm:p-16 text-center shadow-sm max-w-xl mx-auto my-8">
                            <div className="size-20 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                                <span className="material-symbols-outlined text-4xl">bookmarks</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-1.5">
                                {searchQuery ? 'No Matching Items Found' : 'Your Personal Vault is Empty'}
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
                                {searchQuery
                                    ? `No saved items match "${searchQuery}". Clear your search query to see all items.`
                                    : 'Save casting notices, technical guild breakdowns, or cinema showreels to build your quick-reference production library.'}
                            </p>
                            {searchQuery ? (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                                >
                                    Clear Search Query
                                </button>
                            ) : (
                                <div className="flex flex-wrap gap-2.5 justify-center">
                                    <button
                                        onClick={() => navigate('/jobs')}
                                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-sm">work</span>
                                        <span>Explore Jobs</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/guilds')}
                                        className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-sm">groups</span>
                                        <span>Browse Guilds</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
