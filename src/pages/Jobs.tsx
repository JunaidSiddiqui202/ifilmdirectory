import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { jobService, type Job } from '../services/jobService';
import EmptyState from '../components/EmptyState';
import PostMedia from '../components/PostMedia';

const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function Jobs() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'All' | 'Audition' | 'Crew' | 'Post-Production'>('All');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            const data = await jobService.getJobs(filter);
            setJobs(data);
            setLoading(false);
        };
        fetchJobs();
    }, [filter]);

    const filteredJobs = showVerifiedOnly
        ? jobs.filter(job => job.user_details?.verification_tier === 'gold' || job.user_details?.verification_tier === 'blue')
        : jobs;

    const renderVerificationBadge = (tier?: 'gold' | 'blue' | 'gray') => {
        if (tier === 'gold') return <span title="Verified Production House" className="material-symbols-outlined text-amber-500 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        if (tier === 'blue') return <span title="Verified Recruiter" className="material-symbols-outlined text-sky-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        return null; // Gray or undefined gets no badge
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-background-light dark:bg-[#090A0C] pb-36 md:pb-24 overflow-x-hidden transition-colors">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto flex flex-col flex-1">
                {/* Cinema Header */}
                <header className="sticky top-0 z-40 flex flex-col bg-white/80 dark:bg-[#090A0C]/85 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between p-4 pb-3 gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="md:hidden flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/home')}>
                                <HamburgerMenu />
                                <Logo size="sm" showText={true} />
                                <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    Jobs
                                </span>
                            </div>
                            <h1 className="hidden md:flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                                <span className="material-symbols-outlined text-amber-500 text-xl">work</span>
                                <span>Castings & Crew Calls</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => navigate('/post-job')}
                                className="rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-black hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/25 active:scale-95"
                            >
                                + Post Call
                            </button>
                            <button
                                onClick={() => navigate('/search')}
                                className="size-9 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-amber-500 transition-colors"
                                title="Search Jobs"
                            >
                                <span className="material-symbols-outlined text-xl">search</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
                        {[
                            { id: 'All', label: 'All Calls' },
                            { id: 'Audition', label: 'Auditions & Roles' },
                            { id: 'Crew', label: 'Key Crew' },
                            { id: 'Post-Production', label: 'Post-Production' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id as any)}
                                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                                    filter === item.id
                                        ? 'bg-amber-500 text-black font-bold shadow-sm shadow-amber-500/25'
                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent dark:border-white/5'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Verified Toggle */}
                    <div className="px-4 pb-3 flex items-center justify-between border-t border-black/[0.03] dark:border-white/[0.04] pt-2.5">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-amber-500 text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            <span>Verified Studios & Recruiters</span>
                        </span>
                        <button
                            onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${showVerifiedOnly ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 bg-black dark:bg-white w-4 h-4 rounded-full transition-transform ${showVerifiedOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </header>

                {/* Job List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 px-4 pt-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 md:col-span-2">
                            <div className="size-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Loading film opportunities...</p>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="md:col-span-2 py-16">
                            <EmptyState
                                message="No opportunities found"
                                subMessage={showVerifiedOnly ? "Try turning off the verified filter to see more calls." : "Be the first production to post a casting or crew call!"}
                                icon="work_off"
                                actionLabel={!showVerifiedOnly ? "Post a Call" : "Clear Filter"}
                                onAction={showVerifiedOnly ? () => setShowVerifiedOnly(false) : () => navigate('/post-job')}
                            />
                        </div>
                    ) : (
                        filteredJobs.map((job) => {
                            const isAudition = job.type === 'Audition';
                            const isPost = job.type === 'Post-Production';
                            const badgeColor = isAudition
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : isPost
                                ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20';

                            return (
                                <article
                                    key={job.id}
                                    onClick={() => navigate(`/job/${job.id}`)}
                                    className="flex cursor-pointer flex-col justify-between gap-3.5 rounded-2xl bg-white dark:bg-[#121316] p-4 sm:p-5 shadow-sm border border-black/[0.04] dark:border-white/[0.07] hover:border-amber-500/25 hover:-translate-y-0.5 transition-all group"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-2.5">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-11 rounded-full overflow-hidden shrink-0 border border-black/5 dark:border-white/10 bg-black">
                                                    <PostMedia src={job.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                                                        {job.company}
                                                        {renderVerificationBadge(job.user_details?.verification_tier)}
                                                    </p>
                                                    <h3 className="font-bold text-zinc-900 dark:text-white text-base tracking-tight leading-snug group-hover:text-amber-500 transition-colors truncate">
                                                        {job.title}
                                                    </h3>
                                                </div>
                                            </div>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 border ${badgeColor}`}>
                                                {job.type}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm text-amber-500">location_on</span>
                                                {job.location}
                                            </span>
                                            {job.salary && (
                                                <span className="flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-200">
                                                    <span className="material-symbols-outlined text-sm text-amber-500">payments</span>
                                                    ₹ {job.salary}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs">
                                        <span className="text-xs text-zinc-400">
                                            Posted {formatTimeAgo(job.postedAt)}
                                        </span>
                                        <span className="font-bold text-amber-500 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                            View Details
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </span>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
