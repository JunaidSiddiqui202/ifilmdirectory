import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { jobService, type Job } from '../services/jobService';
import { rssJobService } from '../services/rssJobService';
import EmptyState from '../components/EmptyState';
import PostMedia from '../components/PostMedia';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';

const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function Jobs() {
    const navigate = useNavigate();
    const toast = useToast();
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();
    const [filter, setFilter] = useState<'All' | 'Audition' | 'Crew' | 'Post-Production'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [subFilter, setSubFilter] = useState<string>('All');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncMinutesAgo, setLastSyncMinutesAgo] = useState<number>(0);
    const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
    
    // Full Content Reader Modal (like news & reviews)
    const [selectedJobModal, setSelectedJobModal] = useState<Job | null>(null);

    const loadJobs = async (force: boolean = false) => {
        if (force) setIsSyncing(true);
        else setLoading(true);

        try {
            if (force) {
                await rssJobService.syncAllFeeds();
            }
            const data = await jobService.getJobs(filter === 'All' ? undefined : filter);
            setJobs(data);

            const lastSync = rssJobService.getLastSyncTime();
            if (lastSync) {
                setLastSyncMinutesAgo(Math.max(0, Math.floor((Date.now() - lastSync) / 60000)));
            }

            if (force) {
                toast.success('Synced live film fraternity jobs from news & production feeds!');
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
            if (force) toast.error('Failed to sync live feeds. Showing cached jobs.');
        } finally {
            setLoading(false);
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        loadJobs();

        // 30-minute background auto-refresh timer check
        const interval = setInterval(() => {
            if (rssJobService.isCacheStale()) {
                console.log('30-minute interval elapsed: refreshing film fraternity jobs...');
                loadJobs(true);
            } else {
                const lastSync = rssJobService.getLastSyncTime();
                if (lastSync) {
                    setLastSyncMinutesAgo(Math.max(0, Math.floor((Date.now() - lastSync) / 60000)));
                }
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
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
            const matchesRole = job.fraternityRole?.toLowerCase().includes(q);
            if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesDescription && !matchesRole) return false;
        }

        // Fraternity Role Filter
        if (subFilter !== 'All') {
            if (job.fraternityRole) {
                if (job.fraternityRole !== subFilter) return false;
            } else {
                const text = `${job.title} ${job.description} ${job.type} ${job.requirements}`.toLowerCase();
                if (!text.includes(subFilter.toLowerCase())) return false;
            }
        }

        return true;
    });

    const renderVerificationBadge = (tier?: 'gold' | 'blue' | 'gray') => {
        if (tier === 'gold') return <span title="Verified Studio / Production House" className="material-symbols-outlined text-amber-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        if (tier === 'blue') return <span title="Verified Recruiter / Director" className="material-symbols-outlined text-sky-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        return null;
    };

    const getFraternityBadgeStyle = (role?: string) => {
        switch (role) {
            case 'Editor':
                return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';
            case 'Cameraman':
                return 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30';
            case 'VFX Artist':
                return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30';
            case 'SFX & Sound':
                return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';
            case 'Musician':
                return 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30';
            case 'Artist & Actor':
                return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
            case 'Makeup & Stylist':
                return 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/30';
            default:
                return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border-zinc-500/30';
        }
    };

    const handleShareJob = async (job: Job, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const shareUrl = `${window.location.origin}/job/${job.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${job.title} at ${job.company}`,
                    text: `Film Fraternity Job: ${job.title} at ${job.company} (${job.location}) — Check it out on iFilmDirectory`,
                    url: shareUrl
                });
            } catch {
                // Cancelled
            }
        } else {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Job link copied to clipboard!');
        }
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
                                        <span>Film & Media Fraternity Jobs</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                            Live Auto-Sync
                                        </span>
                                    </h1>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        Editors, Cameramen, VFX, Sound, Musicians, Castings & Makeup calls
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Top Actions: Post & Manual Sync */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => loadJobs(true)}
                                disabled={isSyncing}
                                className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 transition-all active:scale-95 flex items-center gap-1.5"
                                title="Pull fresh film jobs from RSS news resources"
                            >
                                <span className={`material-symbols-outlined text-base ${isSyncing ? 'animate-spin text-amber-500' : ''}`}>
                                    sync
                                </span>
                                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                            </button>

                            <button
                                onClick={() => {
                                    if (!currentUser) return openAuthModal('Sign in to post a casting call or crew opening');
                                    navigate('/post-job');
                                }}
                                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-base">add_circle</span>
                                <span>Post Call</span>
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
                                placeholder="Search by role (e.g. Editor, Cameraman, VFX, Sound, Musician, Makeup)..."
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

                        {/* Verified Filter & Sync Status */}
                        <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-2.5 px-1">
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Auto-syncs 30m</span>
                            </div>

                            <button
                                onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                    showVerifiedOnly
                                        ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/40 shadow-sm'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:text-zinc-900 dark:hover:text-white shadow-sm'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                <span>Verified</span>
                                <span className={`size-2 rounded-full ${showVerifiedOnly ? 'bg-amber-400 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Category Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {[
                            { id: 'All', label: 'All Openings', icon: 'grid_view' },
                            { id: 'Audition', label: 'Castings & Auditions', icon: 'theater_comedy' },
                            { id: 'Post-Production', label: 'Edit, VFX & Audio', icon: 'movie_filter' },
                            { id: 'Crew', label: 'Camera & Production Crew', icon: 'videocam' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id as any)}
                                className={`whitespace-nowrap flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    filter === item.id
                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/5 shadow-sm'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </header>

                {/* Sub-Filters: Film Fraternity Specific Roles */}
                <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar border-b border-zinc-200 dark:border-white/[0.04] text-[11px]">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider shrink-0 text-[10px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-amber-500">groups</span>
                        <span>Fraternity:</span>
                    </span>
                    {[
                        { id: 'All', label: 'All Fraternity' },
                        { id: 'Editor', label: '✂️ Editors & Colorists' },
                        { id: 'Cameraman', label: '🎥 Cameramen / DOP' },
                        { id: 'VFX Artist', label: '✨ VFX & 3D' },
                        { id: 'SFX & Sound', label: '🔊 SFX & Sound' },
                        { id: 'Musician', label: '🎵 Music Composers' },
                        { id: 'Artist & Actor', label: '🎭 Actors / Audition' },
                        { id: 'Makeup & Stylist', label: '💄 Makeup & Stylists' },
                        { id: 'Crew', label: '🎬 Direction & Crew' }
                    ].map((roleItem) => (
                        <button
                            key={roleItem.id}
                            onClick={() => setSubFilter(roleItem.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all ${
                                subFilter === roleItem.id
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-sm'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-transparent'
                            }`}
                        >
                            {roleItem.label}
                        </button>
                    ))}
                </div>

                {/* Counter Strip & Sync Notice */}
                <div className="flex items-center justify-between py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold flex items-center gap-1.5">
                        <span>Showing <strong className="text-zinc-900 dark:text-white">{filteredJobs.length}</strong> active fraternity opportunities</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline text-zinc-400 text-[11px]">
                            {lastSyncMinutesAgo > 0 ? `Synced ${lastSyncMinutesAgo}m ago` : 'Freshly synced'}
                        </span>
                    </span>
                    {searchQuery && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Matching &quot;{searchQuery}&quot;</span>
                    )}
                </div>

                {/* Jobs Grid (Responsive) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 col-span-full">
                            <div className="size-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-xs font-semibold text-zinc-400">Pulling latest film fraternity jobs...</p>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="col-span-full py-16">
                            <EmptyState
                                message="No fraternity opportunities found"
                                subMessage={showVerifiedOnly || searchQuery || subFilter !== 'All' ? "Try clearing role filters or search query to see more openings." : "New jobs pull every 30 minutes. You can also post an opening!"}
                                icon="work_off"
                                actionLabel={showVerifiedOnly || searchQuery || subFilter !== 'All' ? "Reset Filters" : "Post a Call"}
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
                                    onClick={() => setSelectedJobModal(job)}
                                    className="flex cursor-pointer flex-col justify-between rounded-2xl bg-white dark:bg-[#121316] p-5 shadow-sm dark:shadow-lg border border-zinc-200 dark:border-white/[0.06] hover:border-amber-500/50 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden"
                                >
                                    {/* Top Accents */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.03] rounded-full blur-2xl group-hover:bg-amber-500/[0.08] transition-colors" />

                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-12 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black/60 shadow-inner">
                                                    <PostMedia src={job.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                                                        <span>{job.company}</span>
                                                        {renderVerificationBadge(job.user_details?.verification_tier)}
                                                    </p>
                                                    <h3 className="font-extrabold text-zinc-900 dark:text-white text-base tracking-tight leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                                                        {job.title}
                                                    </h3>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold border uppercase tracking-wider ${badgeColor}`}>
                                                    {job.type}
                                                </span>
                                                {job.fraternityRole && (
                                                    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${getFraternityBadgeStyle(job.fraternityRole)}`}>
                                                        {job.fraternityRole}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description Snippet */}
                                        {job.description && (
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                                                {job.description}
                                            </p>
                                        )}

                                        {/* Meta Chips */}
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/5">
                                                <span className="material-symbols-outlined text-[13px] text-amber-500 dark:text-amber-400">location_on</span>
                                                <span className="truncate max-w-[130px]">{job.location || 'India'}</span>
                                            </span>
                                            {job.salary && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold border border-amber-500/20">
                                                    <span className="material-symbols-outlined text-[13px]">payments</span>
                                                    <span>{job.salary}</span>
                                                </span>
                                            )}
                                            {job.isRss && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-300 text-[10px] font-bold border border-blue-500/20">
                                                    <span className="material-symbols-outlined text-[11px]">rss_feed</span>
                                                    <span>Live Feed</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer Details */}
                                    <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-xs mt-2">
                                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                                            <span>Posted {formatTimeAgo(job.postedAt)}</span>
                                        </span>
                                        <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform text-xs">
                                            <span>Full Details</span>
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </span>
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>
            </div>

            {/* FULL CONTENT MODAL (Like News & Reviews Reader) */}
            {selectedJobModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
                    onClick={() => setSelectedJobModal(null)}
                >
                    <div 
                        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#121316] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl overflow-y-auto flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 z-20 flex items-center justify-between p-4 sm:p-5 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/5">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="size-11 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black/60">
                                    <PostMedia src={selectedJobModal.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                        <span>{selectedJobModal.company}</span>
                                        {renderVerificationBadge(selectedJobModal.user_details?.verification_tier)}
                                        {selectedJobModal.sourceName && (
                                            <span className="text-[10px] text-zinc-400">• {selectedJobModal.sourceName}</span>
                                        )}
                                    </div>
                                    <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white truncate">
                                        {selectedJobModal.title}
                                    </h2>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedJobModal(null)}
                                className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Modal Body: Full Content Breakdown */}
                        <div className="p-5 sm:p-6 space-y-5">
                            {/* Tags Strip */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-lg px-2.5 py-1 text-xs font-black bg-amber-500 text-white">
                                    {selectedJobModal.type}
                                </span>
                                {selectedJobModal.fraternityRole && (
                                    <span className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${getFraternityBadgeStyle(selectedJobModal.fraternityRole)}`}>
                                        {selectedJobModal.fraternityRole}
                                    </span>
                                )}
                                <span className="rounded-lg px-2.5 py-1 text-xs font-bold bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">location_on</span>
                                    <span>{selectedJobModal.location}</span>
                                </span>
                                {selectedJobModal.salary && (
                                    <span className="rounded-lg px-2.5 py-1 text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">payments</span>
                                        <span>{selectedJobModal.salary}</span>
                                    </span>
                                )}
                                <span className="text-xs text-zinc-400 ml-auto flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                    <span>{formatTimeAgo(selectedJobModal.postedAt)}</span>
                                </span>
                            </div>

                            {/* Full Description & Overview */}
                            <div>
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                                    Opportunity Overview & Description
                                </h3>
                                <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                                    {selectedJobModal.fullContent || selectedJobModal.description}
                                </div>
                            </div>

                            {/* Requirements & Tools Needed */}
                            {selectedJobModal.requirements && (
                                <div>
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                                        Key Qualifications & Gear / Software
                                    </h3>
                                    <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-200 dark:border-white/5">
                                        {selectedJobModal.requirements}
                                    </div>
                                </div>
                            )}

                            {/* Audition Details if applicable */}
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

                            {/* Deadline Notice */}
                            {selectedJobModal.deadline && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span className="material-symbols-outlined text-sm text-amber-500">event_available</span>
                                    <span>Application Deadline: <strong>{new Date(selectedJobModal.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                                </div>
                            )}
                        </div>

                        {/* Modal Action Bar */}
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
                                        href={`mailto:${selectedJobModal.applicationEmail}?subject=${encodeURIComponent(`Application for ${selectedJobModal.title} - iFilmDirectory`)}&body=${encodeURIComponent(`Hi ${selectedJobModal.company} Team,\n\nI am writing to apply for the ${selectedJobModal.title} position posted on iFilmDirectory.\n\nPlease find my portfolio and credits attached.\n\nBest regards.`)}`}
                                        className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">mail</span>
                                        <span>Apply via Email</span>
                                    </a>
                                )}

                                {selectedJobModal.sourceUrl && (
                                    <a
                                        href={selectedJobModal.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-105 transition-all"
                                    >
                                        <span className="text-white">Apply on Source</span>
                                        <span className="material-symbols-outlined text-sm text-white">launch</span>
                                    </a>
                                )}

                                {!selectedJobModal.sourceUrl && !selectedJobModal.applicationEmail && (
                                    <button
                                        onClick={() => {
                                            if (!currentUser) {
                                                openAuthModal('Sign in to apply for this role in iFilm');
                                                return;
                                            }
                                            const id = selectedJobModal.id;
                                            setSelectedJobModal(null);
                                            navigate(`/job/${id}`);
                                        }}
                                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:brightness-105 transition-all"
                                    >
                                        <span>Apply in iFilm</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
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
