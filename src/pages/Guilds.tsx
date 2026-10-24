import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { guildService } from '../services/guildService';
import type { Guild, GuildPost } from '../services/guildService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../services/storageService';
import BottomNav from '../components/BottomNav';
import PostMedia from '../components/PostMedia';
import SEO from '../components/SEO';

export default function Guilds() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
    const [posts, setPosts] = useState<GuildPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [enhancing, setEnhancing] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [postType, setPostType] = useState<'post' | 'poll' | 'ama'>('post');
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestName, setRequestName] = useState('');
    const [requestReason, setRequestReason] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [isBTS, setIsBTS] = useState(false);
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [languageMix, setLanguageMix] = useState('english');
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [trendingPosts, setTrendingPosts] = useState<GuildPost[]>([]);
    const [activePostId, setActivePostId] = useState<string | null>(null);
    const [hasAgreedGuidelines, setHasAgreedGuidelines] = useState<boolean>(() => {
        try {
            return localStorage.getItem('ifilmdirectory_guild_standards_agreed') === 'true';
        } catch {
            return false;
        }
    });

    const languages = [
        { code: 'english', name: 'English' },
        { code: 'hi', name: 'हिंदी (Hindi)' },
        { code: 'te', name: 'తెలుగు (Telugu)' },
        { code: 'ta', name: 'தமிழ் (Tamil)' },
        { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
        { code: 'ml', name: 'മലയാളം (Malayalam)' },
        { code: 'ur', name: 'اردو (Urdu)' },
        { code: 'hinglish', name: 'Hinglish (Hindi-English)' },
        { code: 'tinglish', name: 'Tinglish (Telugu-English)' },
        { code: 'tanglish', name: 'Tanglish (Tamil-English)' },
        { code: 'kanglish', name: 'Kanglish (Kannada-English)' },
        { code: 'manglish', name: 'Manglish (Malayalam-English)' },
    ];

    // Material Symbol icons for each guild (reliable client-side mapping)
    const GUILD_ICONS: Record<string, string> = {
        'vfx-cgi': 'movie_filter',
        'cinematography': 'videocam',
        'acting': 'theater_comedy',
        'directing': 'movie_edit',
        'line-producers': 'analytics',
        'art-department': 'palette',
        'public-relations': 'campaign',
        'makeup-styling': 'face_retouching_natural',
        'music-playback': 'music_note',
        'post-production': 'content_cut',
        'casting-network': 'person_search'
    };

    const getGuildIcon = (guild: Guild) => GUILD_ICONS[guild.slug] || 'groups';

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (!selectedGuild) return;

        console.log('[Guilds] Subscribing to posts for guild:', selectedGuild.id);
        const unsubscribe = guildService.subscribeToGuildPosts(selectedGuild.id, (guildPosts) => {
            console.log('[Guilds] Received posts update:', guildPosts.length, 'posts');
            if (activePostId) {
                const activeInTrending = trendingPosts.find(p => p.id === activePostId);
                if (activeInTrending && !guildPosts.some(p => p.id === activePostId)) {
                    setPosts([activeInTrending, ...guildPosts]);
                    return;
                }
            }
            setPosts(guildPosts);
        });

        return () => unsubscribe();
    }, [selectedGuild, activePostId, trendingPosts]);

    // Subscribe to ALL guild posts for trending topics
    useEffect(() => {
        console.log('[Guilds] Subscribing to all guild posts for trending');
        const unsubscribe = guildService.subscribeToAllGuildPosts((allPosts) => {
            console.log('[Guilds] Received all posts update:', allPosts.length, 'posts');
            // Sort by creation date and take top 10
            const sorted = allPosts.sort((a, b) => {
                const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() :
                    typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() :
                    typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
            });
            setTrendingPosts(sorted.slice(0, 10));
        });

        return () => unsubscribe();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        const allGuilds = await guildService.getAllGuilds();
        setGuilds(allGuilds);
        if (allGuilds.length > 0) {
            setSelectedGuild(allGuilds[0]);
        }
        setLoading(false);
    };

    const handleSelectGuild = (guild: Guild) => {
        setSelectedGuild(guild);
    };


    const handleApplyGlitter = async () => {
        if (!newPostContent) return;
        setEnhancing(true);
        const res = await aiService.enhanceText(newPostContent, {
            tone: 'guild',
            purpose: 'post',
            languageMix: languageMix
        });
        if (res.success && res.data) {
            setNewPostContent(res.data);
        }
        setEnhancing(false);
    };

    const handleCreatePost = async () => {
        if (!selectedGuild || !currentUser || !newPostTitle || !newPostContent) return;

        setSharing(true);
        try {
            let mediaUrls: string[] = [];

            if (selectedImage) {
                const uploadRes = await uploadFile(selectedImage);
                if (uploadRes.url) {
                    mediaUrls.push(uploadRes.url);
                }
            } else if (imagePreview && imagePreview.startsWith('http')) {
                // If it's an AI-generated URL and not a local file preview
                mediaUrls.push(imagePreview);
            }

            const pollData = postType === 'poll' ? {
                options: pollOptions.filter(opt => opt.trim()).map((opt, i) => ({
                    id: `opt_${i}`,
                    text: opt,
                    votes: 0
                })),
                totalVotes: 0,
                voters: []
            } : undefined;

            await guildService.createPost({
                guildId: selectedGuild.id,
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Anonymous',
                userPhoto: currentUser.photoURL || undefined,
                title: newPostTitle,
                content: newPostContent,
                tags: [...activeTags, ...(isBTS ? ['BTS', 'Critique'] : [])],
                language: 'english',
                type: postType,
                pollData,
                amaHostId: postType === 'ama' ? currentUser.uid : undefined,
                mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
            });

            setNewPostTitle('');
            setNewPostContent('');
            setPostType('post');
            setPollOptions(['', '']);
            setSelectedImage(null);
            setImagePreview(null);
            setIsBTS(false);
            setActiveTags([]);
            setShowCreatePost(false);
            // No need to manually refresh, the listener will handle it!
        } catch (error) {
            console.error('Post creation failed:', error);
            alert('Failed to post. Please try again.');
        } finally {
            setSharing(false);
            setShowCreatePost(false);
        }
    };

    const handleImageSelect = (file: File | null) => {
        if (!file) return;
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerateAIImage = async () => {
        if (!newPostTitle && !newPostContent) {
            alert('Please enter some text in the title or content first so the AI can understand the context!');
            return;
        }

        setGeneratingAI(true);
        try {
            // Using the new context-aware visual generation
            const res = await aiService.generateVisual(newPostTitle, newPostContent);
            if (res.success && res.data) {
                setImagePreview(res.data);
            } else {
                // Fallback to a high-quality cinema shot if AI fails
                setImagePreview(`https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop`);
            }
        } catch (error) {
            console.error('Visual generation failed:', error);
            setImagePreview(`https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1000&auto=format&fit=crop`);
        } finally {
            setGeneratingAI(false);
        }
    };

    const handleRequestGuild = async () => {
        if (!currentUser || !requestName || !requestReason) return;
        setRequesting(true);
        await guildService.requestGuild({
            userId: currentUser.uid,
            guildName: requestName,
            reason: requestReason
        });
        setRequestName('');
        setRequestReason('');
        setShowRequestModal(false);
        setRequesting(false);
        alert('Your guild request has been submitted for review!');
    };

    // Handle clicking a trending topic card: switch guild and smooth scroll to the post
    const handleSelectTrendingTopic = (post: GuildPost) => {
        setActivePostId(post.id);

        // Find the guild this post belongs to
        const targetGuild = guilds.find(g => g.id === post.guildId) || guilds.find(g => g.slug === post.guildId);
        
        if (targetGuild) {
            setSelectedGuild(targetGuild);
        }

        // If the post is not in the current feed, proactively prepend it so it immediately appears
        setPosts(prev => {
            if (prev.some(p => p.id === post.id)) return prev;
            return [post, ...prev];
        });

        // Smooth scroll to the post and trigger highlighting
        setTimeout(() => {
            const el = document.getElementById(`post-${post.id}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 150);
    };

    if (loading && guilds.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[100dvh]">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 flex flex-col relative pb-20">
            <SEO
                title="Cinema Guilds & Film Associations | Industry Unions"
                description="Explore verified film industry guilds, cinematography societies, writers associations, and cinema unions across Indian and global filmmaking."
                keywords={[
                    'film guilds',
                    'cinema unions',
                    'cinematography association',
                    'directors guild',
                    'screenwriters association',
                    'film trade bodies'
                ]}
            />

            {/* Top Navigation & Cinema Department Horizontal Tabs */}
            <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] shadow-xs">
                {/* Header Bar */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/groups-forums')}
                            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/[0.08] transition-all"
                            title="Back to Forums"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500 text-xl">groups</span>
                                <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                                    Skill Guilds
                                </h1>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider border border-amber-500/20">
                                    Trade Chapters
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
                                Specialized industry associations for verified cinema craft professionals
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-white/20 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:border-amber-500 hover:text-amber-500 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                            <span>Request Guild</span>
                        </button>
                        <button
                            onClick={() => setShowCreatePost(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0 text-xs"
                        >
                            <span className="material-symbols-outlined text-base">edit_note</span>
                            <span>Post in Guild</span>
                        </button>
                    </div>
                </div>

                {/* Horizontal Cinema Department Tabs */}
                <div className="border-t border-zinc-100 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none snap-x">
                            {guilds.map((guild) => {
                                const isActive = selectedGuild?.id === guild.id;
                                return (
                                    <button
                                        key={guild.id}
                                        onClick={() => handleSelectGuild(guild)}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start cursor-pointer border ${
                                            isActive
                                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25'
                                                : 'bg-white dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/40 hover:bg-amber-500/5'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-base ${isActive ? 'text-white' : 'text-amber-500'}`}>
                                            {getGuildIcon(guild)}
                                        </span>
                                        <span>{guild.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400'
                                        }`}>
                                            {guild.memberCount.toLocaleString()}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Feed Area */}
            <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
                {selectedGuild && (
                    <>
                        {/* Current Guild Banner & Charter Info */}
                        <div className="bg-white dark:bg-[#121316] p-5 sm:p-6 rounded-3xl border border-zinc-200 dark:border-white/[0.08] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
                            <div className="flex items-start gap-4">
                                <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner shrink-0">
                                    <span className="material-symbols-outlined text-3xl">{getGuildIcon(selectedGuild)}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                            {selectedGuild.name}
                                        </h2>
                                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider">
                                            {selectedGuild.category}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                                        {selectedGuild.description || 'Dedicated space for verified cinema technicians, department heads, and craft specialists to exchange production standards and technical know-how.'}
                                    </p>
                                    <p className="text-[11px] text-zinc-500 font-medium pt-1 flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span>{selectedGuild.memberCount.toLocaleString()} Industry Members</span>
                                        <span>•</span>
                                        <span>Official Cinema Guild</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCreatePost(true)}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
                            >
                                <span className="material-symbols-outlined text-base">add</span>
                                <span>Start Discussion</span>
                            </button>
                        </div>

                        {/* Compact Trade Verified Standards Strip */}
                        <div className="bg-white dark:bg-[#121316] px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 min-w-0">
                                <span className="material-symbols-outlined text-amber-500 text-base shrink-0">verified_user</span>
                                <span className="font-bold text-zinc-900 dark:text-white shrink-0">Trade Verified Space:</span>
                                <span className="text-zinc-500 truncate">Strict film craft standards apply. Showrunners scout technical contributors here.</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                <span>No generic spam • Technical breakdowns only • Respect IP rights</span>
                            </div>
                        </div>

                        {/* Trending Technical Topics Across Guilds Section */}
                        <div className="bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] p-5 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-3.5">
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <span className="material-symbols-outlined text-sm">trending_up</span>
                                    </div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        Trending Technical Topics Across Guilds
                                    </h3>
                                </div>
                                <span className="text-[11px] text-zinc-400 font-medium">Click card to jump directly to thread</span>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                                {trendingPosts.length > 0 ? trendingPosts.slice(0, 6).map((post) => {
                                    const isSelected = activePostId === post.id;
                                    return (
                                        <div
                                            key={post.id}
                                            onClick={() => handleSelectTrendingTopic(post)}
                                            className={`min-w-[280px] max-w-[310px] snap-start rounded-2xl p-4 border transition-all cursor-pointer group flex flex-col justify-between ${
                                                isSelected
                                                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
                                                    : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/[0.06] hover:border-amber-500 hover:bg-amber-500/[0.02] hover:shadow-md'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2.5 mb-2.5">
                                                    <div
                                                        className="w-8 h-8 rounded-xl bg-cover bg-center shrink-0 border border-zinc-200 dark:border-white/10"
                                                        style={{ backgroundImage: `url(${post.userPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.userName)})` }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">{post.userName}</p>
                                                            {isSelected && (
                                                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500 text-white font-extrabold uppercase tracking-tight">Active</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                                                            {guilds.find(g => g.id === post.guildId)?.name || 'Guild Thread'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <h5 className={`font-bold text-xs mb-1.5 line-clamp-2 transition-colors leading-snug ${
                                                    isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-white group-hover:text-amber-500'
                                                }`}>
                                                    {post.title}
                                                </h5>
                                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                                    {post.content}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200/60 dark:border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <span className="material-symbols-outlined text-xs text-amber-500">thumb_up</span>
                                                        <span>{post.likes}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <span className="material-symbols-outlined text-xs">chat_bubble</span>
                                                        <span>{post.commentCount}</span>
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold flex items-center gap-0.5 transition-transform ${
                                                    isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500 group-hover:translate-x-0.5'
                                                }`}>
                                                    <span>{isSelected ? 'Viewing' : 'View Thread'}</span>
                                                    <span className="material-symbols-outlined text-xs">{isSelected ? 'check' : 'arrow_forward'}</span>
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="w-full py-8 text-center text-zinc-400 text-xs">
                                        No trending topics yet. Be the first to start a conversation!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Posts Feed */}
                        <div className="space-y-5">
                            {posts.length === 0 ? (
                                <div className="bg-white dark:bg-[#121316] rounded-3xl border border-zinc-200 dark:border-white/[0.08] p-12 text-center shadow-sm">
                                    <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-3xl">forum</span>
                                    </div>
                                    <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                                        No discussions yet in {selectedGuild.name}
                                    </h4>
                                    <p className="text-xs text-zinc-500 max-w-md mx-auto mb-5 leading-relaxed">
                                        Be the first industry professional to start a thread on technique, gear, workflows, or post-production standards.
                                    </p>
                                    <button
                                        onClick={() => setShowCreatePost(true)}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
                                    >
                                        <span className="material-symbols-outlined text-base">edit_note</span>
                                        <span>Create First Post</span>
                                    </button>
                                </div>
                            ) : (
                                posts.map(post => (
                                    <GuildPostCard key={post.id} post={post} isHighlighted={activePostId === post.id} />
                                ))
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Create Post Modal */}
            {showCreatePost && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowCreatePost(false)}
                >
                    <div
                        className="bg-white dark:bg-zinc-900 w-full max-w-xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/[0.08] flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/90 dark:bg-zinc-900/90 shrink-0">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-xl">edit_note</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                                            Start Guild Discussion
                                        </h3>
                                        <p className="text-[11px] text-zinc-500 font-medium truncate">
                                            Posting as <span className="font-bold text-zinc-800 dark:text-zinc-200">{currentUser?.displayName || 'Film Professional'}</span>
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowCreatePost(false)}
                                    className="size-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-all shrink-0"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1">
                            {/* Department / Guild Selector */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                                    Target Guild Department
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedGuild?.id || ''}
                                        onChange={(e) => {
                                            const guild = guilds.find(g => g.id === e.target.value);
                                            if (guild) setSelectedGuild(guild);
                                        }}
                                        className="w-full appearance-none px-3.5 py-2.5 pr-10 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs font-bold text-zinc-900 dark:text-white cursor-pointer hover:border-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                    >
                                        {guilds.map((guild) => (
                                            <option key={guild.id} value={guild.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                                                {guild.name} ({guild.category})
                                            </option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none text-base">
                                        expand_more
                                    </span>
                                </div>
                            </div>

                            {/* Type Selection */}
                            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/[0.08]">
                                {(['post', 'poll', 'ama'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setPostType(t)}
                                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all capitalize flex items-center justify-center gap-1.5 ${
                                            postType === t
                                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-sm">
                                            {t === 'post' ? 'article' : t === 'poll' ? 'poll' : 'mic_external_on'}
                                        </span>
                                        {t === 'ama' ? 'AMA' : t}
                                    </button>
                                ))}
                            </div>

                            {/* BTS / Critique Toggle */}
                            <button
                                onClick={() => setIsBTS(!isBTS)}
                                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                    isBTS
                                        ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                                        : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/[0.08]'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-lg ${isBTS ? 'text-amber-500' : 'text-zinc-400'}`}>movie_filter</span>
                                    <div className="text-left">
                                        <p className={`text-xs font-bold ${isBTS ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                            BTS / Case Study Mode
                                        </p>
                                        <p className="text-[10px] text-zinc-500 leading-none">Share on-set making-of and request professional critique</p>
                                    </div>
                                </div>
                                <div className={`w-9 h-5 rounded-full relative transition-colors ${isBTS ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-white/10'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${isBTS ? 'right-0.5' : 'left-0.5'}`}></div>
                                </div>
                            </button>

                            {/* Post Title & Visual Upload */}
                            <div className="flex gap-3">
                                <div className="flex-1 space-y-3">
                                    <input
                                        placeholder="Post Title (e.g. Best LUTs for Log3?)"
                                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-3 font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-xs transition-all"
                                        value={newPostTitle}
                                        onChange={(e) => setNewPostTitle(e.target.value)}
                                    />

                                    {postType === 'poll' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2">
                                            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Poll Options</p>
                                            {pollOptions.map((opt, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        placeholder={`Option ${i + 1}`}
                                                        className="flex-1 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg p-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...pollOptions];
                                                            newOpts[i] = e.target.value;
                                                            setPollOptions(newOpts);
                                                        }}
                                                    />
                                                    {pollOptions.length > 2 && (
                                                        <button
                                                            onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                                                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {pollOptions.length < 5 && (
                                                <button
                                                    onClick={() => setPollOptions([...pollOptions, ''])}
                                                    className="w-full py-1.5 border border-dashed border-zinc-300 dark:border-white/10 rounded-lg text-xs font-bold text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/[0.02] transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                    Add Option
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Visual Upload Box */}
                                <div className="w-24 h-24 shrink-0 group relative">
                                    {imagePreview ? (
                                        <div className="w-full h-full rounded-xl overflow-hidden border-2 border-amber-500 shadow-md">
                                            <PostMedia src={imagePreview} fallbackType="GENERAL" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-all z-10"
                                            >
                                                <span className="material-symbols-outlined text-xs">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full rounded-xl border border-dashed border-zinc-300 dark:border-white/10 flex flex-col items-center justify-center bg-zinc-50 dark:bg-white/5 hover:border-amber-500/50 hover:bg-amber-500/[0.02] transition-all cursor-pointer overflow-hidden group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
                                            />
                                            <span className="material-symbols-outlined text-2xl text-zinc-400 group-hover:text-amber-500 transition-colors">add_photo_alternate</span>
                                            <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-amber-600 mt-0.5">Add Media</span>
                                        </div>
                                    )}

                                    {/* AI Generate Button */}
                                    {!imagePreview && (
                                        <button
                                            onClick={handleGenerateAIImage}
                                            disabled={generatingAI}
                                            className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-1.5 rounded-lg shadow-md hover:scale-110 active:scale-95 transition-all z-20 group/ai"
                                            title="Generate AI Concept Image"
                                        >
                                            {generatingAI ? (
                                                <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Language Mix Dropdown */}
                            <div className="relative space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Language Tone
                                </label>
                                <button
                                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                    className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl hover:border-amber-500/50 transition-all text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-500 text-sm">translate</span>
                                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{languages.find(l => l.code === languageMix)?.name || 'English'}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-zinc-400 text-sm">{showLanguageDropdown ? 'expand_less' : 'expand_more'}</span>
                                </button>

                                {showLanguageDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-[40]"
                                            onClick={() => setShowLanguageDropdown(false)}
                                        />
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-white/10 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                                            {languages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => {
                                                        setLanguageMix(lang.code);
                                                        setShowLanguageDropdown(false);
                                                    }}
                                                    className={`w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-amber-500/5 dark:hover:bg-zinc-700 transition-colors ${languageMix === lang.code ? 'bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300'}`}
                                                >
                                                    <span className="text-xs flex-1">{lang.name}</span>
                                                    {languageMix === lang.code && (
                                                        <span className="material-symbols-outlined text-amber-500 text-sm">check_circle</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Quick Tags */}
                            <div className="flex flex-wrap gap-1.5">
                                {['#Poster', '#Lighting', '#ColorGrading', '#VFX', '#BehindTheScenes', '#Feedback'].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                                        }}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all border ${activeTags.includes(tag) ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:border-amber-500/50 hover:text-amber-600'}`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {/* Content Textarea with AI Glitter */}
                            <div className="relative group">
                                <textarea
                                    placeholder="What's on your mind? Feel free to use Hinglish, Tinglish, or Tamglish!"
                                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-3.5 min-h-[110px] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 transition-all leading-relaxed"
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                />

                                <button
                                    onClick={handleApplyGlitter}
                                    disabled={enhancing || !newPostContent}
                                    className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold rounded-full shadow-sm hover:shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className={`material-symbols-outlined text-xs ${enhancing ? 'animate-spin' : ''}`}>flare</span>
                                    Apply AI Glitter
                                </button>
                            </div>

                            {/* First-time Guild Standards Agreement */}
                            {!hasAgreedGuidelines && (
                                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={hasAgreedGuidelines}
                                        onChange={(e) => {
                                            const agreed = e.target.checked;
                                            setHasAgreedGuidelines(agreed);
                                            if (agreed) {
                                                try {
                                                    localStorage.setItem('ifilmdirectory_guild_standards_agreed', 'true');
                                                } catch {}
                                            }
                                        }}
                                        className="mt-0.5 size-4 rounded accent-amber-500 cursor-pointer shrink-0"
                                    />
                                    <div className="text-[11px] leading-snug text-zinc-700 dark:text-zinc-300">
                                        <span className="font-bold text-zinc-900 dark:text-white block">Guild Standards Agreement</span>
                                        <span>I agree to trade-verified etiquette: strictly original work/setups, constructive cinema critiques, and respecting IP rights.</span>
                                    </div>
                                </label>
                            )}

                            {/* Pro Tip Callout */}
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/15">
                                <span className="material-symbols-outlined text-amber-500 text-xs shrink-0">info</span>
                                <span>Pro Tip: Use "AI Glitter" to polish terminology and structure for guild peers.</span>
                            </div>
                        </div>

                        {/* Modal Footer - Fixed at bottom */}
                        <div className="p-4 flex gap-3 bg-zinc-50/90 dark:bg-zinc-900/90 border-t border-zinc-200 dark:border-white/[0.08] shrink-0">
                            <button
                                onClick={() => setShowCreatePost(false)}
                                className="flex-1 py-2.5 text-xs font-bold border border-zinc-200 dark:border-white/10 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePost}
                                disabled={sharing || !newPostTitle || !newPostContent || !hasAgreedGuidelines}
                                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                                <span>{sharing ? 'Sharing...' : !hasAgreedGuidelines ? 'Agree Standards to Post' : 'Share with Guild'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Guild Modal */}
            {showRequestModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setShowRequestModal(false)}
                >
                    <div
                        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-zinc-50 dark:bg-white/5">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">campaign</span>
                                Request Guild
                            </h3>
                            <button onClick={() => setShowRequestModal(false)} className="material-symbols-outlined hover:bg-gray-200 dark:hover:bg-white/10 p-2 rounded-full transition-all">close</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-text-subtle-light dark:text-text-subtle-dark mb-1 block px-1">Guild Name</label>
                                <input
                                    placeholder="e.g. Script Supervisors, Gaffer Fraternity..."
                                    className="w-full bg-gray-100 dark:bg-white/5 border border-border-light dark:border-border-dark rounded-xl p-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    value={requestName}
                                    onChange={(e) => setRequestName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-text-subtle-light dark:text-text-subtle-dark mb-1 block px-1">Why should we add this?</label>
                                <textarea
                                    placeholder="Briefly explain the need for this professional department..."
                                    className="w-full bg-gray-100 dark:bg-white/5 border border-border-light dark:border-border-dark rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm font-medium"
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-6 flex gap-3 bg-zinc-50 dark:bg-white/5 border-t border-border-light dark:border-border-dark">
                            <button
                                onClick={() => setShowRequestModal(false)}
                                className="flex-1 py-3 text-sm font-bold border border-border-light dark:border-border-dark rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestGuild}
                                disabled={requesting || !requestName || !requestReason}
                                className="flex-1 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-95"
                            >
                                {requesting ? 'Sending...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <BottomNav />
        </div>
    );
}

function GuildPostCard({ post, isHighlighted }: { post: GuildPost; isHighlighted?: boolean }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [translated, setTranslated] = useState(false);
    const [translation, setTranslation] = useState<string | null>(null);
    const [translating, setTranslating] = useState(false);
    const [poll, setPoll] = useState(post.pollData);
    const [likes, setLikes] = useState(post.likes);
    const [hasLiked, setHasLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentCount, setCommentCount] = useState(post.commentCount);
    const [isPinned, setIsPinned] = useState(post.isPinned || false);
    const [hasAgreedCommentGuidelines, setHasAgreedCommentGuidelines] = useState<boolean>(() => {
        try {
            return localStorage.getItem('ifilmdirectory_guild_standards_agreed') === 'true';
        } catch {
            return false;
        }
    });

    // Load initial comments for inline preview (newest first)
    useEffect(() => {
        const loadComments = async () => {
            try {
                // Always try to fetch from Firebase first
                console.log('[Guilds] Attempting to fetch comments for post ID:', post.id);
                const fetchedComments = await guildService.getPostComments(post.id);
                console.log('[Guilds] Found real comments in Firebase:', fetchedComments.length);

                if (fetchedComments.length > 0) {
                    // Sort by newest first
                    setComments(fetchedComments.reverse());
                    // Sync count: combine initial demo count with actual new comments if needed
                    // For now, if real comments exist, they are our source of truth + the base count
                    const baseCount = post.id.startsWith('demo_') ? Math.max(post.commentCount, fetchedComments.length) : fetchedComments.length;
                    setCommentCount(baseCount);
                } else if (post.id.startsWith('demo_')) {
                    // Only show demo comments if no real comments exist for demo posts
                    setComments([
                        { id: 'c2', userName: 'Priya Kapoor', userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100', content: 'Would love to see a follow-up post about advanced techniques!', createdAt: { seconds: Date.now() / 1000 }, likes: 0 },
                        { id: 'c1', userName: 'Ankit Sharma', userPhoto: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?q=80&w=100', content: 'Great insights! This helped me on my last project.', createdAt: { seconds: (Date.now() - 3600000) / 1000 }, likes: 0 }
                    ]);
                    setCommentCount(post.commentCount);
                }
            } catch (error) {
                console.error('[Guilds] CRITICAL: Error fetching comments:', error);
                if (post.id.startsWith('demo_')) {
                    setComments([
                        { id: 'c2', userName: 'Priya Kapoor', userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100', content: 'Would love to see a follow-up post about advanced techniques!', createdAt: { seconds: Date.now() / 1000 }, likes: 0 },
                        { id: 'c1', userName: 'Ankit Sharma', userPhoto: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?q=80&w=100', content: 'Great insights! This helped me on my last project.', createdAt: { seconds: (Date.now() - 3600000) / 1000 }, likes: 0 }
                    ]);
                }
            }
        };
        loadComments();
    }, [post.id, post.commentCount]);

    const handleLike = async () => {
        if (!currentUser || hasLiked) return;

        // Optimistic UI
        setLikes(prev => prev + 1);
        setHasLiked(true);

        // Don't call API for demo posts
        if (!post.id.startsWith('demo_')) {
            await guildService.likePost(post.id);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: post.title,
            text: `${post.userName}: ${post.title}`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.log('Share cancelled or failed');
        }
    };

    const handleTogglePin = async () => {
        if (!currentUser) return;

        const newPinState = !isPinned;
        setIsPinned(newPinState);

        if (!post.id.startsWith('demo_')) {
            await guildService.updatePost(post.id, { isPinned: newPinState });
        }
    };

    const handleOpenComments = async () => {
        setShowComments(true);
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim() || !currentUser) return;

        const commentData = {
            postId: post.id,
            userId: currentUser.uid,
            userName: currentUser.displayName || 'Anonymous',
            userPhoto: currentUser.photoURL || undefined,
            content: newComment
        };

        // Optimistic UI - add comment at the top (newest first) and increment count
        const tempId = `temp_${Date.now()}`;
        setComments(prev => [{ ...commentData, id: tempId, createdAt: new Date().toISOString(), likes: 0 }, ...prev]);
        setCommentCount(prev => prev + 1);
        setNewComment('');

        // Store in backend (for all posts including demo - they'll be stored with the demo post id)
        try {
            console.log('[Guilds] Saving comment to backend:', commentData);
            const commentId = await guildService.addComment(commentData);
            console.log('[Guilds] Comment saved with ID:', commentId);

            // Update the temp ID with the real one
            setComments(prev => prev.map(c => c.id === tempId ? { ...c, id: commentId } : c));
        } catch (error) {
            console.error('[Guilds] Error saving comment:', error);
            // Revert optimistic update on error
            setComments(prev => prev.filter(c => c.id !== tempId));
            setCommentCount(prev => prev - 1);
            alert('Failed to save comment. Please try again.');
            return;
        }

        // Auto-close modal after brief delay to show the new comment
        setTimeout(() => {
            setShowComments(false);
        }, 500);
    };

    const handleVote = async (optionId: string) => {
        if (!currentUser || !poll || poll.voters.includes(currentUser.uid)) return;

        // Optimistic UI update
        const updatedOptions = poll.options.map(opt => {
            if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
            return opt;
        });
        setPoll({
            ...poll,
            options: updatedOptions,
            totalVotes: poll.totalVotes + 1,
            voters: [...poll.voters, currentUser.uid]
        });

        if (!post.id.startsWith('demo_')) {
            await guildService.voteOnPoll(post.id, optionId, currentUser.uid);
        }
    };

    const handleTranslate = async () => {
        if (translating) return;
        if (translated) {
            setTranslated(false);
            return;
        }

        setTranslating(true);
        const res = await aiService.translateContent(post.content);
        if (res.success && res.data) {
            setTranslation(res.data.translatedText);
            setTranslated(true);
        }
        setTranslating(false);
    };

    const hasVoted = currentUser && poll?.voters.includes(currentUser.uid);

    return (
        <>
            <article
                id={`post-${post.id}`}
                className={`bg-white dark:bg-[#121316] rounded-3xl shadow-sm transition-all group overflow-hidden scroll-mt-28 ${
                    isHighlighted
                        ? 'border-2 border-amber-500 ring-4 ring-amber-500/20 shadow-xl bg-gradient-to-b from-amber-500/[0.04] to-transparent'
                        : 'border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/30 hover:shadow-md'
                } ${post.type === 'ama' ? 'border-purple-500/30' : ''}`}
            >
                {/* Post Header */}
                <div className="p-5 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-black overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 shadow-sm">
                        {post.userPhoto && (
                            <PostMedia
                                src={post.userPhoto}
                                fallbackType="USER_MALE"
                                className="w-full h-full"
                            />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                onClick={() => navigate(`/profile/${post.userId}`)}
                                className="text-sm font-black text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors cursor-pointer"
                            >
                                {post.userName}
                            </span>
                            {post.type === 'ama' && (
                                <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-black rounded uppercase tracking-tighter border border-purple-200 dark:border-purple-800">AMA Host</span>
                            )}

                            {/* Professional Badges */}
                            {post.userBadges?.map(badge => (
                                <div
                                    key={badge.id}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${badge.bg} ${badge.color} border-current/10`}
                                    title={badge.label}
                                >
                                    <span className="material-symbols-outlined text-[12px] font-bold">{badge.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-tight hidden sm:inline">{badge.label}</span>
                                </div>
                            ))}

                            <span className="text-[10px] text-text-subtle-light dark:text-text-subtle-dark font-medium">• 2h ago</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {post.type === 'ama' && <span className="material-symbols-outlined text-purple-600 text-sm">mic_external_on</span>}
                            {post.type === 'poll' && <span className="material-symbols-outlined text-orange-500 text-sm">poll</span>}
                            <h4 className="text-lg font-black leading-tight group-hover:text-primary transition-colors">{post.title}</h4>
                        </div>
                    </div>
                    <button
                        onClick={handleTogglePin}
                        className={`p-1.5 rounded-lg shadow-sm transition-all ${isPinned ? 'bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-text-subtle-light hover:text-primary hover:bg-primary/10'}`}
                        title={isPinned ? 'Unpin post' : 'Pin post'}
                    >
                        <span className="material-symbols-outlined text-sm">push_pin</span>
                    </button>
                </div>

                {/* Post Content */}
                <div className="px-5 pb-4">
                    <div className="relative">
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm font-medium whitespace-pre-wrap">
                            {translated ? translation : post.content}
                        </p>

                        {/* Media Rendering with Fallback */}
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <div className="mt-4 rounded-2xl overflow-hidden border border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5">
                                <PostMedia
                                    src={post.mediaUrls[0]}
                                    fallbackType="GENERAL"
                                    className="w-full h-auto max-h-[400px] hover:scale-[1.02] transition-transform duration-500"
                                />
                            </div>
                        )}

                        {/* Poll Display */}
                        {post.type === 'poll' && poll && (
                            <div className="mt-4 space-y-3 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-border-light dark:border-border-dark">
                                {poll.options.map((opt) => {
                                    const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleVote(opt.id)}
                                            disabled={!!hasVoted}
                                            className="w-full relative group/opt"
                                        >
                                            <div className="relative z-10 flex justify-between items-center p-3 text-sm font-bold">
                                                <div className="flex items-center gap-2">
                                                    {hasVoted && poll.voters[poll.voters.length - 1] === currentUser?.uid && opt.votes > 0 && (
                                                        <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                                                    )}
                                                    {opt.text}
                                                </div>
                                                {hasVoted && <span>{percentage}%</span>}
                                            </div>
                                            <div className="absolute inset-0 bg-white dark:bg-zinc-800 border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                                                {hasVoted && (
                                                    <div
                                                        className="h-full bg-primary/10 border-r-2 border-primary transition-all duration-1000 ease-out"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                                <p className="text-[10px] text-text-subtle-light dark:text-text-subtle-dark font-medium text-center">
                                    {poll.totalVotes} total votes • {hasVoted ? 'Thanks for voting!' : 'Vote to see results'}
                                </p>
                            </div>
                        )}

                        {/* Translation Button */}
                        <button
                            onClick={handleTranslate}
                            disabled={translating}
                            className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full border border-primary/10 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-xs">translate</span>
                            {translating ? 'Translating...' : translated ? 'See Original' : `Translate to English`}
                        </button>

                        {translated && (
                            <div className="mt-2 text-[10px] text-text-subtle-light dark:text-text-subtle-dark italic animate-in fade-in slide-in-from-top-1">
                                * Translated via AI for clarity
                            </div>
                        )}

                        {/* Interactive "Ask/Comment" Box (Inline) */}
                        <div className="mt-6 flex gap-3 items-center">
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 border border-border-light dark:border-border-dark">
                                {currentUser?.photoURL && (
                                    <PostMedia
                                        src={currentUser.photoURL}
                                        fallbackType="USER_MALE"
                                        className="w-full h-full"
                                    />
                                )}
                            </div>
                            <div className="flex-1 relative group/input">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                                    placeholder={post.type === 'ama' ? `Ask ${post.userName.split(' ')[0]} a question...` : "Add a comment..."}
                                    className={`w-full bg-zinc-50 dark:bg-zinc-800/50 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${post.type === 'ama' ? 'border-purple-200 dark:border-purple-800 focus:ring-purple-500/30' : 'border-border-light dark:border-border-dark focus:ring-primary/30'}`}
                                />
                                {newComment.trim() && (
                                    <button
                                        onClick={handleSubmitComment}
                                        className="absolute right-2 top-1.5 p-1 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xl">send</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Inline Comments Preview with Like/Reply */}
                        {comments.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark space-y-4">
                                <p className="text-[10px] font-black text-text-subtle-light dark:text-text-subtle-dark uppercase tracking-[0.2em]">Latest Engagement</p>
                                {comments.slice(0, 3).map((comment, idx) => (
                                    <div
                                        key={comment.id}
                                        className="flex gap-3 animate-in slide-in-from-left-2 duration-300"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 border border-border-light dark:border-border-dark">
                                            {comment.userPhoto && (
                                                <PostMedia
                                                    src={comment.userPhoto}
                                                    fallbackType="USER_MALE"
                                                    className="w-full h-full"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{comment.userName}</p>
                                            </div>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{comment.content}</p>

                                            {/* Inline Like & Reply Actions */}
                                            <div className="flex items-center gap-4 mt-2">
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        setComments(prev => prev.map((c, i) =>
                                                            i === idx ? { ...c, likes: (c.likes || 0) + 1 } : c
                                                        ));
                                                        if (!comment.id.startsWith('temp_') && !comment.id.startsWith('c')) {
                                                            await guildService.likeComment(comment.id);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1 text-text-subtle-light hover:text-red-500 transition-all text-[10px] font-bold"
                                                >
                                                    <span className="material-symbols-outlined text-xs">favorite</span>
                                                    <span>{comment.likes || 0}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNewComment(`@${comment.userName} `);
                                                    }}
                                                    className="flex items-center gap-1 text-text-subtle-light hover:text-primary transition-all text-[10px] font-bold"
                                                >
                                                    <span className="material-symbols-outlined text-xs">reply</span>
                                                    <span>Reply</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {comments.length > 3 && (
                                    <button
                                        onClick={handleOpenComments}
                                        className="text-xs text-primary font-black hover:underline uppercase tracking-tighter"
                                    >
                                        View all {commentCount} responses
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Post Footer - Wired Actions */}
                <div className="px-5 py-3 border-t border-border-light dark:border-border-dark flex items-center gap-6 bg-zinc-50/50 dark:bg-white/5">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 transition-all active:scale-95 group/btn ${hasLiked ? 'text-red-500' : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-red-500'}`}
                    >
                        <span className={`material-symbols-outlined text-lg ${hasLiked ? 'filled' : 'group-hover/btn:fill-current'}`}>favorite</span>
                        <span className="text-xs font-bold">{likes}</span>
                    </button>
                    <button
                        onClick={handleOpenComments}
                        className="flex items-center gap-1.5 text-text-subtle-light dark:text-text-subtle-dark hover:text-primary transition-all active:scale-95 group/btn"
                    >
                        <span className="material-symbols-outlined text-lg">chat_bubble</span>
                        <span className="text-xs font-bold">
                            {post.type === 'ama' ? `Questions (${commentCount})` : `${commentCount} Comments`}
                        </span>
                    </button>
                    {post.type === 'ama' && (
                        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">Active session</span>
                        </div>
                    )}
                    <button
                        onClick={handleShare}
                        className="ml-auto flex items-center gap-1.5 text-text-subtle-light dark:text-text-subtle-dark hover:text-primary transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-lg">share</span>
                        <span className="text-xs font-bold">Share</span>
                    </button>
                </div>
            </article>

            {/* Comments Modal */}
            {showComments && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4 z-50 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setShowComments(false)}
                >
                    <div
                        className="bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                            <h3 className="text-lg font-black">Comments</h3>
                            <button onClick={() => setShowComments(false)} className="material-symbols-outlined text-text-subtle-light hover:text-zinc-900 dark:hover:text-white">close</button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-center text-text-subtle-light py-8">No comments yet. Be the first!</p>
                            ) : (
                                comments.map((comment, idx) => (
                                    <div key={comment.id} className="flex gap-3 group/comment">
                                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                                            {comment.userPhoto && (
                                                <PostMedia
                                                    src={comment.userPhoto}
                                                    fallbackType="USER_MALE"
                                                    className="w-full h-full"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold">{comment.userName}</p>
                                                <span className="text-[10px] text-text-subtle-light">• just now</span>
                                            </div>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{comment.content}</p>

                                            {/* Like & Reply Actions */}
                                            <div className="flex items-center gap-4 mt-2">
                                                <button
                                                    onClick={async () => {
                                                        // Update local state
                                                        setComments(prev => prev.map((c, i) =>
                                                            i === idx ? { ...c, likes: (c.likes || 0) + 1 } : c
                                                        ));
                                                        // Call backend if not demo
                                                        if (!comment.id.startsWith('temp_') && !comment.id.startsWith('c')) {
                                                            await guildService.likeComment(comment.id);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1 text-text-subtle-light hover:text-red-500 transition-all text-xs"
                                                >
                                                    <span className="material-symbols-outlined text-sm">favorite</span>
                                                    <span>{comment.likes || 0}</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setNewComment(`@${comment.userName} `);
                                                    }}
                                                    className="flex items-center gap-1 text-text-subtle-light hover:text-primary transition-all text-xs"
                                                >
                                                    <span className="material-symbols-outlined text-sm">reply</span>
                                                    <span>Reply</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* First-time Comment Guild Standards Agreement */}
                        {!hasAgreedCommentGuidelines && (
                            <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-500/15 border-t border-amber-500/20">
                                <label className="flex items-start gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={hasAgreedCommentGuidelines}
                                        onChange={(e) => {
                                            const agreed = e.target.checked;
                                            setHasAgreedCommentGuidelines(agreed);
                                            if (agreed) {
                                                try {
                                                    localStorage.setItem('ifilmdirectory_guild_standards_agreed', 'true');
                                                } catch {}
                                            }
                                        }}
                                        className="mt-0.5 size-3.5 rounded accent-amber-500 cursor-pointer shrink-0"
                                    />
                                    <span className="text-[10px] leading-tight text-zinc-700 dark:text-zinc-300">
                                        <span className="font-bold text-zinc-900 dark:text-white">Guild Standards: </span>
                                        I agree to constructive critique and trade etiquette.
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Comment Input */}
                        <div className="p-4 border-t border-zinc-200 dark:border-white/10 flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                                onKeyDown={(e) => e.key === 'Enter' && hasAgreedCommentGuidelines && handleSubmitComment()}
                            />
                            <button
                                onClick={handleSubmitComment}
                                disabled={!newComment.trim() || !hasAgreedCommentGuidelines}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl disabled:opacity-50 transition-all flex items-center justify-center shadow-md shadow-amber-500/20"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
