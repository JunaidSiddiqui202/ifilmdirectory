import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rssNewsService, type NewsItem } from '../services/rssNewsService';

interface BreakingTickerProps {
    variant?: 'home' | 'page';
    onItemClick?: (item: NewsItem) => void;
}

export default function BreakingTicker({ variant = 'home', onItemClick }: BreakingTickerProps) {
    const navigate = useNavigate();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const data = await rssNewsService.getNews();
                if (mounted && data.items.length > 0) {
                    setNews(data.items.slice(0, 15));
                }
            } catch (err) {
                console.error('Ticker load error:', err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        load();

        const interval = setInterval(() => {
            rssNewsService.getNews().then(d => {
                if (mounted && d.items.length > 0) {
                    setNews(d.items.slice(0, 15));
                }
            });
        }, 15 * 60 * 1000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);

    if (isLoading && news.length === 0) {
        return (
            <div className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 animate-pulse ${variant === 'home' ? 'my-2.5' : 'mb-6'}`}>
                <div className="size-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">Loading Live Cinema Wire...</span>
            </div>
        );
    }

    if (news.length === 0) return null;

    const handleItemClick = (item: NewsItem) => {
        if (onItemClick) {
            onItemClick(item);
        } else {
            navigate('/south-cinema');
        }
    };

    const getIndustryBadge = (industry: NewsItem['industry']) => {
        switch (industry) {
            case 'telugu': return { label: 'Tollywood', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30' };
            case 'tamil': return { label: 'Kollywood', color: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30' };
            case 'malayalam': return { label: 'Mollywood', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
            case 'kannada': return { label: 'Sandalwood', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/15 border-purple-500/30' };
            default: return { label: 'South', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/15 border-blue-500/30' };
        }
    };

    // Duplicate list for infinite smooth marquee
    const marqueeItems = [...news, ...news];

    return (
        <div
            className={`w-full relative flex items-center overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-r dark:from-[#14151a] dark:via-[#0e0f13] dark:to-[#14151a] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 shadow-sm dark:shadow-lg transition-all select-none ${
                variant === 'home' ? 'my-2.5' : 'mb-6'
            }`}
        >
            {/* Fixed Left Live Badge */}
            <div className="z-10 shrink-0 flex items-center pl-3 sm:pl-4 pr-3 py-2.5 bg-white/95 dark:bg-[#14151a]/95 backdrop-blur-md border-r border-zinc-200 dark:border-white/10 shadow-[4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => navigate('/south-cinema')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:bg-red-600/20 dark:hover:bg-red-600/30 dark:text-red-400 border border-red-500/30 dark:border-red-500/40 transition-all group active:scale-95"
                    title="Open South Cinema Wire"
                >
                    <span className="relative flex size-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">
                        Live Wire
                    </span>
                </button>
            </div>

            {/* Continuous Horizontally Moving Marquee Track */}
            <div className="flex-1 overflow-hidden relative py-2.5">
                <div 
                    className="animate-marquee-scroll flex items-center gap-8 cursor-pointer"
                    style={{ animationDuration: `${Math.max(150, news.length * 12)}s` }}
                >
                    {marqueeItems.map((item, idx) => {
                        const badge = getIndustryBadge(item.industry);
                        const isReview = item.category === 'review';

                        return (
                            <div
                                key={`${item.id}-${idx}`}
                                onClick={() => handleItemClick(item)}
                                className="flex items-center gap-2 shrink-0 group hover:opacity-100 transition-opacity"
                            >
                                {/* Industry Tag */}
                                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${badge.color}`}>
                                    {badge.label}
                                </span>

                                {/* Review Star Tag */}
                                {isReview && (
                                    <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-black flex items-center gap-0.5 shadow-sm">
                                        <span className="material-symbols-outlined text-[10px] filled">star</span>
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

            {/* Fixed Right Shortcut to Hub */}
            <div className="z-10 shrink-0 flex items-center pr-3 sm:pr-4 pl-2 py-2.5 bg-white/95 dark:bg-[#14151a]/95 backdrop-blur-md border-l border-zinc-200 dark:border-white/10 shadow-[-4px_0_12px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_12px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => navigate('/south-cinema')}
                    className="size-7 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center justify-center transition-all"
                    title="View All South Cinema Stories"
                >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                </button>
            </div>
        </div>
    );
}
