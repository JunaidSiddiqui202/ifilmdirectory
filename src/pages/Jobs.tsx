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
    const [searchQuery, setSearchQuery] = useState('');
    const [subFilter, setSubFilter] = useState<string>('All');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            const data = await jobService.getJobs(filter === 'All' ? undefined : filter);
            setJobs(data);
            setLoading(false);
        };
        fetchJobs();
    }, [filter]);

    const filteredJobs = jobs.filter(job => {
        // Verification filter
        if (showVerifiedOnly) {
            const tier = job.user_details?.verification_tier;
            if (tier !== 'gold' && tier !== 'blue') return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchesTitle = job.title?.toLowerCase().includes(q);
            const matchesCompany = job.company?.toLowerCase().includes(q);
            const matchesLocation = job.location?.toLowerCase().includes(q);
            const matchesDescription = job.description?.toLowerCase().includes(q);
            if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesDescription) return false;
        }

        // SubFilter for specific roles
        if (subFilter !== 'All') {
            const text = `${job.title} ${job.description} ${job.type}`.toLowerCase();
            if (!text.includes(subFilter.toLowerCase())) return false;
        }

        return true;
    });

    const renderVerificationBadge = (tier?: 'gold' | 'blue' | 'gray') => {
        if (tier === 'gold') return <span title="Verified Studio / Production House" className="material-symbols-outlined text-amber-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        if (tier === 'blue') return <span title="Verified Recruiter / Director" className="material-symbols-outlined text-sky-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        return null;
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-36 md:pb-24 overflow-x-hidden font-display transition-colors">
            <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 px-3 sm:px-6 lg:px-8">
                {/* Cinema Top Header */}
                <header className="sticky top-0 z-40 flex flex-col bg-white/90 dark:bg-[#090A0C]/90 backdrop-blur-2xl border-b border-zinc-200 dark:border-white/[0.06] -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-3.5 gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="md:hidden flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/home')}>
                                <HamburgerMenu />
                                <Logo size="sm" showText={true} />
                            </div>
                            <div className="hidden md:flex items-center gap-2.5">
                                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl">work</span>
                                </div>
                                <div>
                                    <h1 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                        <span>Castings & Crew Calls</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                            Live Board
                                        </span>
                                    </h1>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Direct hiring by verified production houses & indie filmmakers</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => navigate('/post-job')}
                                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-black text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-base">add_circle</span>
                                <span>Post Opportunity</span>
                            </button>
                        </div>
                    </div>

                    {/* Integrated Search & Quick Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                        <div className="sm:col-span-8 relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3.5 text-zinc-400 dark:text-zinc-500 text-lg pointer-events-none">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by role, character, camera, production house, city..."
                                className="w-full bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all shadow-sm dark:shadow-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 text-zinc-500 hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            )}
                        </div>

                        {/* Verified Switcher Button */}
                        <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-3 px-1">
                            <button
                                onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    showVerifiedOnly
                                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm'
                                        : 'bg-[#121316] text-zinc-400 border-white/10 hover:text-white'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                <span>Verified Only</span>
                                <span className={`size-2 rounded-full ${showVerifiedOnly ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Category Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {[
                            { id: 'All', label: 'All Opportunities', icon: 'grid_view' },
                            { id: 'Audition', label: 'Castings & Auditions', icon: 'theater_comedy' },
                            { id: 'Crew', label: 'Direction & Camera', icon: 'videocam' },
                            { id: 'Post-Production', label: 'Edit, VFX & Sound', icon: 'movie_filter' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id as any)}
                                className={`whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    filter === item.id
                                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                                        : 'bg-[#121316] text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </header>

                {/* Sub-Filters: Departments */}
                <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar border-b border-white/[0.04] text-[11px]">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider shrink-0 text-[10px]">Filter Role:</span>
                    {['All', 'Actor', 'Director', 'Cinematographer', 'Editor', 'Sound', 'Producer', 'Writer'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setSubFilter(role)}
                            className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                                subFilter === role
                                    ? 'bg-white/10 text-white border border-white/20'
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                            }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>

                {/* Counter Strip */}
                <div className="flex items-center justify-between py-3 text-xs text-zinc-400">
                    <span className="font-semibold">
                        Showing <strong className="text-white">{filteredJobs.length}</strong> available film calls
                    </span>
                    {searchQuery && (
                        <span className="text-amber-400 font-medium">Matching &quot;{searchQuery}&quot;</span>
                    )}
                </div>

                {/* Jobs Grid (Responsive: 1 col on mobile, 2 on tablet, 3 on desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 col-span-full">
                            <div className="size-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-xs font-semibold text-zinc-400">Loading film opportunities...</p>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="col-span-full py-16">
                            <EmptyState
                                message="No opportunities found"
                                subMessage={showVerifiedOnly || searchQuery ? "Try clearing filters to explore more opportunities." : "Be the first production to post a casting call or crew opening!"}
                                icon="work_off"
                                actionLabel={showVerifiedOnly || searchQuery ? "Reset Filters" : "Post a Call"}
                                onAction={() => {
                                    if (showVerifiedOnly || searchQuery || subFilter !== 'All') {
                                        setShowVerifiedOnly(false);
                                        setSearchQuery('');
                                        setSubFilter('All');
                                    } else {
                                        navigate('/post-job');
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        filteredJobs.map((job) => {
                            const isAudition = job.type === 'Audition';
                            const isPost = job.type === 'Post-Production';
                            const badgeColor = isAudition
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : isPost
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                            return (
                                <article
                                    key={job.id}
                                    onClick={() => navigate(`/job/${job.id}`)}
                                    className="flex cursor-pointer flex-col justify-between rounded-2xl bg-[#121316] p-5 shadow-lg border border-white/[0.06] hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden"
                                >
                                    {/* Top Accents */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.03] rounded-full blur-2xl group-hover:bg-amber-500/[0.08] transition-colors" />

                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/60 shadow-inner">
                                                    <PostMedia src={job.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-zinc-400 truncate flex items-center gap-1">
                                                        <span>{job.company}</span>
                                                        {renderVerificationBadge(job.user_details?.verification_tier)}
                                                    </p>
                                                    <h3 className="font-extrabold text-white text-base tracking-tight leading-snug group-hover:text-amber-400 transition-colors line-clamp-1">
                                                        {job.title}
                                                    </h3>
                                                </div>
                                            </div>
                                            <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold shrink-0 border uppercase tracking-wider ${badgeColor}`}>
                                                {job.type}
                                            </span>
                                        </div>

                                        {/* Description Snippet */}
                                        {job.description && (
                                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                                                {job.description}
                                            </p>
                                        )}

                                        {/* Meta Chips */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-3">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/5">
                                                <span className="material-symbols-outlined text-[13px] text-amber-400">location_on</span>
                                                <span className="truncate max-w-[130px]">{job.location || 'India'}</span>
                                            </span>
                                            {job.salary && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                                                    <span className="material-symbols-outlined text-[13px]">payments</span>
                                                    <span>₹ {job.salary}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer Details */}
                                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs mt-2">
                                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                                            <span>Posted {formatTimeAgo(job.postedAt)}</span>
                                        </span>
                                        <span className="font-black text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform text-xs">
                                            <span>Details & Apply</span>
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
