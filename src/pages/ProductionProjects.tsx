import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService, type ProductionProject } from '../services/projectService';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import EmptyState from '../components/EmptyState';
import PostMedia from '../components/PostMedia';

export default function ProductionProjects() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
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
            setProjects(data);
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
            console.log("Attempt v2.0 - Creating project with data:", {
                ...newProject,
                producerId: currentUser.uid,
                status: 'active'
            });
            await projectService.createProject({
                ...newProject,
                producerId: currentUser.uid,
                status: 'active'
            });
            console.log("Project created successfully");
            setIsCreateModalOpen(false);
            setNewProject({ name: '', description: '', location: '' });
            fetchProjects();
        } catch (error: any) {
            console.error("Project creation error v2.0:", error);
            console.error("Error Code:", error.code);
            console.error("Error Message:", error.message);
        }
    };

    const handleSeedProjects = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            await projectService.seedProjects(currentUser.uid);
            alert("Seed projects added successfully!"); // Direct feedback
            await fetchProjects();
        } catch (error) {
            console.error(error);
            alert("Failed to seed projects. Check permissions.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative mx-auto flex h-full min-h-[100dvh] w-full max-w-md md:max-w-3xl lg:max-w-4xl flex-col bg-[#F8F9FA] dark:bg-zinc-950 pb-24 overflow-x-hidden">
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/70 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 backdrop-blur-3xl border-b border-black/[0.02] dark:border-white/[0.02] flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <HamburgerMenu />
                    <h1 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase truncate">My Projects</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleSeedProjects}
                        className="size-9 sm:size-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center hover:text-primary transition-all active:scale-95"
                        title="Seed Demo Projects"
                    >
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px]">database</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="size-9 sm:size-10 bg-primary text-white rounded-full shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center pt-20 gap-4 md:col-span-2">
                        <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : projects.length > 0 ? (
                    projects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => navigate(`/project/${project.id}`)}
                            className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-sm border border-zinc-100 dark:border-white/5 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{project.name}</h3>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        {project.location || 'Global'}
                                    </p>
                                </div>
                                <span className="px-2 py-1 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 text-[8px] font-black uppercase tracking-widest">
                                    {project.status}
                                </span>
                            </div>

                            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-6">
                                {project.description}
                            </p>

                            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-white/5 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {project.shortlist.slice(0, 3).map((talent) => (
                                            <div key={talent.userId} className="size-8 rounded-full border-2 border-white dark:border-zinc-900 overflow-hidden shrink-0 -ml-2 first:ml-0">
                                                <PostMedia
                                                    src={talent.userPhoto || ''}
                                                    fallbackType="USER_MALE"
                                                    className="size-full"
                                                />
                                            </div>
                                        ))}
                                        {project.shortlist.length > 3 && (
                                            <div className="size-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                                +{project.shortlist.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        {project.shortlist.length} Crew Shortlisted
                                    </span>
                                </div>
                                <span className="material-symbols-outlined text-zinc-300 group-hover:text-primary transition-all group-hover:translate-x-1">chevron_right</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col gap-4 md:col-span-2">
                        <EmptyState
                            message="No Production Projects"
                            subMessage="Create your first project to start building your dream crew."
                            icon="architecture"
                            actionLabel="Create Project"
                            onAction={() => setIsCreateModalOpen(true)}
                        />
                        <button
                            onClick={handleSeedProjects}
                            className="mx-auto mt-4 px-6 py-2.5 rounded-full border border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:border-primary hover:text-primary transition-all flex items-center gap-2 shadow-sm active:scale-95"
                        >
                            <span className="material-symbols-outlined text-sm">database</span>
                            Initialize 3 Seed Projects
                        </button>
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleCreateProject} className="bg-white dark:bg-zinc-900 rounded-[32px] w-full max-w-sm p-8 shadow-2xl border border-zinc-200 dark:border-white/5 space-y-4 animate-in zoom-in-95">
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-4">Start New Project</h3>

                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Project Name</span>
                                <input
                                    required
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    className="w-full h-14 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border-none text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-primary"
                                    placeholder="e.g. My Next Feature"
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Description</span>
                                <textarea
                                    required
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border-none text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-primary min-h-[100px]"
                                    placeholder="Describe your vision..."
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Shoot Location</span>
                                <input
                                    value={newProject.location}
                                    onChange={e => setNewProject({ ...newProject, location: e.target.value })}
                                    className="w-full h-14 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border-none text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-primary"
                                    placeholder="e.g. London / Mumbai / Global"
                                />
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 h-14 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
