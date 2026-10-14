import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';

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
    const [activeTab, setActiveTab] = useState<SavedType>('all');
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Seed Data FOR DEMO - defined outside to ensure availability
    const demoItems: SavedItem[] = [
        {
            id: 'seed-1',
            type: 'job',
            data: {
                id: 'job-1',
                title: 'Lead Cinematographer',
                company: 'Dharma Productions',
                logo: 'https://images.unsplash.com/photo-1492691523567-6170c24dac02?w=200&h=200&fit=crop'
            },
            savedAt: new Date().toISOString()
        },
        {
            id: 'seed-2',
            type: 'showreel',
            data: {
                id: 'show-1',
                title: 'Cinematography Reel 2024',
                creator: 'Arjun Mehra',
                thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=400&fit=crop'
            },
            savedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'seed-3',
            type: 'post',
            data: {
                id: 'post-1',
                content: 'New camera rigging setup for the upcoming action sequences in Mumbai...',
                author: 'Karan Singh',
                image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=400&fit=crop'
            },
            savedAt: new Date(Date.now() - 172800000).toISOString()
        }
    ];

    useEffect(() => {
        const fetchSavedItems = async () => {
            if (!currentUser) {
                setSavedItems(demoItems); // Still show demo items even if no user
                setLoading(false);
                return;
            }

            setLoading(true);
            let realItems: SavedItem[] = [];

            try {
                // 1. Fetch from specialized collections with individual try-catch to avoid total failure
                const [jobsRes, postsRes] = await Promise.allSettled([
                    getDocs(query(collection(db, 'saved_jobs'), where('userId', '==', currentUser.uid))),
                    getDocs(query(collection(db, 'saved_posts'), where('userId', '==', currentUser.uid)))
                ]);

                // 2. Resolve Jobs
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
                        } catch (e) { console.error("SavedItems: Job resolution error", e); }
                        return null;
                    });
                    const resolvedJobs = await Promise.all(jobPromises);
                    realItems = [...realItems, ...resolvedJobs.filter((i): i is any => i !== null)];
                } else {
                    console.error("SavedItems: Failed to fetch saved_jobs", jobsRes.reason);
                }

                // 3. Resolve Posts/Reels
                if (postsRes.status === 'fulfilled') {
                    const postsSnap = postsRes.value;
                    const postPromises = postsSnap.docs.map(async (saveDoc) => {
                        const saveData = saveDoc.data();
                        if (!saveData.postId) return null;
                        try {
                            const collectionName = saveData.type === 'showreel' ? 'showreels' : 'posts';
                            const snap = await getDoc(doc(db, collectionName, saveData.postId));

                            if (snap.exists()) {
                                return {
                                    id: saveDoc.id,
                                    type: (saveData.type || 'post') as 'post' | 'showreel',
                                    data: { id: snap.id, ...snap.data() },
                                    savedAt: saveData.savedAt
                                };
                            } else {
                                // Fallback
                                const fallbackCollection = collectionName === 'posts' ? 'showreels' : 'posts';
                                const fallbackSnap = await getDoc(doc(db, fallbackCollection, saveData.postId));
                                if (fallbackSnap.exists()) {
                                    return {
                                        id: saveDoc.id,
                                        type: (fallbackCollection === 'showreels' ? 'showreel' : 'post') as 'post' | 'showreel',
                                        data: { id: fallbackSnap.id, ...fallbackSnap.data() },
                                        savedAt: saveData.savedAt
                                    };
                                }
                            }
                        } catch (e) { console.error("SavedItems: Post/Reel resolution error", e); }
                        return null;
                    });
                    const resolvedPosts = await Promise.all(postPromises);
                    realItems = [...realItems, ...resolvedPosts.filter((i): i is any => i !== null)];
                } else {
                    console.error("SavedItems: Failed to fetch saved_posts", postsRes.reason);
                }

            } catch (error) {
                console.error("SavedItems: General fetch error", error);
            } finally {
                // 4. Merge, sort and set state
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

    const filteredItems = savedItems.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'jobs') return item.type === 'job';
        if (activeTab === 'posts') return item.type === 'post';
        if (activeTab === 'showreels') return item.type === 'showreel';
        return true;
    });

    return (
        <div className="relative mx-auto flex h-full min-h-[100dvh] w-full max-w-md md:max-w-3xl lg:max-w-4xl flex-col bg-[#F8F9FA] dark:bg-zinc-950 pb-24 overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/70 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 backdrop-blur-3xl border-b border-black/[0.02] dark:border-white/[0.02] flex items-center gap-3">
                <HamburgerMenu />
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase truncate">Saved Items</h1>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
                {(['all', 'jobs', 'posts', 'showreels'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 sm:px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                            : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <main className="flex-1 px-4 py-2 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center pt-20 gap-4">
                        <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Syncing your folder...</p>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    if (item.type === 'job') {
                                        navigate(`/job/${item.data.id}`);
                                    } else if (item.type === 'showreel') {
                                        navigate(`/showreel/view1?id=${item.data.id}`);
                                    } else if (item.type === 'post') {
                                        // If it's a job-related post, take them to the job page
                                        if (item.data.jobId) {
                                            navigate(`/job/${item.data.jobId}`);
                                        } else if (item.data.blogId) {
                                            // Take them to blogs page - later we can add scroll logic there too
                                            navigate('/blogs-events');
                                        } else {
                                            // Regular post, take to showcase and scroll
                                            navigate(`/showcase?id=${item.data.id}`);
                                        }
                                    }
                                }}
                                className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex gap-4">
                                    <div className="size-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-white/5">
                                        {(item.type === 'job' && item.data.logo) || (item.type === 'post' && item.data.image) || (item.type === 'showreel' && item.data.thumbnail) ? (
                                            <img
                                                src={item.type === 'job' ? item.data.logo : (item.type === 'showreel' ? item.data.thumbnail : item.data.image)}
                                                alt="Item"
                                                className="size-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    const placeholderName = item.type === 'job' ? item.data.company : (item.type === 'showreel' ? item.data.title : 'Post');
                                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(placeholderName)}&background=random`;
                                                }}
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-zinc-400 text-3xl">
                                                {item.type === 'job' ? 'work' : (item.type === 'showreel' ? 'play_circle' : 'article')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${item.type === 'job' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                item.type === 'showreel' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                                }`}>
                                                {item.type}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                                                {(() => {
                                                    const val = item.savedAt;
                                                    if (!val) return 'New';
                                                    if (val.toDate) return val.toDate().toLocaleDateString();
                                                    if (typeof val === 'object' && val.seconds) return new Date(val.seconds * 1000).toLocaleDateString();
                                                    return new Date(val).toLocaleDateString();
                                                })()}
                                            </span>
                                        </div>
                                        <h3 className="text-zinc-900 dark:text-white font-bold text-sm truncate group-hover:text-primary transition-colors">
                                            {item.type === 'job' ? item.data.title : (item.type === 'showreel' ? item.data.title : item.data.content?.substring(0, 50) + '...')}
                                        </h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate">
                                            {item.type === 'job' ? item.data.company : (item.type === 'showreel' ? item.data.creator : item.data.author)}
                                        </p>
                                    </div>
                                    <div className="self-center">
                                        <span className="material-symbols-outlined text-zinc-300 group-hover:text-primary transition-all group-hover:translate-x-1">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center pt-20 text-center gap-6 px-10">
                        <div className="size-24 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-300">
                            <span className="material-symbols-outlined text-6xl">bookmarks</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Empty Collection</h3>
                            <p className="text-sm text-zinc-500 font-medium">Try saving some items from the feed or job board.</p>
                        </div>
                        <button
                            onClick={() => navigate('/home')}
                            className="bg-primary text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                            Explore Content
                        </button>
                    </div>
                )}
                <div className="h-20" />
            </main>

            <BottomNav />
        </div>
    );
}
