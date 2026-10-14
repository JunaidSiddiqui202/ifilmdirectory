import React, { useEffect, useState } from 'react';
import { type UserProfile, getFollowers, getFollowing } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import PostMedia from './PostMedia';

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: 'followers' | 'following';
}

const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, userId, type }) => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen, userId, type]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = type === 'followers' ? await getFollowers(userId) : await getFollowing(userId);
            setUsers(data);
        } catch (error) {
            console.error("Error fetching follow list:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 h-full w-full">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 h-[70vh] flex flex-col border border-zinc-100 dark:border-white/5">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white capitalize leading-tight">
                            {type}
                        </h2>
                        <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400 mt-1">Network Circle</p>
                    </div>
                    <button onClick={onClose} className="size-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                        <span className="material-symbols-outlined font-black">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-4">Syncing...</p>
                        </div>
                    ) : users.length > 0 ? (
                        users.map((profile) => (
                            <div
                                key={profile.uid}
                                onClick={() => {
                                    navigate(`/profile/${profile.uid}`);
                                    onClose();
                                }}
                                className="flex items-center gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-zinc-100 dark:hover:border-white/5"
                            >
                                <div className="size-12 rounded-xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all shrink-0">
                                    <PostMedia src={profile.photoURL || ''} fallbackType="USER_MALE" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-zinc-900 dark:text-white truncate tracking-tight">{profile.displayName || 'Unnamed'}</p>
                                    <p className="text-[10px] text-primary font-black uppercase tracking-tighter truncate opacity-70">{profile.role || 'Artist'}</p>
                                </div>
                                <div className="size-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-sm font-black">arrow_forward_ios</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <div className="size-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-zinc-400">person_off</span>
                            </div>
                            <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">No {type} yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;
