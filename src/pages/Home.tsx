import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { blogService, type BlogPost } from '../services/blogService';
import { jobService, type Job } from '../services/jobService';
import { getLatestUsers, type UserProfile } from '../services/userService';
import { showreelService, type Showreel } from '../services/showreelService';
import { getPosts, type PostData } from '../services/postService';
import { rssNewsService, type NewsItem } from '../services/rssNewsService';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useToast } from '../context/ToastContext';
import { useUnread } from '../context/UnreadContext';
import PostMedia from '../components/PostMedia';
import BreakingTicker from '../components/BreakingTicker';

const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
};

const formatNewsTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
        const mins = Math.max(1, Math.floor(diff / (1000 * 60)));
        return `${mins}m ago`;
    }
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
};

const formatJobTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Recent';
    try {
        const ms = timestamp.toDate ? timestamp.toDate().getTime() : (typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime());
        if (isNaN(ms)) return 'Recent';
        return formatNewsTimeAgo(ms);
    } catch {
        return 'Recent';
    }
};

export default function Home() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();
    const toast = useToast();
    const { hasUnreadMessages, hasUnreadNotifications } = useUnread();
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [newUsers, setNewUsers] = useState<UserProfile[]>([]);
    const [reels, setReels] = useState<Showreel[]>([]);
    const [networkPosts, setNetworkPosts] = useState<PostData[]>([]);
    const [likedPostsMap, setLikedPostsMap] = useState<Record<string, boolean>>({});
    const [selectedPollOption, setSelectedPollOption] = useState<number | null>(null);

    // Film News & Movie Reviews state
    const [cinemaNews, setCinemaNews] = useState<NewsItem[]>([]);
    const [newsFilter, setNewsFilter] = useState<'all' | 'review' | 'news'>('all');
    const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsItem | null>(null);
    const [newsLoading, setNewsLoading] = useState(true);

    // Film & Media Fraternity Jobs modal state
    const [selectedJobModal, setSelectedJobModal] = useState<Job | null>(null);

    useEffect(() => {
        // Pre-fill with cached cinema news instantly so UI renders without delay
        const initialCached = rssNewsService.getCachedNews();
        if (initialCached && initialCached.length > 0) {
            setCinemaNews(initialCached);
            setNewsLoading(false);
        }

        const loadHomeData = async () => {
            try {
                const [fetchedBlogs, fetchedJobs, fetchedUsers, fetchedReels, fetchedPosts, newsResult] = await Promise.all([
                    blogService.getBlogs(),
                    jobService.getJobs(),
                    getLatestUsers(8),
                    showreelService.getTrendingShowreels(10),
                    getPosts(10),
                    rssNewsService.getNews(false).catch((err) => {
                        console.error('Error fetching cinema news:', err);
                        return null;
                    })
                ]);
                setBlogs(fetchedBlogs.slice(0, 6));
                setJobs(fetchedJobs.slice(0, 6));
                setNewUsers(fetchedUsers);

                if (fetchedPosts && fetchedPosts.length > 0) {
                    setNetworkPosts(fetchedPosts.slice(0, 4));
                }
                
                if (fetchedReels && fetchedReels.length > 0) {
                    setReels(fetchedReels);
                } else {
                    await showreelService.seedShowreels();
                    const freshShowreels = await showreelService.getTrendingShowreels(10);
                    setReels(freshShowreels);
                }

                if (newsResult && (newsResult as any).items && Array.isArray((newsResult as any).items) && (newsResult as any).items.length > 0) {
                    setCinemaNews((newsResult as any).items);
                } else if (Array.isArray(newsResult) && newsResult.length > 0) {
                    setCinemaNews(newsResult);
                }
                setNewsLoading(false);
            } catch (err) {
                console.error('Error loading home data:', err);
                setNewsLoading(false);
            }
        };
        loadHomeData();
    }, []);

    /**
     * Opens original news or job article in a focused pop-up window over the current page.
     * When finished reading, the user can simply close the popup to return to iFilmDirectory.
     */
    const openSourcePopup = (url?: string, _title?: string) => {
        if (!url) return;
        const width = Math.min(1060, Math.max(680, Math.floor(window.innerWidth * 0.88)));
        const height = Math.min(900, Math.max(600, Math.floor(window.innerHeight * 0.90)));
        const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
        const top = Math.max(0, Math.floor((window.screen.height - height) / 2));

        const popupFeatures = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=yes`;
        const popup = window.open(url, 'CinemaNewsSourcePopup', popupFeatures);

        if (popup) {
            popup.focus();
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleShareNews = async (item: NewsItem, e: React.MouseEvent) => {
        e.stopPropagation();
        const siteLink = `${window.location.origin}/south-cinema?id=${encodeURIComponent(item.id)}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: `${item.title} — via iFilmDirectory South Cinema Wire`,
                    url: siteLink,
                });
            } catch {
                // user cancelled
            }
        } else {
            await navigator.clipboard.writeText(siteLink);
            toast.success('iFilmDirectory news link copied to clipboard!');
        }
    };

    const filteredNews = cinemaNews.filter(item => {
        if (newsFilter === 'review') return item.category === 'review' || Boolean(item.rating);
        if (newsFilter === 'news') return item.category === 'news' && !item.rating;
        return true;
    });

    const handleShareJob = async (job: Job, e: React.MouseEvent) => {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/job/${job.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${job.title} at ${job.company}`,
                    text: `Film Fraternity Job: ${job.title} at ${job.company} (${job.location}) — Check it out on iFilmDirectory`,
                    url: shareUrl
                });
            } catch {
                // user cancelled
            }
        } else {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Job link copied to clipboard!');
        }
    };


    const poll = {
        question: "Which filmmaking breakthrough are you most excited to use on your next shoot?",
        options: [
            { id: 1, text: "Virtual Production (LED Volumes & Unreal Engine)", votes: 142 },
            { id: 2, text: "AI Color Grading & Post-Production Clean-up", votes: 89 },
            { id: 3, text: "Large-Format Cinema Cameras (Alexa 35 / Venice 2)", votes: 115 },
            { id: 4, text: "Independent OTT & Direct Theatrical Distribution", votes: 64 }
        ]
    };

    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0) + (selectedPollOption ? 1 : 0);

    // Reusable Quick Actions
    const QuickActionsGrid = () => (
        <div className="grid grid-cols-4 gap-2">
            <button
                onClick={() => navigate('/post-job')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 hover:border-amber-500/40 dark:hover:border-white/20 transition-all group active:scale-95 text-center shadow-sm dark:shadow-none"
            >
                <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg text-white">campaign</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Post Call</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Cast & Crew</span>
            </button>

            <button
                onClick={() => navigate('/browse-profiles')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 hover:border-amber-500/40 dark:hover:border-white/20 transition-all group active:scale-95 text-center shadow-sm dark:shadow-none"
            >
                <div className="size-9 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-800 dark:text-white flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">group</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Directory</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Talent & Crew</span>
            </button>

            <button
                onClick={() => navigate('/booking-facilities')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 hover:border-amber-500/40 dark:hover:border-white/20 transition-all group active:scale-95 text-center shadow-sm dark:shadow-none"
            >
                <div className="size-9 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-800 dark:text-white flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">apartment</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Facilities</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Studios & Gear</span>
            </button>

            <button
                onClick={() => navigate('/groups-forums')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 hover:border-amber-500/40 dark:hover:border-white/20 transition-all group active:scale-95 text-center shadow-sm dark:shadow-none"
            >
                <div className="size-9 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-800 dark:text-white flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">forum</span>
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">Guilds</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Discussions</span>
            </button>
        </div>
    );

    // Reusable Featured Talent Section
    const FeaturedTalentSection = () => (
        <section className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 p-4 sm:p-5 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-purple-500" />
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                        Featured Talent & Studios
                    </h2>
                </div>
                <button
                    onClick={() => navigate('/browse-profiles')}
                    className="text-xs font-bold text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors flex items-center gap-0.5"
                >
                    <span>Directory</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3">
                {newUsers.slice(0, 4).map((user) => (
                    <div
                        key={user.uid}
                        onClick={() => navigate(`/profile/${user.uid}`)}
                        className="rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 p-3 hover:border-amber-500/30 transition-all cursor-pointer group flex flex-col items-center text-center shadow-xs dark:shadow-none"
                    >
                        <div className="size-12 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-white/10 group-hover:border-amber-500/50 transition-colors mb-2">
                            <PostMedia
                                src={user.photoURL || ''}
                                fallbackType="USER_MALE"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h3 className="font-bold text-xs text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate w-full">
                            {user.displayName || 'Filmmaker'}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate w-full mt-0.5">
                            {(user as any).role || user.bio?.slice(0, 20) || 'Key Crew'}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );

    // Reusable Poll Section
    const DailyPollSection = () => (
        <section className="rounded-2xl bg-white dark:bg-gradient-to-br dark:from-[#121316] dark:to-[#18191D] border border-zinc-200 dark:border-white/5 p-5 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Industry Pulse • Daily Poll
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">{totalVotes} votes</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3.5 leading-snug">
                {poll.question}
            </h3>
            <div className="space-y-2.5">
                {poll.options.map((option) => {
                    const isSelected = selectedPollOption === option.id;
                    const voteCount = option.votes + (isSelected ? 1 : 0);
                    const percentage = Math.round((voteCount / totalVotes) * 100);

                    return (
                        <button
                            key={option.id}
                            onClick={() => {
                                if (!currentUser) {
                                    openAuthModal('Sign in to vote in industry polls');
                                    return;
                                }
                                setSelectedPollOption(option.id);
                            }}
                            className={`relative w-full text-left p-2.5 rounded-xl border transition-all overflow-hidden ${
                                isSelected
                                    ? 'border-amber-500 bg-amber-500/10'
                                    : 'border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] hover:border-amber-500/30 dark:hover:border-white/20'
                            }`}
                        >
                            {selectedPollOption !== null && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-amber-500/15 transition-all duration-500 pointer-events-none"
                                    style={{ width: `${percentage}%` }}
                                />
                            )}
                            <div className="relative flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-white">
                                <span className="truncate pr-2">{option.text}</span>
                                {selectedPollOption !== null && (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">{percentage}%</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );

    const defaultBlogs: BlogPost[] = [
        {
            id: 'seed-blog-1',
            title: 'The Visual Language of Modern South Indian Action Cinema',
            excerpt: 'Deconstructing slow-motion choreography, multi-camera setups, and color grading that redefined pan-India blockbuster aesthetics.',
            content: '',
            author: 'Arun Matheswaran',
            authorId: 'arun-matheswaran',
            authorPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
            category: 'Cinematography',
            views: 1840,
            likes: 320,
            date: null,
        },
        {
            id: 'seed-blog-2',
            title: 'Independent Filmmaking in 2026: Financing, OTT Presales & Distribution',
            excerpt: 'A pragmatic survival manual for debut directors navigating international festival circuits, angel syndicates, and hybrid theatrical releases.',
            content: '',
            author: 'Suman Kumar',
            authorId: 'suman-kumar',
            authorPhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
            image: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=450&fit=crop',
            category: 'Film Trade',
            views: 2410,
            likes: 415,
            date: null,
        },
        {
            id: 'seed-blog-3',
            title: 'Mastering Sync Sound & Foley Recording on Challenging Indian Sets',
            excerpt: 'Why live sync sound is making a massive resurgence in multilingual productions, and how sound recordists manage chaotic urban locations.',
            content: '',
            author: 'Resul Pookutty',
            authorId: 'resul-pookutty',
            authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
            image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=450&fit=crop',
            category: 'Sound Design',
            views: 1520,
            likes: 298,
            date: null,
        },
        {
            id: 'seed-blog-4',
            title: 'The Art of Screenplay Pacing: From 3-Act Paradigm to Non-Linear Narratives',
            excerpt: 'Examining structure, character arcs, and dialogue economy in contemporary Malayalam and Tamil screenplay masterpieces.',
            content: '',
            author: 'Jeethu Joseph',
            authorId: 'jeethu-joseph',
            authorPhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop',
            image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=450&fit=crop',
            category: 'Screenwriting',
            views: 3100,
            likes: 540,
            date: null,
        }
    ];

    const displayBlogs = blogs.length > 0 ? blogs : defaultBlogs;

    const defaultCommunityPosts: PostData[] = [
        {
            id: 'seed-post-1',
            author: 'Karan Johar',
            authorId: 'karan-johar',
            authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
            role: 'Producer & Director',
            authorVerified: true,
            content: 'Just wrapped up principal photography for our new feature film in Mumbai! Incredible work by our camera department and lighting team. Post-production starts Monday. #CinemaLife #Wrap',
            image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
            likes: 142,
            comments: 28,
            createdAt: null,
        },
        {
            id: 'seed-post-2',
            author: 'Sandeep Reddy Vanga',
            authorId: 'sandeep-vanga',
            authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
            role: 'Director & Writer',
            authorVerified: true,
            content: 'Final 7.1.4 Dolby Atmos surround mix underway. The dynamics between whispered silence and an explosive brass score are monumental. Experience it on the biggest screen possible. 🔊🎬 #SoundDesign #Cinema',
            image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=450&fit=crop',
            likes: 389,
            comments: 64,
            createdAt: null,
        },
        {
            id: 'seed-post-3',
            author: 'Ravi Varman',
            authorId: 'ravi-varman',
            authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
            role: 'Cinematographer (ISC)',
            authorVerified: true,
            content: 'Shooting natural dusk in Rajasthan with Cooke Anamorphic Full Frame primes. Always respect the shadows as much as the light. 🎥🌅 #Cinematography #Filmmaking',
            image: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&h=450&fit=crop',
            likes: 215,
            comments: 41,
            createdAt: null,
        }
    ];

    const displayPosts = networkPosts.length > 0 ? networkPosts : defaultCommunityPosts;

    // Featured Editorial Articles & Blog Section (Rendered in Main Feed Column)
    const EditorialArticlesSection = () => (
        <section className="space-y-3.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                        Industry Insights & Editorial Articles
                    </h2>
                </div>
                <button
                    onClick={() => navigate('/blogs-events')}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-0.5"
                >
                    <span>Read All Articles</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {displayBlogs.slice(0, 4).map((blog) => (
                    <article
                        key={blog.id}
                        onClick={() => navigate('/blogs-events')}
                        className="group rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 overflow-hidden hover:border-amber-500/40 transition-all cursor-pointer flex flex-col shadow-sm dark:shadow-none hover:shadow-md"
                    >
                        {/* Cover Image */}
                        <div className="w-full aspect-[16/9] relative overflow-hidden bg-black/5 dark:bg-black/40">
                            <img
                                src={blog.image || blog.coverImage || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop'}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold shadow-sm">
                                    {blog.category || 'Film Trade'}
                                </span>
                            </div>
                            <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-semibold text-zinc-300 border border-white/10 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-amber-400">schedule</span>
                                <span>3 min read</span>
                            </div>
                        </div>

                        {/* Article Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-sm sm:text-[15px] text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                                    {blog.title}
                                </h3>
                                {blog.excerpt && (
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                                        {blog.excerpt}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-white/5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                <div className="flex items-center gap-1.5 truncate">
                                    {blog.authorPhoto ? (
                                        <img src={blog.authorPhoto} alt="" className="size-4 rounded-full object-cover shrink-0" />
                                    ) : (
                                        <span className="material-symbols-outlined text-xs text-amber-500">edit_note</span>
                                    )}
                                    <span className="font-medium truncate">{blog.author || 'Editorial Board'}</span>
                                </div>
                                <span className="font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                                    Read Article <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                </span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );

    // Reusable Top Movie Reviews Widget (for Desktop Sidebar Card 2)
    const TopReviewsWidget = () => {
        const reviews = cinemaNews.filter(i => i.category === 'review' || Boolean(i.rating)).slice(0, 4);
        const displayItems = reviews.length > 0 ? reviews : cinemaNews.slice(0, 4);

        return (
            <section className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 p-4 sm:p-5 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                            Certified Movie Reviews
                        </h2>
                    </div>
                    <button
                        onClick={() => navigate('/south-cinema')}
                        className="text-xs font-bold text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors flex items-center gap-0.5"
                    >
                        <span>All Reviews</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>

                <div className="space-y-2.5">
                    {newsLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-white/[0.03] animate-pulse border border-zinc-200 dark:border-white/5" />
                        ))
                    ) : displayItems.length > 0 ? (
                        displayItems.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedNewsArticle(item)}
                                className="group p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 hover:border-amber-500/30 transition-all cursor-pointer flex gap-3 items-center shadow-xs dark:shadow-none"
                            >
                                <div className="relative size-14 rounded-lg overflow-hidden shrink-0 bg-black/60 border border-white/10">
                                    <img
                                        src={item.thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=200&fit=crop'}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=200&fit=crop';
                                        }}
                                    />
                                    {item.rating && (
                                        <div className="absolute inset-x-0 bottom-0 bg-amber-500 text-white font-black text-[9px] text-center leading-tight py-0.5">
                                            {item.rating}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
                                            {item.rating ? '★ Review' : 'Film Scoop'}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openSourcePopup(item.link, item.title);
                                            }}
                                            className="text-[10px] text-zinc-500 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors flex items-center gap-0.5 cursor-pointer"
                                            title={`Open ${item.source} in pop-up window`}
                                        >
                                            <span>• {item.source}</span>
                                            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                        </button>
                                    </div>
                                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                                        {item.title}
                                    </h4>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-xs text-zinc-500 dark:text-zinc-400">
                            Reviews syncing...
                        </div>
                    )}
                </div>
            </section>
        );
    };

    // Reusable Top Fraternity Jobs Widget (for Desktop Sidebar Card 3)
    const TopJobsWidget = () => {
        const displayJobs = jobs.slice(0, 4);

        return (
            <section className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 p-4 sm:p-5 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                            Hot Cast & Crew Calls
                        </h2>
                    </div>
                    <button
                        onClick={() => navigate('/jobs')}
                        className="text-xs font-bold text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors flex items-center gap-0.5"
                    >
                        <span>All Jobs</span>
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>

                <div className="space-y-2.5">
                    {displayJobs.length > 0 ? (
                        displayJobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => setSelectedJobModal(job)}
                                className="group p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 hover:border-amber-500/30 transition-all cursor-pointer flex gap-3 items-center shadow-xs dark:shadow-none"
                            >
                                <div className="relative size-12 rounded-xl overflow-hidden shrink-0 bg-black/60 border border-zinc-200 dark:border-white/10">
                                    <PostMedia
                                        src={job.logo || ''}
                                        fallbackType="COMPANY_LOGO"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 truncate max-w-[120px]">
                                            {job.company}
                                        </span>
                                        {job.fraternityRole && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                                                {job.fraternityRole}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
                                        {job.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        <span>{job.location}</span>
                                        {job.salary && (
                                            <>
                                                <span>•</span>
                                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{job.salary}</span>
                                            </>
                                        )}
                                        {job.postedAt && (
                                            <>
                                                <span>•</span>
                                                <span>{formatJobTimeAgo(job.postedAt)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedJobModal(job);
                                    }}
                                    className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white transition-all shrink-0 group-hover:bg-amber-500 group-hover:text-white"
                                    title="View Job"
                                >
                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-xs text-zinc-500 dark:text-zinc-400">
                            Fraternity calls syncing...
                        </div>
                    )}
                </div>

                {/* Audition Safety Notice */}
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-white/5 flex items-start gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span className="material-symbols-outlined text-amber-500 text-xs shrink-0 mt-0.5">shield</span>
                    <p className="leading-snug">
                        <strong className="text-zinc-700 dark:text-zinc-300">Audition Safety:</strong> Never pay money for auditions, screen tests, or roles. Report suspicious calls to{' '}
                        <a href="mailto:jobs@ifilmdirectory.com" className="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                            jobs@ifilmdirectory.com
                        </a>.
                    </p>
                </div>
            </section>
        );
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-36 md:pb-24 overflow-x-hidden font-display transition-colors">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex flex-col flex-1 px-4 sm:px-6">
                
                {/* 1. CINEMA TOP HEADER: Official Logo + Quick Search + Comms (Mobile Only; on desktop the left sidebar provides full nav and branding) */}
                <header className="md:hidden sticky top-0 z-30 flex items-center justify-between py-3.5 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <HamburgerMenu />
                        <Logo size="sm" showText={true} />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/search')}
                            className="p-2 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-amber-500/30 transition-all active:scale-95"
                            aria-label="Search"
                        >
                            <span className="material-symbols-outlined text-xl">search</span>
                        </button>
                        <button
                            onClick={() => {
                                if (!currentUser) {
                                    openAuthModal('Sign in to view notifications & alerts');
                                    return;
                                }
                                navigate('/messaging?tab=notifications');
                            }}
                            className="relative p-2 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-amber-500/30 transition-all active:scale-95"
                            aria-label="Notifications"
                            title="Notifications & Alerts"
                        >
                            <span className="material-symbols-outlined text-xl">notifications</span>
                            {hasUnreadNotifications && (
                                <span className="absolute top-1.5 right-1.5 size-2 bg-amber-500 rounded-full animate-pulse shadow-sm shadow-amber-500/50" />
                            )}
                        </button>
                        <button
                            onClick={() => {
                                if (!currentUser) {
                                    openAuthModal('Sign in to view direct messages');
                                    return;
                                }
                                navigate('/messaging');
                            }}
                            className="relative p-2 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-amber-500/30 transition-all active:scale-95"
                            aria-label="Messages"
                            title="Direct Messages"
                        >
                            <span className="material-symbols-outlined text-xl">chat_bubble</span>
                            {hasUnreadMessages && (
                                <span className="absolute top-1.5 right-1.5 size-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#121316] animate-pulse shadow-sm shadow-red-500/60" />
                            )}
                        </button>
                        {currentUser ? (
                            <div
                                onClick={() => navigate('/profile')}
                                className="size-9 rounded-full overflow-hidden border border-zinc-300 dark:border-white/20 ml-1 cursor-pointer hover:border-amber-500 transition-colors shrink-0"
                                title="My Profile"
                            >
                                <PostMedia
                                    src={currentUser?.photoURL || ''}
                                    fallbackType="USER_MALE"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => openAuthModal('Sign in to join the filmmaker network')}
                                className="ml-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                                title="Sign In"
                            >
                                <span className="material-symbols-outlined text-[15px] font-black">login</span>
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* 2. RESPONSIVE TWO-COLUMN GRID ON DESKTOP (xl:) / 1-COLUMN ON MOBILE */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4">
                    
                    {/* PRIMARY CINEMA STREAM (Left 2 cols on xl) */}
                    <div className="xl:col-span-2 space-y-6">
                        
                        {/* Welcome Banner */}
                        <div className="flex items-center justify-between pb-1">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-amber-500" />
                                    Filmmaker Network & Production Hub
                                </span>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white mt-0.5">
                                    {currentUser ? `Welcome back, ${currentUser.displayName?.split(' ')[0] || 'Creator'}!` : 'Welcome to iFilmDirectory!'}
                                </h1>
                            </div>
                            <button
                                onClick={() => navigate('/showcase')}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-base">movie</span>
                                <span>Feed</span>
                            </button>
                        </div>

                        {/* Live South Cinema Breaking RSS Ticker with Jobs Arrivals & Instant Readers */}
                        <BreakingTicker
                            variant="home"
                            onNewsClick={(item) => setSelectedNewsArticle(item)}
                            onJobClick={(job) => setSelectedJobModal(job)}
                        />


                        {/* Film News & Movie Reviews Section (Responsive News Headlines with Small Thumbnails) */}
                        <section className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                                            <span>Film News & Reviews</span>
                                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                Top Stories
                                            </span>
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => navigate('/south-cinema')}
                                        className="sm:hidden text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-0.5"
                                    >
                                        <span>All Wire</span>
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>

                                {/* Filter Pills + Desktop View All */}
                                <div className="flex items-center justify-between sm:justify-end gap-2">
                                    <div className="flex items-center bg-zinc-100 dark:bg-white/[0.04] p-0.5 rounded-xl border border-zinc-200 dark:border-white/5 text-[11px] font-bold">
                                        <button
                                            onClick={() => setNewsFilter('all')}
                                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                                newsFilter === 'all'
                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setNewsFilter('review')}
                                            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                                                newsFilter === 'review'
                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[12px] filled text-white">star</span>
                                            <span>Reviews</span>
                                        </button>
                                        <button
                                            onClick={() => setNewsFilter('news')}
                                            className={`px-2.5 py-1 rounded-lg transition-all ${
                                                newsFilter === 'news'
                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            News
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => navigate('/south-cinema')}
                                        className="hidden sm:flex text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors items-center gap-0.5"
                                        title="Explore all cinema news"
                                    >
                                        <span>All Wire</span>
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>
                            </div>

                            {/* News Headlines with Small Thumbnails */}
                            {newsLoading ? (
                                <div className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 divide-y divide-zinc-100 dark:divide-white/5 overflow-hidden">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="p-2.5 sm:p-3 flex items-center gap-3 animate-pulse">
                                            <div className="size-14 sm:size-16 rounded-xl bg-zinc-200 dark:bg-white/5 shrink-0" />
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="h-3 bg-zinc-200 dark:bg-white/5 rounded w-1/4" />
                                                <div className="h-3.5 bg-zinc-200 dark:bg-white/5 rounded w-4/5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : filteredNews.length > 0 ? (
                                <div className="flex flex-col rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] divide-y divide-zinc-100 dark:divide-white/[0.05] overflow-hidden shadow-xs">
                                    {filteredNews.slice(0, 5).map((item) => {
                                        const isReview = item.category === 'review' || Boolean(item.rating);
                                        return (
                                            <article
                                                key={item.id}
                                                onClick={() => setSelectedNewsArticle(item)}
                                                className="group flex items-center gap-3 p-2.5 sm:p-3 hover:bg-amber-500/[0.03] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                            >
                                                {/* Small Thumbnail */}
                                                <div className="relative size-14 sm:size-16 rounded-xl overflow-hidden shrink-0 bg-black/60 border border-zinc-200 dark:border-white/10 shadow-xs">
                                                    <img
                                                        src={item.thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=200&fit=crop'}
                                                        alt={item.title}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                             (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=200&fit=crop';
                                                        }}
                                                    />
                                                    {isReview && item.rating && (
                                                        <div className="absolute inset-x-0 bottom-0 bg-amber-500 text-white font-black text-[9px] text-center leading-tight py-0.5 shadow-xs">
                                                            ★ {item.rating}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* News Headline & Info */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openSourcePopup(item.link, item.title);
                                                            }}
                                                            className="text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 truncate max-w-[120px] flex items-center gap-0.5 hover:underline"
                                                            title={`Open ${item.source} in pop-up window`}
                                                        >
                                                            <span>{item.source}</span>
                                                            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                        </button>
                                                        <span className="text-[10px] text-zinc-400">•</span>
                                                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{formatNewsTimeAgo(item.timestamp)}</span>
                                                        {isReview && !item.rating && (
                                                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                                REVIEW
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                                                        {item.title}
                                                    </h3>
                                                </div>

                                                {/* Share Action */}
                                                <button
                                                    onClick={(e) => handleShareNews(item, e)}
                                                    className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors shrink-0"
                                                    title="Share story"
                                                >
                                                    <span className="material-symbols-outlined text-base">share</span>
                                                </button>
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-6 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 text-center text-xs text-zinc-600 dark:text-zinc-400">
                                    No stories found for this filter. Check back shortly!
                                </div>
                            )}

                            {filteredNews.length > 5 && (
                                <div className="text-center pt-1">
                                    <button
                                        onClick={() => navigate('/south-cinema')}
                                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all inline-flex items-center justify-center gap-1.5"
                                    >
                                        <span>Browse Full Cinema Wire & Reviews ({filteredNews.length})</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            )}

                            {/* South Cinema Wire Editorial & Review Disclaimer */}
                            <div className="p-3 sm:p-3.5 rounded-xl bg-zinc-100/70 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-amber-500 text-base shrink-0 mt-0.5">verified_user</span>
                                <div className="space-y-1">
                                    <p className="leading-relaxed">
                                        <strong className="text-zinc-700 dark:text-zinc-300">Editorial & Review Notice:</strong> Film headlines and certified reviews are aggregated via public RSS feeds under fair use. Copyrights and trademarks belong to original publishers. Reviews reflect critic opinions.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        <span>Editorial inquiries & DMCA:</span>
                                        <a href="mailto:editorial@ifilmdirectory.com" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                                            editorial@ifilmdirectory.com
                                        </a>
                                        <span>•</span>
                                        <a href="mailto:contact@ifilmdirectory.com" className="hover:text-amber-500">
                                            contact@ifilmdirectory.com
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* On Mobile / Tablet: Prioritize Jobs & Featured Talent right after News & Reviews */}
                        <div className="xl:hidden space-y-6">
                            <TopJobsWidget />
                            <FeaturedTalentSection />
                        </div>

                        {/* Trending Showreels & BTS */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        Trending Showreels & BTS
                                    </h2>
                                </div>
                                <button
                                    onClick={() => navigate('/showreel/view1')}
                                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-0.5"
                                >
                                    <span>Watch All</span>
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>

                            <div className="flex overflow-x-auto gap-3.5 no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                                {reels.length > 0 ? (
                                    reels.map((reel) => (
                                        <div
                                            key={reel.id}
                                            onClick={() => navigate('/showreel/view1')}
                                            className="w-[130px] sm:w-[155px] shrink-0 aspect-[9/16] relative rounded-2xl overflow-hidden snap-start group cursor-pointer shadow-lg border border-zinc-200 dark:border-white/5 hover:border-amber-500/40 transition-all bg-black"
                                        >
                                            <PostMedia
                                                src={reel.videoUrl || reel.thumbnail}
                                                fallbackType="FILM_SET"
                                                isThumbnail={true}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                            
                                            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px] text-amber-400 filled" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                                <span className="text-white text-[9px] font-bold">{formatViews(reel.views)}</span>
                                            </div>

                                            <div className="absolute bottom-2.5 left-2.5 right-2.5">
                                                <p className="text-white text-xs font-bold truncate group-hover:text-amber-400 transition-colors">
                                                    {reel.title || 'Cinematic Reel'}
                                                </p>
                                                <p className="text-zinc-300 text-[10px] uppercase font-semibold tracking-wider truncate mt-0.5">
                                                    {reel.creator}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full py-10 text-center text-zinc-500 text-xs">
                                        Loading filmmaker showreels...
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Filmmaker Community Feed */}
                        <section className="space-y-3.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        Filmmaker Community Feed
                                    </h2>
                                </div>
                                <button
                                    onClick={() => navigate('/showcase')}
                                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-0.5"
                                >
                                    <span>Explore Feed</span>
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {displayPosts.slice(0, 3).map((post, pIdx) => {
                                    const postKey = post.id || `post-${pIdx}`;
                                    const isLiked = !!likedPostsMap[postKey];
                                    const currentLikes = (post.likes || 12) + (isLiked ? 1 : 0);
                                    const mediaUrl = post.image || (post.images && post.images[0]);

                                    return (
                                        <div
                                            key={postKey}
                                            onClick={() => navigate(`/showcase${post.id ? `?id=${post.id}` : ''}`)}
                                            className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 p-4 sm:p-5 hover:border-amber-500/30 transition-all cursor-pointer group shadow-sm dark:shadow-none"
                                        >
                                            {/* Creator Row */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div
                                                        className="size-10 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 shrink-0 cursor-pointer"
                                                        onClick={(e) => {
                                                            if (post.authorId) {
                                                                e.stopPropagation();
                                                                navigate(`/profile/${post.authorId}`);
                                                            }
                                                        }}
                                                    >
                                                        <PostMedia
                                                            src={post.authorImage || ''}
                                                            fallbackType="USER_MALE"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate">
                                                                {post.author}
                                                            </h3>
                                                            {(post.authorVerified || post.author === 'Karan Johar' || post.author === 'Sandeep Reddy Vanga' || post.author === 'Ravi Varman') && (
                                                                <span className="material-symbols-outlined text-amber-500 text-[15px] filled shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                                    verified
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                                            {post.role || 'Film Professional'} • {post.createdAt ? formatNewsTimeAgo(post.createdAt.toDate ? post.createdAt.toDate().getTime() : post.createdAt) : '2h ago'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 shrink-0">
                                                    Post
                                                </span>
                                            </div>

                                            {/* Post Text */}
                                            <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed mb-3 line-clamp-3">
                                                {post.content}
                                            </p>

                                            {/* Post Media Attachment */}
                                            {mediaUrl && (
                                                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-3 border border-zinc-200 dark:border-white/5">
                                                    <PostMedia
                                                        src={mediaUrl}
                                                        fallbackType="FILM_SET"
                                                        className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
                                                    />
                                                </div>
                                            )}

                                            {/* Engagement Bar */}
                                            <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 pt-2.5 border-t border-zinc-100 dark:border-white/5">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!currentUser) {
                                                            openAuthModal('Sign in to appreciate posts and connect with creators');
                                                            return;
                                                        }
                                                        setLikedPostsMap(prev => ({ ...prev, [postKey]: !prev[postKey] }));
                                                    }}
                                                    className={`flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-lg transition-colors ${isLiked ? 'text-red-500 bg-red-500/10' : 'hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                                                    title="Like"
                                                >
                                                    <span className={`material-symbols-outlined text-[17px] ${isLiked ? 'filled' : ''}`} style={isLiked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                                        {isLiked ? 'favorite' : 'favorite_border'}
                                                    </span>
                                                    <span>{currentLikes}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/showcase${post.id ? `?id=${post.id}` : ''}`);
                                                    }}
                                                    className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                    title="Comments"
                                                >
                                                    <span className="material-symbols-outlined text-[17px]">chat_bubble_outline</span>
                                                    <span>{post.comments || 18} Comments</span>
                                                </button>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const shareUrl = `${window.location.origin}/showcase${post.id ? `?id=${post.id}` : ''}`;
                                                        if (navigator.share) {
                                                            try {
                                                                await navigator.share({
                                                                    title: `${post.author} on iFilmDirectory`,
                                                                    text: post.content.slice(0, 100),
                                                                    url: shareUrl,
                                                                });
                                                            } catch {}
                                                        } else {
                                                            await navigator.clipboard.writeText(shareUrl);
                                                            toast.success('Post link copied to clipboard!');
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 py-1 px-2 -mr-2 rounded-lg hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                    title="Share"
                                                >
                                                    <span className="material-symbols-outlined text-[17px]">share</span>
                                                    <span>Share</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Callout card to enter community */}
                                <div
                                    onClick={() => navigate('/showcase')}
                                    className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-xl">forum</span>
                                        </div>
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors">
                                                Join 5,000+ Film Fraternity Creators
                                            </h4>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                Share behind-the-scenes, post project updates & collaborate
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform shrink-0">
                                        <span>View Feed</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Industry Insights & Editorial Articles (Blog Section) */}
                        <EditorialArticlesSection />

                        {/* On Mobile / Tablet, render remaining community sections sequentially */}
                        <div className="xl:hidden space-y-6">
                            <DailyPollSection />

                            {/* Mobile Footer Links */}
                            <div className="pt-4 pb-4 px-2 text-center text-xs text-zinc-500 space-y-2 border-t border-zinc-200 dark:border-white/5">
                                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                                    <span onClick={() => navigate('/privacy')} className="hover:text-zinc-900 dark:hover:text-zinc-300 cursor-pointer">Privacy</span>
                                    <span onClick={() => navigate('/terms')} className="hover:text-zinc-900 dark:hover:text-zinc-300 cursor-pointer">Terms</span>
                                    <span onClick={() => navigate('/blogs-events')} className="hover:text-zinc-900 dark:hover:text-zinc-300 cursor-pointer">Editorial</span>
                                    <span onClick={() => navigate('/booking-facilities')} className="hover:text-zinc-900 dark:hover:text-zinc-300 cursor-pointer">Facilities</span>
                                </div>
                                <p className="text-[11px] text-zinc-500">© 2026 iFilmDirectory. A property of 5M Collective Services Pvt. Ltd. (5MC). All rights reserved.</p>
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP RIGHT SIDEBAR (1 col on xl desktop) */}
                    <div className="hidden xl:flex flex-col gap-6">
                        {/* 1. Creator Shortcuts */}
                        <div className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 p-4 shadow-sm dark:shadow-none">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
                                Creator Shortcuts
                            </h3>
                            <QuickActionsGrid />
                        </div>

                        {/* 2. REVIEWS LISTS VIEW */}
                        <TopReviewsWidget />

                        {/* 3. JOBS LISTS VIEW */}
                        <TopJobsWidget />

                        {/* 4. Featured Talent & Studios */}
                        <FeaturedTalentSection />

                        {/* 5. Industry Pulse (Daily Poll) */}
                        <DailyPollSection />

                        {/* Footer Links & Copyright (Instagram Style) */}
                        <div className="px-2 pt-2 text-[11px] text-zinc-500 space-y-2">
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                <span onClick={() => navigate('/privacy')} className="hover:text-zinc-300 cursor-pointer">Privacy</span>
                                <span onClick={() => navigate('/terms')} className="hover:text-zinc-300 cursor-pointer">Terms</span>
                                <span onClick={() => navigate('/blogs-events')} className="hover:text-zinc-300 cursor-pointer">Editorial</span>
                                <span onClick={() => navigate('/booking-facilities')} className="hover:text-zinc-300 cursor-pointer">Facilities</span>
                            </div>
                            <p>© 2026 iFilmDirectory. A property of 5M Collective Services Pvt. Ltd. (5MC). All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* IN-APP FILM NEWS & REVIEW READER MODAL */}
            {selectedNewsArticle && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setSelectedNewsArticle(null)}
                >
                    <div
                        className="w-full max-w-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header Media & Close */}
                        <div className="relative aspect-[16/9] w-full max-h-64 overflow-hidden bg-black shrink-0">
                            <img
                                src={selectedNewsArticle.thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop'}
                                alt={selectedNewsArticle.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedNewsArticle(null)}
                                className="absolute top-3 right-3 size-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105 z-10"
                                aria-label="Close story"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>

                            {/* Tags */}
                            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    {selectedNewsArticle.rating ? (
                                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-amber-500 text-white flex items-center gap-1 shadow-md">
                                            <span className="material-symbols-outlined text-[11px] filled">star</span>
                                            <span>{selectedNewsArticle.rating}</span>
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-blue-600 text-white backdrop-blur-md">
                                            Film News
                                        </span>
                                    )}
                                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-lg bg-black/70 text-white backdrop-blur-md border border-white/20">
                                        {selectedNewsArticle.industry}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => openSourcePopup(selectedNewsArticle.link, selectedNewsArticle.title)}
                                    className="text-white text-[11px] font-medium bg-black/70 hover:bg-black/90 px-2 py-0.5 rounded-md backdrop-blur-md flex items-center gap-1 transition-all cursor-pointer border border-white/10 hover:border-amber-400/50"
                                    title={`Open ${selectedNewsArticle.source} in pop-up window`}
                                >
                                    <span>{selectedNewsArticle.source}</span>
                                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                    <span>• {formatNewsTimeAgo(selectedNewsArticle.timestamp)}</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                            {selectedNewsArticle.category === 'review' && (
                                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-500 filled">star</span>
                                        <span className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-wider">
                                            Film Review & Verdict
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-white bg-amber-500 px-2.5 py-0.5 rounded-lg">
                                        {selectedNewsArticle.rating || '★ CERTIFIED'}
                                    </span>
                                </div>
                            )}

                            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-snug">
                                {selectedNewsArticle.title}
                            </h2>

                            <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line space-y-3 pt-3 border-t border-zinc-200 dark:border-white/5">
                                {selectedNewsArticle.content || selectedNewsArticle.description}
                            </div>

                            {/* Editorial & Review Attribution Box */}
                            <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-400/[0.04] border border-amber-500/20 text-xs space-y-2">
                                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-sm">verified_user</span>
                                    <span>Editorial Attribution & Fair Use</span>
                                </div>
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Aggregated under fair use and public RSS syndication. All trademarks, story excerpts, and copyright belong exclusively to {selectedNewsArticle.source}. Film reviews represent independent viewpoints of their respective critics.
                                </p>
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] border-t border-amber-500/15">
                                    <span className="text-zinc-500 dark:text-zinc-400">Queries & DMCA:</span>
                                    <a
                                        href={`mailto:editorial@ifilmdirectory.com?subject=Editorial Inquiry: ${encodeURIComponent(selectedNewsArticle.title)}`}
                                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-xs">mail</span>
                                        editorial@ifilmdirectory.com
                                    </a>
                                    <span className="text-zinc-400 dark:text-zinc-600">•</span>
                                    <a href="mailto:contact@ifilmdirectory.com" className="text-zinc-600 dark:text-zinc-400 hover:text-amber-500">
                                        contact@ifilmdirectory.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-[#0e0f12] border-t border-zinc-200 dark:border-white/10 flex items-center gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => openSourcePopup(selectedNewsArticle.link, selectedNewsArticle.title)}
                                className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm text-center flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                                <span>Read Full Story on {selectedNewsArticle.source} (Pop-up)</span>
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                            </button>

                            <button
                                onClick={(e) => handleShareNews(selectedNewsArticle, e)}
                                className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 transition-all shadow-xs"
                                title="Share"
                            >
                                <span className="material-symbols-outlined text-base sm:text-lg">share</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* IN-APP FRATERNITY JOB & CASTING READER MODAL */}
            {selectedJobModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setSelectedJobModal(null)}
                >
                    <div
                        className="w-full max-w-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="relative p-5 sm:p-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] flex items-start justify-between gap-4 shrink-0">
                            <div className="flex items-start gap-3.5">
                                <div className="size-14 sm:size-16 rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 shrink-0 bg-black">
                                    <PostMedia
                                        src={selectedJobModal.logo || ''}
                                        fallbackType="COMPANY_LOGO"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                            {selectedJobModal.company}
                                        </span>
                                        {(selectedJobModal.user_details?.verification_tier || (selectedJobModal as any).verified) && (
                                            <span className="material-symbols-outlined text-sm text-blue-500 filled" title="Verified Production House">
                                                verified
                                            </span>
                                        )}
                                        {selectedJobModal.isRss && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                Live RSS Sync
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-base sm:text-xl font-black text-zinc-900 dark:text-white leading-tight">
                                        {selectedJobModal.title}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                        {selectedJobModal.fraternityRole && (
                                            <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold border border-purple-500/20">
                                                {selectedJobModal.fraternityRole}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            {selectedJobModal.location}
                                        </span>
                                        <span>•</span>
                                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                                            {selectedJobModal.salary}
                                        </span>
                                        <span>•</span>
                                        <span>{selectedJobModal.type}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedJobModal(null)}
                                className="size-9 rounded-full bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-700 dark:text-white flex items-center justify-center transition-all shrink-0"
                                aria-label="Close"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                            <div>
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                                    Role & Production Details
                                </h3>
                                <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                                    {selectedJobModal.fullContent || selectedJobModal.description}
                                </div>
                            </div>

                            {selectedJobModal.requirements && (
                                <div>
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                                        Key Qualifications & Software / Gear
                                    </h3>
                                    <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                                        {selectedJobModal.requirements}
                                    </div>
                                </div>
                            )}

                            {(selectedJobModal.gender || selectedJobModal.ageRange || selectedJobModal.shootDate) && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl text-xs">
                                    {selectedJobModal.gender && (
                                        <div>
                                            <span className="text-zinc-400 block text-[10px] uppercase font-bold">Gender</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{selectedJobModal.gender}</span>
                                        </div>
                                    )}
                                    {selectedJobModal.ageRange && (
                                        <div>
                                            <span className="text-zinc-400 block text-[10px] uppercase font-bold">Age Group</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{selectedJobModal.ageRange}</span>
                                        </div>
                                    )}
                                    {selectedJobModal.shootDate && (
                                        <div>
                                            <span className="text-zinc-400 block text-[10px] uppercase font-bold">Shoot Schedule</span>
                                            <span className="font-bold text-zinc-900 dark:text-white">{selectedJobModal.shootDate}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedJobModal.deadline && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span className="material-symbols-outlined text-sm text-amber-500">event_available</span>
                                    <span>Application Deadline: <strong>{new Date(selectedJobModal.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                                </div>
                            )}

                            {/* In-Modal Casting & Opportunity Safety Alert */}
                            <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/[0.05] border border-amber-500/20 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                                        <span className="material-symbols-outlined text-sm">shield</span>
                                        <span>Safety & Anti-Fraud Notice</span>
                                    </div>
                                    <a
                                        href={`mailto:jobs@ifilmdirectory.com?subject=Job Safety Report: ${encodeURIComponent(selectedJobModal.title)} at ${encodeURIComponent(selectedJobModal.company)}`}
                                        className="text-[10px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1 hover:underline"
                                    >
                                        <span className="material-symbols-outlined text-xs">flag</span>
                                        <span>Report Listing</span>
                                    </a>
                                </div>
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    iFilmDirectory never charges fees for auditions or applications. Never pay anyone for roles, screen tests, or job processing. Legitimate productions never charge talent. Verify producer credentials before attending private auditions.
                                </p>
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] border-t border-amber-500/15">
                                    <span className="text-zinc-500 dark:text-zinc-400">Fraud Helpline:</span>
                                    <a href="mailto:jobs@ifilmdirectory.com" className="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                                        jobs@ifilmdirectory.com
                                    </a>
                                    <span className="text-zinc-400 dark:text-zinc-600">•</span>
                                    <a href="mailto:support@ifilmdirectory.com" className="text-zinc-600 dark:text-zinc-400 hover:text-amber-500">
                                        support@ifilmdirectory.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 bg-zinc-50 dark:bg-[#15171B] border-t border-zinc-200 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleShareJob(selectedJobModal, e)}
                                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all text-xs flex items-center gap-1 font-bold"
                                    title="Share Opportunity"
                                >
                                    <span className="material-symbols-outlined text-base">share</span>
                                    <span className="hidden sm:inline">Share</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const id = selectedJobModal.id;
                                        setSelectedJobModal(null);
                                        navigate(`/job/${id}`);
                                    }}
                                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all text-xs flex items-center gap-1 font-bold"
                                    title="Open Dedicated Page"
                                >
                                    <span className="material-symbols-outlined text-base">open_in_new</span>
                                    <span className="hidden sm:inline">Full Page</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {selectedJobModal.applicationEmail && (
                                    <a
                                        href={`mailto:${selectedJobModal.applicationEmail}?subject=${encodeURIComponent(`Application for ${selectedJobModal.title} - iFilmDirectory`)}&body=${encodeURIComponent(`Hi ${selectedJobModal.company} Team,\n\nI am writing to apply for the ${selectedJobModal.title} position on iFilmDirectory.\n\nPlease find my portfolio and credits attached.\n\nBest regards.`)}`}
                                        className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">mail</span>
                                        <span>Apply via Email</span>
                                    </a>
                                )}

                                {selectedJobModal.sourceUrl && (
                                    <button
                                        type="button"
                                        onClick={() => openSourcePopup(selectedJobModal.sourceUrl!, selectedJobModal.title)}
                                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-105 transition-all cursor-pointer"
                                    >
                                        <span className="text-white">Apply on Source</span>
                                        <span className="material-symbols-outlined text-sm text-white">launch</span>
                                    </button>
                                )}

                                {!selectedJobModal.sourceUrl && !selectedJobModal.applicationEmail && (
                                    <button
                                        onClick={() => {
                                            const id = selectedJobModal.id;
                                            setSelectedJobModal(null);
                                            navigate(`/job/${id}`);
                                        }}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-105 transition-all"
                                    >
                                        <span className="text-white">Apply in iFilm</span>
                                        <span className="material-symbols-outlined text-sm text-white">arrow_forward</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
