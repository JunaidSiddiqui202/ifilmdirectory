import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import BreakingTicker from '../components/BreakingTicker';
import { rssNewsService, type NewsItem, type RSSFeedSource } from '../services/rssNewsService';
import { generateText } from '../services/groqService';
import { useToast } from '../context/ToastContext';

export default function SouthCinemaNews() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();

    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'all' | 'news' | 'review' | 'telugu' | 'tamil' | 'malayalam' | 'kannada'>('all');
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

    // Filter & sort news items (new news always strictly on top)
    const filteredNews = news
        .filter((item) => {
            // Tab filter
            if (activeTab === 'news' && item.category !== 'news') return false;
            if (activeTab === 'review' && item.category !== 'review') return false;
            if (activeTab === 'telugu' && item.industry !== 'telugu') return false;
            if (activeTab === 'tamil' && item.industry !== 'tamil') return false;
            if (activeTab === 'malayalam' && item.industry !== 'malayalam') return false;
            if (activeTab === 'kannada' && item.industry !== 'kannada') return false;

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return item.title.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q) ||
                    item.source.toLowerCase().includes(q);
            }

            return true;
        })
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const reviewsCount = news.filter(n => n.category === 'review').length;
    const newsCount = news.filter(n => n.category === 'news').length;

    const formatTimeAgo = (timestamp: number) => {
        const diffMs = Date.now() - timestamp;
        const mins = Math.floor(diffMs / (60 * 1000));
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
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
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex flex-col flex-1 px-4 sm:px-6">
                
                {/* 1. TOP HEADER (Mobile) */}
                <header className="md:hidden sticky top-0 z-30 flex items-center justify-between py-3.5 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleManualRefresh}
                            className={`p-2 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all ${isRefreshing ? 'animate-spin text-amber-500' : ''}`}
                            title="Refresh Feeds"
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                        </button>
                        <button
                            onClick={() => setIsFeedModalOpen(true)}
                            className="p-2 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-all"
                            title="Manage RSS Feeds"
                        >
                            <span className="material-symbols-outlined text-xl">rss_feed</span>
                        </button>
                    </div>
                </header>

                {/* 2. PAGE TITLE & STATUS BANNER */}
                <div className="mt-4 sm:mt-6 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                South Cinema Wire
                            </h1>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Live Tollywood, Kollywood, Mollywood & Sandalwood breaking updates, box office & reviews.
                        </p>
                    </div>

                    {/* Sync telemetry & action buttons */}
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 text-[11px] text-zinc-600 dark:text-zinc-400 shadow-xs dark:shadow-none">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span>
                                {lastSyncTime ? `Synced ${formatTimeAgo(lastSyncTime)}` : 'Connecting...'}
                            </span>
                            <span className="text-zinc-400 dark:text-zinc-600">• Auto 15m</span>
                        </div>

                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-400 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 shadow-xs"
                        >
                            <span className={`material-symbols-outlined text-sm ${isRefreshing ? 'animate-spin' : ''}`}>sync</span>
                            <span className="hidden xs:inline">Refresh</span>
                        </button>

                        <button
                            onClick={() => setIsFeedModalOpen(true)}
                            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 hover:border-amber-500/30 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-xs dark:shadow-none"
                            title="Add / Configure Feeds"
                        >
                            <span className="material-symbols-outlined text-base text-amber-500">tune</span>
                            <span className="hidden sm:inline">Feeds</span>
                        </button>
                    </div>
                </div>

                {/* 3. LIVE BREAKING TICKER */}
                <BreakingTicker variant="page" onItemClick={(item) => setSelectedArticle(item)} />

                {/* 4. SEARCH & FILTER SECTION */}
                <div className="space-y-3 mb-6">
                    {/* Search Bar */}
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Search stars, films, reviews or breaking headlines..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-10 pr-10 rounded-xl bg-white dark:bg-[#121316] border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors shadow-xs dark:shadow-none"
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
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'all'
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5'
                            }`}
                        >
                            All Stories ({news.length})
                        </button>

                        <button
                            onClick={() => setActiveTab('news')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                                activeTab === 'news'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">campaign</span>
                            Breaking News ({newsCount})
                        </button>

                        <button
                            onClick={() => setActiveTab('review')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                                activeTab === 'review'
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/50 shadow-md'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm filled text-amber-500">star</span>
                            Movie Reviews ({reviewsCount})
                        </button>

                        <button
                            onClick={() => setActiveTab('telugu')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'telugu'
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/50'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5'
                            }`}
                        >
                            Tollywood (Telugu)
                        </button>

                        <button
                            onClick={() => setActiveTab('tamil')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'tamil'
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/50'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5'
                            }`}
                        >
                            Kollywood (Tamil)
                        </button>

                        <button
                            onClick={() => setActiveTab('malayalam')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'malayalam'
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5'
                            }`}
                        >
                            Mollywood (Malayalam)
                        </button>

                        <button
                            onClick={() => setActiveTab('kannada')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                                activeTab === 'kannada'
                                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/50'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5'
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
                                    className="group rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 hover:border-amber-500/40 transition-all overflow-hidden flex flex-col cursor-pointer shadow-sm hover:shadow-lg dark:shadow-md dark:hover:shadow-xl hover:-translate-y-0.5"
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
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                                        {/* Industry & Category Badges */}
                                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border backdrop-blur-md ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                            {isReview && (
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500 text-white shadow-md flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[10px] filled text-white">star</span>
                                                    <span>{item.rating || 'REVIEW'}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Source Tag */}
                                        <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/20 text-[10px] font-semibold text-white max-w-[130px] truncate">
                                            {item.source}
                                        </div>

                                        {/* Time badge at bottom */}
                                        <div className="absolute bottom-2 right-2.5 text-[10px] font-medium text-white/90 bg-black/75 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                            {formatTimeAgo(item.timestamp)}
                                        </div>
                                    </div>

                                    {/* Content Body */}
                                    <div className="p-4 flex flex-col flex-1 justify-between">
                                        <div className="space-y-2.5">
                                            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors leading-snug">
                                                {item.title}
                                            </h3>

                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                                                {item.description}
                                            </p>
                                        </div>

                                        {/* Card Footer with Open Source Pop-Up and Reader */}
                                        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openSourcePopup(item.link, item.title);
                                                }}
                                                className="text-[11px] font-extrabold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                                                title="Open original news in pop-up window"
                                            >
                                                <span>Open Source</span>
                                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedArticle(item);
                                                    }}
                                                    className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-white/5"
                                                    title="Open reader preview"
                                                >
                                                    <span>Reader</span>
                                                    <span className="material-symbols-outlined text-xs">fullscreen</span>
                                                </button>

                                                <button
                                                    onClick={(e) => handleShare(item, e)}
                                                    className="size-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors"
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
                    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedArticle(null)}
                >
                    <div
                        className="w-full max-w-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="absolute top-3 right-3 size-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all hover:scale-105 z-10"
                                aria-label="Close reader"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>

                            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-amber-400 border border-amber-500/30">
                                    {selectedArticle.industry}
                                </span>
                                <span className="text-white font-medium bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-md text-[11px]">
                                    {selectedArticle.source} • {formatTimeAgo(selectedArticle.timestamp)}
                                </span>
                            </div>
                        </div>

                        {/* Modal Full Article Scrollable Body */}
                        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                            {selectedArticle.category === 'review' && (
                                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-500 filled">star</span>
                                        <span className="text-xs font-black text-amber-600 dark:text-amber-300 uppercase tracking-wider">
                                            Film Review & Verdict
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-white bg-amber-500 px-2.5 py-0.5 rounded-lg">
                                        {selectedArticle.rating || '★ RATED'}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white leading-snug">
                                    {selectedArticle.title}
                                </h2>
                                {!isGeneratingStory && !expandedStories[selectedArticle.id] && (
                                    <button
                                        onClick={() => expandStoryWithAI(selectedArticle)}
                                        className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                                        title="Enhance article into full report"
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
                                <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed space-y-3 pt-3 border-t border-zinc-200 dark:border-white/5 font-normal">
                                    {((expandedStories[selectedArticle.id] || selectedArticle.content || selectedArticle.description) || '')
                                        .split('\n\n')
                                        .filter(Boolean)
                                        .map((para, i) => (
                                            <p key={i} className="leading-relaxed">{para.trim()}</p>
                                        ))}
                                    {/* Modal Editorial Attribution & Contact Disclaimer */}
                                    <div className="mt-5 p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-400/[0.04] border border-amber-500/20 text-xs space-y-2">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                                            <span className="material-symbols-outlined text-sm">verified_user</span>
                                            <span>Editorial & Review Attribution</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            Aggregated under fair use and public RSS syndication for cinema industry discovery. All trademarks, excerpts, headlines, and copyright belong exclusively to the source publisher ({selectedArticle.source}). Movie reviews reflect independent opinions of respective film critics.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] border-t border-amber-500/15">
                                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Corrections & Grievances:</span>
                                            <a
                                                href={`mailto:editorial@ifilmdirectory.com?subject=Editorial Inquiry: ${encodeURIComponent(selectedArticle.title)}`}
                                                className="text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-xs">mail</span>
                                                editorial@ifilmdirectory.com
                                            </a>
                                            <span className="text-zinc-400 dark:text-zinc-600">•</span>
                                            <a
                                                href="mailto:contact@ifilmdirectory.com"
                                                className="text-zinc-600 dark:text-zinc-400 hover:text-amber-500 inline-flex items-center gap-1"
                                            >
                                                contact@ifilmdirectory.com
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-[#0e0f12] border-t border-zinc-200 dark:border-white/10 flex items-center gap-3 shrink-0">
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
                                className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 transition-all shadow-xs"
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
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsFeedModalOpen(false)}
                >
                    <div
                        className="w-full max-w-lg bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">rss_feed</span>
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white">Manage Cinema RSS Feeds</h2>
                            </div>
                            <button
                                onClick={() => setIsFeedModalOpen(false)}
                                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Add Custom Feed Form */}
                        <form onSubmit={handleAddCustomFeed} className="space-y-3 bg-zinc-50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-zinc-200 dark:border-white/5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Add Custom RSS Feed Link
                            </h3>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Feed Name (e.g. 123Telugu, Behindwoods)"
                                    value={newFeedName}
                                    onChange={(e) => setNewFeedName(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
                                />
                                <input
                                    type="url"
                                    placeholder="RSS Feed URL (e.g. https://domain.com/feed)"
                                    value={newFeedUrl}
                                    onChange={(e) => setNewFeedUrl(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
                                />
                                <div className="flex items-center gap-2">
                                    <select
                                        value={newFeedIndustry}
                                        onChange={(e) => setNewFeedIndustry(e.target.value as any)}
                                        className="h-10 px-3 rounded-lg bg-white dark:bg-black/40 border border-zinc-300 dark:border-white/10 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 flex-1"
                                    >
                                        <option value="telugu">Tollywood (Telugu)</option>
                                        <option value="tamil">Kollywood (Tamil)</option>
                                        <option value="malayalam">Mollywood (Malayalam)</option>
                                        <option value="kannada">Sandalwood (Kannada)</option>
                                        <option value="south">South Cinema (All)</option>
                                    </select>
                                    <button
                                        type="submit"
                                        className="h-10 px-4 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all shrink-0"
                                    >
                                        Add Feed
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Configured Feeds List */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Active Feed Sources ({feeds.length})
                                </h3>
                                <button
                                    onClick={handleResetFeeds}
                                    className="text-[11px] text-zinc-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                                >
                                    Reset to Defaults
                                </button>
                            </div>

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {feeds.map((f) => (
                                    <div
                                        key={f.id}
                                        className="p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">{f.name}</span>
                                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-white/5 text-zinc-700 dark:text-zinc-400">
                                                    {f.industry}
                                                </span>
                                                {f.isCustom && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{f.url}</p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleToggleFeed(f.id, !f.enabled)}
                                                className={`size-6 rounded-md flex items-center justify-center text-xs transition-colors ${
                                                    f.enabled ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                                                }`}
                                                title={f.enabled ? 'Disable' : 'Enable'}
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {f.enabled ? 'check' : 'close'}
                                                </span>
                                            </button>

                                            {f.isCustom && (
                                                <button
                                                    onClick={() => handleRemoveFeed(f.id)}
                                                    className="size-6 rounded-md bg-red-500/20 text-red-500 dark:text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-colors"
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
                                className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-400 transition-all"
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
