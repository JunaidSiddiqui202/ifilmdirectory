import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, type ProductionProject, type ShortlistedTalent } from '../services/projectService';
import BottomNav from '../components/BottomNav';
import EmptyState from '../components/EmptyState';
import PostMedia from '../components/PostMedia';

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<ProductionProject | null>(null);
    const [loading, setLoading] = useState(true);

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
            // Refresh local state
            setProject(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    shortlist: prev.shortlist.map(t => t.userId === userId ? { ...t, status } : t)
                };
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!id) return;
        if (!confirm('Remove from shortlist?')) return;
        try {
            await projectService.removeFromShortlist(id, userId);
            setProject(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    shortlist: prev.shortlist.filter(t => t.userId !== userId)
                };
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return null;
    if (!project) return <div>Project not found</div>;

    return (
        <div className="relative mx-auto flex h-full min-h-[100dvh] w-full max-w-md md:max-w-2xl lg:max-w-3xl flex-col bg-[#F8F9FA] dark:bg-zinc-950 pb-24 overflow-x-hidden">
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/70 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 backdrop-blur-3xl border-b border-black/[0.02] dark:border-white/[0.02] flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-1 -ml-2">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white uppercase truncate">{project.name}</h1>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{project.location || 'Global Shoot'}</p>
                </div>
            </header>

            <main className="p-4 space-y-6">
                <section>
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary" />
                        My Shortlisted Crew
                    </h2>

                    {project.shortlist.length > 0 ? (
                        <div className="space-y-3">
                            {project.shortlist.map((talent) => (
                                <div
                                    key={talent.userId}
                                    className="bg-white dark:bg-zinc-900 rounded-[24px] p-4 border border-zinc-100 dark:border-white/5 flex gap-4 items-center"
                                >
                                    <div
                                        className="size-14 rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => navigate(`/profile/${talent.userId}`)}
                                    >
                                        <PostMedia
                                            src={talent.userPhoto || ''}
                                            fallbackType="USER_MALE"
                                            className="size-full"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{talent.userName}</h4>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{talent.role}</p>

                                        <div className="flex gap-2">
                                            <select
                                                value={talent.status}
                                                onChange={(e) => handleUpdateStatus(talent.userId, e.target.value as any)}
                                                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-none focus:ring-1 focus:ring-primary ${talent.status === 'hired' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                    talent.status === 'contacted' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                                    }`}
                                            >
                                                <option value="shortlisted">Shortlisted</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="hired">Hired</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                            <button
                                                onClick={() => navigate(`/chat/${talent.userId}`)}
                                                className="p-1 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">mail</span>
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(talent.userId)}
                                        className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            message="Crew List Empty"
                            subMessage="Start browsing profiles to add talented professionals to your project."
                            icon="group_add"
                            actionLabel="Browse Talent"
                            onAction={() => navigate('/browse-profiles')}
                        />
                    )}
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
