import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { groupService, type Group, type ForumPost, type ForumComment } from '../services/groupService';
import PostMedia from '../components/PostMedia';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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

// Guild iconography mapping for cinematic departments
const GUILD_ICONS: Record<string, { icon: string; color: string; badge: string }> = {
    'Cinematography': { icon: 'videocam', color: 'from-amber-500 to-orange-600', badge: 'ISC / WICA' },
    'Directing': { icon: 'movie_filter', color: 'from-rose-500 to-red-600', badge: 'IFTDA / SWA' },
    'Visual Effects': { icon: 'auto_fix_high', color: 'from-purple-500 to-indigo-600', badge: 'VFX / CGI' },
    'Acting': { icon: 'theater_comedy', color: 'from-emerald-500 to-teal-600', badge: 'CINTAA' },
    'Audio & Music': { icon: 'graphic_eq', color: 'from-cyan-500 to-blue-600', badge: 'SMPPTE' },
    'Editing': { icon: 'content_cut', color: 'from-pink-500 to-rose-600', badge: 'AMVE' },
    'Production': { icon: 'badge', color: 'from-yellow-500 to-amber-600', badge: 'IMPPA / Guild' },
    'Default': { icon: 'forum', color: 'from-zinc-500 to-zinc-700', badge: 'Community' }
};

