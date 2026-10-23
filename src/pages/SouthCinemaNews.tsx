import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import BreakingTicker from '../components/BreakingTicker';
import { rssNewsService, type NewsItem, type RSSFeedSource, type UpcomingMovieRelease } from '../services/rssNewsService';
import { generateText } from '../services/groqService';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';

export default function SouthCinemaNews() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const { isDarkMode, toggleDarkMode } = useTheme();

    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'all' | 'news' | 'review' | 'releases' | 'openings' | 'telugu' | 'tamil' | 'malayalam' | 'kannada'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
    const [expandedStories, setExpandedStories] = useState<{ [id: string]: string }>({});
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);

    // Feed management modal state
    const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
    const [feeds, setFeeds] = useState<RSSFeedSource[]>([]);
    const [newFeedName, setNewFeedName] = useState('');
    const [newFeedUrl, setNewFeedUrl] = useState('');
    const [newFeedIndustry, setNewFeedIndustry] = useState<RSSFeedSource['industry']>('telugu');

    // Auto expand short teaser articles into full journalistic reporting
    const expandStoryWithAI = async (article: NewsItem) => {
        if (expandedStories[article.id] || isGeneratingStory) return;
        setIsGeneratingStory(true);
        try {
            const prompt = `You are a professional film journalist for South Cinema Wire. Given the breaking news headline: "${article.title}" and summary: "${article.description}", write a detailed, comprehensive 3-paragraph news article in professional journalistic tone. Include context, industry significance, fan and audience reaction, and box office or release outlook. Do NOT use markdown headers or bullet points; write 3 clean, engaging paragraphs separated by double line breaks.`;
            const res = await generateText(prompt, 'South Indian Cinema News', 'English');
            if (res.text && res.text.length > 80) {
                setExpandedStories(prev => ({
                    ...prev,
                    [article.id]: res.text.trim()
                }));
            }
        } catch (err) {
            console.warn('AI story expansion error:', err);
        } finally {
            setIsGeneratingStory(false);
        }
    };

    useEffect(() => {
        if (selectedArticle) {
            const isShort = !selectedArticle.content || selectedArticle.content.length < 320 || selectedArticle.content.includes('[...]');
            if (isShort && !expandedStories[selectedArticle.id]) {
                expandStoryWithAI(selectedArticle);
            }
        }
    }, [selectedArticle]);

    // Deep-link direct article opener if URL has ?id=... or ?article=...
    useEffect(() => {
        const articleId = searchParams.get('id') || searchParams.get('article');
        if (articleId && news.length > 0) {
            const found = news.find(n => n.id === articleId);
            if (found) {
                setSelectedArticle(found);
            }
        }
    }, [searchParams, news]);

    useEffect(() => {
        let mounted = true;
        const loadNews = async () => {
            setIsLoading(true);
            try {
                const res = await rssNewsService.getNews(false);
                if (mounted) {
                    const sorted = [...res.items].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    setNews(sorted);
                    setLastSyncTime(res.lastSync);
                }
            } catch (err) {
                console.error('Failed to load RSS cinema news:', err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        loadNews();
        setFeeds(rssNewsService.getFeeds());

        // Auto-refresh interval check (every 15-20 mins)
        const autoInterval = setInterval(async () => {
            if (rssNewsService.isCacheStale()) {
                const res = await rssNewsService.getNews(true);
                if (mounted) {
                    const sorted = [...res.items].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    setNews(sorted);
                    setLastSyncTime(res.lastSync);
                }
            }
        }, 60 * 1000); // Check every minute if stale

        return () => {
            mounted = false;
            clearInterval(autoInterval);
        };
    }, []);

    const handleManualRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            const fresh = await rssNewsService.syncAllFeeds();
            const sorted = [...fresh].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setNews(sorted);
            setLastSyncTime(Date.now());
            showToast('News & reviews synchronized successfully!', 'success');
        } catch {
            showToast('Failed to refresh some feeds. Loaded cached news.', 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleAddCustomFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFeedUrl.trim() || !newFeedName.trim()) {
            showToast('Please enter both feed name and valid URL', 'error');
            return;
        }

        try {
            rssNewsService.addCustomFeed({
                name: newFeedName.trim(),
                url: newFeedUrl.trim(),
                industry: newFeedIndustry,
                enabled: true
            });
            setFeeds(rssNewsService.getFeeds());
            setNewFeedName('');
            setNewFeedUrl('');
            showToast('Custom RSS feed added! Syncing...', 'success');
            handleManualRefresh();
        } catch {
            showToast('Could not save custom feed.', 'error');
        }
    };

    const handleToggleFeed = (id: string, enabled: boolean) => {
        rssNewsService.toggleFeed(id, enabled);
        setFeeds(rssNewsService.getFeeds());
    };

    const handleRemoveFeed = (id: string) => {
        rssNewsService.removeFeed(id);
        setFeeds(rssNewsService.getFeeds());
        showToast('Feed removed.', 'info');
    };

    const handleResetFeeds = () => {
        rssNewsService.resetFeedsToDefault();
        setFeeds(rssNewsService.getFeeds());
        showToast('Reset to default South Indian cinema feeds.', 'info');
        handleManualRefresh();
    };

    const handleShare = async (item: NewsItem, e: React.MouseEvent) => {
        e.stopPropagation();
        const siteLink = `${window.location.origin}/south-cinema?id=${encodeURIComponent(item.id)}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: `${item.title} - Read on iFilmDirectory South Cinema Wire`,
                    url: siteLink
                });
            } catch {
                // User cancelled or share failed
            }
        } else {
            navigator.clipboard.writeText(siteLink);
            showToast('iFilmDirectory news link copied to clipboard!', 'success');
        }
    };

    /**
     * Opens original news article in a focused pop-up window over the current page.
     * When finished reading, the user can simply close the popup to return.
     */
    const openSourcePopup = (url: string, _title?: string) => {
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

    const upcomingReleases: UpcomingMovieRelease[] = rssNewsService.getUpcomingReleases();

    // Filter & sort news items (new news always strictly on top)
    const filteredNews = news
        .filter((item) => {
            // Tab filter
            if (activeTab === 'news' && item.category !== 'news') return false;
            if (activeTab === 'review' && item.category !== 'review') return false;
            if (activeTab === 'releases' && item.category !== 'release') return false;
            if (activeTab === 'openings' && item.category !== 'opening') return false;
            if (activeTab === 'telugu' && item.industry !== 'telugu') return false;
            if (activeTab === 'tamil' && item.industry !== 'tamil') return false;
            if (activeTab === 'malayalam' && item.industry !== 'malayalam') return false;
            if (activeTab === 'kannada' && item.industry !== 'kannada') return false;

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return item.title.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q) ||
                    item.source.toLowerCase().includes(q) ||
                    (item.releaseDate && item.releaseDate.toLowerCase().includes(q));
            }

            return true;
        })
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const reviewsCount = news.filter(n => n.category === 'review').length;
    const newsCount = news.filter(n => n.category === 'news').length;
    const releasesCount = news.filter(n => n.category === 'release').length;
    const openingsCount = news.filter(n => n.category === 'opening').length;

    const formatTimeAgo = (timestamp: number) => {
        if (!timestamp) return '';
        const diffMs = Date.now() - timestamp;
        if (diffMs < 0) return 'Recent Notice';
        const mins = Math.floor(diffMs / (60 * 1000));
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getIndustryBadge = (industry: NewsItem['industry']) => {
        switch (industry) {
            case 'telugu': return { label: 'Tollywood', color: 'text-white bg-red-600/90 border-red-500/40 shadow-xs' };
            case 'tamil': return { label: 'Kollywood', color: 'text-white bg-rose-600/90 border-rose-500/40 shadow-xs' };
            case 'malayalam': return { label: 'Mollywood', color: 'text-white bg-emerald-600/90 border-emerald-500/40 shadow-xs' };
            case 'kannada': return { label: 'Sandalwood', color: 'text-white bg-purple-600/90 border-purple-500/40 shadow-xs' };
            default: return { label: 'South Cinema', color: 'text-white bg-blue-600/90 border-blue-500/40 shadow-xs' };
        }
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-36 md:pb-24 overflow-x-hidden font-display transition-colors">
            <SEO
                title="South Cinema News & Industry Wire | Tollywood, Kollywood & Mollywood"
                description="Breaking news, production announcements, box office reports, and industry updates from South Indian cinema: Tollywood, Kollywood, Mollywood, and Sandalwood."
                keywords={[
                    'south cinema news',
                    'tollywood updates',
                    'telugu cinema news',
                    'kollywood tamil movies',
                    'mollywood malayalam film news',
                    'sandalwood kannada cinema',
                    'pan-india movies',
                    'box office india'
                ]}
            />
            <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 px-3 sm:px-6 lg:px-8">
                
                {/* Cinema Top Header (Unified Desktop & Mobile) */}
                <header className="sticky top-0 z-40 flex flex-col bg-white/90 dark:bg-[#090A0C]/90 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/[0.06] -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3.5 gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center gap-2 cursor-pointer select-none">
                                <button
                                    onClick={() => navigate('/home')}
                                    className="p-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                    title="Back to Home"
                                >
                                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                                </button>
                                <HamburgerMenu />
                                <Logo size="sm" showText={true} />
                            </div>

                            <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-zinc-200 dark:border-white/10">
                                <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg">newspaper</span>
                                </div>
                                <div>
                                    <h1 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                        <span>South Cinema Wire</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20">
                                            Live Wire
                                        </span>
                                    </h1>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        Tollywood • Kollywood • Mollywood • Sandalwood
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Top Actions: Theme toggle, Feed Manager & Manual Sync */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[11px] text-zinc-600 dark:text-zinc-400">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{lastSyncTime ? `Synced ${formatTimeAgo(lastSyncTime)}` : 'Connecting...'}</span>
                            </div>

                            <button
                                onClick={toggleDarkMode}
                                className="flex md:hidden size-9 sm:size-10 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 transition-all active:scale-95"
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                aria-label="Toggle theme"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>

                            <button
                                onClick={handleManualRefresh}
                                disabled={isRefreshing}
                                className="px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-400 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                                title="Refresh all cinema RSS feeds"
                            >
                                <span className={`material-symbols-outlined text-base ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
                                <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Wire'}</span>
                            </button>

                            <button
                                onClick={() => setIsFeedModalOpen(true)}
                                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                                title="Add / Configure RSS Feeds"
                            >
                                <span className="material-symbols-outlined text-base text-amber-500">tune</span>
                                <span className="hidden sm:inline">Feeds</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* 2. SUB-HERO BANNER FOR MOBILE & TABLETS */}
                <div className="lg:hidden mt-4 mb-2 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                                South Cinema Wire
                            </h2>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Breaking news, box office, pooja launches & verified reviews.
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] text-zinc-500 dark:text-zinc-400">
                        <span>{lastSyncTime ? `${formatTimeAgo(lastSyncTime)}` : 'Connecting...'}</span>
                    </div>
                </div>

                {/* 3. LIVE BREAKING TICKER */}
                <div className="mt-3">
                    <BreakingTicker variant="page" onItemClick={(item) => setSelectedArticle(item)} />
                </div>

                {/* 3.5 UPCOMING MOVIE RELEASES & GRAND OPENINGS SHOWCASE */}
                <div className="my-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.08] via-zinc-900/[0.02] to-red-500/[0.08] dark:from-amber-500/[0.08] dark:via-[#121316] dark:to-red-500/[0.08] border border-amber-500/20 dark:border-white/[0.08] shadow-sm">
                    <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-base">calendar_month</span>
                            </div>
                            <div>
                                <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <span>Upcoming Theatrical Releases & Grand Openings</span>
                                </h2>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Official countdown for high-budget South Indian tentpoles
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="hidden sm:inline-flex text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                2026–2027 Slate
                            </span>
                            <button
                                onClick={() => setActiveTab('releases')}
                                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-colors"
                            >
                                <span>View Calendar</span>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-1">
                        {upcomingReleases.map((movie) => (
                            <div
                                key={movie.id}
                                onClick={() => {
                                    setSearchQuery(movie.title);
                                }}
                                className="group shrink-0 w-56 sm:w-64 rounded-2xl bg-white dark:bg-[#141518] border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/50 p-3 transition-all cursor-pointer shadow-sm hover:shadow-xl flex flex-col justify-between hover:-translate-y-0.5"
                            >
                                <div className="space-y-2.5">
                                    <div className="aspect-[16/9] w-full rounded-xl overflow-hidden relative bg-black">
                                        <img
                                            src={movie.banner || movie.poster}
                                            alt={movie.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                                        <span className="absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-black/80 text-amber-400 backdrop-blur-md border border-amber-500/30">
                                            {movie.industry || movie.language}
                                        </span>
                                        <span className="absolute bottom-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-600 text-white backdrop-blur-md shadow-md border border-emerald-400/30 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[11px]">event</span>
                                            {movie.releaseDate}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-1">
                                            {movie.title}
                                        </h4>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                                            {movie.starring}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                                    <span className="text-zinc-400 font-medium truncate max-w-[140px]">Dir: {movie.director}</span>
                                    <span className="font-extrabold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                        Wire <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. SEARCH & FILTER SECTION */}
                <div className="space-y-3 mb-6">
                    {/* Search Bar */}
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Search film news, theatrical releases, Pooja launches, cast & stars, or verdicts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-10 pr-10 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs Carousel */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'all'
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08]'
                            }`}
                        >
                            All Stories ({news.length})
                        </button>

                        <button
                            onClick={() => setActiveTab('releases')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                                activeTab === 'releases'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">calendar_month</span>
                            Release Dates ({releasesCount})
                        </button>

                        <button
                            onClick={() => setActiveTab('openings')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                                activeTab === 'openings'
                                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">celebration</span>
                            Movie Openings ({openingsCount})
                        </button>

                        <button
                            onClick={() => setActiveTab('news')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                                activeTab === 'news'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">campaign</span>
                            Breaking News ({newsCount})
                        </button>

                        <button
                            onClick={() => setActiveTab('review')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                                activeTab === 'review'
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/50 shadow-md'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm filled text-amber-500">star</span>
                            Movie Reviews ({reviewsCount})
                        </button>

                        <button
                            onClick={() => setActiveTab('telugu')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'telugu'
                                    ? 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/50'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08]'
                            }`}
                        >
                            Tollywood (Telugu)
                        </button>

                        <button
                            onClick={() => setActiveTab('tamil')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'tamil'
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/50'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08]'
                            }`}
                        >
                            Kollywood (Tamil)
                        </button>

                        <button
                            onClick={() => setActiveTab('malayalam')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'malayalam'
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08]'
                            }`}
                        >
                            Mollywood (Malayalam)
                        </button>

                        <button
                            onClick={() => setActiveTab('kannada')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'kannada'
                                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/50'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08]'
                            }`}
                        >
                            Sandalwood (Kannada)
                        </button>
                    </div>
                </div>

                {/* 5. ARTICLES GRID */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 overflow-hidden p-4 space-y-3 animate-pulse">
                                <div className="aspect-video w-full bg-zinc-100 dark:bg-white/5 rounded-xl" />
                                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-white/10 rounded" />
                                <div className="h-3 w-1/2 bg-zinc-100 dark:bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                ) : filteredNews.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 p-12 text-center space-y-3 my-6 shadow-sm dark:shadow-none">
                        <div className="size-14 mx-auto rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500">
                            <span className="material-symbols-outlined text-2xl">newspaper</span>
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">No stories match your filter</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                            Try searching for different keywords or select "All Stories" to view recent coverage.
                        </p>
                        <button
                            onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold mt-2 hover:bg-amber-400 transition-all shadow-xs"
                        >
                            Show All Stories
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {filteredNews.map((item) => {
                            const badge = getIndustryBadge(item.industry);
                            const isReview = item.category === 'review';

                            return (
                                <article
                                    key={item.id}
                                    onClick={() => setSelectedArticle(item)}
                                    className="group rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/50 dark:hover:border-amber-500/40 transition-all overflow-hidden flex flex-col cursor-pointer shadow-sm hover:shadow-xl dark:shadow-md dark:hover:shadow-2xl hover:-translate-y-1"
                                >
                                    {/* Thumbnail Image Header */}
                                    <div className="aspect-[16/9] w-full relative overflow-hidden bg-black">
                                        <img
                                            src={item.thumbnail}
                                            alt={item.title}
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                const fallbacks = [
                                                    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop',
                                                    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=450&fit=crop',
                                                    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
                                                    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop',
                                                    'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=450&fit=crop'
                                                ];
                                                (e.target as HTMLImageElement).src = fallbacks[Math.abs(item.title.length) % fallbacks.length];
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

                                        {/* Industry & Category Badges */}
                                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border backdrop-blur-md shadow-xs ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                            {isReview && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500 text-white shadow-md flex items-center gap-0.5 border border-amber-400/30">
                                                    <span className="material-symbols-outlined text-[11px] filled text-white">star</span>
                                                    <span>{item.rating || 'REVIEW'}</span>
                                                </span>
                                            )}
                                            {(item.category === 'release' || item.releaseDate) && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-600 text-white shadow-md flex items-center gap-0.5 border border-emerald-400/30">
                                                    <span className="material-symbols-outlined text-[11px]">calendar_month</span>
                                                    <span>{item.releaseDate ? item.releaseDate : 'RELEASE'}</span>
                                                </span>
                                            )}
                                            {item.category === 'opening' && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md flex items-center gap-0.5 border border-amber-400/30">
                                                    <span className="material-symbols-outlined text-[11px]">celebration</span>
                                                    <span>{item.openingType === 'pooja_launch' ? 'Pooja Launch' : item.openingType === 'fdfs_boxoffice' ? 'FDFS Box Office' : 'Movie Opening'}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Source Tag */}
                                        <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/20 text-[10px] font-bold text-white max-w-[130px] truncate shadow-xs">
                                            {item.source}
                                        </div>

                                        {/* Time badge at bottom */}
                                        <div className="absolute bottom-2 right-2.5 text-[10px] font-bold text-white/95 bg-black/80 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10">
                                            {formatTimeAgo(item.timestamp)}
                                        </div>
                                    </div>

                                    {/* Content Body */}
                                    <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                                        <div className="space-y-2.5">
                                            {item.releaseDate && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 w-fit">
                                                    <span className="material-symbols-outlined text-xs text-emerald-500">event</span>
                                                    <span>Theatrical Release: <strong className="text-emerald-600 dark:text-emerald-400">{item.releaseDate}</strong></span>
                                                </div>
                                            )}
                                            {item.category === 'opening' && !item.releaseDate && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 w-fit">
                                                    <span className="material-symbols-outlined text-xs text-amber-500">celebration</span>
                                                    <span>{item.openingType === 'pooja_launch' ? 'Grand Pooja & Shoot Launch' : item.openingType === 'fdfs_boxoffice' ? 'FDFS Opening Day Box Office' : 'Grand Theatrical Opening'}</span>
                                                </div>
                                            )}

                                            <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors leading-snug">
                                                {item.title}
                                            </h3>

                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3 font-normal">
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Card Footer with Open Source Pop-Up and Reader */}
                                        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openSourcePopup(item.link, item.title);
                                                }}
                                                className="text-[11px] font-extrabold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                                                title="Open original news in pop-up window"
                                            >
                                                <span>Source</span>
                                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                            </button>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedArticle(item);
                                                    }}
                                                    className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.05] hover:bg-amber-500/10 border border-zinc-200 dark:border-white/[0.06]"
                                                    title="Open full reader preview"
                                                >
                                                    <span className="material-symbols-outlined text-xs">article</span>
                                                    <span>Reader</span>
                                                </button>

                                                <button
                                                    onClick={(e) => handleShare(item, e)}
                                                    className="size-8 rounded-lg bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors border border-zinc-200 dark:border-white/[0.06]"
                                                    title="Share story"
                                                >
                                                    <span className="material-symbols-outlined text-sm">share</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* EDITORIAL & REVIEW SYNDICATION DISCLAIMER */}
                <div className="mt-10 rounded-2xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 p-5 sm:p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl">policy</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span>Editorial & Movie Review Syndication Notice — South Cinema Wire</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    Fair Use
                                </span>
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                iFilmDirectory curates film entertainment news, trade reports, and critical reviews for discovery, educational commentary, and media research.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        <div className="p-3.5 rounded-xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                                <span className="material-symbols-outlined text-sm">copyright</span>
                                <span>Intellectual Property & Attribution</span>
                            </div>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                All headlines, original article extracts, publisher logos, and trademarks belong to their respective publications (The Hindu, Times of India, Cinema Express, Film Companion, 123Telugu, etc.). We always link directly to original publications.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined text-sm">rate_review</span>
                                <span>Independent Review Opinions</span>
                            </div>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                Film reviews, ratings, and critical verdicts expressed in aggregated articles represent solely the perspectives of the originating journalists and publications, not iFilmDirectory or 5M Collective Services.
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-[11px]">
                            <span className="material-symbols-outlined text-sm text-amber-500">mail</span>
                            <span>Editorial inquiries, corrections, or syndication queries:</span>
                            <a
                                href="mailto:editorial@ifilmdirectory.com?subject=Editorial%20Correction%20or%20Syndication%20Notice%20-%20South%20Cinema%20Wire"
                                className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
                            >
                                editorial@ifilmdirectory.com
                            </a>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                            <a href="mailto:contact@ifilmdirectory.com" className="hover:text-amber-500 transition-colors">
                                Corporate Desk
                            </a>
                            <span>•</span>
                            <span onClick={() => navigate('/terms')} className="hover:text-amber-500 cursor-pointer transition-colors">
                                Terms of Use
                            </span>
                            <span>•</span>
                            <span onClick={() => navigate('/privacy')} className="hover:text-amber-500 cursor-pointer transition-colors">
                                Privacy Policy
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. FULL ARTICLE READER MODAL */}
            {selectedArticle && (
                <div
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedArticle(null)}
                >
                    <div
                        className="w-full max-w-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header Image */}
                        <div className="aspect-[16/9] sm:aspect-[21/9] w-full relative overflow-hidden bg-black shrink-0">
                            <img
                                src={selectedArticle.thumbnail}
                                alt={selectedArticle.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const fallbacks = [
                                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=600&fit=crop',
                                        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&h=600&fit=crop',
                                        'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=600&fit=crop',
                                        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=600&fit=crop'
                                    ];
                                    (e.target as HTMLImageElement).src = fallbacks[Math.abs(selectedArticle.title.length) % fallbacks.length];
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/60 pointer-events-none" />
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="absolute top-3.5 right-3.5 size-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105 z-10"
                                aria-label="Close reader"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>

                            <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-xs">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-amber-400 border border-amber-500/30">
                                    {selectedArticle.industry}
                                </span>
                                <span className="text-white font-bold bg-black/80 px-2.5 py-0.5 rounded-md backdrop-blur-md text-[11px] border border-white/10">
                                    {selectedArticle.source} • {formatTimeAgo(selectedArticle.timestamp)}
                                </span>
                            </div>
                        </div>

                        {/* Modal Full Article Scrollable Body */}
                        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                            {selectedArticle.category === 'review' && (
                                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-500 filled">star</span>
                                        <span className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-wider">
                                            Film Review & Verdict
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-white bg-amber-500 px-3 py-0.5 rounded-lg shadow-xs">
                                        {selectedArticle.rating || '★ RATED'}
                                    </span>
                                </div>
                            )}

                            {selectedArticle.releaseDate && (
                                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-emerald-500">calendar_month</span>
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                            Theatrical Release Date
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-white bg-emerald-600 px-3 py-1 rounded-xl shadow-xs">
                                        {selectedArticle.releaseDate}
                                    </span>
                                </div>
                            )}

                            {selectedArticle.category === 'opening' && !selectedArticle.releaseDate && (
                                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-500">celebration</span>
                                        <span className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-wider">
                                            {selectedArticle.openingType === 'pooja_launch' ? 'Grand Pooja Ceremony & Shoot Launch' : selectedArticle.openingType === 'fdfs_boxoffice' ? 'FDFS Theatrical Opening Day Box Office' : 'Grand Theatrical Opening'}
                                        </span>
                                    </div>
                                    <span className="text-xs font-black text-white bg-amber-500 px-2.5 py-1 rounded-xl">
                                        EXCLUSIVE
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-base sm:text-xl font-black text-zinc-900 dark:text-white leading-snug">
                                    {selectedArticle.title}
                                </h2>
                                {!isGeneratingStory && !expandedStories[selectedArticle.id] && (
                                    <button
                                        onClick={() => expandStoryWithAI(selectedArticle)}
                                        className="shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                                        title="Enhance article into full journalistic report"
                                    >
                                        <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                        <span>Full Report</span>
                                    </button>
                                )}
                            </div>

                            {/* Complete Full Story Content */}
                            {isGeneratingStory && !expandedStories[selectedArticle.id] ? (
                                <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-white/5 animate-pulse">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-500 pb-1">
                                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                        <span>Synthesizing full journalistic report...</span>
                                    </div>
                                    <div className="h-3.5 bg-zinc-200 dark:bg-white/10 rounded-md w-full" />
                                    <div className="h-3.5 bg-zinc-200 dark:bg-white/10 rounded-md w-5/6" />
                                    <div className="h-3.5 bg-zinc-200 dark:bg-white/10 rounded-md w-4/6" />
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-2 leading-relaxed italic">
                                        {selectedArticle.content || selectedArticle.description}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed space-y-3.5 pt-3 border-t border-zinc-200 dark:border-white/5 font-normal">
                                    {((expandedStories[selectedArticle.id] || selectedArticle.content || selectedArticle.description) || '')
                                        .split('\n\n')
                                        .filter(Boolean)
                                        .map((para, i) => (
                                            <p key={i} className="leading-relaxed">{para.trim()}</p>
                                        ))}
                                    {/* Modal Editorial Attribution */}
                                    <div className="mt-4 py-2 px-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-500/[0.04] border border-amber-200/70 dark:border-amber-500/20 flex items-center justify-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 text-center">
                                        <span className="material-symbols-outlined text-xs text-amber-500 shrink-0">verified_user</span>
                                        <span className="truncate">Aggregated under fair use • Excerpts & copyright belong exclusively to {selectedArticle.source}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-[#0e0f12] border-t border-zinc-200 dark:border-white/[0.08] flex items-center gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => openSourcePopup(selectedArticle.link, selectedArticle.title)}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                                title="Open original news in a pop-up window"
                            >
                                <span className="material-symbols-outlined text-base">open_in_new</span>
                                <span>Read Original Source on {selectedArticle.source}</span>
                            </button>

                            <button
                                onClick={(e) => handleShare(selectedArticle, e)}
                                className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08] transition-all shadow-xs"
                                title="Share"
                            >
                                <span className="material-symbols-outlined text-base sm:text-lg">share</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. MANAGE RSS FEEDS MODAL */}
            {isFeedModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsFeedModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg">rss_feed</span>
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-zinc-900 dark:text-white">Manage Cinema Feeds</h2>
                                    <p className="text-[11px] text-zinc-500">Configure active RSS sources & add custom industry wires</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsFeedModalOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Add Custom Feed Form */}
                        <form onSubmit={handleAddCustomFeed} className="space-y-3 bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-2xl border border-zinc-200 dark:border-white/[0.06]">
                            <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Add Custom RSS Feed Link
                            </h3>
                            <div className="space-y-2.5">
                                <input
                                    type="text"
                                    placeholder="Feed Name (e.g. 123Telugu, Behindwoods)"
                                    value={newFeedName}
                                    onChange={(e) => setNewFeedName(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
                                />
                                <input
                                    type="url"
                                    placeholder="RSS Feed URL (e.g. https://domain.com/feed)"
                                    value={newFeedUrl}
                                    onChange={(e) => setNewFeedUrl(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
                                />
                                <div className="flex items-center gap-2">
                                    <select
                                        value={newFeedIndustry}
                                        onChange={(e) => setNewFeedIndustry(e.target.value as any)}
                                        className="h-10 px-3 rounded-xl bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 flex-1"
                                    >
                                        <option value="telugu">Tollywood (Telugu)</option>
                                        <option value="tamil">Kollywood (Tamil)</option>
                                        <option value="malayalam">Mollywood (Malayalam)</option>
                                        <option value="kannada">Sandalwood (Kannada)</option>
                                        <option value="south">South Cinema (All)</option>
                                    </select>
                                    <button
                                        type="submit"
                                        className="h-10 px-4 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all shrink-0 active:scale-95 shadow-sm"
                                    >
                                        Add Feed
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Configured Feeds List */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Active Feed Sources ({feeds.length})
                                </h3>
                                <button
                                    onClick={handleResetFeeds}
                                    className="text-[11px] font-bold text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                                >
                                    Reset to Defaults
                                </button>
                            </div>

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {feeds.map((f) => (
                                    <div
                                        key={f.id}
                                        className="p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{f.name}</span>
                                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-white/5 text-zinc-700 dark:text-zinc-400 font-bold">
                                                    {f.industry}
                                                </span>
                                                {f.isCustom && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{f.url}</p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleToggleFeed(f.id, !f.enabled)}
                                                className={`size-7 rounded-lg flex items-center justify-center text-xs transition-colors ${
                                                    f.enabled ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                                                }`}
                                                title={f.enabled ? 'Disable' : 'Enable'}
                                            >
                                                <span className="material-symbols-outlined text-sm font-bold">
                                                    {f.enabled ? 'check' : 'close'}
                                                </span>
                                            </button>

                                            {f.isCustom && (
                                                <button
                                                    onClick={() => handleRemoveFeed(f.id)}
                                                    className="size-7 rounded-lg bg-red-500/20 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setIsFeedModalOpen(false)}
                                className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-black text-xs hover:bg-amber-400 transition-all shadow-md active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
