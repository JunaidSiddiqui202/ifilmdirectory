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

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 dark:border-white/10 bg-background-light/80 dark:bg-background-dark/80 px-4 backdrop-blur-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center text-zinc-900 dark:text-white hover:opacity-70 transition-opacity"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                    Job Details
                </h1>
                <button
                    onClick={handleBookmark}
                    className="flex size-10 items-center justify-center text-zinc-900 dark:text-white hover:scale-110 transition-transform"
                >
                    <span
                        className={`material-symbols-outlined text-2xl ${isBookmarked ? 'filled text-primary' : ''
                            }`}
                    >
                        {isBookmarked ? 'bookmark' : 'bookmark_border'}
                    </span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 pb-60 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                {/* Hero Title Section */}
                <section className="relative px-4 pt-8 pb-6 bg-gradient-to-b from-primary/5 to-transparent">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-16 shrink-0 rounded-2xl border-2 border-white dark:border-zinc-800 shadow-md bg-white overflow-hidden">
                            <PostMedia src={job.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <button
                                onClick={() => navigate(`/profile/${job.postedBy}`)}
                                className="text-primary text-sm font-bold uppercase tracking-wider hover:opacity-80 transition-all flex items-center gap-1"
                            >
                                {job.company}
                                {job.user_details?.verification_tier === 'gold' && <span title="Verified Production House">🥇</span>}
                                {job.user_details?.verification_tier === 'blue' && <span title="Verified Professional">🔵</span>}
                            </button>
                            <h2 className="text-[28px] font-black leading-tight tracking-tight text-zinc-900 dark:text-white break-words">
                                {job.title}
                            </h2>
                        </div>
                    </div>

                    {/* Quick Metadata Bar */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/5">
                            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/5">
                            <span className="material-symbols-outlined text-sm text-primary">work</span>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{job.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/5">
                            <span className="material-symbols-outlined text-sm text-primary">payments</span>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{job.salary}</span>
                        </div>
                    </div>
                </section>

                {/* Deadline & Post Info */}
                <section className="px-4 py-4 flex items-center justify-between border-y border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">Posted On</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                            {job.postedAt?.toDate ? job.postedAt.toDate().toLocaleDateString() : 'Recently'}
                        </span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] font-black uppercase text-red-400 tracking-widest">Deadline</span>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            {job.deadline}
                        </span>
                    </div>
                </section>

                {/* Audition Specific Details */}
                {job.type === 'Audition' && (
                    <section className="m-4 p-5 bg-primary/5 dark:bg-white/[0.03] rounded-2xl border border-primary/10 dark:border-white/5">
                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Audition Requirements</h3>
                        <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                            {job.gender && (
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Gender</p>
                                    <p className="text-sm text-zinc-900 dark:text-white font-bold">{job.gender}</p>
                                </div>
                            )}
                            {job.ageRange && (
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Age Range</p>
                                    <p className="text-sm text-zinc-900 dark:text-white font-bold">{job.ageRange}</p>
                                </div>
                            )}
                            {job.shootDate && (
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Shoot Date</p>
                                    <p className="text-sm text-zinc-900 dark:text-white font-bold">{new Date(job.shootDate).toLocaleDateString()}</p>
                                </div>
                            )}
                            {job.daysRequired && (
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Duration</p>
                                    <p className="text-sm text-zinc-900 dark:text-white font-bold">{job.daysRequired}</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Reference Media */}
                {job.videoUrl && (
                    <section className="px-4 py-6">
                        <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3">Reference Video</h3>
                        <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-lg ring-1 ring-white/10">
                            <video src={job.videoUrl} controls className="w-full h-full object-contain" />
                        </div>
                    </section>
                )}

                {/* External Links */}
                {job.externalLinks && (job.externalLinks.imdb || job.externalLinks.wiki) && (
                    <section className="px-4 py-2 flex gap-3">
                        {job.externalLinks.imdb && (
                            <a href={job.externalLinks.imdb} target="_blank" rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#f5c518] text-black font-black rounded-xl text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform">
                                <span className="material-symbols-outlined text-lg">movie</span>
                                IMDb
                            </a>
                        )}
                        {job.externalLinks.wiki && (
                            <a href={job.externalLinks.wiki} target="_blank" rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black rounded-xl text-xs uppercase tracking-wider hover:scale-[1.02] transition-transform">
                                <span className="material-symbols-outlined text-lg">public</span>
                                Wikipedia
                            </a>
                        )}
                    </section>
                )}

                {/* Main Content Sections */}
                <div className="px-4 pt-8 space-y-10">
                    <section>
                        <h3 className="text-[22px] font-black text-zinc-900 dark:text-white mb-4">Role Description</h3>
                        <p className="text-[15px] font-medium leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                            {job.description}
                        </p>
                    </section>

                    <section>
                        <h3 className="text-[22px] font-black text-zinc-900 dark:text-white mb-4">Requirements</h3>
                        <p className="text-[15px] font-medium leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                            {job.requirements}
                        </p>
                    </section>
                    {/* Posted By */}
                    <section className="px-4 pt-8">
                        <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-4">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Posted By</h3>
                            <div className="flex items-center gap-4 pt-4">
                                <div className="size-14 shrink-0 rounded-full border-2 border-primary overflow-hidden">
                                    <PostMedia src={job.logo || ''} fallbackType="COMPANY_LOGO" className="w-full h-full" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                                        {job.company}
                                        {job.user_details?.verification_tier === 'gold' && <span title="Verified Production House">🥇</span>}
                                        {job.user_details?.verification_tier === 'blue' && <span title="Verified Professional">🔵</span>}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(`/profile/${job.postedBy}`)}
                                    className="flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 px-4 text-sm font-bold text-primary hover:bg-primary/30 transition-colors"
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer with Apply Button */}
            <div className="fixed bottom-20 left-0 z-20 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4">
                {isOwnJob ? (
                    <button
                        onClick={() => navigate(`/job/${job.id}/applications`)}
                        className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-bold text-white hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined mr-2">group</span>
                        View Applications
                    </button>
                ) : hasApplied ? (
                    <button
                        disabled
                        className="flex h-12 w-full items-center justify-center rounded-lg bg-green-600 text-base font-bold text-white"
                    >
                        <span className="material-symbols-outlined mr-2">check_circle</span>
                        Applied Successfully
                    </button>
                ) : (
                    <button
                        onClick={handleApply}
                        className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-bold text-white hover:bg-primary/90 transition-colors"
                    >
                        Apply Now
                    </button>
                )}
            </div>

            {/* Apply Modal */}
            {
                showApplyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowApplyModal(false); setDisclaimerAccepted(false); }}>
                        <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 mx-4 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">send</span>
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Apply for {job.title}</h3>
                            </div>

                            <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                    <span className="font-medium">Company:</span> {job.company}
                                </p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                    <span className="font-medium">Your Email:</span> {currentUser?.email}
                                </p>
                            </div>

                            <label className="block mb-4">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Add a message (optional)</span>
                                <textarea
                                    value={applicationMessage}
                                    onChange={(e) => setApplicationMessage(e.target.value)}
                                    placeholder="Tell them why you're a great fit..."
                                    className="mt-1 w-full p-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white resize-none h-24"
                                />
                            </label>

                            {/* Legal Safety Disclaimer */}
                            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                                <div className="flex items-start gap-2 mb-2">
                                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 mt-0.5">warning</span>
                                    <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Safety Disclaimer</h4>
                                </div>
                                <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed mb-3">
                                    <strong>IMPORTANT:</strong> iFilmDirectory is a platform that connects film industry professionals. We do not employ, endorse, or verify any job poster or their listings. By applying:
                                </p>
                                <ul className="text-xs text-amber-700 dark:text-amber-300/90 space-y-1 mb-3 ml-4 list-disc">
                                    <li>You acknowledge this is your own decision and responsibility.</li>
                                    <li>iFilmDirectory is <strong>NOT responsible</strong> for any non-payment, misbehavior, fraud, or disputes.</li>
                                    <li>Always verify the legitimacy of job postings independently.</li>
                                    <li>Meet in public places for initial meetings.</li>
                                    <li>Never pay money upfront for any job opportunity.</li>
                                    <li>Report suspicious postings to us immediately.</li>
                                </ul>
                                <label className="flex items-start gap-3 cursor-pointer mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                                    <input
                                        type="checkbox"
                                        checked={disclaimerAccepted}
                                        onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-amber-400 text-primary focus:ring-primary"
                                    />
                                    <span className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                                        I understand and accept that iFilmDirectory acts only as a platform and bears no responsibility for any interactions, payments, or outcomes resulting from this application.
                                    </span>
                                </label>
                            </div>

                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                                Your profile link will be shared with {job.company}. They will contact you at your registered email if interested.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowApplyModal(false); setDisclaimerAccepted(false); }}
                                    disabled={isApplying}
                                    className="flex-1 py-2.5 px-4 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmApplication}
                                    disabled={isApplying || !disclaimerAccepted}
                                    title={!disclaimerAccepted ? 'Please accept the safety disclaimer to continue' : ''}
                                    className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isApplying ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-lg">send</span>
                                            Send Application
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            </div>

            <BottomNav />
        </div>
    );
}
