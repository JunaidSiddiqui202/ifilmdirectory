import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { useNavigate, useParams } from 'react-router-dom';
import { jobService, type Job } from '../services/jobService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Application {
    id: string;
    applicantId: string;
    name: string;
    email: string;
    photoURL?: string;
    role?: string;
    message?: string;
    appliedAt: any;
    status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
}

export default function JobApplications() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { currentUser } = useAuth();
    const toast = useToast();
    const [job, setJob] = useState<Job | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            // Fetch job details
            const fetchedJob = await jobService.getJobById(id);
            if (!fetchedJob) {
                toast.error('Casting call / Job not found');
                navigate('/jobs');
                return;
            }

            // Check if user is the owner
            if (fetchedJob.postedBy !== currentUser?.uid) {
                toast.error('You can only view applications for your own postings.');
                navigate('/jobs');
                return;
            }

            setJob(fetchedJob);

            // Fetch applications
            const apps = await jobService.getApplicationsForJob(id) as Application[];
            setApplications(apps || []);
            setLoading(false);
        };

        fetchData();
    }, [id, currentUser, navigate]);

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return 'Recently';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'shortlisted':
                return {
                    bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
                    dot: 'bg-emerald-400'
                };
            case 'reviewed':
                return {
                    bg: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
                    dot: 'bg-sky-400'
                };
            case 'rejected':
                return {
                    bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
                    dot: 'bg-rose-400'
                };
            default:
                return {
                    bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
                    dot: 'bg-amber-400'
                };
        }
    };

    const handleUpdateStatus = async (applicationId: string, newStatus: 'pending' | 'reviewed' | 'shortlisted' | 'rejected') => {
        try {
            const result = await jobService.updateApplicationStatus(applicationId, newStatus);
            if (result.success) {
                setApplications(prev => prev.map(app =>
                    app.id === applicationId ? { ...app, status: newStatus } : app
                ));
                toast.success(`Application marked as ${newStatus}`);
            } else {
                toast.error(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
        setActiveStatusMenu(null);
    };

    const filteredApplications = applications.filter(app => {
        if (selectedFilter === 'all') return true;
        return app.status === selectedFilter;
    });

    if (loading) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 dark:bg-[#090A0C]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white overflow-x-hidden selection:bg-amber-500/30 font-display transition-colors">
            {/* Top Navigation */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#090A0C]/90 px-4 md:px-8 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-white transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
                    </button>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span>Candidate Applications</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                {applications.length} Received
                            </span>
                        </h1>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs md:max-w-md">
                            {job?.title} • {job?.company || 'Direct Production'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/job/${id}`)}
                    className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-all"
                >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View Job Listing
                </button>
            </header>

            <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 px-4 md:px-8 py-6 pb-28">
                {/* Hero Job Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#121316] via-[#17191e] to-[#121316] p-5 md:p-6 border border-white/[0.08] shadow-xl mb-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                    <span className="material-symbols-outlined text-xs">movie</span>
                                    {job?.type || (job as any)?.category || 'Film Production'}
                                </span>
                                {job?.location && (
                                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        {job.location}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white">{job?.title}</h2>
                            <p className="text-sm text-zinc-400">
                                Recruiter Desk • Manage auditions, shortlist talent, and reach out directly.
                            </p>
                        </div>

                        {/* Quick Metrics */}
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-center min-w-[80px]">
                                <div className="text-lg font-black text-amber-400">
                                    {applications.filter(a => a.status === 'shortlisted').length}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Shortlisted</div>
                            </div>
                            <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-center min-w-[80px]">
                                <div className="text-lg font-black text-sky-400">
                                    {applications.filter(a => a.status === 'reviewed').length}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Reviewed</div>
                            </div>
                            <div className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-center min-w-[80px]">
                                <div className="text-lg font-black text-zinc-200">
                                    {applications.filter(a => a.status === 'pending').length}
                                </div>
                                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Pending</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
                    {(['all', 'shortlisted', 'reviewed', 'pending', 'rejected'] as const).map((filter) => {
                        const count = filter === 'all'
                            ? applications.length
                            : applications.filter(a => a.status === filter).length;
                        const isSelected = selectedFilter === filter;

                        return (
                            <button
                                key={filter}
                                onClick={() => setSelectedFilter(filter)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all flex items-center gap-2 border ${
                                    isSelected
                                        ? 'bg-amber-500 text-white border-transparent shadow-md shadow-amber-500/20'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.06] hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20'
                                }`}
                            >
                                <span>{filter}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Applications Grid */}
                <main className="flex-1">
                    {filteredApplications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-amber-500 dark:text-amber-400">group_off</span>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                                {selectedFilter === 'all' ? 'No applications received yet' : `No ${selectedFilter} candidates`}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                                {selectedFilter === 'all'
                                    ? 'Casting calls usually pick up traction within 24-48 hours of posting.'
                                    : `Try changing your filter to view pending or shortlisted applicants.`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredApplications.map((app) => {
                                const badgeStyle = getStatusBadge(app.status);

                                return (
                                    <div
                                        key={app.id}
                                        className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/30 p-5 transition-all shadow-sm hover:shadow-md dark:shadow-lg flex flex-col justify-between group"
                                    >
                                        <div>
                                            {/* Candidate Header */}
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img
                                                            src={app.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=1c1d22&color=f59e0b`}
                                                            alt={app.name}
                                                            className="w-13 h-13 rounded-2xl object-cover shrink-0 cursor-pointer border border-zinc-200 dark:border-white/10 group-hover:border-amber-500/40 transition-colors shadow-sm"
                                                            onClick={() => navigate(`/profile/${app.applicantId}`)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3
                                                            className="font-bold text-zinc-900 dark:text-white text-base cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
                                                            onClick={() => navigate(`/profile/${app.applicantId}`)}
                                                        >
                                                            {app.name}
                                                            <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-sm">verified</span>
                                                        </h3>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                                            {app.role || 'Film Industry Professional'}
                                                        </p>
                                                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                                                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                            {formatDate(app.appliedAt)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status Selector Dropdown */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveStatusMenu(activeStatusMenu === app.id ? null : app.id)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize flex items-center gap-1.5 border transition-all ${badgeStyle.bg}`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
                                                        <span>{app.status}</span>
                                                        <span className="material-symbols-outlined text-sm">expand_more</span>
                                                    </button>

                                                    {activeStatusMenu === app.id && (
                                                        <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#17191e] rounded-xl shadow-2xl border border-zinc-200 dark:border-white/[0.12] z-30 p-1.5 backdrop-blur-xl">
                                                            {(['pending', 'reviewed', 'shortlisted', 'rejected'] as const).map((status) => {
                                                                const statusConfig = getStatusBadge(status);
                                                                return (
                                                                    <button
                                                                        key={status}
                                                                        onClick={() => handleUpdateStatus(app.id, status)}
                                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold capitalize hover:bg-zinc-100 dark:hover:bg-white/[0.08] flex items-center gap-2 transition-colors ${
                                                                            app.status === status ? 'bg-zinc-100 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-bold' : 'text-zinc-700 dark:text-zinc-300'
                                                                        }`}
                                                                    >
                                                                        <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                                                                        {status}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Pitch Message / Note */}
                                            {app.message && (
                                                <div className="bg-black/30 border border-white/[0.04] rounded-xl p-3.5 mb-4">
                                                    <div className="text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs text-amber-400">format_quote</span>
                                                        Applicant Pitch Note:
                                                    </div>
                                                    <p className="text-xs text-zinc-300 italic line-clamp-3 leading-relaxed">
                                                        "{app.message}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Direct Contact Info */}
                                            <div className="text-xs text-zinc-400 flex items-center gap-2 mb-4 px-1">
                                                <span className="material-symbols-outlined text-sm text-zinc-500">mail</span>
                                                <span className="font-mono text-[11px] text-zinc-300 truncate">{app.email}</span>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                                            <button
                                                onClick={() => navigate(`/profile/${app.applicantId}`)}
                                                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                                            >
                                                <span className="material-symbols-outlined text-sm text-white">person</span>
                                                <span className="text-white">View Profile</span>
                                            </button>
                                            <button
                                                onClick={() => navigate(`/messaging/${app.applicantId}`)}
                                                className="py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                                                title="Direct Message"
                                            >
                                                <span className="material-symbols-outlined text-sm text-amber-400">chat</span>
                                                Chat
                                            </button>
                                            <button
                                                onClick={() => window.open(`mailto:${app.email}?subject=Regarding your application for ${job?.title} on iFilm Directory`)}
                                                className="py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] text-xs font-semibold transition-all flex items-center justify-center"
                                                title="Send Email"
                                            >
                                                <span className="material-symbols-outlined text-sm">mail</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
