import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate, useParams } from 'react-router-dom';
import { jobService, type Job } from '../services/jobService';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import PostMedia from '../components/PostMedia';
import { useToast } from '../context/ToastContext';
import SEO, { JobStructuredData, BreadcrumbStructuredData } from '../components/SEO';

export default function JobDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();
    const toast = useToast();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);
    const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [disclaimerConfirmed, setDisclaimerConfirmed] = useState(true);

    const executeWithDisclaimer = (action: () => void) => {
        const isAccepted = typeof localStorage !== 'undefined' && localStorage.getItem('ifilm_job_disclaimer_accepted') === 'true';
        if (isAccepted) {
            action();
        } else {
            setPendingAction(() => action);
            setShowDisclaimerModal(true);
        }
    };

    const handleConfirmDisclaimer = () => {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('ifilm_job_disclaimer_accepted', 'true');
        }
        setShowDisclaimerModal(false);
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    useEffect(() => {
        const fetchJob = async () => {
            if (id) {
                const fetchedJob = await jobService.getJobById(id);
                setJob(fetchedJob);

                // Check if user has already applied or bookmarked
                if (currentUser && fetchedJob) {
                    const [applied, bookmarked] = await Promise.all([
                        jobService.checkIfApplied(id, currentUser.uid),
                        jobService.checkIfBookmarked(id, currentUser.uid)
                    ]);
                    setHasApplied(applied);
                    setIsBookmarked(bookmarked);
                }
            }
            setLoading(false);
        };
        fetchJob();
    }, [id, currentUser]);

    const handleBookmark = async () => {
        if (!currentUser) {
            openAuthModal('Sign in to save this job to your bookmarks');
            return;
        }
        if (!job?.id) return;

        const result = await jobService.toggleBookmarkJob(job.id, currentUser.uid);
        if (result.success) {
            setIsBookmarked(result.isBookmarked);
            toast.success(result.isBookmarked ? 'Job saved to bookmarks' : 'Job removed from bookmarks');
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background-light dark:bg-background-dark">
                <p className="text-zinc-500">Job not found.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary underline">Go Back</button>
            </div>
        );
    }

    const isOwnJob = currentUser?.uid === job.postedBy;

    const renderVerificationBadge = (tier?: 'gold' | 'blue' | 'gray') => {
        if (tier === 'gold') return <span title="Verified Studio / Production House" className="material-symbols-outlined text-amber-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        if (tier === 'blue') return <span title="Verified Recruiter / Director" className="material-symbols-outlined text-sky-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        return null;
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-36 md:pb-28 overflow-x-hidden font-display transition-colors">
            {job && (
                <>
                    <SEO
                        title={`${job.title} - ${job.company || 'Audition & Casting Call'}`}
                        description={job.description ? job.description.slice(0, 160) : `Casting call for ${job.title} by ${job.company || 'Film Production'}. Location: ${job.location || 'Pan-India'}. Apply directly on iFilmDirectory.`}
                        keywords={[
                            job.title,
                            job.company,
                            job.location,
                            'casting call',
                            'film audition',
                            'movie audition',
                            'film job'
                        ].filter(Boolean) as string[]}
                    />
                    <JobStructuredData
                        title={job.title}
                        description={job.description || job.title}
                        company={job.company || 'Film Production Banner'}
                        location={job.location || 'Pan-India'}
                        employmentType="CONTRACTOR"
                        datePosted={job.postedAt ? (typeof job.postedAt === 'string' ? job.postedAt : (job.postedAt.toDate ? job.postedAt.toDate().toISOString() : new Date().toISOString())) : new Date().toISOString()}
                        url={typeof window !== 'undefined' ? window.location.href : `https://ifilmdirectory.com/job/${id}`}
                    />
                    <BreadcrumbStructuredData
                        items={[
                            { name: 'Home', url: '/' },
                            { name: 'Jobs & Auditions', url: '/jobs' },
                            { name: job.title, url: `/job/${id}` }
                        ]}
                    />
                </>
            )}
            <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 px-4 sm:px-6">
                {/* Cinema Top Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] bg-white/90 dark:bg-[#090A0C]/90 -mx-4 sm:-mx-6 px-4 sm:px-6 backdrop-blur-2xl">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                        title="Back"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <h1 className="flex-1 text-center text-sm sm:text-base font-black tracking-tight text-zinc-900 dark:text-white uppercase truncate px-3">
                        Call Details
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBookmark}
                            className={`flex size-10 items-center justify-center rounded-xl border transition-all ${
                                isBookmarked
                                    ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30'
                                    : 'bg-white dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                            title={isBookmarked ? "Saved to Bookmarks" : "Save Job"}
                        >
                            <span className="material-symbols-outlined text-xl" style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                {isBookmarked ? 'bookmark' : 'bookmark_border'}
                            </span>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 pt-6 pb-20 space-y-6">
                    {/* Hero Title Section */}
                    <section className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm dark:shadow-xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
                            <div className="size-20 shrink-0 rounded-2xl border-2 border-zinc-200 dark:border-white/10 shadow-2xl bg-zinc-100 dark:bg-black overflow-hidden">
                                <PostMedia src={job.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <button
                                    onClick={() => navigate(`/profile/${job.postedBy}`)}
                                    className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1.5 mb-1.5"
                                >
                                    <span>{job.company}</span>
                                    {renderVerificationBadge(job.user_details?.verification_tier)}
                                </button>
                                <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-white break-words">
                                    {job.title}
                                </h2>
                            </div>
                        </div>

                        {/* Metadata Badges */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-6 mt-6 border-t border-zinc-200 dark:border-white/[0.06] relative z-10">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-xs text-zinc-700 dark:text-zinc-300">
                                <span className="material-symbols-outlined text-sm text-amber-500 dark:text-amber-400">location_on</span>
                                <span className="font-semibold">{job.location || 'India'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20 text-xs font-bold">
                                <span className="material-symbols-outlined text-sm">work</span>
                                <span>{job.type}</span>
                            </div>
                            {job.fraternityRole && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-bold">
                                    <span className="material-symbols-outlined text-sm">movie_filter</span>
                                    <span>{job.fraternityRole}</span>
                                </div>
                            )}
                            {job.isRss && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    <span>Verified Portal</span>
                                </div>
                            )}
                            {job.salary && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                                    <span className="material-symbols-outlined text-sm">payments</span>
                                    <span>{job.salary}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-xs text-zinc-600 dark:text-zinc-400">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                <span>Posted {job.postedAt?.toDate ? job.postedAt.toDate().toLocaleDateString() : 'Recently'}</span>
                            </div>
                            {job.deadline && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 text-xs font-bold sm:ml-auto">
                                    <span className="material-symbols-outlined text-sm">event_busy</span>
                                    <span>Deadline: {job.deadline}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Audition Specific Details */}
                    {job.type === 'Audition' && (
                        <section className="p-6 bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-sm dark:shadow-lg">
                            <h3 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">theater_comedy</span>
                                <span>Casting & Character Specs</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {job.gender && (
                                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5">
                                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Gender</p>
                                        <p className="text-sm text-zinc-900 dark:text-white font-bold mt-1">{job.gender}</p>
                                    </div>
                                )}
                                {job.ageRange && (
                                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5">
                                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Age Window</p>
                                        <p className="text-sm text-zinc-900 dark:text-white font-bold mt-1">{job.ageRange}</p>
                                    </div>
                                )}
                                {job.shootDate && (
                                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5">
                                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Tentative Shoot</p>
                                        <p className="text-sm text-zinc-900 dark:text-white font-bold mt-1">{new Date(job.shootDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {job.daysRequired && (
                                    <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5">
                                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Shoot Schedule</p>
                                        <p className="text-sm text-zinc-900 dark:text-white font-bold mt-1">{job.daysRequired}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Reference Media */}
                    {job.videoUrl && (
                        <section className="p-6 bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-sm dark:shadow-lg">
                            <h3 className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-amber-500 dark:text-amber-400">play_circle</span>
                                <span>Reference Mood Reel / Character Pitch</span>
                            </h3>
                            <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl border border-zinc-200 dark:border-white/10">
                                <video src={job.videoUrl} controls className="w-full h-full object-contain" />
                            </div>
                        </section>
                    )}

                    {/* Role Description & Full Content */}
                    <section className="p-6 sm:p-8 bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-sm dark:shadow-lg space-y-4">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-xl">description</span>
                            <span>Opportunity Overview</span>
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line font-normal">
                            {job.fullContent || job.description}
                        </p>
                    </section>

                    {/* Requirements */}
                    {job.requirements && (
                        <section className="p-6 sm:p-8 bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-sm dark:shadow-lg space-y-4">
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-xl">checklist</span>
                                <span>Candidate Requirements & Skills</span>
                            </h3>
                            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line font-normal">
                                {job.requirements}
                            </p>
                        </section>
                    )}

                    {/* Posted By Card */}
                    <section className="p-6 bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-sm dark:shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-14 shrink-0 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden bg-zinc-100 dark:bg-black">
                                    <PostMedia src={job.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recruiter / Production</p>
                                    <p className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                                        <span>{job.company}</span>
                                        {renderVerificationBadge(job.user_details?.verification_tier)}
                                    </p>
                                    {job.sourceName && (
                                        <p className="text-xs text-zinc-400 mt-0.5">Via {job.sourceName}</p>
                                    )}
                                </div>
                            </div>
                            {job.sourceUrl ? (
                                <button
                                    type="button"
                                    onClick={() => executeWithDisclaimer(() => {
                                        if (job.sourceUrl) window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
                                    })}
                                    className="px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/30 transition-all self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
                                >
                                    <span>View Original Listing</span>
                                    <span className="material-symbols-outlined text-sm">launch</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate(`/profile/${job.postedBy}`)}
                                    className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/10 text-zinc-900 dark:text-white text-xs font-bold border border-zinc-200 dark:border-white/10 transition-all self-start sm:self-auto"
                                >
                                    View Creator Profile
                                </button>
                            )}
                        </div>
                    </section>

                    {/* CASTING & RECRUITMENT SAFETY DISCLAIMER */}
                    <section className="rounded-3xl bg-amber-50/90 dark:bg-[#1a1714] border border-amber-300/80 dark:border-amber-500/30 p-5 sm:p-6 space-y-3.5 shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-amber-800 dark:text-amber-400 text-xl">verified_user</span>
                            <h3 className="text-sm font-extrabold text-amber-950 dark:text-white">
                                iFilmDirectory Casting & Opportunity Safety Notice
                            </h3>
                        </div>
                        <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
                            iFilmDirectory is an open directory for film fraternity opportunities. <strong>Never pay money for auditions, registration, security deposits, or artist cards.</strong> Legitimate productions and casting directors never charge talent. Always verify production banners independently before attending private auditions or sharing sensitive personal data.
                        </p>
                        <div className="p-3.5 rounded-2xl bg-amber-100/70 dark:bg-black/50 border border-amber-300/70 dark:border-amber-500/20 text-xs text-zinc-900 dark:text-zinc-200 space-y-1.5 leading-relaxed">
                            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-400 text-xs">
                                <span className="material-symbols-outlined text-base">info</span>
                                <span>Platform Disclaimer: Automated Feed & Transactions</span>
                            </div>
                            <p className="text-[11px] text-zinc-800 dark:text-zinc-300">
                                • <strong>Financial Transactions:</strong> iFilmDirectory is <strong>not responsible for any money transactions</strong> between users, applicants, recruiters, or production banners.
                            </p>
                            <p className="text-[11px] text-zinc-800 dark:text-zinc-300">
                                • <strong>Automated Feed:</strong> Please note this is an <strong>automated feed</strong> and directory aggregation; iFilmDirectory is <strong>not responsible for external apply links workings, availability, or third-party website redirects</strong>.
                            </p>
                        </div>
                        <div className="pt-2 border-t border-amber-300/50 dark:border-amber-500/20 flex flex-wrap items-center justify-end gap-3 text-xs">
                            <a
                                href="mailto:support@ifilmdirectory.com"
                                className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:text-amber-600 transition-colors"
                            >
                                Help & Support Desk
                            </a>
                        </div>
                    </section>
                </main>

                {/* Fixed Bottom Action Drawer */}
                <div className="fixed bottom-0 left-0 z-30 w-full bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/[0.08] p-4">
                    <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3">
                        {isOwnJob ? (
                            <button
                                onClick={() => navigate(`/job/${job.id}/applications`)}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined">group</span>
                                <span>Review Applications ({(job as any).applicationsCount || 0})</span>
                            </button>
                        ) : hasApplied ? (
                            <div className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                <span>Application Submitted</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 w-full">
                                {job.sourceUrl && (
                                    <button
                                        type="button"
                                        onClick={() => executeWithDisclaimer(() => {
                                            if (job.sourceUrl) window.open(job.sourceUrl, '_blank', 'noopener,noreferrer');
                                        })}
                                        className="flex-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 !text-white text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                                        style={{ color: '#ffffff' }}
                                    >
                                        <span className="!text-white font-extrabold" style={{ color: '#ffffff' }}>Apply on Source</span>
                                        <span className="material-symbols-outlined text-sm !text-white" style={{ color: '#ffffff' }}>launch</span>
                                    </button>
                                )}

                                {job.applicationEmail && (
                                    <button
                                        type="button"
                                        onClick={() => executeWithDisclaimer(() => {
                                            if (job.applicationEmail) {
                                                window.location.href = `mailto:${job.applicationEmail}?subject=${encodeURIComponent(`Application for ${job.title} - iFilmDirectory`)}&body=${encodeURIComponent(`Hi ${job.company} Team,\n\nI am applying for the ${job.title} role posted on iFilmDirectory.\n\nPlease find my showreel and profile attached.\n\nBest regards.`)}`;
                                            }
                                        })}
                                        className="flex-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 !text-white text-xs sm:text-sm font-black border border-zinc-800 dark:border-white/10 shadow-lg transition-all active:scale-95 cursor-pointer"
                                        style={{ color: '#ffffff' }}
                                    >
                                        <span className="material-symbols-outlined text-base !text-white" style={{ color: '#ffffff' }}>mail</span>
                                        <span className="!text-white font-black" style={{ color: '#ffffff' }}>Email Studio</span>
                                    </button>
                                )}

                                {!job.sourceUrl && !job.applicationEmail && (
                                    <button
                                        type="button"
                                        onClick={() => executeWithDisclaimer(() => {
                                            window.location.href = `mailto:support@ifilmdirectory.com?subject=${encodeURIComponent(`Inquiry for ${job.title} (${job.company}) - iFilmDirectory`)}`;
                                        })}
                                        className="flex-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 hover:bg-zinc-800 !text-white text-xs sm:text-sm font-black transition-all cursor-pointer"
                                        style={{ color: '#ffffff' }}
                                    >
                                        <span className="material-symbols-outlined text-base !text-white" style={{ color: '#ffffff' }}>mail</span>
                                        <span className="!text-white font-black" style={{ color: '#ffffff' }}>Contact via Support</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 1st-Time Disclaimer Modal */}
                {showDisclaimerModal && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
                        onClick={() => setShowDisclaimerModal(false)}
                    >
                        <div 
                            className="bg-white dark:bg-[#141519] border border-amber-300/60 dark:border-amber-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-scale-in"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/10 pb-4">
                                <div className="size-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white leading-tight">
                                        Casting & Opportunity Safety Notice
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Please review before continuing to external portal or recruiter
                                    </p>
                                </div>
                            </div>

                            {/* Disclaimer Content */}
                            <div className="space-y-3 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                                <p className="font-normal">
                                    iFilmDirectory is an open directory for film fraternity opportunities. <strong>Never pay money for auditions, registration, security deposits, or artist cards.</strong> Legitimate productions and casting directors never charge talent. Always verify production banners independently before attending private auditions or sharing sensitive personal data.
                                </p>

                                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-black/40 border border-amber-300/70 dark:border-amber-500/20 space-y-2 text-[11px] text-zinc-700 dark:text-zinc-300">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-400">
                                        <span className="material-symbols-outlined text-sm">info</span>
                                        <span>Important Platform Notice:</span>
                                    </div>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>We are <strong>not responsible for any money transactions</strong> between users, applicants, recruiters, or production banners.</li>
                                        <li>This is an <strong>automated feed</strong>; we are <strong>not responsible for external apply links workings, availability, or third-party web redirects</strong>.</li>
                                    </ul>
                                </div>

                                <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-zinc-200 dark:border-white/10">
                                    <input
                                        type="checkbox"
                                        checked={disclaimerConfirmed}
                                        onChange={(e) => setDisclaimerConfirmed(e.target.checked)}
                                        className="mt-0.5 size-4 rounded border-zinc-300 dark:border-white/20 bg-white dark:bg-black text-amber-500 focus:ring-amber-500 accent-amber-500"
                                    />
                                    <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold select-none leading-snug">
                                        I understand and agree to the platform safety disclaimer (Do not show again).
                                    </span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDisclaimerModal(false)}
                                    className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDisclaimer}
                                    disabled={!disclaimerConfirmed}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
                                >
                                    <span>Accept & Continue</span>
                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
