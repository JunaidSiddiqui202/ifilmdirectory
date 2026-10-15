import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate, useParams } from 'react-router-dom';
import { jobService, type Job } from '../services/jobService';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';
import PostMedia from '../components/PostMedia';
import { useToast } from '../context/ToastContext';

export default function JobDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { currentUser } = useAuth();
    const toast = useToast();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

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

    const handleApply = async () => {
        if (!currentUser) {
            toast.info('Please login to apply for this job.');
            navigate('/login');
            return;
        }

        if (!job?.id) return;

        // Check if it's the job creator trying to apply
        if (job.postedBy === currentUser.uid) {
            toast.error("You cannot apply to your own job posting.");
            return;
        }

        setShowApplyModal(true);
    };

    const confirmApplication = async () => {
        if (!currentUser || !job?.id) return;

        setIsApplying(true);
        try {
            // Get user profile for application data
            const userProfile = await getUserProfile(currentUser.uid);

            const result = await jobService.applyForJob(job.id, currentUser.uid, {
                name: userProfile?.displayName || currentUser.displayName || 'Anonymous',
                email: currentUser.email || '',
                photoURL: userProfile?.photoURL || currentUser.photoURL || '',
                role: userProfile?.role || 'Professional',
                message: applicationMessage.trim() || undefined
            });

            if (result.success) {
                setHasApplied(true);
                setShowApplyModal(false);

                // Show success message
                toast.success(`Application sent to ${job.company}! They will contact you at ${currentUser.email}`);

                // Also open email if applicationEmail exists
                if (job.applicationEmail) {
                    const emailSubject = `Application for ${job.title} - ${userProfile?.displayName || currentUser.displayName}`;
                    const emailBody = `Hi,\n\nI am interested in the ${job.title} position at ${job.company}.\n\n${applicationMessage ? `Additional Message:\n${applicationMessage}\n\n` : ''}You can view my profile at: ${window.location.origin}/profile/${currentUser.uid}\n\nThank you for considering my application.\n\nBest regards,\n${userProfile?.displayName || currentUser.displayName}`;
                    window.open(`mailto:${job.applicationEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);
                }
            } else {
                toast.error(result.error || 'Failed to submit application.');
            }
        } catch (error) {
            console.error('Application error:', error);
            toast.error('Failed to submit application. Please try again.');
        } finally {
            setIsApplying(false);
        }
    };

    const handleBookmark = async () => {
        if (!currentUser || !job?.id) {
            toast.info('Please login to save this job.');
            return;
        }

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
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-[#090A0C] text-white pb-36 md:pb-28 overflow-x-hidden font-display transition-colors">
            <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 px-4 sm:px-6">
                {/* Cinema Top Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#090A0C]/90 -mx-4 sm:-mx-6 px-4 sm:px-6 backdrop-blur-2xl">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-10 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                        title="Back"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <h1 className="flex-1 text-center text-sm sm:text-base font-black tracking-tight text-white uppercase truncate px-3">
                        Call Details
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBookmark}
                            className={`flex size-10 items-center justify-center rounded-xl border transition-all ${
                                isBookmarked
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : 'bg-white/[0.04] text-zinc-400 border-white/5 hover:text-white'
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
                    <section className="relative p-6 sm:p-8 rounded-3xl bg-[#121316] border border-white/[0.08] shadow-xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
                            <div className="size-20 shrink-0 rounded-2xl border-2 border-white/10 shadow-2xl bg-black overflow-hidden">
                                <PostMedia src={job.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <button
                                    onClick={() => navigate(`/profile/${job.postedBy}`)}
                                    className="text-amber-400 text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1.5 mb-1.5"
                                >
                                    <span>{job.company}</span>
                                    {renderVerificationBadge(job.user_details?.verification_tier)}
                                </button>
                                <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-white break-words">
                                    {job.title}
                                </h2>
                            </div>
                        </div>

                        {/* Metadata Badges */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-6 mt-6 border-t border-white/[0.06] relative z-10">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300">
                                <span className="material-symbols-outlined text-sm text-amber-400">location_on</span>
                                <span className="font-semibold">{job.location || 'India'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
                                <span className="material-symbols-outlined text-sm">work</span>
                                <span>{job.type}</span>
                            </div>
                            {job.salary && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                                    <span className="material-symbols-outlined text-sm">payments</span>
                                    <span>₹ {job.salary}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-400">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                <span>Posted {job.postedAt?.toDate ? job.postedAt.toDate().toLocaleDateString() : 'Recently'}</span>
                            </div>
                            {job.deadline && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold ml-auto">
                                    <span className="material-symbols-outlined text-sm">event_busy</span>
                                    <span>Deadline: {job.deadline}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Audition Specific Details */}
                    {job.type === 'Audition' && (
                        <section className="p-6 bg-[#121316] rounded-3xl border border-white/[0.06] shadow-lg">
                            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">theater_comedy</span>
                                <span>Casting & Character Specs</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {job.gender && (
                                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Gender</p>
                                        <p className="text-sm text-white font-bold mt-1">{job.gender}</p>
                                    </div>
                                )}
                                {job.ageRange && (
                                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Age Window</p>
                                        <p className="text-sm text-white font-bold mt-1">{job.ageRange}</p>
                                    </div>
                                )}
                                {job.shootDate && (
                                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Tentative Shoot</p>
                                        <p className="text-sm text-white font-bold mt-1">{new Date(job.shootDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {job.daysRequired && (
                                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Shoot Schedule</p>
                                        <p className="text-sm text-white font-bold mt-1">{job.daysRequired}</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Reference Media */}
                    {job.videoUrl && (
                        <section className="p-6 bg-[#121316] rounded-3xl border border-white/[0.06] shadow-lg">
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-amber-400">play_circle</span>
                                <span>Reference Mood Reel / Character Pitch</span>
                            </h3>
                            <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl border border-white/10">
                                <video src={job.videoUrl} controls className="w-full h-full object-contain" />
                            </div>
                        </section>
                    )}

                    {/* Role Description */}
                    <section className="p-6 sm:p-8 bg-[#121316] rounded-3xl border border-white/[0.06] shadow-lg space-y-4">
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-400 text-xl">description</span>
                            <span>Opportunity Overview</span>
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap font-normal">
                            {job.description}
                        </p>
                    </section>

                    {/* Requirements */}
                    {job.requirements && (
                        <section className="p-6 sm:p-8 bg-[#121316] rounded-3xl border border-white/[0.06] shadow-lg space-y-4">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-400 text-xl">checklist</span>
                                <span>Candidate Requirements & Skills</span>
                            </h3>
                            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap font-normal">
                                {job.requirements}
                            </p>
                        </section>
                    )}

                    {/* Posted By Card */}
                    <section className="p-6 bg-[#121316] rounded-3xl border border-white/[0.06] shadow-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-14 shrink-0 rounded-2xl border border-white/10 overflow-hidden bg-black">
                                    <PostMedia src={job.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recruiter / Production</p>
                                    <p className="text-base font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                                        <span>{job.company}</span>
                                        {renderVerificationBadge(job.user_details?.verification_tier)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/profile/${job.postedBy}`)}
                                className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-all self-start sm:self-auto"
                            >
                                View Creator Profile
                            </button>
                        </div>
                    </section>
                </main>

                {/* Fixed Bottom Action Drawer */}
                <div className="fixed bottom-0 left-0 z-30 w-full bg-[#090A0C]/95 backdrop-blur-xl border-t border-white/[0.08] p-4">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        {isOwnJob ? (
                            <button
                                onClick={() => navigate(`/job/${job.id}/applications`)}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined">group</span>
                                <span>Review Applications ({(job as any).applicationsCount || 0})</span>
                            </button>
                        ) : hasApplied ? (
                            <div className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-extrabold">
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                <span>Application Submitted</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleApply}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-sm font-black shadow-xl shadow-amber-500/20 transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-lg">send</span>
                                <span>Apply with iFilm Profile</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Apply Modal */}
                {showApplyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in" onClick={() => { setShowApplyModal(false); setDisclaimerAccepted(false); }}>
                        <div className="bg-[#141519] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <div className="size-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                                    <span className="material-symbols-outlined text-xl">send</span>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base sm:text-lg font-black text-white truncate">Submit Application</h3>
                                    <p className="text-xs text-zinc-400 truncate">{job.title} • {job.company}</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-1.5 text-xs">
                                <p className="text-zinc-400">
                                    Applying as: <strong className="text-white">{currentUser?.displayName || 'Creator'}</strong>
                                </p>
                                <p className="text-zinc-400">
                                    Direct Contact: <strong className="text-white">{currentUser?.email}</strong>
                                </p>
                            </div>

                            <label className="block space-y-1.5">
                                <span className="text-xs font-bold text-zinc-300">Note to Director / Recruiter (Optional)</span>
                                <textarea
                                    value={applicationMessage}
                                    onChange={(e) => setApplicationMessage(e.target.value)}
                                    placeholder="Introduce yourself, mention key credits, or why you fit this role..."
                                    className="w-full p-3.5 rounded-xl border border-white/10 bg-black/60 text-white placeholder:text-zinc-500 text-xs resize-none h-24 focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </label>

                            {/* Safety Disclaimer */}
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-2">
                                <div className="flex items-center gap-2 text-amber-400 font-bold">
                                    <span className="material-symbols-outlined text-base">verified_user</span>
                                    <span>Film Professional Safety Notice</span>
                                </div>
                                <p className="text-[11px] text-zinc-300 leading-relaxed">
                                    iFilmDirectory connects creative professionals. Never pay money upfront for auditions or role offers. Report any suspicious listings directly to support.
                                </p>
                                <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-white/10">
                                    <input
                                        type="checkbox"
                                        checked={disclaimerAccepted}
                                        onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                                        className="mt-0.5 size-4 rounded border-white/20 bg-black text-amber-500 focus:ring-amber-500 accent-amber-500"
                                    />
                                    <span className="text-[11px] text-zinc-300 font-semibold select-none leading-snug">
                                        I understand and accept independent responsibility for professional communications.
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => { setShowApplyModal(false); setDisclaimerAccepted(false); }}
                                    disabled={isApplying}
                                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-zinc-300 font-bold text-xs hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmApplication}
                                    disabled={isApplying || !disclaimerAccepted}
                                    className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                                >
                                    {isApplying ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-base">check</span>
                                            <span>Confirm & Send</span>
                                        </>
                                    )}
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
