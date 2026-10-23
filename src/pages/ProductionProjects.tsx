import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { projectService, type ProductionProject } from '../services/projectService';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import PostMedia from '../components/PostMedia';
import SEO from '../components/SEO';
import { useToast } from '../context/ToastContext';

type PhaseFilter = 'all' | 'Development' | 'Pre-Production' | 'Principal Photography' | 'Post-Production' | 'Distribution';

export default function ProductionProjects() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();
    const toast = useToast();

    const [projects, setProjects] = useState<ProductionProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // New project form state
    const [newProject, setNewProject] = useState<{
        name: string;
        description: string;
        location: string;
        format: ProductionProject['format'];
        genre: string;
        productionPhase: NonNullable<ProductionProject['productionPhase']>;
        budgetTier: NonNullable<ProductionProject['budgetTier']>;
    }>({
        name: '',
        description: '',
        location: '',
        format: 'Feature Film',
        genre: '',
        productionPhase: 'Pre-Production',
        budgetTier: 'Medium Budget'
    });

    useEffect(() => {
        fetchProjects();
    }, [currentUser]);

    const fetchProjects = async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await projectService.getProducerProjects(currentUser.uid);
            setProjects(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            openAuthModal('Sign in to create a production project');
            return;
        }
        try {
            await projectService.createProject({
                name: newProject.name.trim(),
                description: newProject.description.trim(),
                location: newProject.location.trim() || 'Pan-India',
                format: newProject.format,
                genre: newProject.genre.trim() || 'Drama',
                productionPhase: newProject.productionPhase,
                budgetTier: newProject.budgetTier,
                producerId: currentUser.uid,
                status: 'active'
            });
            toast.success("Production project slate initialized!");
            setIsCreateModalOpen(false);
            setNewProject({
                name: '',
                description: '',
                location: '',
                format: 'Feature Film',
                genre: '',
                productionPhase: 'Pre-Production',
                budgetTier: 'Medium Budget'
            });
            fetchProjects();
        } catch (error: any) {
            console.error("Project creation error:", error);
            toast.error("Failed to create project");
        }
    };

    const handleSeedProjects = async () => {
        if (!currentUser) {
            openAuthModal('Sign in to initialize production projects');
            return;
        }
        setLoading(true);
        try {
            await projectService.seedProjects(currentUser.uid);
            toast.success("Demo cinema productions loaded into your slate!");
            await fetchProjects();
        } catch (error) {
            console.error(error);
            toast.error("Could not seed demo projects.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this production project? This action cannot be undone.")) return;
        setDeletingId(projectId);
        try {
            await projectService.deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            toast.success("Project removed from slate");
        } catch (error) {
            console.error("Error deleting project:", error);
            toast.error("Failed to delete project");
        } finally {
            setDeletingId(null);
        }
    };

    // Filtered Projects
    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            // Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = project.name.toLowerCase().includes(q);
                const matchDesc = (project.description || '').toLowerCase().includes(q);
                const matchLoc = (project.location || '').toLowerCase().includes(q);
                const matchGenre = (project.genre || '').toLowerCase().includes(q);
                const matchTalent = project.shortlist.some(t => 
                    (t.userName || '').toLowerCase().includes(q) || 
                    (t.role || '').toLowerCase().includes(q)
                );
                if (!matchName && !matchDesc && !matchLoc && !matchGenre && !matchTalent) return false;
            }

            // Phase
            if (phaseFilter !== 'all') {
                if (project.productionPhase !== phaseFilter) return false;
            }

            // Status
            if (statusFilter !== 'all') {
                if ((project.status || 'active') !== statusFilter) return false;
            }

            return true;
        });
    }, [projects, searchQuery, phaseFilter, statusFilter]);

    // KPI Metrics
    const totalShortlisted = useMemo(() => {
        return projects.reduce((acc, p) => acc + (p.shortlist?.length || 0), 0);
    }, [projects]);

    const activeProductionsCount = useMemo(() => {
        return projects.filter(p => (p.status || 'active') === 'active').length;
    }, [projects]);

    const hiredCount = useMemo(() => {
        return projects.reduce((acc, p) => acc + (p.shortlist?.filter(t => t.status === 'hired').length || 0), 0);
    }, [projects]);

    const getPhaseBadge = (phase?: string) => {
        switch (phase) {
            case 'Principal Photography':
                return { label: 'Principal Photography', color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' };
            case 'Pre-Production':
                return { label: 'Pre-Production', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
            case 'Post-Production':
                return { label: 'Post-Production', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' };
            case 'Development':
                return { label: 'Development', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' };
            case 'Distribution':
                return { label: 'Distribution', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
            default:
                return { label: 'Pre-Production', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white overflow-x-hidden font-display selection:bg-amber-500/30 pb-28 transition-colors">
            <SEO 
                title="Production Project Desk | iFilmDirectory"
                description="Manage your feature films, web series slates, crew shortlists, and physical filming logistics with verified Indian cinema talent."
            />

            {/* Top Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="md:hidden flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/home')}>
                        <HamburgerMenu />
                        <Logo size="sm" showText={true} />
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
                            <span className="material-symbols-outlined text-xl">movie_filter</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>Production Project Desk</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                    {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
                                </span>
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Line production boards, crew shortlists, and filming logistics
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {projects.length === 0 && (
                        <button
                            onClick={handleSeedProjects}
                            className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-all"
                            title="Load Sample Film Productions"
                        >
                            <span className="material-symbols-outlined text-base text-amber-500">auto_awesome</span>
                            <span className="hidden sm:inline">Load Sample Slate</span>
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/browse-profiles')}
                        className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                        <span className="material-symbols-outlined text-base text-amber-500">person_search</span>
                        <span className="hidden sm:inline">Browse Talent</span>
                    </button>
                    <button
                        onClick={() => {
                            if (!currentUser) return openAuthModal('Sign in to initialize production projects');
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-black shadow-md shadow-amber-500/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base font-bold">add</span>
                        <span>New Production</span>
                    </button>
                </div>
            </header>

            <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 px-4 md:px-8 py-6 space-y-6">
                
                {/* Executive Production KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.07] shadow-xs flex items-center gap-3.5">
                        <div className="size-10 sm:size-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl sm:text-2xl">movie</span>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                                {projects.length}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                                Total Titles
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.07] shadow-xs flex items-center gap-3.5">
                        <div className="size-10 sm:size-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl sm:text-2xl">fiber_manual_record</span>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                                {activeProductionsCount}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                                Active In-Flight
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.07] shadow-xs flex items-center gap-3.5">
                        <div className="size-10 sm:size-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl sm:text-2xl">groups</span>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                                {totalShortlisted}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                                Crew Shortlisted
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.07] shadow-xs flex items-center gap-3.5">
                        <div className="size-10 sm:size-11 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-xl sm:text-2xl">handshake</span>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                                {hiredCount}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                                Confirmed Hires
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.07] p-3.5 sm:p-4 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search title, genre, shoot location, or shortlisted crew..."
                                className="w-full bg-slate-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {(['all', 'active', 'completed', 'archived'] as const).map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                                        statusFilter === st
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    {st === 'all' ? 'All Status' : st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Production Phase Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-zinc-100 dark:border-white/[0.05]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shrink-0 mr-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-amber-500">timeline</span>
                            <span>Phase:</span>
                        </span>
                        {(['all', 'Development', 'Pre-Production', 'Principal Photography', 'Post-Production', 'Distribution'] as PhaseFilter[]).map((phase) => (
                            <button
                                key={phase}
                                onClick={() => setPhaseFilter(phase)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                                    phaseFilter === phase
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold'
                                        : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent hover:border-zinc-300 dark:hover:border-white/10'
                                }`}
                            >
                                {phase === 'all' ? 'All Phases' : phase}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="size-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-3 text-xs font-bold text-zinc-400 tracking-wide uppercase">
                                Loading Production Slate...
                            </p>
                        </div>
                    ) : filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredProjects.map((project) => {
                                const phaseConfig = getPhaseBadge(project.productionPhase);
                                const isDeleting = deletingId === project.id;

                                return (
                                    <div
                                        key={project.id}
                                        onClick={() => navigate(`/project/${project.id}`)}
                                        className="group relative bg-white dark:bg-[#121316] rounded-2xl p-5 shadow-sm dark:shadow-xl border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/50 hover:shadow-lg dark:hover:shadow-amber-500/5 transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Header Tags */}
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${phaseConfig.color}`}>
                                                        {phaseConfig.label}
                                                    </span>
                                                    {project.format && (
                                                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                                            {project.format}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => handleDeleteProject(project.id!, e)}
                                                        disabled={isDeleting}
                                                        className="size-7 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                                                        title="Delete Project"
                                                    >
                                                        <span className="material-symbols-outlined text-base">
                                                            {isDeleting ? 'sync' : 'delete'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Title & Metadata */}
                                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                                                {project.name}
                                            </h3>

                                            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-3 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs text-amber-500">location_on</span>
                                                    <span>{project.location || 'Pan-India'}</span>
                                                </span>
                                                {project.genre && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs text-zinc-400">theater_comedy</span>
                                                        <span>{project.genre}</span>
                                                    </span>
                                                )}
                                                {project.budgetTier && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs text-emerald-500">payments</span>
                                                        <span>{project.budgetTier}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-2 mb-4">
                                                {project.description || 'Feature production in pre-production staging. Direct crew shortlisting active.'}
                                            </p>
                                        </div>

                                        {/* Shortlist Avatar Footer */}
                                        <div className="border-t border-zinc-100 dark:border-white/[0.06] pt-3.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                {project.shortlist && project.shortlist.length > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex -space-x-2">
                                                            {project.shortlist.slice(0, 3).map((talent) => (
                                                                <div key={talent.userId} className="size-7 rounded-full border-2 border-white dark:border-[#121316] overflow-hidden shrink-0 bg-zinc-100 dark:bg-black">
                                                                    <PostMedia
                                                                        src={talent.userPhoto || ''}
                                                                        fallbackType="USER_MALE"
                                                                        className="size-full object-cover"
                                                                    />
                                                                </div>
                                                            ))}
                                                            {project.shortlist.length > 3 && (
                                                                <div className="size-7 rounded-full border-2 border-white dark:border-[#121316] bg-zinc-100 dark:bg-[#1a1b20] flex items-center justify-center text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                                                    +{project.shortlist.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                                                            {project.shortlist.length} Crew Shortlisted
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">person_add</span>
                                                        <span>No crew shortlisted</span>
                                                    </span>
                                                )}
                                            </div>

                                            <span className="size-8 rounded-xl bg-zinc-50 dark:bg-white/[0.04] group-hover:bg-amber-500 group-hover:text-white text-zinc-400 dark:text-zinc-500 flex items-center justify-center transition-all">
                                                <span className="material-symbols-outlined text-base">
                                                    arrow_forward
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : projects.length > 0 ? (
                        /* Filtered Empty State */
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] shadow-sm">
                            <div className="size-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-3 text-zinc-400">
                                <span className="material-symbols-outlined text-2xl">search_off</span>
                            </div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                                No Projects Match Your Filter
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                                Adjust your keyword search or phase filter to see titles from your production deck.
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); setPhaseFilter('all'); setStatusFilter('all'); }}
                                className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all shadow-xs"
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        /* Zero Projects Slate Empty State */
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500 dark:text-amber-400">
                                <span className="material-symbols-outlined text-3xl">movie_edit</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-1.5">
                                Your Production Slate is Empty
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
                                Create your first film, web series, or commercial project board to shortlist certified cinematographers, directors, actors, and post-production crew.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (!currentUser) return openAuthModal('Sign in to initialize production projects');
                                        setIsCreateModalOpen(true);
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">add</span>
                                    <span>Initialize New Production</span>
                                </button>
                                <button
                                    onClick={handleSeedProjects}
                                    className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 text-xs font-semibold border border-zinc-200 dark:border-white/[0.08] transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base text-amber-500 dark:text-amber-400">auto_awesome</span>
                                    <span>Load 3 Demo Productions</span>
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
                    onClick={() => setIsCreateModalOpen(false)}
                >
                    <form
                        onSubmit={handleCreateProject}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-[#121316] rounded-2xl sm:rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-zinc-200 dark:border-white/[0.12] space-y-4 text-zinc-900 dark:text-white animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.07]">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500">movie_creation</span>
                                    <span>Initialize Production Board</span>
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Set up your project slate and start shortlisting HODs & crew
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="space-y-4 pt-1">
                            {/* Project Title */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                    Project / Film Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="e.g. Kaithi 2 / Untitled Mystery Thriller"
                                />
                            </div>

                            {/* Format & Phase Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                        Format
                                    </label>
                                    <select
                                        value={newProject.format}
                                        onChange={e => setNewProject({ ...newProject, format: e.target.value as any })}
                                        className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                                    >
                                        <option value="Feature Film">Feature Film</option>
                                        <option value="Web Series">Web Series / OTT</option>
                                        <option value="Short Film">Short Film</option>
                                        <option value="Documentary">Documentary</option>
                                        <option value="Music Video">Music Video</option>
                                        <option value="Commercial">TV Commercial / Ad</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                        Production Phase
                                    </label>
                                    <select
                                        value={newProject.productionPhase}
                                        onChange={e => setNewProject({ ...newProject, productionPhase: e.target.value as any })}
                                        className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                                    >
                                        <option value="Development">Development</option>
                                        <option value="Pre-Production">Pre-Production</option>
                                        <option value="Principal Photography">Principal Photography</option>
                                        <option value="Post-Production">Post-Production</option>
                                        <option value="Distribution">Distribution</option>
                                    </select>
                                </div>
                            </div>

                            {/* Genre & Budget Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                        Genre
                                    </label>
                                    <input
                                        value={newProject.genre}
                                        onChange={e => setNewProject({ ...newProject, genre: e.target.value })}
                                        className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="e.g. Action / Thriller / Period"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                        Budget Scale
                                    </label>
                                    <select
                                        value={newProject.budgetTier}
                                        onChange={e => setNewProject({ ...newProject, budgetTier: e.target.value as any })}
                                        className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
                                    >
                                        <option value="Indie Micro">Indie Micro (&lt; ₹1 Cr)</option>
                                        <option value="Medium Budget">Medium Budget (₹1 Cr - ₹15 Cr)</option>
                                        <option value="Tentpole / Large Scale">Tentpole / Large Scale (₹15 Cr+)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                    Primary Shoot Location
                                </label>
                                <input
                                    value={newProject.location}
                                    onChange={e => setNewProject({ ...newProject, location: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="e.g. Hyderabad, Mumbai & London Studios"
                                />
                            </div>

                            {/* Logline */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                    Logline / Production Brief <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 resize-none transition-colors"
                                    placeholder="Brief narrative outline, shooting requirements, or crew profile targets..."
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex items-center gap-3 pt-3 border-t border-zinc-100 dark:border-white/[0.07]">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 py-2.5 sm:py-3 rounded-xl border border-zinc-200 dark:border-white/[0.08] text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2.5 sm:py-3 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all"
                            >
                                Create Production Board
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
