import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, type ProductionProject, type ShortlistedTalent } from '../services/projectService';
import { type UserProfile as UserProfileType } from '../services/userService';
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
    const [isAddCrewModalOpen, setIsAddCrewModalOpen] = useState(false);
    const [directoryProfiles, setDirectoryProfiles] = useState<UserProfileType[]>([]);
    const [directoryLoading, setDirectoryLoading] = useState(false);
    const [searchDirectoryQuery, setSearchDirectoryQuery] = useState('');
    const [addingTalentId, setAddingTalentId] = useState<string | null>(null);

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

    const openAddCrewModal = async () => {
        setIsAddCrewModalOpen(true);
        if (directoryProfiles.length === 0) {
            setDirectoryLoading(true);
            try {
                const { getAllUsers } = await import('../services/userService');
                const { CURATED_CINEMA_TALENT } = await import('../constants/curatedTalent');
                const liveUsers = await getAllUsers();
                const liveUids = new Set(liveUsers.map(u => u.uid));
                const supplemental = (CURATED_CINEMA_TALENT as unknown as UserProfileType[]).filter(p => !liveUids.has(p.uid as string));
                setDirectoryProfiles([...liveUsers, ...supplemental]);
            } catch (err) {
                console.error("Failed to load talent directory:", err);
            } finally {
                setDirectoryLoading(false);
            }
        }
    };

    const handleAddTalentToCurrentProject = async (talent: UserProfileType) => {
        if (!id || !project) return;
        const alreadyInShortlist = (project.shortlist || []).some(t => t.userId === talent.uid);
        if (alreadyInShortlist) {
            toast.info(`${talent.displayName || 'Creator'} is already in this project's shortlist.`);
            return;
        }

        setAddingTalentId(talent.uid);
        try {
            await projectService.addToShortlist(id, {
                userId: talent.uid,
                userName: talent.displayName || 'Cinema Talent',
                userPhoto: talent.photoURL,
                role: talent.role || 'Industry Professional',
                status: 'shortlisted'
            });

            // Refresh project state
            const refreshed = await projectService.getProjectById(id);
            if (refreshed) {
                setProject(refreshed);
            }
            toast.success(`Added ${talent.displayName} to shortlist!`);
        } catch (err) {
            console.error("Error shortlisting talent:", err);
            toast.error("Failed to add talent to project");
        } finally {
            setAddingTalentId(null);
        }
    };

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
                        onClick={openAddCrewModal}
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
                        onClick={openAddCrewModal}
                        className="text-xs font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        <span>Find More Filmmakers</span>
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
                                                    onChange={(e) => handleUpdateStatus(talent.userId, e.target.value as ShortlistedTalent['status'])}
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
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
                                Browse certified cinematographers, directors, actors, and editors to add them to this production.
                            </p>
                            <div className="flex items-center gap-3 flex-wrap justify-center">
                                <button
                                    onClick={openAddCrewModal}
                                    className="px-4 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">person_add</span>
                                    <span>Add Crew to this Project</span>
                                </button>
                                <button
                                    onClick={() => navigate('/browse-profiles')}
                                    className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-800 dark:text-white text-xs font-bold transition-all border border-zinc-200 dark:border-white/10"
                                >
                                    Browse Full Directory
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* Quick Add Crew From Directory Modal */}
            {isAddCrewModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
                    onClick={() => setIsAddCrewModalOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-[#121316] rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500">person_add</span>
                                    <span>Add Crew to {project.name}</span>
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Select certified filmmakers, cinematographers, actors & technicians
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddCrewModalOpen(false)}
                                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-4 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">
                                    search
                                </span>
                                <input
                                    type="text"
                                    value={searchDirectoryQuery}
                                    onChange={(e) => setSearchDirectoryQuery(e.target.value)}
                                    placeholder="Search by name, role (e.g. Cinematographer, Director), or city..."
                                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-[#090A0C] border border-zinc-200 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        {/* Talent List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                            {directoryLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="size-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                                    <span className="text-xs text-zinc-400">Loading industry filmmakers...</span>
                                </div>
                            ) : (
                                (() => {
                                    const filteredTalent = directoryProfiles.filter(p => {
                                        if (!searchDirectoryQuery.trim()) return true;
                                        const q = searchDirectoryQuery.toLowerCase();
                                        return (
                                            (p.displayName || '').toLowerCase().includes(q) ||
                                            (p.role || '').toLowerCase().includes(q) ||
                                            (p.location || '').toLowerCase().includes(q) ||
                                            (p.skills || []).some((s: string) => s.toLowerCase().includes(q))
                                        );
                                    });

                                    if (filteredTalent.length === 0) {
                                        return (
                                            <div className="text-center py-12 text-zinc-400 text-xs">
                                                No filmmakers found matching "{searchDirectoryQuery}".
                                            </div>
                                        );
                                    }

                                    return filteredTalent.map((talent) => {
                                        const isAlreadyIn = (project.shortlist || []).some(t => t.userId === talent.uid);
                                        const isAddingThis = addingTalentId === talent.uid;

                                        return (
                                            <div
                                                key={talent.uid}
                                                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/5 hover:border-amber-500/30 transition-all"
                                            >
                                                <div
                                                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                                                    onClick={() => navigate(`/profile/${talent.uid}`)}
                                                >
                                                    <div className="size-11 rounded-xl overflow-hidden shrink-0 bg-zinc-200 dark:bg-zinc-800">
                                                        <PostMedia
                                                            src={talent.photoURL || ''}
                                                            fallbackType="USER_MALE"
                                                            className="size-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate hover:text-amber-500 transition-colors">
                                                            {talent.displayName || 'Cinema Creator'}
                                                        </h5>
                                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
                                                            <span className="font-semibold text-amber-600 dark:text-amber-400">{talent.role || 'Professional'}</span>
                                                            {talent.location && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="truncate">{talent.location}</span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {isAlreadyIn ? (
                                                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">check</span>
                                                            <span>Shortlisted</span>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAddTalentToCurrentProject(talent)}
                                                            disabled={isAddingThis}
                                                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add</span>
                                                            <span>{isAddingThis ? 'Adding...' : 'Add Crew'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 flex items-center justify-between text-xs">
                            <span className="text-zinc-500 dark:text-zinc-400">
                                Looking for studios & gear?
                            </span>
                            <button
                                onClick={() => {
                                    setIsAddCrewModalOpen(false);
                                    navigate('/browse-profiles');
                                }}
                                className="font-bold text-amber-500 hover:underline flex items-center gap-1"
                            >
                                <span>Open Full Talent Directory</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
