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

export default function BreakingTicker({ variant = 'home', onNewsClick, onJobClick, onItemClick }: BreakingTickerProps) {
    const navigate = useNavigate();
    const [tickerItems, setTickerItems] = useState<TickerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const [newsData, jobsData] = await Promise.all([
                    rssNewsService.getNews().catch(() => ({ items: rssNewsService.getCachedNews() })),
                    rssJobService.getJobs().catch(() => rssJobService.getCachedJobs())
                ]);

                if (!mounted) return;

                const newsItems: NewsItem[] = (newsData && (newsData as any).items) ? (newsData as any).items : [];
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

    if (isLoading && tickerItems.length === 0) {
        return (
            <div className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 animate-pulse ${variant === 'home' ? 'my-2' : 'mb-6'}`}>
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
            case 'telugu': return { label: 'Tollywood', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30' };
            case 'tamil': return { label: 'Kollywood', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30' };
            case 'malayalam': return { label: 'Mollywood', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
            case 'kannada': return { label: 'Sandalwood', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/15 border-purple-500/30' };
            default: return { label: 'Cinema Wire', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/15 border-blue-500/30' };
        }
    };

    // Duplicate list for infinite smooth marquee
    const marqueeItems = [...tickerItems, ...tickerItems];

    return (
        <div
            className={`w-full relative flex items-center overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-r dark:from-[#14151a] dark:via-[#0e0f13] dark:to-[#14151a] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 shadow-sm dark:shadow-lg transition-all select-none ${
                variant === 'home' ? 'my-2' : 'mb-6'
            }`}
        >
            {/* Fixed Left Live Badge */}
            <div className="z-10 shrink-0 flex items-center pl-3 sm:pl-4 pr-3 py-2 bg-white/95 dark:bg-[#14151a]/95 backdrop-blur-md border-r border-zinc-200 dark:border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-sm">
                    <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-2 bg-white"></span>
                    </span>
                    <span>Live Wire</span>
                </div>
            </div>

            {/* Continuous Horizontally Moving Marquee Track */}
            <div className="flex-1 overflow-hidden relative py-2.5">
                <div 
                    className="animate-marquee-scroll flex items-center gap-8 cursor-pointer"
                    style={{ animationDuration: `${Math.max(120, tickerItems.length * 10)}s` }}
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
                                    {/* Job Tag */}
                                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                        isAudition 
                                            ? 'bg-amber-500 text-white border-amber-600' 
                                            : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                                    }`}>
                                        <span className="material-symbols-outlined text-[11px]">
                                            {isAudition ? 'theater_comedy' : 'work'}
                                        </span>
                                        <span>{isAudition ? 'CASTING CALL' : 'NEW JOB'}</span>
                                    </span>

                                    {/* Fraternity Role Tag */}
                                    {job.fraternityRole && (
                                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                                            {job.fraternityRole}
                                        </span>
                                    )}

                                    {/* Job Title & Studio */}
                                    <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors whitespace-nowrap">
                                        {job.title} <strong className="text-amber-600 dark:text-amber-400 font-extrabold">@{job.company}</strong> ({job.location})
                                    </span>

                                    {/* Separator */}
                                    <span className="text-zinc-300 dark:text-zinc-600 text-xs font-bold pl-3">•</span>
                                </div>
                            );
                        }

                        // News / Review item
                        const item = entry.data;
                        const badge = getIndustryBadge(item.industry);
                        const isReview = item.category === 'review' || Boolean(item.rating);

                        return (
                            <div
                                key={`news-${item.id}-${idx}`}
                                onClick={() => handleEntryClick(entry)}
                                className="flex items-center gap-2 shrink-0 group hover:opacity-100 transition-opacity"
                            >
                                {/* Industry Tag */}
                                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${badge.color}`}>
                                    {badge.label}
                                </span>

                                {/* Review Star Tag */}
                                {isReview && (
                                    <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-white flex items-center gap-0.5 shadow-sm">
                                        <span className="material-symbols-outlined text-[10px] filled text-white">star</span>
                                        <span>{item.rating || 'REVIEW'}</span>
                                    </span>
                                )}

                                {/* Headline Title */}
                                <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors whitespace-nowrap">
                                    {item.title}
                                </span>

                                {/* Bullet Separator */}
                                <span className="text-zinc-300 dark:text-zinc-600 text-xs font-bold pl-3">•</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Fixed Right Shortcut to South Cinema News */}
            <div className="z-10 shrink-0 flex items-center pr-3 sm:pr-4 pl-2 py-2 bg-white/95 dark:bg-[#14151a]/95 backdrop-blur-md border-l border-zinc-200 dark:border-white/10 shadow-[-4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_12px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => navigate('/south-cinema')}
                    className="size-7 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center justify-center transition-all"
                    title="View Full Wire"
                >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
            </div>
        </div>
    );
}
