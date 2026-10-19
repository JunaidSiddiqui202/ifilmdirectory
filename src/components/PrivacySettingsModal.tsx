import { useState } from 'react';
import { type UserProfile } from '../services/userService';
import { useToast } from '../context/ToastContext';

interface PrivacySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    privacySettings: UserProfile['privacySettings'];
    onSave: (settings: UserProfile['privacySettings']) => Promise<void>;
}

export default function PrivacySettingsModal({ isOpen, onClose, privacySettings, onSave }: PrivacySettingsModalProps) {
    const toast = useToast();
    const [settings, setSettings] = useState<NonNullable<UserProfile['privacySettings']>>(privacySettings || {
        profileVisibility: 'public',
        showreelsVisibility: 'public',
        contactVisibility: 'public'
    });
    const [loading, setLoading] = useState(false);

    const handleToggle = (key: keyof NonNullable<UserProfile['privacySettings']>, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (loading) return;
        if (!navigator.onLine) {
            toast.error('You are offline. Please check your internet connection.');
            return;
        }

        setLoading(true);
        try {
            await onSave(settings);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save privacy settings');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-[32px] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Privacy Settings</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors font-bold">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <section className="space-y-2">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Profile Visibility</label>
                            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                                {['public', 'connections', 'private'].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => handleToggle('profileVisibility', v)}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${settings.profileVisibility === v
                                            ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-2">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Showreels Visibility</label>
                            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                                {['public', 'connections', 'private'].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => handleToggle('showreelsVisibility', v)}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${settings.showreelsVisibility === v
                                            ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-2">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Contact Details</label>
                            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                                {['public', 'connections', 'private'].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => handleToggle('contactVisibility', v)}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${settings.contactVisibility === v
                                            ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm'
                                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                            <span className="text-primary font-bold">Connections:</span> Only users you have connected with can see these items. <br />
                            <span className="text-primary font-bold">Private:</span> Only you can see these items.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
}
