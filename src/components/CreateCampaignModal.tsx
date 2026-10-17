import React, { useState } from 'react';
import { createCampaign } from '../services/adService';
import type { AdCampaign } from '../services/adService';
import { uploadFile } from '../services/storageService';

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newCampaign: AdCampaign) => void;
}

export default function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
    const [title, setTitle] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [placement, setPlacement] = useState<AdCampaign['placement']>('home_feed');
    const [clientName, setClientName] = useState('');
    const [clientContact, setClientContact] = useState('');
    const [dealValue, setDealValue] = useState('');
    const [notes, setNotes] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!imageFile) throw new Error("Please select an ad creative image.");
            if (!title || !targetUrl || !startDate || !endDate) throw new Error("Title, Target URL, and Dates are required.");

            // Upload Image
            const uploadRes = await uploadFile(imageFile);
            if (uploadRes.error || !uploadRes.url) throw new Error(uploadRes.error || "Image upload failed");

            const newCampaign: Omit<AdCampaign, 'id'> = {
                title,
                targetUrl,
                imageUrl: uploadRes.url,
                placement,
                startDate,
                endDate,
                status: 'active',
                views: 0,
                clicks: 0,
                clientName: clientName.trim() || undefined,
                clientContact: clientContact.trim() || undefined,
                dealValue: dealValue ? Number(dealValue) : undefined,
                notes: notes.trim() || undefined,
                createdAt: new Date().toISOString()
            };

            const created = await createCampaign(newCampaign);
            onSuccess(created as AdCampaign);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create campaign");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#121316] rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-white/10 custom-scrollbar font-display">
                <div className="p-6 border-b border-zinc-200 dark:border-white/10 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <span className="material-symbols-outlined text-[22px]">campaign</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white">Commercial Ad Campaign</h2>
                            <p className="text-xs text-zinc-500">Configure sponsor placement, client deal, and tracking</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-zinc-500">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/30">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Campaign Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:border-amber-500 outline-none transition-colors"
                            placeholder="e.g. Sony FX3 Cinema Line Launch"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Client / Brand Name</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:border-amber-500 outline-none transition-colors"
                                placeholder="e.g. Sony India / Red Giant"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Deal Value (₹)</label>
                            <input
                                type="number"
                                value={dealValue}
                                onChange={e => setDealValue(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:border-amber-500 outline-none transition-colors"
                                placeholder="e.g. 50000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Target Destination URL *</label>
                        <input
                            type="url"
                            value={targetUrl}
                            onChange={e => setTargetUrl(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:border-amber-500 outline-none transition-colors"
                            placeholder="https://example.com/cinema-gear"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Placement Slot *</label>
                            <select
                                value={placement}
                                onChange={e => setPlacement(e.target.value as any)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:border-amber-500 outline-none transition-colors"
                            >
                                <option value="home_feed">Home Main Feed (High Traffic)</option>
                                <option value="cinema_wire">Cinema Wire & Blogs</option>
                                <option value="sidebar">Desktop Sticky Sidebar</option>
                                <option value="profile_top">Top of Profile Pages</option>
                                <option value="directory_pinned">Talent Directory Featured</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Ad Creative Asset *</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
                                className="w-full text-xs text-zinc-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Start Date *</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:border-amber-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">End Date *</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:border-amber-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Client Contact / Agency</label>
                            <input
                                type="text"
                                value={clientContact}
                                onChange={e => setClientContact(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:border-amber-500 outline-none"
                                placeholder="contact@agency.com / +91 98..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Internal Deal Notes</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-sm focus:border-amber-500 outline-none"
                                placeholder="Terms, invoice #, campaign goals"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 font-bold text-xs uppercase tracking-wider transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider disabled:opacity-50 shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                    <span>Deploying...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                                    <span>Launch Campaign</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
