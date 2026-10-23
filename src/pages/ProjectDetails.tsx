import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, type ProductionProject, type ShortlistedTalent } from '../services/projectService';
import BottomNav from '../components/BottomNav';
import PostMedia from '../components/PostMedia';
import SEO from '../components/SEO';
import { useToast } from '../context/ToastContext';

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [project, setProject] = useState<ProductionProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'shortlisted' | 'contacted' | 'hired' | 'rejected'>('all');

    useEffect(() => {
        const fetchProject = async () => {
            if (!id) return;
            try {
                const data = await projectService.getProjectById(id);
                setProject(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    const handleUpdateStatus = async (userId: string, status: ShortlistedTalent['status']) => {
        if (!id) return;
        try {
            await projectService.updateTalentStatus(id, userId, status);
            setProject(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    shortlist: prev.shortlist.map(t => t.userId === userId ? { ...t, status } : t)
                };
            });
            toast.success(`Crew status updated to ${status}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status");
        }
    };

    const handleRemove = async (userId: string, userName?: string) => {
        if (!id) return;
        if (!window.confirm(`Remove ${userName || 'this talent'} from this production shortlist?`)) return;
        try {
            await projectService.removeFromShortlist(id, userId);
            setProject(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    shortlist: prev.shortlist.filter(t => t.userId !== userId)
                };
            });
            toast.success("Removed from project shortlist");
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove talent");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#090A0C]">
                <div className="size-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white p-6 text-center">
                <span className="material-symbols-outlined text-5xl text-amber-500 mb-3">movie_off</span>
                <h2 className="text-xl font-bold mb-1">Production Project Not Found</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 max-w-sm">
                    This project may have been moved or removed from your slate.
                </p>
                <button
                    onClick={() => navigate('/projects')}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/20"
                >
                    Back to Production Desk
                </button>
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'hired':
                return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
            case 'contacted':
                return 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400';
            case 'rejected':
                return 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400';
            default:
                return 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400';
        }
    };

    const filteredShortlist = (project.shortlist || []).filter(talent => {
        if (activeFilter === 'all') return true;
        return talent.status === activeFilter;
    });

    const hiredCount = (project.shortlist || []).filter(t => t.status === 'hired').length;
    const contactedCount = (project.shortlist || []).filter(t => t.status === 'contacted').length;
    const shortlistedCount = (project.shortlist || []).filter(t => t.status === 'shortlisted').length;

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white overflow-x-hidden font-display selection:bg-amber-500/30 pb-28 transition-colors">
            <SEO 
                title={`${project.name} | Production Desk`}
                description={project.description || 'Feature film production board on iFilmDirectory'}
            />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/[0.08] transition-all"
                        title="Back to Production Desk"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
                            <span className="truncate">{project.name}</span>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                                {project.shortlist.length} Crew
                            </span>
                        </h1>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 truncate">
                            <span className="flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-xs text-amber-500">location_on</span>
                                <span>{project.location || 'Pan-India Shoot'}</span>
                            </span>
                            {project.productionPhase && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold uppercase">
                                    {project.productionPhase}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/browse-profiles')}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md shadow-amber-500/10 shrink-0"
                    >
                        <span className="material-symbols-outlined text-base">person_add</span>
                        <span className="hidden sm:inline">Add Crew from Directory</span>
                    </button>
                </div>
            </header>

            <div className="w-full max-w-5xl mx-auto flex flex-col flex-1 px-4 md:px-8 py-6 space-y-6">
                
                {/* Project Brief Card */}
                <div className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] p-5 shadow-sm dark:shadow-xl space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">movie_filter</span>
                            <span>Production Brief & Narrative Logline</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {project.format && (
                                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                    {project.format}
                                </span>
                            )}
                            {project.genre && (
                                <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                    {project.genre}
                                </span>
                            )}
                            {project.budgetTier && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    {project.budgetTier}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                        {project.description || 'Feature production in pre-production staging. Direct crew shortlisting active.'}
                    </p>
                </div>

                {/* Shortlist Filter Tabs */}
                <div className="flex items-center justify-between gap-3 flex-wrap border-b border-zinc-200 dark:border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                activeFilter === 'all'
                                    ? 'bg-amber-500 text-black shadow-xs'
                                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            All ({project.shortlist.length})
                        </button>
                        <button
                            onClick={() => setActiveFilter('hired')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                activeFilter === 'hired'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            Confirmed Hires ({hiredCount})
                        </button>
                        <button
                            onClick={() => setActiveFilter('contacted')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                activeFilter === 'contacted'
                                    ? 'bg-sky-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            Contacted ({contactedCount})
                        </button>
                        <button
                            onClick={() => setActiveFilter('shortlisted')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                activeFilter === 'shortlisted'
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xs'
                                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            Shortlisted ({shortlistedCount})
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/browse-profiles')}
                        className="text-xs font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
                    >
                        <span>Find More Filmmakers</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>

                {/* Shortlist Cards */}
                <section>
                    {filteredShortlist.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredShortlist.map((talent) => {
                                const statusClass = getStatusStyle(talent.status);

                                return (
                                    <div
                                        key={talent.userId}
                                        className="bg-white dark:bg-[#121316] rounded-2xl p-4 sm:p-5 border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/40 hover:shadow-md transition-all flex flex-col justify-between gap-3 shadow-sm dark:shadow-lg group"
                                    >
                                        <div className="flex items-start gap-3.5">
                                            <div
                                                className="size-14 rounded-2xl overflow-hidden shrink-0 cursor-pointer border border-zinc-200 dark:border-white/10 group-hover:border-amber-500/40 transition-colors bg-zinc-100 dark:bg-black"
                                                onClick={() => navigate(`/profile/${talent.userId}`)}
                                            >
                                                <PostMedia
                                                    src={talent.userPhoto || ''}
                                                    fallbackType="USER_MALE"
                                                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h4
                                                            onClick={() => navigate(`/profile/${talent.userId}`)}
                                                            className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate cursor-pointer"
                                                        >
                                                            {talent.userName || 'Cinema Professional'}
                                                        </h4>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                                                            {talent.role || 'Crew Member / HOD'}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() => handleRemove(talent.userId, talent.userName)}
                                                        className="text-zinc-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                                                        title="Remove from shortlist"
                                                    >
                                                        <span className="material-symbols-outlined text-base">close</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-white/[0.06] pt-3 mt-1 gap-2 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Status:</span>
                                                <select
                                                    value={talent.status}
                                                    onChange={(e) => handleUpdateStatus(talent.userId, e.target.value as any)}
                                                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border outline-none cursor-pointer transition-all ${statusClass}`}
                                                >
                                                    <option value="shortlisted" className="bg-white dark:bg-[#17191e] text-zinc-900 dark:text-white">Shortlisted</option>
                                                    <option value="contacted" className="bg-white dark:bg-[#17191e] text-zinc-900 dark:text-white">Contacted</option>
                                                    <option value="hired" className="bg-white dark:bg-[#17191e] text-zinc-900 dark:text-white">Hired</option>
                                                    <option value="rejected" className="bg-white dark:bg-[#17191e] text-zinc-900 dark:text-white">Rejected</option>
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => navigate(`/profile/${talent.userId}`)}
                                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold transition-all flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">person</span>
                                                    <span>Profile</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/chat/${talent.userId}`)}
                                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-semibold transition-all flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-sm">chat</span>
                                                    <span>Message</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-500 dark:text-amber-400">
                                <span className="material-symbols-outlined text-2xl">group_add</span>
                            </div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                                No Talent in this Category
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                                Browse certified cinematographers, directors, actors, and editors to add them to this production.
                            </p>
                            <button
                                onClick={() => navigate('/browse-profiles')}
                                className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
                            >
                                Browse Talent Directory
                            </button>
                        </div>
                    )}
                </section>
            </div>

            <BottomNav />
        </div>
    );
}
