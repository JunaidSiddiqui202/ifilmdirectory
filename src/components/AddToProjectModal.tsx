import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService, type ProductionProject } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import PostMedia from './PostMedia';
import { useToast } from '../context/ToastContext';

interface AddToProjectModalProps {
    userId: string;
    userName: string;
    userPhoto?: string;
    userRole: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddToProjectModal({ userId, userName, userPhoto, userRole, onClose, onSuccess }: AddToProjectModalProps) {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const toast = useToast();
    const [projects, setProjects] = useState<ProductionProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!currentUser) return;
            try {
                const data = await projectService.getProducerProjects(currentUser.uid);
                setProjects(data);
                if (data.length > 0) setSelectedProjectId(data[0].id!);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [currentUser]);

    const handleAdd = async () => {
        if (!selectedProjectId) return;
        setSaving(true);
        try {
            await projectService.addToShortlist(selectedProjectId, {
                userId,
                userName,
                userPhoto,
                role: userRole,
                status: 'shortlisted'
            });
            toast.success(`Added ${userName} to shortlist!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error adding to project:", error);
            toast.error("Failed to add to project.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/5 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Add to Project</h3>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mb-6 border border-zinc-100 dark:border-white/5">
                        <div className="size-12 rounded-full overflow-hidden shadow-sm shrink-0">
                            <PostMedia
                                src={userPhoto || ''}
                                fallbackType="USER_MALE"
                                className="w-full h-full"
                                alt={userName}
                            />
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white">{userName}</p>
                            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">{userRole}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : projects.length > 0 ? (
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Select Project</span>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full h-14 px-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border-none text-zinc-900 dark:text-white font-bold focus:ring-2 focus:ring-primary appearance-none"
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </label>

                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? "Adding..." : "Add to Shortlist"}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-zinc-500 text-sm mb-4 font-bold">You don't have any active projects.</p>
                            <button
                                onClick={() => { onClose(); navigate('/projects'); }}
                                className="text-primary font-black uppercase tracking-widest text-xs hover:underline"
                            >
                                Create a Project First
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
