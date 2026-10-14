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

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            // Fetch job details
            const fetchedJob = await jobService.getJobById(id);
            if (!fetchedJob) {
                toast.error('Job not found');
                navigate('/jobs');
                return;
            }

            // Check if user is the owner
            if (fetchedJob.postedBy !== currentUser?.uid) {
                toast.error('You can only view applications for your own job postings.');
                navigate('/jobs');
                return;
            }

            setJob(fetchedJob);

            // Fetch applications
            const apps = await jobService.getApplicationsForJob(id) as Application[];
            setApplications(apps);
            setLoading(false);
        };

        fetchData();
    }, [id, currentUser, navigate]);

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'shortlisted': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'reviewed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);

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
            <div className="flex min-h-[100dvh] items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto flex flex-col flex-1 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 dark:border-white/10 bg-background-light/80 dark:bg-background-dark/80 px-4 backdrop-blur-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 items-center justify-center text-zinc-900 dark:text-white hover:opacity-70 transition-opacity"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                    Applications
                </h1>
                <div className="w-10" />
            </header>

            {/* Job Info Banner */}
            <div className="bg-primary/10 dark:bg-primary/20 px-4 py-3 border-b border-primary/20">
                <h2 className="font-bold text-zinc-900 dark:text-white">{job?.title}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{job?.company} • {applications.length} application{applications.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-4 overflow-x-auto">
                {['all', 'pending', 'reviewed', 'shortlisted', 'rejected'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setSelectedFilter(filter)}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${selectedFilter === filter
                            ? 'bg-primary text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                    >
                        {filter} {filter === 'all' ? `(${applications.length})` : `(${applications.filter(a => a.status === filter).length})`}
                    </button>
                ))}
            </div>

            {/* Applications List */}
            <main className="flex-1 pb-24">
                {filteredApplications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <span className="material-symbols-outlined text-5xl text-zinc-300 dark:text-zinc-600 mb-4">inbox</span>
                        <h3 className="text-lg font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                            {selectedFilter === 'all' ? 'No applications yet' : `No ${selectedFilter} applications`}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-500">
                            {selectedFilter === 'all'
                                ? 'Applications will appear here when candidates apply.'
                                : `No applications with "${selectedFilter}" status.`}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredApplications.map((app) => (
                            <div
                                key={app.id}
                                className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex gap-3">
                                    {/* Profile Photo */}
                                    <img
                                        src={app.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=random`}
                                        alt={app.name}
                                        className="w-12 h-12 rounded-full object-cover shrink-0 cursor-pointer border-2 border-zinc-200 dark:border-zinc-700"
                                        onClick={() => navigate(`/profile/${app.applicantId}`)}
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div>
                                                <h3
                                                    className="font-bold text-zinc-900 dark:text-white cursor-pointer hover:text-primary transition-colors"
                                                    onClick={() => navigate(`/profile/${app.applicantId}`)}
                                                >
                                                    {app.name}
                                                </h3>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{app.role || 'Professional'}</p>
                                            </div>

                                            {/* Status Badge with Dropdown */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveStatusMenu(activeStatusMenu === app.id ? null : app.id)}
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize flex items-center gap-1 ${getStatusColor(app.status)}`}
                                                >
                                                    {app.status}
                                                    <span className="material-symbols-outlined text-xs">expand_more</span>
                                                </button>

                                                {/* Status Dropdown */}
                                                {activeStatusMenu === app.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-20 overflow-hidden">
                                                        {(['pending', 'reviewed', 'shortlisted', 'rejected'] as const).map((status) => (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleUpdateStatus(app.id, status)}
                                                                className={`w-full text-left px-3 py-2 text-sm capitalize hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2 ${app.status === status ? 'bg-zinc-100 dark:bg-zinc-700' : ''
                                                                    }`}
                                                            >
                                                                <span className={`w-2 h-2 rounded-full ${status === 'shortlisted' ? 'bg-green-500' :
                                                                    status === 'reviewed' ? 'bg-blue-500' :
                                                                        status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                                                                    }`} />
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <a
                                            href={`mailto:${app.email}`}
                                            className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
                                        >
                                            <span className="material-symbols-outlined text-base">mail</span>
                                            {app.email}
                                        </a>

                                        {/* Message */}
                                        {app.message && (
                                            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 mb-2">
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">"{app.message}"</p>
                                            </div>
                                        )}

                                        {/* Applied Date */}
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                            Applied {formatDate(app.appliedAt)}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => navigate(`/profile/${app.applicantId}`)}
                                                className="flex-1 py-2 px-3 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-base">person</span>
                                                View Profile
                                            </button>
                                            <button
                                                onClick={() => window.open(`mailto:${app.email}?subject=Regarding your application for ${job?.title}`)}
                                                className="flex-1 py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-base">mail</span>
                                                Contact
                                            </button>
                                            <button
                                                onClick={() => navigate(`/messaging/${app.applicantId}`)}
                                                className="py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-base">chat</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            </div>

            <BottomNav />
        </div>
    );
}
