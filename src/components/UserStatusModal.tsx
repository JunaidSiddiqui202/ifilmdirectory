import React, { useState } from 'react';
import type { UserProfile } from '../services/userService';
import { isSuperAdmin } from '../services/userService';

interface UserStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile | null;
    onUpdateStatus: (uid: string, status: 'active' | 'suspended' | 'blocked') => Promise<void>;
    onIssueWarning: (uid: string) => Promise<void>;
    onDeleteUser: (uid: string) => Promise<void>;
}

export default function UserStatusModal({ isOpen, onClose, user, onUpdateStatus, onIssueWarning, onDeleteUser }: UserStatusModalProps) {
    const [status, setStatus] = useState<'active' | 'suspended' | 'blocked'>('active');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Initialize status when user changes
    React.useEffect(() => {
        if (user) {
            setStatus(user.accountStatus || 'active');
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onUpdateStatus(user.uid, status);
            onClose();
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setLoading(false);
        }
    };

    const handleWarning = async () => {
        if (confirm(`Send a formal warning to ${user.displayName || 'this user'}?`)) {
            setLoading(true);
            try {
                await onIssueWarning(user.uid);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            await onDeleteUser(user.uid);
            onClose();
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    const isProtectedAdmin = isSuperAdmin(user.email);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Moderate Account</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-zinc-500">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-zinc-400 w-full h-full flex items-center justify-center">person</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-zinc-900 dark:text-white">{user.displayName || 'No Name'}</p>
                            <p className="text-sm text-zinc-500">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                                {isProtectedAdmin && <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full font-bold border border-zinc-200 uppercase tracking-tighter">System Admin</span>}
                                {(user.warningCount || 0) > 0 && (
                                    <span className="text-xs bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                                        {user.warningCount} Warnings
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {isProtectedAdmin ? (
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 text-sm rounded-lg flex gap-2">
                            <span className="material-symbols-outlined text-zinc-400">lock</span>
                            This is a protected system administrator account. Actions are restricted.
                        </div>
                    ) : (
                        <>
                            {!showDeleteConfirm ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">Change Status</label>

                                        <div className="grid grid-cols-1 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setStatus('active')}
                                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${status === 'active' ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'}`}
                                            >
                                                <span className={`material-symbols-outlined ${status === 'active' ? 'text-green-600' : 'text-zinc-400'}`}>check_circle</span>
                                                <span className={`font-bold ${status === 'active' ? 'text-green-700' : 'text-zinc-600'}`}>Active</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setStatus('suspended')}
                                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${status === 'suspended' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'}`}
                                            >
                                                <span className={`material-symbols-outlined ${status === 'suspended' ? 'text-orange-600' : 'text-zinc-400'}`}>pause_circle</span>
                                                <span className={`font-bold ${status === 'suspended' ? 'text-orange-700' : 'text-zinc-600'}`}>Suspended / Hold</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setStatus('blocked')}
                                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${status === 'blocked' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'}`}
                                            >
                                                <span className={`material-symbols-outlined ${status === 'blocked' ? 'text-red-600' : 'text-zinc-400'}`}>block</span>
                                                <span className={`font-bold ${status === 'blocked' ? 'text-red-700' : 'text-zinc-600'}`}>Blocked / Banned</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex flex-col gap-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:opacity-90 flex items-center justify-center gap-2"
                                        >
                                            {loading ? 'Processing...' : 'Save Account Status'}
                                        </button>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={handleWarning}
                                                disabled={loading}
                                                className="flex-1 py-2 rounded-lg border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-sm hover:bg-amber-500/25 flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-lg">warning</span>
                                                Issue Warning
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(true)}
                                                disabled={loading}
                                                className="flex-1 py-2 rounded-lg border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                                Delete User
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4 animate-in zoom-in-95">
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                                        <span className="material-symbols-outlined text-4xl text-red-600 mb-2">warning</span>
                                        <h3 className="font-bold text-red-800 dark:text-red-200 text-lg">Permanently Delete?</h3>
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            This will remove the user's entire profile and data from iFilmDirectory. <strong>This action cannot be undone.</strong>
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={handleDelete}
                                            disabled={loading}
                                            className="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
                                        >
                                            {loading ? 'Deleting...' : 'Confirm Permanent Deletion'}
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="w-full py-2 text-zinc-500 font-medium hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
