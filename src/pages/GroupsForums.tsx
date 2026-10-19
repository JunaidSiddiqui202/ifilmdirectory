import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { groupService, type Group, type ForumPost } from '../services/groupService';
import PostMedia from '../components/PostMedia';
import { useAuth } from '../context/AuthContext';

const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function GroupsForums() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [activeFilter, setActiveFilter] = useState('My Feed');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>(['group-cinematography']);

    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    // New post form state
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('group-cinematography');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedGroups, fetchedPosts] = await Promise.all([
                    groupService.getGroups(),
                    groupService.getForumPosts()
                ]);
                setGroups(fetchedGroups || []);
                setPosts(fetchedPosts || []);
            } catch (err) {
                console.error("GroupsForums fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpvote = (postId: string) => {
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, likes: post.likes + 1 }
                : post
        ));
    };

    const handleToggleJoin = (groupId: string) => {
        setJoinedGroupIds(prev => 
            prev.includes(groupId) 
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) return;

        const targetGroup = groups.find(g => g.id === selectedGroupId);
        const newPost: ForumPost = {
            id: `post-${Date.now()}`,
            groupId: selectedGroupId,
            groupName: targetGroup?.name || 'Filmmakers Guild',
            author: currentUser?.displayName || 'Film Creator',
            authorId: currentUser?.uid || 'user-default',
            authorImage: currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            title: newTitle.trim(),
            content: newContent.trim(),
            likes: 1,
            comments: 0,
            createdAt: new Date()
        };

        // Optimistically update
        setPosts(prev => [newPost, ...prev]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewContent('');

        // Persist
        await groupService.createForumPost({
            groupId: selectedGroupId,
            author: newPost.author,
            authorId: newPost.authorId,
            authorImage: newPost.authorImage,
            title: newPost.title,
            content: newPost.content
        });
    };

    // Filter posts based on active tab
    const filteredPosts = posts.filter(post => {
        if (activeFilter === 'Joined Groups') {
            return joinedGroupIds.includes(post.groupId);
        }
        if (activeFilter === 'Popular') {
            return post.likes >= 15;
        }
        return true;
    });

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white font-display selection:bg-amber-500/30 pb-36 md:pb-24 transition-colors">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090A0C]/90 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="md:hidden flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/home')}>
                        <HamburgerMenu />
                        <Logo size="sm" showText={true} />
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
                            <span className="material-symbols-outlined text-xl">forum</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>Filmmaker Guilds & Discussions</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                    Community
                                </span>
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Connect with certified guilds, share craft insights, and discuss techniques
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-black shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        <span>Start Discussion</span>
                    </button>
                </div>
            </header>

            <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 px-4 md:px-8 py-6">
                {/* Mobile Hero */}
                <div className="md:hidden mb-4">
                    <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span>Guilds & Community</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                            {groups.length} Guilds
                        </span>
                    </h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Discussions with directors, cinematographers, writers & crew
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
                    {['My Feed', 'Popular', 'Newest', 'Joined Groups'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
                                activeFilter === filter
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-transparent shadow-md shadow-amber-500/20'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.06] hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20 shadow-sm dark:shadow-none'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Main Content Grid: Guilds Carousel + Feed */}
                <div className="flex flex-col gap-8">
                    {/* Active Industry Guilds Carousel */}
                    <section>
                        <div className="mb-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Active Industry Guilds</h2>
                            </div>
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{groups.length} Guilds Available</span>
                        </div>

                        <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x">
                            {loading ? (
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-44 w-40 animate-pulse rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 shadow-sm" />
                                    ))}
                                </div>
                            ) : (
                                groups.map((group) => {
                                    const isJoined = joinedGroupIds.includes(group.id!);
                                    return (
                                        <div
                                            key={group.id}
                                            className="flex min-w-[155px] max-w-[165px] shrink-0 flex-col items-center gap-2.5 rounded-2xl bg-white dark:bg-[#121316] p-4 shadow-sm hover:shadow-md dark:shadow-xl border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/30 transition-all snap-start group"
                                        >
                                            <div className="size-16 rounded-2xl overflow-hidden ring-1 ring-zinc-200 dark:ring-white/10 shrink-0 group-hover:scale-105 transition-transform bg-zinc-100 dark:bg-black">
                                                <PostMedia
                                                    src={group.image || ''}
                                                    fallbackType="GENERAL"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="text-center w-full min-w-0">
                                                <h3 className="line-clamp-1 text-xs font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" title={group.name}>
                                                    {group.name}
                                                </h3>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                                                    {group.members.toLocaleString()} Members
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleToggleJoin(group.id!)}
                                                className={`mt-auto w-full rounded-xl py-1.5 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 border ${
                                                    isJoined
                                                        ? 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-200 dark:hover:bg-white/[0.1]'
                                                        : 'bg-amber-500 text-white hover:bg-amber-400 border-amber-400 shadow-md shadow-amber-500/20'
                                                }`}
                                            >
                                                {isJoined ? (
                                                    <>
                                                        <span className="material-symbols-outlined text-xs">check</span>
                                                        <span>Joined</span>
                                                    </>
                                                ) : (
                                                    <span>Join Guild</span>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    {/* Forum Posts / Discussions */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-400" />
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Recent Craft Discussions</h2>
                            </div>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{filteredPosts.length} Topics</span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="size-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="text-center py-16 px-4 bg-white dark:bg-[#121316] rounded-2xl border border-zinc-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                                <span className="material-symbols-outlined text-4xl mb-2 text-zinc-400 dark:text-zinc-500">forum</span>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">No discussions in this tab</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                                    Be the first to start a conversation or switch back to the 'My Feed' tab.
                                </p>
                                <button
                                    onClick={() => setActiveFilter('My Feed')}
                                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all shadow-sm"
                                >
                                    View All Discussions
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPosts.map((post) => (
                                    <article
                                        key={post.id}
                                        className="rounded-2xl bg-white dark:bg-[#121316] p-5 shadow-sm hover:shadow-md dark:shadow-xl border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/30 flex flex-col gap-3.5 transition-all group"
                                    >
                                        {/* Post Header */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black">
                                                    <PostMedia
                                                        src={post.authorImage || ''}
                                                        fallbackType="USER_MALE"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                        {post.author}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        in <span className="font-semibold text-amber-600 dark:text-amber-400">{post.groupName || 'Filmmakers Guild'}</span> • {formatTimeAgo(post.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08]">
                                                Discussion
                                            </span>
                                        </div>

                                        {/* Post Content */}
                                        <div>
                                            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1.5 leading-snug">
                                                {post.title}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                {post.content}
                                            </p>
                                        </div>

                                        {/* Optional Attached Image */}
                                        {post.image && (
                                            <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/5">
                                                <img
                                                    src={post.image}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Post Actions */}
                                        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/[0.06] pt-3 mt-1">
                                            <div className="flex items-center gap-3 text-xs font-semibold">
                                                <button
                                                    onClick={() => handleUpvote(post.id!)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-amber-500/10 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 border border-zinc-200 dark:border-white/[0.06] transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-base text-amber-500 dark:text-amber-400">arrow_upward</span>
                                                    <span>{post.likes}</span>
                                                </button>
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.06] transition-all">
                                                    <span className="material-symbols-outlined text-base">chat_bubble_outline</span>
                                                    <span>{post.comments} comments</span>
                                                </button>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard?.writeText(window.location.href);
                                                }}
                                                className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">share</span>
                                                <span className="hidden sm:inline">Share</span>
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <BottomNav />

            {/* Create Post Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.12] p-6 rounded-2xl w-full max-w-lg shadow-2xl text-zinc-900 dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Start a Discussion</h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Share queries, equipment feedback, or industry notices</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                                    Target Guild / Group
                                </label>
                                <select
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value)}
                                    className="w-full rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] p-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                                >
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id} className="bg-white dark:bg-[#121316] text-zinc-900 dark:text-white">
                                            {g.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                                    Discussion Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Best anamorphic lens choices for low-light night shoots"
                                    className="w-full rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] p-3 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                                    Discussion Details
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="Share context, camera models, lighting setups, or questions..."
                                    className="w-full rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] p-3 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-amber-500 resize-none transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-white/[0.08] text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 shadow-md shadow-amber-500/25 transition-all"
                                >
                                    Publish Discussion
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
