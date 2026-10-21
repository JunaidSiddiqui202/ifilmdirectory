import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { jobService, type Job } from '../services/jobService';
import { getAllUsers, type UserProfile } from '../services/userService';
import { blogService, type BlogPost } from '../services/blogService';
import { facilityService, type Facility } from '../services/facilityService';
import { getPosts, type PostData } from '../services/postService';
import { rssNewsService, type NewsItem } from '../services/rssNewsService';
import EmptyState from '../components/EmptyState';
import PostMedia from '../components/PostMedia';

type TabType = 'all' | 'people' | 'studios' | 'feed' | 'news' | 'jobs' | 'blogs' | 'nearme';

interface SearchPrediction {
    id: string;
    type: 'people' | 'studio' | 'feed' | 'news' | 'job' | 'blog' | 'keyword';
    title: string;
    subtitle?: string;
    badge: string;
    badgeColor: string;
    icon: string;
    image?: string;
    fallbackType?: 'USER_MALE' | 'COMPANY_LOGO' | 'FILM_SET' | 'CINEMA_HALL';
    action: () => void;
}

interface SearchResultsState {
    people: UserProfile[];
    studios: Facility[];
    feed: PostData[];
    news: NewsItem[];
    jobs: Job[];
    blogs: BlogPost[];
}

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [results, setResults] = useState<SearchResultsState>({
        people: [],
        studios: [],
        feed: [],
        news: [],
        jobs: [],
        blogs: []
    });
    const [searchMessage, setSearchMessage] = useState('');
    const [predictions, setPredictions] = useState<SearchPrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyUsers, setNearbyUsers] = useState<UserProfile[]>([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsItem | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cache datasets across keystrokes so predictions are instant (<10ms)
    const datasetsRef = useRef<{
        users: UserProfile[];
        studios: Facility[];
        feed: PostData[];
        news: NewsItem[];
        jobs: Job[];
        blogs: BlogPost[];
        loaded: boolean;
    }>({
        users: [],
        studios: [],
        feed: [],
        news: [],
        jobs: [],
        blogs: [],
        loaded: false
    });

    // Helper: calculate Levenshtein distance for fuzzy matching
    const levenshteinDistance = (str1: string, str2: string): number => {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix: number[][] = [];

        for (let i = 0; i <= len1; i++) matrix[i] = [i];
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[len1][len2];
    };

    // Fuzzy match helper
    const fuzzyMatch = (text: string, q: string): boolean => {
        if (!text || !q) return false;
        const textLower = text.toLowerCase();
        const qLower = q.toLowerCase();

        if (textLower.includes(qLower)) return true;
        if (qLower.length < 3) return false;

        const words = textLower.split(/\s+/);
        for (const word of words) {
            const maxDistance = word.length <= 6 ? 1 : 2;
            if (levenshteinDistance(word, qLower) <= maxDistance) return true;
            if (word.includes(qLower)) return true;
        }
        return false;
    };

    // Pre-fetch all datasets into ref for instant searching & predictions
    const loadAllDatasets = async () => {
        if (datasetsRef.current.loaded) return datasetsRef.current;
        try {
            const [users, studios, feed, newsRes, jobs, blogs] = await Promise.all([
                getAllUsers().catch(() => []),
                facilityService.getFacilities().catch(() => []),
                getPosts(40).catch(() => []),
                rssNewsService.getNews().catch(() => ({ items: rssNewsService.getCachedNews(), lastSync: 0, isStale: false })),
                jobService.getJobs().catch(() => []),
                blogService.getBlogs().catch(() => [])
            ]);

            datasetsRef.current = {
                users,
                studios,
                feed,
                news: newsRes.items || [],
                jobs,
                blogs,
                loaded: true
            };
        } catch (err) {
            console.error("Error loading search datasets:", err);
        }
        return datasetsRef.current;
    };

    useEffect(() => {
        loadAllDatasets();
    }, []);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null && q !== query) {
            setQuery(q);
        }
    }, [searchParams]);

    // Format news relative time
    const formatNewsTime = (timestamp: number) => {
        if (!timestamp) return '';
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    // 1. GENERATE INSTANT SEARCH PREDICTIONS ACROSS ALL ENTITIES
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed || trimmed.length < 2) {
            setPredictions([]);
            setShowPredictions(false);
            return;
        }

        const buildPredictions = async () => {
            const datasets = await loadAllDatasets();
            const lowerQuery = trimmed.toLowerCase();
            const matches: SearchPrediction[] = [];

            // 1. Users / Talent Predictions
            for (const user of datasets.users) {
                if (matches.length >= 10) break;
                const name = user.displayName || user.username || '';
                const role = user.role || 'Filmmaker';
                if (
                    name.toLowerCase().includes(lowerQuery) ||
                    role.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(name, trimmed)
                ) {
                    matches.push({
                        id: `user-${user.uid}`,
                        type: 'people',
                        title: name || 'Creator',
                        subtitle: `${role}${user.location ? ` • ${user.location}` : ''}`,
                        badge: 'Talent',
                        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20',
                        icon: 'person',
                        image: user.photoURL || undefined,
                        fallbackType: 'USER_MALE',
                        action: () => {
                            setShowPredictions(false);
                            navigate(`/profile/${user.uid}`);
                        }
                    });
                }
            }

            // 2. Studio & Facilities Predictions
            for (const studio of datasets.studios) {
                if (matches.length >= 10) break;
                if (
                    studio.name.toLowerCase().includes(lowerQuery) ||
                    studio.type.toLowerCase().includes(lowerQuery) ||
                    (studio.location && studio.location.toLowerCase().includes(lowerQuery)) ||
                    fuzzyMatch(studio.name, trimmed)
                ) {
                    matches.push({
                        id: `studio-${studio.id}`,
                        type: 'studio',
                        title: studio.name,
                        subtitle: `${studio.type} • ${studio.location || 'India'}`,
                        badge: studio.type === 'Studio' ? 'Studio' : (studio.type === 'Equipment' ? 'Gear' : 'Facility'),
                        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20',
                        icon: 'domain',
                        image: studio.image,
                        fallbackType: 'FILM_SET',
                        action: () => {
                            setShowPredictions(false);
                            navigate(`/booking/details/${studio.id}`);
                        }
                    });
                }
            }

            // 3. Cinema News & Reviews Predictions
            for (const item of datasets.news) {
                if (matches.length >= 10) break;
                if (
                    item.title.toLowerCase().includes(lowerQuery) ||
                    (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
                    item.source.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(item.title, trimmed)
                ) {
                    const isReview = item.category === 'review' || !!item.rating;
                    matches.push({
                        id: `news-${item.id}`,
                        type: 'news',
                        title: item.title,
                        subtitle: `${item.source} • ${formatNewsTime(item.timestamp)}`,
                        badge: isReview ? (item.rating ? `★ ${item.rating}` : 'Review') : 'Cinema Wire',
                        badgeColor: isReview
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                        icon: 'newspaper',
                        image: item.thumbnail,
                        fallbackType: 'CINEMA_HALL',
                        action: () => {
                            setShowPredictions(false);
                            setSelectedNewsArticle(item);
                        }
                    });
                }
            }

            // 4. Feed & Community Posts Predictions
            for (const post of datasets.feed) {
                if (matches.length >= 10) break;
                if (
                    (post.content && post.content.toLowerCase().includes(lowerQuery)) ||
                    (post.author && post.author.toLowerCase().includes(lowerQuery)) ||
                    fuzzyMatch(post.content || '', trimmed)
                ) {
                    matches.push({
                        id: `post-${post.id || Math.random()}`,
                        type: 'feed',
                        title: post.content ? (post.content.length > 60 ? post.content.slice(0, 60) + '...' : post.content) : 'Filmmaker Post',
                        subtitle: `By ${post.author || 'Creator'}${post.role ? ` (${post.role})` : ''}`,
                        badge: 'Feed',
                        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
                        icon: 'forum',
                        image: post.authorImage || post.image,
                        fallbackType: 'USER_MALE',
                        action: () => {
                            setShowPredictions(false);
                            navigate('/showcase');
                        }
                    });
                }
            }

            // 5. Jobs & Castings Predictions
            for (const job of datasets.jobs) {
                if (matches.length >= 10) break;
                if (
                    job.title.toLowerCase().includes(lowerQuery) ||
                    job.company.toLowerCase().includes(lowerQuery) ||
                    job.location.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(job.title, trimmed)
                ) {
                    matches.push({
                        id: `job-${job.id}`,
                        type: 'job',
                        title: job.title,
                        subtitle: `${job.company} • ${job.location}`,
                        badge: 'Job',
                        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20',
                        icon: 'work',
                        image: job.logo,
                        fallbackType: 'COMPANY_LOGO',
                        action: () => {
                            setShowPredictions(false);
                            navigate(`/job/${job.id}`);
                        }
                    });
                }
            }

            // Add general keyword search prediction as fallback/direct option
            matches.unshift({
                id: 'keyword-direct',
                type: 'keyword',
                title: `Search everything for "${trimmed}"`,
                subtitle: 'Press Enter or click to view all matches',
                badge: 'Search All',
                badgeColor: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-200 border-zinc-500/20',
                icon: 'search',
                action: () => {
                    setShowPredictions(false);
                    triggerFullSearch(trimmed);
                }
            });

            setPredictions(matches.slice(0, 9));
            setShowPredictions(true);
        };

        const timer = setTimeout(buildPredictions, 180);
        return () => clearTimeout(timer);
    }, [query]);

    // 2. TRIGGER FULL SEARCH ACROSS ALL 6 VERTICALS
    const triggerFullSearch = (searchQuery: string) => {
        setSearchParams(searchQuery ? { q: searchQuery } : {});
    };

    useEffect(() => {
        if (!query.trim()) {
            setResults({
                people: [],
                studios: [],
                feed: [],
                news: [],
                jobs: [],
                blogs: []
            });
            setSearchMessage('');
            return;
        }

        setLoading(true);
        setSearchMessage('');

        const performSearch = async () => {
            try {
                const lowerQuery = query.toLowerCase();
                const datasets = await loadAllDatasets();

                // 1. Search Users / Talent
                const filteredPeople = datasets.users.filter(user =>
                    (user.displayName && (user.displayName.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.displayName, query))) ||
                    (user.role && (user.role.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.role, query))) ||
                    (user.location && (user.location.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.location, query))) ||
                    (user.bio && user.bio.toLowerCase().includes(lowerQuery)) ||
                    (user.username && (user.username.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.username, query)))
                );

                // 2. Search Studios & Facilities
                const filteredStudios = datasets.studios.filter(facility =>
                    facility.name.toLowerCase().includes(lowerQuery) ||
                    facility.type.toLowerCase().includes(lowerQuery) ||
                    (facility.location && facility.location.toLowerCase().includes(lowerQuery)) ||
                    (facility.description && facility.description.toLowerCase().includes(lowerQuery)) ||
                    fuzzyMatch(facility.name, query) ||
                    fuzzyMatch(facility.type, query)
                );

                // 3. Search Feed Posts
                const filteredFeed = datasets.feed.filter(post =>
                    (post.content && (post.content.toLowerCase().includes(lowerQuery) || fuzzyMatch(post.content, query))) ||
                    (post.author && (post.author.toLowerCase().includes(lowerQuery) || fuzzyMatch(post.author, query))) ||
                    (post.role && post.role.toLowerCase().includes(lowerQuery))
                );

                // 4. Search Cinema News & Movie Reviews
                const filteredNews = datasets.news.filter(news =>
                    news.title.toLowerCase().includes(lowerQuery) ||
                    (news.description && news.description.toLowerCase().includes(lowerQuery)) ||
                    (news.content && news.content.toLowerCase().includes(lowerQuery)) ||
                    news.source.toLowerCase().includes(lowerQuery) ||
                    news.industry.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(news.title, query)
                );

                // 5. Search Jobs & Castings
                let filteredJobs = datasets.jobs.filter(job =>
                    job.title.toLowerCase().includes(lowerQuery) ||
                    job.company.toLowerCase().includes(lowerQuery) ||
                    job.location.toLowerCase().includes(lowerQuery) ||
                    job.type.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(job.title, query) ||
                    fuzzyMatch(job.company, query)
                );

                // 6. Search Blogs
                const filteredBlogs = datasets.blogs.filter(blog =>
                    blog.title.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(blog.title, query) ||
                    (blog.category && blog.category.toLowerCase().includes(lowerQuery)) ||
                    blog.author.toLowerCase().includes(lowerQuery) ||
                    (blog.content && blog.content.toLowerCase().includes(lowerQuery))
                );

                const totalFound =
                    filteredPeople.length +
                    filteredStudios.length +
                    filteredFeed.length +
                    filteredNews.length +
                    filteredJobs.length +
                    filteredBlogs.length;

                let msg = '';
                if (totalFound > 0) {
                    msg = `Found ${totalFound} result${totalFound > 1 ? 's' : ''} matching "${query}"`;
                }

                setResults({
                    people: filteredPeople,
                    studios: filteredStudios,
                    feed: filteredFeed,
                    news: filteredNews,
                    jobs: filteredJobs,
                    blogs: filteredBlogs
                });
                setSearchMessage(msg);

            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Haversine formula for Nearby
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const getUserLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });

                try {
                    const allUsers = await getAllUsers();
                    const nearby = allUsers.filter(user => {
                        if (!user.location) return false;
                        const coords = user.location.split(',').map(c => parseFloat(c.trim()));
                        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                            return calculateDistance(latitude, longitude, coords[0], coords[1]) <= 50;
                        }
                        return false;
                    });
                    setNearbyUsers(nearby);
                } catch (error) {
                    console.error('Error fetching nearby users:', error);
                } finally {
                    setLocationLoading(false);
                }
            },
            () => {
                alert('Unable to get your location. Please enable location services in your browser.');
                setLocationLoading(false);
            }
        );
    };

    useEffect(() => {
        if (activeTab === 'nearme' && !userLocation) {
            getUserLocation();
        }
    }, [activeTab]);

    const handleClear = () => {
        setQuery('');
        setPredictions([]);
        setShowPredictions(false);
        setSearchParams({});
        inputRef.current?.focus();
    };

    const totalResultsCount =
        results.people.length +
        results.studios.length +
        results.feed.length +
        results.news.length +
        results.jobs.length +
        results.blogs.length;

    const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
        { id: 'all', label: 'All', icon: 'travel_explore', count: totalResultsCount },
        { id: 'people', label: 'Talent', icon: 'person', count: results.people.length },
        { id: 'studios', label: 'Studios & Gear', icon: 'domain', count: results.studios.length },
        { id: 'feed', label: 'Feed', icon: 'forum', count: results.feed.length },
        { id: 'news', label: 'News & Reviews', icon: 'newspaper', count: results.news.length },
        { id: 'jobs', label: 'Jobs', icon: 'work', count: results.jobs.length },
        { id: 'blogs', label: 'Articles', icon: 'article', count: results.blogs.length },
        { id: 'nearme', label: 'Near Me', icon: 'location_on', count: nearbyUsers.length },
    ];

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-[#050f26] text-zinc-900 dark:text-white font-display pb-36 md:pb-24">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto flex flex-col flex-1 px-3 sm:px-4">
                
                {/* 1. SEARCH HEADER & PREDICTIVE INPUT */}
                <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#050f26]/95 backdrop-blur-xl py-3 border-b border-zinc-200 dark:border-blue-500/20">
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-zinc-100 dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer"
                            title="Go Back"
                            aria-label="Back"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                        
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setShowPredictions(true);
                                }}
                                onFocus={() => {
                                    if (predictions.length > 0) setShowPredictions(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setShowPredictions(false);
                                        triggerFullSearch(query);
                                    } else if (e.key === 'Escape') {
                                        setShowPredictions(false);
                                    }
                                }}
                                placeholder="Search talent, studios, feed, news, reviews, jobs..."
                                className="w-full h-11 pl-10 pr-10 rounded-xl bg-zinc-100 dark:bg-[#06132b] border border-zinc-200 dark:border-blue-500/20 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500 text-lg pointer-events-none">
                                search
                            </span>
                            
                            {query && (
                                <button
                                    onClick={handleClear}
                                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                                    title="Clear search"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            )}

                            {/* 2. INSTANT SEARCH PREDICTIONS DROPDOWN */}
                            {showPredictions && predictions.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0a1c3e] rounded-2xl shadow-2xl border border-zinc-200 dark:border-blue-500/20 overflow-hidden z-50 divide-y divide-zinc-100 dark:divide-blue-500/10 max-h-[75vh] overflow-y-auto"
                                >
                                    <div className="px-3.5 py-2 bg-zinc-50 dark:bg-[#06132b] text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-blue-300 flex items-center justify-between">
                                        <span>Instant Predictions</span>
                                        <span>{predictions.length} Suggestions</span>
                                    </div>

                                    {predictions.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={p.action}
                                            className="px-3.5 py-2.5 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-[#0f2758] transition-colors cursor-pointer group"
                                        >
                                            {/* Preview Image or Icon */}
                                            <div className="size-9 rounded-xl overflow-hidden bg-zinc-100 dark:bg-[#06132b] border border-zinc-200 dark:border-blue-500/20 shrink-0 flex items-center justify-center">
                                                {p.image ? (
                                                    <PostMedia
                                                        src={p.image}
                                                        fallbackType={p.fallbackType || 'FILM_SET'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="material-symbols-outlined text-zinc-400 dark:text-blue-300 text-lg">
                                                        {p.icon}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title & Subtitle */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                        {p.title}
                                                    </h5>
                                                </div>
                                                {p.subtitle && (
                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                        {p.subtitle}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Category Badge */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${p.badgeColor}`}>
                                                {p.badge}
                                            </span>

                                            <span className="material-symbols-outlined text-zinc-400 group-hover:text-amber-500 group-hover:translate-x-0.5 text-base transition-all">
                                                arrow_forward
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. HORIZONTAL FILTER TABS WITH COUNTERS */}
                    <div className="flex gap-1.5 sm:gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
                        {tabs.map((tab) => {
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setShowPredictions(false);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                        isSelected
                                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                                            : 'bg-zinc-100 dark:bg-[#0a1c3e] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-blue-500/20 hover:border-amber-500/40 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    {typeof tab.count === 'number' && query.trim() && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. RESULTS DISPLAY */}
                <div className="pt-4 space-y-6">
                    
                    {/* Empty Query State */}
                    {!query.trim() && (
                        <div className="text-center py-16 px-4">
                            <div className="size-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <span className="material-symbols-outlined text-3xl">travel_explore</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                                Search Everything on iFilmDirectory
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                                Type a keyword to instantly discover filmmakers, shooting floors, equipment rentals, cinema wire stories, movie reviews, feed posts, and casting calls.
                            </p>

                            {/* Popular Suggestions Chips */}
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                                {['Director', 'Cinematographer', 'Annapurna Studios', 'Devara Review', 'Camera Rental', 'Hyderabad', 'Audition'].map((chip) => (
                                    <button
                                        key={chip}
                                        onClick={() => {
                                            setQuery(chip);
                                            triggerFullSearch(chip);
                                        }}
                                        className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-amber-500/40 hover:text-amber-500 transition-all cursor-pointer"
                                    >
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading Spinner */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="size-9 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
                            <span className="text-xs font-semibold text-zinc-400">Searching all verticals...</span>
                        </div>
                    )}

                    {/* Results Content */}
                    {!loading && query.trim() && (
                        <>
                            {searchMessage && (
                                <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between">
                                    <span>{searchMessage}</span>
                                    <span className="text-[11px] text-zinc-400">Showing {activeTab === 'all' ? 'top across all' : activeTab}</span>
                                </div>
                            )}

                            {/* 1. TALENT & CREATORS SECTION */}
                            {(activeTab === 'all' || activeTab === 'people') && results.people.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-500 text-lg">person</span>
                                            Talent & Filmmakers ({results.people.length})
                                        </h4>
                                        {activeTab === 'all' && results.people.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('people')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.people.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(activeTab === 'all' ? results.people.slice(0, 4) : results.people).map((person) => (
                                            <div
                                                key={person.uid}
                                                onClick={() => navigate(`/profile/${person.uid}`)}
                                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                <div className="size-12 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-blue-500/30">
                                                    <PostMedia
                                                        src={person.photoURL || ''}
                                                        fallbackType="USER_MALE"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h5 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                        {person.displayName || 'Unknown Creator'}
                                                    </h5>
                                                    <p className="text-xs text-purple-600 dark:text-purple-300 font-medium truncate">
                                                        {person.role || 'Filmmaker'}
                                                    </p>
                                                    {person.location && (
                                                        <p className="text-[11px] text-zinc-400 truncate flex items-center gap-0.5 mt-0.5">
                                                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                                                            {person.location}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="material-symbols-outlined text-zinc-400 group-hover:text-amber-500 group-hover:translate-x-0.5 text-base transition-all shrink-0">
                                                    chevron_right
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 2. STUDIOS, FACILITIES & GEAR SECTION */}
                            {(activeTab === 'all' || activeTab === 'studios') && results.studios.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">domain</span>
                                            Studios & Equipment ({results.studios.length})
                                        </h4>
                                        {activeTab === 'all' && results.studios.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('studios')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.studios.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(activeTab === 'all' ? results.studios.slice(0, 4) : results.studios).map((facility) => (
                                            <div
                                                key={facility.id}
                                                onClick={() => navigate(`/booking/details/${facility.id}`)}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group flex gap-3"
                                            >
                                                <div className="size-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-blue-500/20 bg-zinc-100 dark:bg-[#06132b]">
                                                    <PostMedia
                                                        src={facility.image}
                                                        fallbackType="FILM_SET"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <h5 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                            {facility.name}
                                                        </h5>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 shrink-0">
                                                            {facility.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[13px] text-zinc-400">location_on</span>
                                                        {facility.location}
                                                    </p>
                                                    <div className="flex items-center justify-between text-xs font-semibold mt-2 pt-1 border-t border-zinc-100 dark:border-blue-500/10">
                                                        <span className="text-amber-500">{facility.price}</span>
                                                        <span className="text-zinc-400 flex items-center gap-0.5 text-[11px]">
                                                            <span className="material-symbols-outlined text-[12px] text-amber-500">star</span>
                                                            {facility.rating} ({facility.reviews})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 3. CINEMA WIRE & MOVIE REVIEWS SECTION */}
                            {(activeTab === 'all' || activeTab === 'news') && results.news.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-red-500 text-lg">newspaper</span>
                                            Cinema Wire & Reviews ({results.news.length})
                                        </h4>
                                        {activeTab === 'all' && results.news.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('news')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.news.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {(activeTab === 'all' ? results.news.slice(0, 4) : results.news).map((item) => {
                                            const isReview = item.category === 'review' || !!item.rating;
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => setSelectedNewsArticle(item)}
                                                    className="p-3.5 rounded-2xl bg-white dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group flex gap-3.5"
                                                >
                                                    {item.thumbnail && (
                                                        <div className="size-16 sm:size-20 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-blue-500/20 bg-zinc-100 dark:bg-[#06132b]">
                                                            <PostMedia
                                                                src={item.thumbnail}
                                                                fallbackType="CINEMA_HALL"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                                                                {item.source}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-400">
                                                                • {formatNewsTime(item.timestamp)}
                                                            </span>
                                                            {isReview && (
                                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                                                    {item.rating || '★ REVIEW'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h5 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-snug line-clamp-2 group-hover:text-amber-500 transition-colors">
                                                            {item.title}
                                                        </h5>
                                                        {item.description && (
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* 4. FEED & COMMUNITY POSTS SECTION */}
                            {(activeTab === 'all' || activeTab === 'feed') && results.feed.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-emerald-500 text-lg">forum</span>
                                            Feed & Community Posts ({results.feed.length})
                                        </h4>
                                        {activeTab === 'all' && results.feed.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('feed')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.feed.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {(activeTab === 'all' ? results.feed.slice(0, 3) : results.feed).map((post) => (
                                            <div
                                                key={post.id}
                                                onClick={() => navigate('/showcase')}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-2.5 mb-2">
                                                    <div className="size-9 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-blue-500/30">
                                                        <PostMedia
                                                            src={post.authorImage || ''}
                                                            fallbackType="USER_MALE"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                                                            {post.author}
                                                        </h5>
                                                        <p className="text-[11px] text-zinc-400 truncate">
                                                            {post.role || 'Creator'}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        Feed
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 line-clamp-3 leading-relaxed">
                                                    {post.content}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-zinc-400 mt-2.5 pt-2 border-t border-zinc-100 dark:border-blue-500/10">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm text-red-500">favorite</span>
                                                        {post.likes || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                                        {post.comments || 0}
                                                    </span>
                                                    <span className="ml-auto text-amber-500 font-semibold group-hover:underline flex items-center gap-0.5">
                                                        View in Feed
                                                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 5. JOBS & CASTINGS SECTION */}
                            {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">work</span>
                                            Jobs & Castings ({results.jobs.length})
                                        </h4>
                                        {activeTab === 'all' && results.jobs.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('jobs')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.jobs.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {(activeTab === 'all' ? results.jobs.slice(0, 3) : results.jobs).map((job) => (
                                            <div
                                                key={job.id}
                                                onClick={() => navigate(`/job/${job.id}`)}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="size-11 rounded-xl bg-zinc-100 dark:bg-[#06132b] border border-zinc-200 dark:border-blue-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {job.logo ? (
                                                            <img
                                                                src={job.logo}
                                                                className="w-full h-full object-cover"
                                                                alt={job.company}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-zinc-400 text-xl">work</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight truncate group-hover:text-amber-500 transition-colors">
                                                            {job.title}
                                                        </h5>
                                                        <p className="text-xs text-amber-500 font-semibold truncate">{job.company}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2 flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm text-amber-500">location_on</span>
                                                        {job.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm text-zinc-400">work</span>
                                                        {job.type}
                                                    </span>
                                                    {job.salary && (
                                                        <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                                                            <span className="material-symbols-outlined text-sm">payments</span>
                                                            {job.salary}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 6. ARTICLES & BLOGS SECTION */}
                            {(activeTab === 'all' || activeTab === 'blogs') && results.blogs.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-cyan-500 text-lg">article</span>
                                            Journal & Articles ({results.blogs.length})
                                        </h4>
                                        {activeTab === 'all' && results.blogs.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('blogs')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.blogs.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {(activeTab === 'all' ? results.blogs.slice(0, 3) : results.blogs).map((blog) => (
                                            <div
                                                key={blog.id}
                                                onClick={() => navigate(`/blog/${blog.id}`)}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full mb-1.5 inline-block">
                                                    {blog.category}
                                                </span>
                                                <h5 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors">
                                                    {blog.title}
                                                </h5>
                                                <p className="text-xs text-zinc-400 mt-1">By {blog.author}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Total Zero Results Fallback */}
                            {totalResultsCount === 0 && (
                                <EmptyState
                                    message={`No results for "${query}"`}
                                    subMessage="Try checking your spelling or using broader keywords across creators, studios, news, or jobs."
                                    icon="search_off"
                                    actionLabel="Clear Search"
                                    onAction={handleClear}
                                />
                            )}
                        </>
                    )}

                    {/* 5. NEAR ME SECTION */}
                    {activeTab === 'nearme' && (
                        <section className="space-y-3">
                            <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">location_on</span>
                                Talent Near You (Within 50km)
                            </h4>

                            {locationLoading && (
                                <div className="flex justify-center py-12">
                                    <div className="size-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
                                </div>
                            )}

                            {!locationLoading && nearbyUsers.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {nearbyUsers.map((person) => (
                                        <div
                                            key={person.uid}
                                            onClick={() => navigate(`/profile/${person.uid}`)}
                                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="size-11 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-blue-500/30">
                                                <PostMedia
                                                    src={person.photoURL || ''}
                                                    fallbackType="USER_MALE"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                    {person.displayName || 'Creator'}
                                                </h5>
                                                <p className="text-xs text-zinc-400 truncate">
                                                    {person.role || 'Professional'}
                                                    {person.location ? ` • ${person.location}` : ''}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">
                                                location_on
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!locationLoading && nearbyUsers.length === 0 && userLocation && (
                                <EmptyState
                                    message="No creators found within 50km"
                                    subMessage="Try searching for major cities like Hyderabad, Chennai, Bengaluru, or Mumbai."
                                    icon="location_off"
                                />
                            )}

                            {!locationLoading && !userLocation && (
                                <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/20">
                                    <span className="material-symbols-outlined text-4xl text-amber-500 mb-2">location_searching</span>
                                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white">Enable Location</h5>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto mb-4">
                                        Discover local actors, directors, cinematographers, and crew members located near you.
                                    </p>
                                    <button
                                        onClick={getUserLocation}
                                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                                    >
                                        Find Nearby Talent
                                    </button>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>

            {/* 6. FULL-SCREEN / POP-UP NEWS ARTICLE READER MODAL */}
            {selectedNewsArticle && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
                    onClick={() => setSelectedNewsArticle(null)}
                >
                    <div
                        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0a1c3e] border border-zinc-200 dark:border-blue-500/30 shadow-2xl p-5 sm:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedNewsArticle(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 dark:bg-white/10 text-zinc-700 dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer z-10"
                            title="Close"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>

                        {/* Thumbnail */}
                        {selectedNewsArticle.thumbnail && (
                            <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-4 border border-zinc-200 dark:border-blue-500/20 bg-zinc-100 dark:bg-[#06132b]">
                                <PostMedia
                                    src={selectedNewsArticle.thumbnail}
                                    fallbackType="CINEMA_HALL"
                                    className="w-full h-full object-cover"
                                />
                                {selectedNewsArticle.category === 'review' && (
                                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-400 font-black text-xs border border-amber-400/40 flex items-center gap-1 shadow-lg">
                                        <span className="material-symbols-outlined text-sm">star</span>
                                        <span>{selectedNewsArticle.rating || 'CERTIFIED REVIEW'}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Metadata Header */}
                        <div className="flex items-center gap-2 text-xs font-bold mb-2 flex-wrap">
                            <span className="text-red-500 uppercase tracking-wide">
                                {selectedNewsArticle.source}
                            </span>
                            <span className="text-zinc-400">• {formatNewsTime(selectedNewsArticle.timestamp)}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#06132b] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-blue-500/20 uppercase">
                                {selectedNewsArticle.industry}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white leading-snug">
                            {selectedNewsArticle.title}
                        </h3>

                        {/* Content */}
                        <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 mt-3.5 leading-relaxed whitespace-pre-line">
                            {selectedNewsArticle.content || selectedNewsArticle.description}
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-blue-500/20 flex items-center justify-between gap-3">
                            <button
                                onClick={() => setSelectedNewsArticle(null)}
                                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-[#06132b] text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-[#0f2758] transition-all cursor-pointer"
                            >
                                Close
                            </button>
                            <a
                                href={selectedNewsArticle.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                <span>Read on {selectedNewsArticle.source}</span>
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