export default function GroupsForums() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const toast = useToast();

    // Filters and search
    const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'joined'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('cat') || 'All');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDepartmentGroup, setActiveDepartmentGroup] = useState<Group | null>(null);

    // Data states
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>(['group-cinematography', 'group-directing']);
    const [likedPostIds, setLikedPostIds] = useState<string[]>([]);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPostForComments, setSelectedPostForComments] = useState<ForumPost | null>(null);
    const [postComments, setPostComments] = useState<ForumComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    // New post form state
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('group-cinematography');
    const [newPostImage, setNewPostImage] = useState('');
    const [submittingPost, setSubmittingPost] = useState(false);

    // Sync URL query params if any
    useEffect(() => {
        const cat = searchParams.get('cat');
        if (cat) {
            setSelectedCategory(cat);
        }
    }, [searchParams]);

    // Initial Fetch
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
                toast.error("Failed to load industry guilds");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter categories dynamically
    const categories = useMemo(() => {
        const cats = Array.from(new Set(groups.map(g => g.category)));
        return ['All', ...cats];
    }, [groups]);

    // Handle like / upvote with optimistic update
    const handleUpvote = (postId: string) => {
        const isLiked = likedPostIds.includes(postId);
        setLikedPostIds(prev => 
            isLiked ? prev.filter(id => id !== postId) : [...prev, postId]
        );
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return { ...post, likes: post.likes + (isLiked ? -1 : 1) };
            }
            return post;
        }));
        if (!isLiked) {
            toast.success("Discussion upvoted!");
        }
    };

    // Toggle joining guild
    const handleToggleJoin = (groupId: string, groupName: string) => {
        const isJoined = joinedGroupIds.includes(groupId);
        setJoinedGroupIds(prev =>
            isJoined ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
        if (isJoined) {
            toast.info(`Left ${groupName}`);
        } else {
            toast.success(`Joined ${groupName}! New craft threads will appear in your feed.`);
        }
    };

    // Create New Discussion
    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) {
            toast.error("Please provide both a discussion title and context.");
            return;
        }

        setSubmittingPost(true);
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
            image: newPostImage.trim() || undefined,
            likes: 1,
            comments: 0,
            createdAt: new Date()
        };

        // Optimistically insert
        setPosts(prev => [newPost, ...prev]);
        setShowCreateModal(false);
        setNewTitle('');
        setNewContent('');
        setNewPostImage('');
        toast.success("Craft discussion published to the guild!");

        try {
            await groupService.createForumPost({
                groupId: selectedGroupId,
                author: newPost.author,
                authorId: newPost.authorId,
                authorImage: newPost.authorImage,
                title: newPost.title,
                content: newPost.content,
                image: newPost.image
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingPost(false);
        }
    };

    // Open Comments drawer/modal
    const handleOpenComments = async (post: ForumPost) => {
        setSelectedPostForComments(post);
        setLoadingComments(true);
        try {
            const comments = await groupService.getComments(post.id || '');
            setPostComments(comments);
        } catch (e) {
            console.error(e);
            setPostComments([]);
        } finally {
            setLoadingComments(false);
        }
    };

    // Submit a comment
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCommentText.trim() || !selectedPostForComments) return;

        setSubmittingComment(true);
        const newComment: ForumComment = {
            id: `comm-${Date.now()}`,
            postId: selectedPostForComments.id || '',
            author: currentUser?.displayName || 'Verified Filmmaker',
            authorId: currentUser?.uid || 'user-me',
            authorImage: currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
            authorRole: 'Film Professional',
            content: newCommentText.trim(),
            createdAt: new Date(),
            likes: 0
        };

        // Optimistically update comments & post comment counter
        setPostComments(prev => [...prev, newComment]);
        setPosts(prev => prev.map(p => 
            p.id === selectedPostForComments.id 
                ? { ...p, comments: (p.comments || 0) + 1 } 
                : p
        ));
        setNewCommentText('');
        toast.success("Reply added to discussion!");

        try {
            await groupService.addComment({
                postId: selectedPostForComments.id || '',
                author: newComment.author,
                authorId: newComment.authorId,
                authorImage: newComment.authorImage,
                authorRole: newComment.authorRole,
                content: newComment.content
            });
        } catch (err) {
            console.error("Error creating comment:", err);
        } finally {
            setSubmittingComment(false);
        }
    };

    // Filter Posts
    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = post.title.toLowerCase().includes(q);
                const matchContent = post.content.toLowerCase().includes(q);
                const matchAuthor = post.author.toLowerCase().includes(q);
                const matchGroup = (post.groupName || '').toLowerCase().includes(q);
                if (!matchTitle && !matchContent && !matchAuthor && !matchGroup) return false;
            }

            // Department group filter
            if (activeDepartmentGroup) {
                if (post.groupId !== activeDepartmentGroup.id) return false;
            } else if (selectedCategory !== 'All') {
                const matchedGroup = groups.find(g => g.id === post.groupId);
                if (matchedGroup && matchedGroup.category !== selectedCategory) return false;
            }

            // Tab filter
            if (activeTab === 'popular') {
                return post.likes >= 15;
            }
            if (activeTab === 'joined') {
                return joinedGroupIds.includes(post.groupId);
            }

            return true;
        });
    }, [posts, searchQuery, activeDepartmentGroup, selectedCategory, activeTab, joinedGroupIds, groups]);

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white font-display selection:bg-amber-500/30 pb-36 md:pb-24 transition-colors">
            <SEO
                title="Filmmaker Guilds & Craft Forums | iFilmDirectory"
                description="Connect with verified cinematography societies, directors guilds, VFX artists, and screenwriters. Discuss camera tech, production economics, and industry standards."
            />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="md:hidden flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/home')}>
                        <HamburgerMenu />
                        <Logo size="sm" showText={true} />
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-sm">
                            <span className="material-symbols-outlined text-xl">forum</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>Guilds & Forums</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                                    {groups.length} Channels Active
                                </span>
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Verified trade craft discussions, equipment breakdowns & crew collaborations
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => navigate('/guilds')}
                        className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] transition-all"
                        title="View Detailed Skill Guild Channels"
                    >
                        <span className="material-symbols-outlined text-base text-amber-500">groups</span>
                        <span>Trade Guilds</span>
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-amber-500/25 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-base">edit_note</span>
                        <span>Start Discussion</span>
                    </button>
                </div>
            </header>

            {/* Container */}
            <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 px-4 md:px-8 py-6 gap-6">
                
                {/* Hero Banner with Search */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white p-6 md:p-8 border border-white/10 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-amber-400 text-xs font-semibold mb-3">
                                <span className="material-symbols-outlined text-sm">verified</span>
                                <span>Indian & Global Cinema Community</span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
                                Cinematic Knowledge & Trade Guilds
                            </h2>
                            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                                Exchange technical insights with cinematographers, directors, editors, sync sound technicians, and VFX leads on active feature film workflows.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="w-full md:w-80">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search gear, optics, OTT, SOPs..."
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 focus:bg-white/15 transition-all backdrop-blur-md"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Guilds Showcase Carousel */}
                <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                                Official Industry Guilds & Societies
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeDepartmentGroup && (
                                <button
                                    onClick={() => setActiveDepartmentGroup(null)}
                                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                                >
                                    <span>Clear Guild Filter</span>
                                    <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                            )}
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                {groups.length} Verified
                            </span>
                        </div>
                    </div>

                    {/* Guild Cards Grid / Carousel */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {loading ? (
                            Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="h-44 animate-pulse rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5" />
                            ))
                        ) : (
                            groups.map((group) => {
                                const isJoined = joinedGroupIds.includes(group.id!);
                                const isSelected = activeDepartmentGroup?.id === group.id;
                                const guildStyle = GUILD_ICONS[group.category] || GUILD_ICONS['Default'];

                                return (
                                    <div
                                        key={group.id}
                                        onClick={() => setActiveDepartmentGroup(isSelected ? null : group)}
                                        className={`flex flex-col items-center text-center p-3.5 rounded-2xl bg-white dark:bg-[#121316] border transition-all cursor-pointer relative group ${
                                            isSelected 
                                                ? 'border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20' 
                                                : 'border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/40 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="relative size-14 rounded-2xl overflow-hidden mb-2.5 ring-1 ring-zinc-200 dark:ring-white/10 shrink-0 group-hover:scale-105 transition-transform bg-zinc-100 dark:bg-black">
                                            <PostMedia
                                                src={group.image || ''}
                                                fallbackType="GENERAL"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                                                <span className="material-symbols-outlined text-white text-xs">
                                                    {guildStyle.icon}
                                                </span>
                                            </div>
                                        </div>

                                        <h3 className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors w-full" title={group.name}>
                                            {group.name}
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                                            {group.members.toLocaleString()} Film Crew
                                        </p>

                                        <div className="mt-3 w-full">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleJoin(group.id!, group.name);
                                                }}
                                                className={`w-full py-1 rounded-xl text-[11px] font-bold transition-all border ${
                                                    isJoined
                                                        ? 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'
                                                        : 'bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow-sm'
                                                }`}
                                            >
                                                {isJoined ? 'Joined' : '+ Join'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Filter and Tab Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/[0.08] pb-4">
                    {/* View Tabs */}
                    <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] self-start">
                        {[
                            { key: 'all', label: 'All Discussions', icon: 'all_inclusive' },
                            { key: 'popular', label: 'High Engagement', icon: 'trending_up' },
                            { key: 'joined', label: 'My Guilds', icon: 'verified' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-white dark:bg-[#121316] text-amber-600 dark:text-amber-400 shadow-sm border border-zinc-200/50 dark:border-white/10'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Department Categories Pill Bar */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setSelectedCategory(cat);
                                    setActiveDepartmentGroup(null);
                                    if (cat === 'All') {
                                        searchParams.delete('cat');
                                    } else {
                                        searchParams.set('cat', cat);
                                    }
                                    setSearchParams(searchParams);
                                }}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                    selectedCategory === cat && !activeDepartmentGroup
                                        ? 'bg-amber-500 text-white border-transparent shadow-sm'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/20'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Layout: Discussions Feed */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                                {activeDepartmentGroup 
                                    ? `Threads in ${activeDepartmentGroup.name}`
                                    : `${selectedCategory === 'All' ? 'Industry-wide' : selectedCategory} Discussions`
                                }
                            </h3>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                            {filteredPosts.length} Topics
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="size-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading craft discussions...</p>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-16 px-4 bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-white/[0.06] shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-amber-500">
                                <span className="material-symbols-outlined text-3xl">forum</span>
                            </div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                                No discussions found in this department
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                                Be the first filmmaker to initiate a conversation or reset filters to explore all community threads.
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setActiveDepartmentGroup(null);
                                        setSearchQuery('');
                                        setActiveTab('all');
                                    }}
                                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.1] text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all"
                                >
                                    Reset Filters
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all"
                                >
                                    Start a Thread
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPosts.map((post) => {
                                const isUpvoted = likedPostIds.includes(post.id || '');
                                return (
                                    <article
                                        key={post.id}
                                        className="rounded-3xl bg-white dark:bg-[#121316] p-5 sm:p-6 shadow-sm hover:shadow-md dark:shadow-xl border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/30 transition-all flex flex-col gap-4 group"
                                    >
                                        {/* Post Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-11 rounded-2xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-black">
                                                    <PostMedia
                                                        src={post.authorImage || ''}
                                                        fallbackType="USER_MALE"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                                                            {post.author}
                                                        </h4>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                                                            Verified Film Professional
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                        in <span className="font-semibold text-zinc-800 dark:text-zinc-200">{post.groupName || 'Filmmakers Guild'}</span> • {formatTimeAgo(post.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex items-center gap-1.5">
                                                <span className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08] font-medium">
                                                    Guild Thread
                                                </span>
                                            </div>
                                        </div>

                                        {/* Post Content */}
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-2 leading-snug">
                                                {post.title}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                                {post.content}
                                            </p>
                                        </div>

                                        {/* Optional Attached Media */}
                                        {post.image && (
                                            <div className="w-full max-h-96 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/5">
                                                <img
                                                    src={post.image}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Actions Bar */}
                                        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-white/[0.06] pt-3.5 mt-1">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpvote(post.id || '')}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                        isUpvoted
                                                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20'
                                                            : 'bg-zinc-100 dark:bg-white/[0.04] hover:bg-amber-500/10 text-zinc-700 dark:text-zinc-300 hover:text-amber-500 border-zinc-200 dark:border-white/[0.06]'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-base">
                                                        {isUpvoted ? 'thumb_up' : 'thumb_up_off_alt'}
                                                    </span>
                                                    <span>{post.likes}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleOpenComments(post)}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/[0.06] text-xs font-bold transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-base">chat_bubble_outline</span>
                                                    <span>{post.comments || 0} Replies</span>
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard?.writeText(window.location.href);
                                                        toast.success("Discussion link copied to clipboard!");
                                                    }}
                                                    className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all"
                                                    title="Share discussion"
                                                >
                                                    <span className="material-symbols-outlined text-base">share</span>
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Drawer / Modal */}
            {selectedPostForComments && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
                    onClick={() => setSelectedPostForComments(null)}
                >
                    <div
                        className="bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.12] rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl text-zinc-900 dark:text-white overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-1">
                                    {selectedPostForComments.title}
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Discussion in <span className="font-semibold text-amber-500">{selectedPostForComments.groupName}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPostForComments(null)}
                                className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-500 dark:text-zinc-400 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Comments Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Original Post Context Snippet */}
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06]">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="size-7 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                                        <PostMedia
                                            src={selectedPostForComments.authorImage}
                                            fallbackType="USER_MALE"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{selectedPostForComments.author}</span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-3">
                                    {selectedPostForComments.content}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Replies & Insights ({postComments.length})
                                </h4>
                            </div>

                            {loadingComments ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="size-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : postComments.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500 text-xs">
                                    No comments yet. Share your experience on this topic!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {postComments.map((comm) => (
                                        <div
                                            key={comm.id}
                                            className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] flex gap-3"
                                        >
                                            <div className="size-8 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                                                <PostMedia
                                                    src={comm.authorImage}
                                                    fallbackType="USER_MALE"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                                            {comm.author}
                                                        </span>
                                                        {comm.authorRole && (
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-500">
                                                                {comm.authorRole}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-zinc-400">
                                                        {formatTimeAgo(comm.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                                                    {comm.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* New Comment Input */}
                        <form onSubmit={handleSubmitComment} className="p-4 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.02] flex gap-2">
                            <input
                                type="text"
                                required
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Add technical insight or reply to discussion..."
                                className="flex-1 rounded-xl bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/[0.1] px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-amber-500"
                            />
                            <button
                                type="submit"
                                disabled={submittingComment || !newCommentText.trim()}
                                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1 shrink-0"
                            >
                                <span>Send</span>
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Start Discussion Modal */}
            {showCreateModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.12] p-6 rounded-3xl w-full max-w-lg shadow-2xl text-zinc-900 dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Start a Craft Discussion</h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Share queries, equipment reviews, or production notices</p>
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
                                    Target Guild / Department
                                </label>
                                <select
                                    value={selectedGroupId}
                                    onChange={(e) => setSelectedGroupId(e.target.value)}
                                    className="w-full rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] p-3 text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:border-amber-500 transition-colors"
                                >
                                    {groups.map(g => (
                                        <option key={g.id} value={g.id} className="bg-white dark:bg-[#121316] text-zinc-900 dark:text-white">
                                            {g.name} ({g.category})
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
                                    placeholder="e.g. Best anamorphic lens choices for low-light night shoots on Alexa 35"
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
                                    placeholder="Share context, camera models, lighting setups, festival packaging, or questions..."
                                    className="w-full rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] p-3 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-amber-500 resize-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                                    Reference Image URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={newPostImage}
                                    onChange={(e) => setNewPostImage(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] p-3 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-amber-500 transition-colors"
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
                                    disabled={submittingPost}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-amber-500/25 transition-all"
                                >
                                    {submittingPost ? 'Publishing...' : 'Publish Discussion'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
