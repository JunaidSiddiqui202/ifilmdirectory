import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService, type ProductionProject } from '../services/projectService';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import PostMedia from '../components/PostMedia';
import { useToast } from '../context/ToastContext';

export default function ProductionProjects() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const toast = useToast();
    const [projects, setProjects] = useState<ProductionProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', location: '' });

    useEffect(() => {
        fetchProjects();
    }, [currentUser]);

    const fetchProjects = async () => {
        if (!currentUser) return;
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
        if (!currentUser) return;
        try {
            await projectService.createProject({
                ...newProject,
                producerId: currentUser.uid,
                status: 'active'
            });
            toast.success("Production project initialized!");
            setIsCreateModalOpen(false);
            setNewProject({ name: '', description: '', location: '' });
            fetchProjects();
        } catch (error: any) {
            console.error("Project creation error:", error);
            toast.error("Failed to create project");
        }
    };

    const handleSeedProjects = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            await projectService.seedProjects(currentUser.uid);
            toast.success("Demo film productions added to your deck!");
            await fetchProjects();
        } catch (error) {
            console.error(error);
            toast.error("Could not seed projects.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white overflow-x-hidden font-display selection:bg-amber-500/30 pb-28 transition-colors">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090A0C]/90 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
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
                                    {projects.length} Titles
                                </span>
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Line production boards, crew shortlists, and filming logistics
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleSeedProjects}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-all"
                        title="Load Demo Slate"
                    >
                        <span className="material-symbols-outlined text-base text-amber-500">database</span>
                        <span className="hidden sm:inline">Demo Slate</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base font-bold">add</span>
                        <span>New Project</span>
                    </button>
                </div>
            </header>

            <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 px-4 md:px-8 py-6">
                {/* Mobile Hero */}
                <div className="md:hidden mb-4">
                    <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span>Production Projects</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                            {projects.length}
                        </span>
                    </h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage active titles, crew shortlists, and shoot schedules
                    </p>
                </div>

                {/* Projects Grid */}
                <main className="flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="size-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-3 text-xs font-bold text-zinc-400 tracking-wide uppercase">
                                Loading Production Slate...
                            </p>
                        </div>
                    ) : projects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    onClick={() => navigate(`/project/${project.id}`)}
                                    className="bg-white dark:bg-[#121316] rounded-2xl p-5 shadow-sm dark:shadow-xl border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start gap-2 mb-3">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate">
                                                    {project.name}
                                                </h3>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1 truncate">
                                                    <span className="material-symbols-outlined text-xs text-amber-500">location_on</span>
                                                    {project.location || 'Pan-India Locations'}
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                                {project.status || 'Active'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-3 mb-5">
                                            {project.description || 'Feature production in pre-production staging. Direct crew shortlisting active.'}
                                        </p>
                                    </div>

                                    <div className="border-t border-zinc-100 dark:border-white/[0.06] pt-3.5 flex items-center justify-between">
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
                                            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                                {project.shortlist.length} Crew Shortlisted
                                            </span>
                                        </div>
                                        <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500 group-hover:text-amber-500 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all text-lg">
                                            arrow_forward
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500 dark:text-amber-400">
                                <span className="material-symbols-outlined text-3xl">movie_edit</span>
                            </div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                                No Production Projects Yet
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
                                Create your first film or web series production board to shortlist certified DPs, directors, and actors.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    Start New Project
                                </button>
                                <button
                                    onClick={handleSeedProjects}
                                    className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 text-xs font-semibold border border-zinc-200 dark:border-white/[0.08] transition-all flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base text-amber-500 dark:text-amber-400">database</span>
                                    Load 3 Demo Productions
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
                        className="bg-white dark:bg-[#121316] rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-zinc-200 dark:border-white/[0.12] space-y-4 text-zinc-900 dark:text-white animate-in zoom-in-95"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Start New Production</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Initialize a production board and shortlist crew</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="space-y-3.5">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                    Project / Film Title
                                </label>
                                <input
                                    required
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="e.g. Kaithi 2 / Untitled Crime Thriller"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                    Logline / Production Brief
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 resize-none transition-colors"
                                    placeholder="Brief outline of the project, shoot schedule, or crew needs..."
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block mb-1.5">
                                    Primary Shoot Location
                                </label>
                                <input
                                    value={newProject.location}
                                    onChange={e => setNewProject({ ...newProject, location: e.target.value })}
                                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-300 dark:border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="e.g. Hyderabad & London Studios"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-white/[0.08] text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all"
                            >
                                Initialize Project
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
