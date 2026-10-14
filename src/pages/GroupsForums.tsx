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
                setGroups(fetchedGroups);
                setPosts(fetchedPosts);
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
            author: currentUser?.displayName || 'Junaid Siddiqui',
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
            return post.likes >= 50;
        }
        return true;
    });

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-[#090A0C] text-zinc-900 dark:text-white font-display transition-colors pb-36 md:pb-24">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto flex flex-col flex-1">
                {/* Cinema Header */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#090A0C]/85 p-4 pb-3 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="md:hidden flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/home')}>
                            <HamburgerMenu />
                            <Logo size="sm" showText={true} />
                            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Guilds
                            </span>
                        </div>
                        <h1 className="hidden md:flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                            <span className="material-symbols-outlined text-amber-500 text-xl">forum</span>
                            <span>Filmmaker Guilds & Discussions</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-black shadow-sm hover:bg-amber-400 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            <span>New Post</span>
                        </button>
                    </div>
                </header>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
                    {['My Feed', 'Popular', 'Newest', 'Joined Groups'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                                activeFilter === filter
                                    ? 'bg-amber-500 text-black font-bold shadow-sm shadow-amber-500/25'
                                    : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent dark:border-white/5'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-6 px-4">
                    {/* Suggested Groups */}
                    <section>
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Active Industry Guilds</h2>
                            </div>
                            <span className="text-xs font-semibold text-amber-500">{groups.length} Guilds</span>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                            {loading ? (
                                <div className="flex gap-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-44 w-36 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800/60" />
                                    ))}
                                </div>
                            ) : (
                                groups.map((group) => {
                                    const isJoined = joinedGroupIds.includes(group.id!);
                                    return (
                                        <div
                                            key={group.id}
                                            className="flex min-w-[145px] max-w-[155px] shrink-0 flex-col items-center gap-2.5 rounded-2xl bg-white p-3.5 shadow-sm dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07] snap-start group"
                                        >
                                            <div className="size-16 rounded-full overflow-hidden ring-2 ring-amber-500/20 shrink-0">
                                                <PostMedia
                                                    src={group.image || ''}
                                                    fallbackType="GENERAL"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            </div>
                                            <div className="text-center w-full">
                                                <h3 className="line-clamp-1 text-xs font-bold text-zinc-900 dark:text-white" title={group.name}>
                                                    {group.name}
                                                </h3>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                                                    {group.members.toLocaleString()} Members
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleToggleJoin(group.id!)}
                                                className={`mt-auto w-full rounded-full py-1 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 ${
                                                    isJoined
                                                        ? 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
                                                        : 'bg-amber-500 text-black hover:bg-amber-400 shadow-sm'
                                                }`}
                                            >
                                                {isJoined ? (
                                                    <>
                                                        <span className="material-symbols-outlined text-xs">check</span>
                                                        <span>Joined</span>
                                                    </>
                                                ) : (
                                                    <span>Join</span>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>

                {/* Forum Posts / Discussions */}
                <section className="flex flex-col gap-3.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Recent Discussions</h2>
                        </div>
                        <span className="text-xs text-zinc-400 font-medium">{filteredPosts.length} Topics</span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500 bg-white/5 rounded-2xl border border-white/5 p-6">
                            <span className="material-symbols-outlined text-3xl mb-2 text-zinc-400">forum</span>
                            <p className="text-sm font-semibold text-zinc-300">No discussions in this tab.</p>
                            <button
                                onClick={() => setActiveFilter('My Feed')}
                                className="mt-3 px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold"
                            >
                                View All Discussions
                            </button>
                        </div>
                    ) : (
                        filteredPosts.map((post) => (
                            <div
                                key={post.id}
                                className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07] flex flex-col gap-3 hover:border-amber-500/25 transition-all"
                            >
                                {/* Post Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-9 rounded-full overflow-hidden shrink-0 border border-black/10 dark:border-white/10">
                                            <PostMedia
                                                src={post.authorImage || ''}
                                                fallbackType="USER_MALE"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                                                {post.author}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                in <span className="font-semibold text-amber-500">{post.groupName || 'Filmmakers Guild'}</span> • {formatTimeAgo(post.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                        <span className="material-symbols-outlined text-lg">more_horiz</span>
                                    </button>
                                </div>

                                {/* Post Content */}
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-1">
                                        {post.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                        {post.content}
                                    </p>
                                </div>

                                {/* Optional Attached Image */}
                                {post.image && (
                                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Post Actions */}
                                <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-white/5">
                                    <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                        <button
                                            onClick={() => handleUpvote(post.id!)}
                                            className="flex items-center gap-1.5 hover:text-amber-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-base text-amber-500">arrow_upward</span>
                                            <span>{post.likes}</span>
                                        </button>
                                        <button className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-base">chat_bubble_outline</span>
                                            <span>{post.comments}</span>
                                        </button>
                                        <button className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-base">share</span>
                                            <span className="hidden sm:inline">Share</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </div>
            </div>

            <BottomNav />

            {/* Create Post Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 p-5 sm:p-6 rounded-2xl w-full max-w-md shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Start a Discussion</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-zinc-400 hover:text-white"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                    Target Guild / Group
                                </label>
                                <select
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value)}
                                    className="w-full rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-primary"
                                >
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id} className="dark:bg-zinc-900">
                                            {g.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                    Discussion Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Best cine lenses for low-light shoots"
                                    className="w-full rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                    Content
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="Share your technical question, industry experience, or advice..."
                                    className="w-full rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-primary resize-none"
                                />
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 shadow-md shadow-amber-500/25"
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
