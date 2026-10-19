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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                        {itemToEdit ? 'Edit Experience' : 'Add Experience'}
                    </h3>
                    <button onClick={onClose} disabled={loading} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50">
                        <span className="material-symbols-outlined">close</span>
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

                    <div className="flex gap-3 pt-4">
                        {itemToEdit && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this experience?')) {
                                        onDelete(formData.id);
                                        onClose();
                                    }
                                }}
                                className="px-4 py-2 rounded-lg font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                                Delete
                            </button>
                        )}
                        <div className="flex-1 flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
