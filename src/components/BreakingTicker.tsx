import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rssNewsService, type NewsItem } from '../services/rssNewsService';
import { rssJobService } from '../services/rssJobService';
import { type Job } from '../services/jobService';

export type TickerEntry =
    | { kind: 'news'; data: NewsItem }
    | { kind: 'job'; data: Job };

interface BreakingTickerProps {
    variant?: 'home' | 'page';
    onNewsClick?: (item: NewsItem) => void;
    onJobClick?: (job: Job) => void;
    onItemClick?: (item: NewsItem) => void; // backwards compat
}

const formatTickerTime = (timestamp?: number | string) => {
    if (!timestamp) return '';
    const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    if (isNaN(time)) return '';
    const diffMs = Date.now() - time;
    if (diffMs < 0) return 'Recent';
    const mins = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isExcludedFromTicker = (title?: string, desc?: string) => {
    const text = `${title || ''} ${desc || ''}`.toLowerCase();
    // Exclude trailers, teasers, lyrical videos, promo songs, and re-releases
    return /\b(trailer|teaser|lyrical|glimpse|promo song|promo video|re-?release|re-?releasing|rerelease|4k re-?release)\b/i.test(text);
};

export default function BreakingTicker({ variant = 'home', onNewsClick, onJobClick, onItemClick }: BreakingTickerProps) {
    const navigate = useNavigate();
    const [tickerItems, setTickerItems] = useState<TickerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Defaults to continuous moving marquee so the ticker actively scrolls across the screen on load.
    const [mode, setMode] = useState<'rotator' | 'marquee'>(() => {
        try {
            const saved = localStorage.getItem('ifilm_ticker_mode');
            if (saved === 'rotator' || saved === 'marquee') return saved;
        } catch {
            // fallback
        }
        return 'marquee';
    });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const toggleMode = () => {
        setMode((prev) => {
            const next = prev === 'rotator' ? 'marquee' : 'rotator';
            try {
                localStorage.setItem('ifilm_ticker_mode', next);
            } catch {
                // ignore
            }
            return next;
        });
    };

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const [newsData, jobsData] = await Promise.all([
                    rssNewsService.getNews().catch(() => ({ items: rssNewsService.getCachedNews() })),
                    rssJobService.getJobs().catch(() => rssJobService.getCachedJobs())
                ]);

                if (!mounted) return;

                const rawNews: NewsItem[] = (newsData && (newsData as any).items) ? (newsData as any).items : [];
                // Filter out trailers, teasers, lyrical videos, and old re-releases
                const newsItems = rawNews.filter(it => !isExcludedFromTicker(it.title, it.description));
                const jobList: Job[] = Array.isArray(jobsData) ? jobsData : [];

                // Interweave news and fresh job arrivals:
                // e.g. [News 1, Job 1, News 2, Job 2, News 3, Job 3, ...]
                const combined: TickerEntry[] = [];
                const maxLen = Math.max(newsItems.length, jobList.length);

                for (let i = 0; i < maxLen; i++) {
                    if (i < newsItems.length) {
                        combined.push({ kind: 'news', data: newsItems[i] });
                    }
                    if (i < jobList.length && i < 12) {
                        combined.push({ kind: 'job', data: jobList[i] });
                    }
                }

                if (combined.length > 0) {
                    setTickerItems(combined.slice(0, 30));
                }
            } catch (err) {
                console.error('Ticker load error:', err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        load();

        // 15-minute background refresh
        const interval = setInterval(() => {
            load();
        }, 15 * 60 * 1000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    // Auto-advance Rotator every 7.5 seconds when not paused for relaxed reading
    useEffect(() => {
        if (mode !== 'rotator' || isPaused || tickerItems.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
        }, 7500);

        return () => clearInterval(timer);
    }, [mode, isPaused, tickerItems.length]);

    if (isLoading && tickerItems.length === 0) {
        return (
            <div className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 animate-pulse ${variant === 'home' ? 'my-2' : 'mb-6'}`}>
                <div className="size-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">Loading Live Cinema Wire & Job Alerts...</span>
            </div>
        );
    }

    if (tickerItems.length === 0) return null;

    const handleEntryClick = (entry: TickerEntry) => {
        if (entry.kind === 'news') {
            if (onNewsClick) {
                onNewsClick(entry.data);
            } else if (onItemClick) {
                onItemClick(entry.data);
            } else {
                navigate('/south-cinema');
            }
        } else if (entry.kind === 'job') {
            if (onJobClick) {
                onJobClick(entry.data);
            } else {
                navigate(`/job/${entry.data.id}`);
            }
        }
    };

    const getIndustryBadge = (industry: NewsItem['industry']) => {
        switch (industry) {
            case 'telugu': return { label: 'Tollywood', color: 'text-white bg-amber-600 border-amber-500/40' };
            case 'tamil': return { label: 'Kollywood', color: 'text-white bg-rose-600 border-rose-500/40' };
            case 'malayalam': return { label: 'Mollywood', color: 'text-white bg-emerald-600 border-emerald-500/40' };
            case 'kannada': return { label: 'Sandalwood', color: 'text-white bg-purple-600 border-purple-500/40' };
            default: return { label: 'Cinema Wire', color: 'text-white bg-blue-600 border-blue-500/40' };
        }
    };

    const currentEntry = tickerItems[currentIndex] || tickerItems[0];
    // Seamless infinite loop: duplicate items evenly so translating -50% creates an invisible loop
    const repeatMultiplier = tickerItems.length < 8 ? 4 : 2;
    const marqueeItems = tickerItems.length > 0
        ? Array.from({ length: repeatMultiplier }, () => tickerItems).flat()
        : [];
    // Dynamic duration ensuring a very calm, slow, readable speed (~18px/sec)
    const approxItemWidth = 280;
    const totalHalfWidth = (repeatMultiplier / 2) * Math.max(tickerItems.length, 1) * approxItemWidth;
    const marqueeDuration = Math.max(105, Math.round(totalHalfWidth / 18));

    const renderSingleEntry = (entry?: TickerEntry) => {
        if (!entry) return null;

        if (entry.kind === 'job') {
            const job = entry.data;
            const isAudition = job.type === 'Audition';

            return (
                <div key={`job-${job.id}-${currentIndex}`} className="flex items-center gap-2 sm:gap-2.5 min-w-0 w-full animate-ticker-slide">
                    {/* Job Type Tag */}
                    <span className={`shrink-0 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${isAudition
                        ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-black border-amber-700 dark:border-amber-400'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        }`}>
                        <span className="material-symbols-outlined text-[11px]">
                            {isAudition ? 'theater_comedy' : 'work'}
                        </span>
                        <span>{isAudition ? 'Casting Call' : 'New Job'}</span>
                    </span>

                    {/* Fraternity Role Tag */}
                    {job.fraternityRole && (
                        <span className="hidden sm:inline-flex shrink-0 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            {job.fraternityRole}
                        </span>
                    )}

                    {/* Job Title & Company */}
                    <div className="min-w-0 flex-1 flex items-center gap-1.5 text-sm sm:text-xs font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        <span className="truncate">
                            {job.title}
                        </span>
                        <span className="shrink-0 text-amber-700 dark:text-amber-400 font-extrabold text-xs sm:text-[11px]">
                            @{job.company}
                        </span>
                        {job.location && (
                            <span className="hidden md:inline-flex shrink-0 text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                                ({job.location})
                            </span>
                        )}
                    </div>

                    {/* Compensation */}
                    {job.salary && (
                        <span className="hidden lg:inline-flex shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                            {job.salary}
                        </span>
                    )}
                </div>
            );
        }

        // News item
        const item = entry.data;
        const badge = getIndustryBadge(item.industry);
        const isReview = item.category === 'review' || Boolean(item.rating);
        const isRelease = item.category === 'release' || Boolean(item.releaseDate);
        const isOpening = item.category === 'opening' || Boolean(item.openingType);

        return (
            <div key={`news-${item.id}-${currentIndex}`} className="flex items-center gap-2 sm:gap-2.5 min-w-0 w-full animate-ticker-slide">
                {/* Specific Category Badges */}
                {isRelease ? (
                    <span className="shrink-0 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white border border-emerald-600 flex items-center gap-1 shadow-xs">
                        <span className="material-symbols-outlined text-[11px]">calendar_month</span>
                        <span>Release</span>
                    </span>
                ) : isOpening ? (
                    <span className="shrink-0 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500 text-white border border-rose-600 flex items-center gap-1 shadow-xs">
                        <span className="material-symbols-outlined text-[11px]">celebration</span>
                        <span>{item.openingType === 'pooja_launch' ? 'Pooja Launch' : 'Opening'}</span>
                    </span>
                ) : isReview ? (
                    <span className="shrink-0 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-0.5 shadow-xs">
                        <span className="material-symbols-outlined text-[11px] filled text-white">star</span>
                        <span>{item.rating || 'REVIEW'}</span>
                    </span>
                ) : (
                    <span className={`shrink-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${badge.color}`}>
                        {badge.label}
                    </span>
                )}

                {/* News Headline Title - FULL TEXT CLEARLY VISIBLE */}
                <span
                    className="min-w-0 flex-1 truncate text-sm sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                    title={item.title}
                >
                    {item.title}
                </span>

                {/* Release Date info if present */}
                {item.releaseDate && (
                    <span className="hidden md:inline-flex shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        📅 {item.releaseDate}
                    </span>
                )}

                {/* Source & Timestamp */}
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-300">{item.source}</span>
                    <span>•</span>
                    <span>{formatTickerTime(item.timestamp)}</span>
                </div>
            </div>
        );
    };

    return (
        <div
            className={`w-full relative flex items-center overflow-hidden rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 dark:hover:border-amber-500/30 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all select-none ${variant === 'home' ? 'my-2' : 'mb-6'
                }`}
        >
            {/* Fixed Left Live Badge */}
            <div className="z-10 shrink-0 flex items-center pl-3 sm:pl-3.5 pr-2.5 sm:pr-3 py-2 bg-white/95 dark:bg-[#1e1f24]/95 backdrop-blur-md border-r border-zinc-200 dark:border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => navigate('/south-cinema')}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs sm:text-[10px] uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                    title="View South Cinema Live Wire"
                >
                    <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-2 bg-white"></span>
                    </span>
                    <span>Live Wire</span>
                </button>
            </div>

            {/* Center: Full Visible Headline Area */}
            {mode === 'rotator' ? (
                <div
                    key={`rotator-box-${currentIndex}`}
                    className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 flex items-center cursor-pointer group overflow-hidden relative"
                    onClick={() => currentEntry && handleEntryClick(currentEntry)}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {renderSingleEntry(currentEntry)}

                    {/* Active auto-advance timer progress line */}
                    {!isPaused && tickerItems.length > 1 && (
                        <div
                            key={`timer-progress-${currentIndex}`}
                            className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-red-600 to-amber-500 rounded-full animate-ticker-progress pointer-events-none"
                        />
                    )}
                </div>
            ) : (
                /* Continuous Horizontally Moving Marquee Track */
                <div
                    className="flex-1 overflow-hidden relative py-2.5 px-3"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div
                        className="animate-marquee-scroll flex items-center gap-8 cursor-pointer"
                        style={{
                            animation: `marquee-scroll ${marqueeDuration}s linear infinite`,
                            animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                    >
                        {marqueeItems.map((entry, idx) => {
                            if (entry.kind === 'job') {
                                const job = entry.data;
                                const isAudition = job.type === 'Audition';

                                return (
                                    <div
                                        key={`job-${job.id}-${idx}`}
                                        onClick={() => handleEntryClick(entry)}
                                        className="flex items-center gap-2 shrink-0 group hover:opacity-100 transition-opacity"
                                    >
                                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${isAudition
                                            ? 'bg-amber-500 text-white border-amber-600'
                                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                                            }`}>
                                            <span className="material-symbols-outlined text-[11px]">
                                                {isAudition ? 'theater_comedy' : 'work'}
                                            </span>
                                            <span>{isAudition ? 'CASTING CALL' : 'NEW JOB'}</span>
                                        </span>

                                        {job.fraternityRole && (
                                            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                                                {job.fraternityRole}
                                            </span>
                                        )}

                                        <span className="text-sm sm:text-xs font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors whitespace-nowrap">
                                            {job.title} <strong className="text-amber-600 dark:text-amber-400 font-extrabold">@{job.company}</strong> ({job.location})
                                        </span>

                                        <span className="text-zinc-300 dark:text-blue-300/40 text-xs font-bold pl-3">•</span>
                                    </div>
                                );
                            }

                            const item = entry.data;
                            const badge = getIndustryBadge(item.industry);
                            const isReview = item.category === 'review' || Boolean(item.rating);
                            const isRelease = item.category === 'release' || Boolean(item.releaseDate);
                            const isOpening = item.category === 'opening' || Boolean(item.openingType);

                            return (
                                <div
                                    key={`news-${item.id}-${idx}`}
                                    onClick={() => handleEntryClick(entry)}
                                    className="flex items-center gap-2 shrink-0 group hover:opacity-100 transition-opacity"
                                >
                                    {isRelease ? (
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-white border border-emerald-600 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[11px]">calendar_month</span>
                                            <span>Release</span>
                                        </span>
                                    ) : isOpening ? (
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500 text-white border border-rose-600 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[11px]">celebration</span>
                                            <span>Opening</span>
                                        </span>
                                    ) : (
                                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                    )}

                                    {isReview && (
                                        <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-0.5 shadow-sm">
                                            <span className="material-symbols-outlined text-[10px] filled text-white">star</span>
                                            <span>{item.rating || 'REVIEW'}</span>
                                        </span>
                                    )}

                                    <span className="text-sm sm:text-xs font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors whitespace-nowrap">
                                        {item.title}
                                    </span>

                                    <span className="text-zinc-300 dark:text-blue-300/40 text-xs font-bold pl-3">•</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Controls & Navigation */}
            <div className="z-10 shrink-0 flex items-center gap-1 sm:gap-1.5 pr-2.5 sm:pr-3 pl-2 py-1.5 bg-white/95 dark:bg-[#1e1f24]/95 backdrop-blur-md border-l border-zinc-200 dark:border-white/10 shadow-[-4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_12px_rgba(0,0,0,0.5)]">
                {/* Counter (Rotator mode) */}
                {mode === 'rotator' && tickerItems.length > 0 && (
                    <span className="hidden sm:inline-block text-[10px] font-black px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 tabular-nums">
                        {currentIndex + 1}/{tickerItems.length}
                    </span>
                )}

                {/* Previous Button (Rotator mode) */}
                {mode === 'rotator' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex((prev) => (prev - 1 + tickerItems.length) % tickerItems.length);
                        }}
                        className="size-6 sm:size-7 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer"
                        title="Previous Headline"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                )}

                {/* Next Button (Rotator mode) */}
                {mode === 'rotator' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
                        }}
                        className="size-6 sm:size-7 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer"
                        title="Next Headline"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                )}

                {/* Paused state indicator in marquee mode */}
                {mode === 'marquee' && isPaused && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <span className="material-symbols-outlined text-[10px]">pause</span>
                        <span>Paused</span>
                    </span>
                )}

                {/* Mode Switcher (Continuous Moving Marquee / Single Story View) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMode();
                    }}
                    className={`size-6 sm:size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${mode === 'marquee'
                        ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                        : 'bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-600 dark:text-zinc-400'
                        }`}
                    title={mode === 'marquee' ? 'Click for Single Headline View' : 'Click for Continuous Moving Marquee'}
                >
                    <span className="material-symbols-outlined text-sm">
                        {mode === 'marquee' ? 'view_carousel' : 'motion_photos_on'}
                    </span>
                </button>

                {/* Full Wire Link */}
                <button
                    onClick={() => navigate('/south-cinema')}
                    className="size-6 sm:size-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-all cursor-pointer"
                    title="Open Full Cinema Wire & Reviews"
                >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
            </div>
        </div>
    );
}
