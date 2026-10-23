import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

export interface ExperienceItem {
    id: string;
    title: string;
    role: string;
    year: string;
    description?: string;
    type?: 'movie' | 'tv' | 'theater' | 'commercial' | 'other';
}

interface ExperienceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: ExperienceItem) => void;
    onDelete: (id: string) => void;
    itemToEdit?: ExperienceItem | null;
}

export default function ExperienceModal({ isOpen, onClose, onSave, onDelete, itemToEdit }: ExperienceModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ExperienceItem>({
        id: '',
        title: '',
        role: '',
        year: new Date().getFullYear().toString(),
        type: 'movie',
        description: ''
    });

    useEffect(() => {
        if (itemToEdit) {
            setFormData(itemToEdit);
        } else {
            // Reset for new item
            setFormData({
                id: Date.now().toString(), // Temporary ID for new items
                title: '',
                role: '',
                year: new Date().getFullYear().toString(),
                type: 'movie',
                description: ''
            });
        }
    }, [itemToEdit, isOpen]);

    const handleChange = (field: keyof ExperienceItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Prevent double-click race conditions
        if (loading) return;

        // 2. Offline check
        if (!navigator.onLine) {
            toast.error("You are offline. Please check your internet connection.");
            return;
        }

        // 3. Sanitize inputs (strip leading/trailing whitespace)
        const sanitizedTitle = formData.title.trim();
        const sanitizedRole = formData.role.trim();

        if (!sanitizedTitle) {
            toast.error("Please enter a valid project title.");
            return;
        }

        if (!sanitizedRole) {
            toast.error("Please enter a valid role.");
            return;
        }

        setLoading(true);
        try {
            await onSave({
                ...formData,
                title: sanitizedTitle,
                role: sanitizedRole,
                description: formData.description?.trim() || ''
            });
            onClose();
        } catch (error) {
            console.error("Failed to save experience:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#111317] rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden">
                <div className="p-5 border-b border-zinc-200 dark:border-white/10 flex justify-between items-center bg-white/95 dark:bg-[#111317]/95 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                            <span className="material-symbols-outlined text-xl">theaters</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                                {itemToEdit ? 'Edit Filmography Credit' : 'Add Filmography Credit'}
                            </h3>
                            <p className="text-xs text-zinc-500 font-medium">Record feature, series, or commercial</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={loading} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Project Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g. Inception"
                            className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
                            <input
                                type="text"
                                required
                                value={formData.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                                placeholder="e.g. Lead Actor"
                                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Year</label>
                            <input
                                type="text"
                                required
                                value={formData.year}
                                onChange={(e) => handleChange('year', e.target.value)}
                                placeholder="e.g. 2023"
                                className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                        >
                            <option value="movie">Movie</option>
                            <option value="tv">TV Show</option>
                            <option value="theater">Theater</option>
                            <option value="commercial">Commercial</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description (Optional)</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                            placeholder="Brief details about your role..."
                            className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white resize-none"
                        />
                    </div>

                    <div className="flex gap-2.5 pt-4">
                        {itemToEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this experience?')) {
                                        onDelete(formData.id);
                                        onClose();
                                    }
                                }}
                                className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20"
                            >
                                Delete
                            </button>
                        )}
                        <div className="flex-1 flex gap-2.5 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors border border-zinc-200 dark:border-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black bg-amber-500 hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {loading ? 'Saving...' : 'Save Credit'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
