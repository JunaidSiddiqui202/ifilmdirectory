import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import PostMedia from '../components/PostMedia';
import ExternalLink from '../components/ExternalLink';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { getUserProfile, followUser, unfollowUser, isFollowing } from '../services/userService';
import { addCommentToPost, getCommentsForPost, toggleLikePost, deletePost, reportPost, toggleSavePost } from '../services/postService';
import { Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useToast } from '../context/ToastContext';
import { useUnread } from '../context/UnreadContext';
import { useTheme } from '../context/ThemeContext';
import { rssNewsService, type NewsItem } from '../services/rssNewsService';
import SEO from '../components/SEO';

interface Comment {
    id: number | string;
    author: string;
    authorImage: string;
    text: string;
    time: string;
    likes: number;
    isLiked: boolean;
    parentId?: string;
    replyTo?: string;
    replies?: Comment[];
    showReplies?: boolean;
}

interface Post {
    id: string;
    author: string;
    authorId: string;
    authorImage: string;
    role: string;
    time: string;
    content: string;
    authorVerified?: boolean;
    image?: string;
    images?: string[];
    likes: number;
    likedBy?: string[];
    isLiked: boolean;
    comments: number;
    commentList: Comment[];
    createdAt?: any;
    jobId?: string;
    deadline?: string;
    blogId?: string;
    isSaved: boolean;
    isFollowing?: boolean;
    postType?: 'blog' | 'job' | 'regular';
    videoUrl?: string;
    videoType?: 'trailer' | 'teaser' | 'lyrical' | 'opening';
    movieTitle?: string;
    releaseDate?: string;
}

const formatTimeAgo = (date: any) => {
    if (!date) return '';
    const now = new Date();
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    const diff = now.getTime() - dateObj.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Just now';
};

// Helper to linkify URLs in text
const Linkify = ({ children }: { children: string }) => {
    const text = children;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
        <span>
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    const href = part.startsWith('http') ? part : `https://${part}`;
                    return (
                        <ExternalLink
                            key={i}
                            href={href}
                            className="text-blue-500 hover:underline break-all"
                        >
                            {part}
                        </ExternalLink>
                    );
                }
                return part;
            })}
        </span>
    );
};

export default function Showcase() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();
    const toast = useToast();
    const { hasUnreadMessages, hasUnreadNotifications } = useUnread();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        const targetId = searchParams.get('id');
        if (targetId && posts.length > 0) {
            const element = document.getElementById(`post-${targetId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [searchParams, posts]);

    // UI State
    const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [reportModalPostId, setReportModalPostId] = useState<string | null>(null);
    const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);

    // Comment Input State
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState<{ id: string | number; author: string } | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [feedFilter, setFeedFilter] = useState<'All' | 'BTS' | 'Cinematography' | 'Opportunities'>('All');
    
    // Feed Mode: News & Reviews vs Creators Feed
    const [mainFeedTab, setMainFeedTab] = useState<'news' | 'creators'>(
        searchParams.get('tab') === 'creators' ? 'creators' : 'news'
    );
    const [news, setNews] = useState<NewsItem[]>([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [newsFilter, setNewsFilter] = useState<'all' | 'releases' | 'openings' | 'reviews' | 'telugu' | 'tamil' | 'malayalam' | 'kannada'>('all');
    const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsItem | null>(null);
    const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);

    // Auto-load Live South Cinema News & Reviews
    useEffect(() => {
        let mounted = true;
        rssNewsService.getNews().then(data => {
            if (mounted && data.items.length > 0) {
                setNews(data.items);
            }
        }).catch(err => {
            console.error("Error loading feed news:", err);
        }).finally(() => {
            if (mounted) setNewsLoading(false);
        });

        // 90-minute auto update check
        const newsInterval = setInterval(async () => {
            if (rssNewsService.isCacheStale()) {
                try {
                    const fresh = await rssNewsService.getNews(true);
                    if (mounted && fresh.items.length > 0) {
                        setNews(fresh.items);
                    }
                } catch (e) {
                    console.warn("Background news refresh error in Showcase:", e);
                }
            }
        }, 60 * 1000);

        return () => {
            mounted = false;
            clearInterval(newsInterval);
        };
    }, []);

    const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});
    const [followedSuggestedIds, setFollowedSuggestedIds] = useState<Record<string, boolean>>({});

    const toggleFollowSuggested = async (creatorId: string, creatorName: string) => {
        if (!currentUser) {
            openAuthModal('Sign in to follow creators');
            return;
        }
        const isNowFollowing = !followedSuggestedIds[creatorId];
        setFollowedSuggestedIds(prev => ({ ...prev, [creatorId]: isNowFollowing }));
        try {
            if (isNowFollowing) {
                await followUser(currentUser.uid, creatorId);
                toast.success(`Following ${creatorName}`);
            } else {
                await unfollowUser(currentUser.uid, creatorId);
                toast.info(`Unfollowed ${creatorName}`);
            }
        } catch (e) {
            console.error("Error following suggested creator", e);
        }
    };

    const suggestedList = [
        {
            id: 'priya_director',
            name: 'Priya Patel',
            role: 'Director / Feature',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
            verified: true,
        },
        {
            id: 'ananya_cinematography',
            name: 'Ananya Reddy',
            role: 'Cinematographer (ISC)',
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
            verified: true,
        },
        {
            id: 'rohan_sound',
            name: 'Rohan Das',
            role: 'Sound Designer / Atmos',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
            verified: false,
        },
        {
            id: 'aarav_actor',
            name: 'Aarav Sharma',
            role: 'Lead Actor',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
            verified: true,
        },
    ];

    const toggleExpandPost = (postId: string) => {
        setExpandedPostIds(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const initiateReply = (commentId: string | number, author: string) => {
        setReplyingTo({ id: commentId, author });
        // Optionally focus input
        const input = document.getElementById('comment-input');
        if (input) input.focus();
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const groupComments = (rawComments: any[]) => {
        const mapped = rawComments.map(c => ({
            ...c,
            id: c.id,
            time: formatTimeAgo(c.createdAt),
            isLiked: false,
            replies: []
        })) as Comment[];

        const topLevel: Comment[] = [];
        const replyComments: Comment[] = [];
        mapped.forEach(c => {
            if (c.parentId) replyComments.push(c);
            else topLevel.push(c);
        });

        replyComments.forEach(r => {
            const parent = topLevel.find(p => String(p.id) === String(r.parentId));
            if (parent) {
                if (!parent.replies) parent.replies = [];
                parent.replies.push(r);
            } else {
                topLevel.push(r);
            }
        });
        return topLevel;
    };


    // Load User Profile and Subscribe to Posts
    useEffect(() => {
        if (currentUser) {
            getUserProfile(currentUser.uid).then(data => {
                if (data) setUserProfile(data);
            });
        }

        // Import subscribeToPosts dynamically
        import('../services/postService').then(({ subscribeToPosts }) => {
            const unsubscribe = subscribeToPosts(async (fetchedPosts) => {
                try {
                    const savedPosts = currentUser
                        ? await getDocs(query(collection(db, 'saved_posts'), where('userId', '==', currentUser.uid)))
                            .then(snap => snap.docs.map(doc => doc.data().postId))
                        : [];

                    const mappedPosts = await Promise.all(fetchedPosts.map(async (p) => {
                        const id = p.id || Math.random().toString();
                        const isLiked = p.likedBy ? p.likedBy.includes(currentUser?.uid || '') : false;
                        const isSaved = savedPosts.includes(id);
                        const isFollowingAuthor = currentUser && p.authorId ? await isFollowing(currentUser.uid, p.authorId) : false;

                        return {
                            ...p,
                            id: id,
                            authorId: p.authorId || 'unknown',
                            time: formatTimeAgo(p.createdAt),
                            isLiked: isLiked,
                            isSaved: isSaved,
                            isFollowing: isFollowingAuthor,
                            commentList: []
                        } as Post;
                    }));
                    setPosts(mappedPosts);
                } catch (error) {
                    console.error("Error processing posts subscription:", error);
                }
            });

            return () => unsubscribe();
        });
    }, [currentUser]);

    // Fetch comments when opening comment section
    useEffect(() => {
        if (activeCommentPostId) {
            getCommentsForPost(activeCommentPostId).then(comments => {
                const grouped = groupComments(comments);
                setPosts(prev => prev.map(p => {
                    if (String(p.id) === String(activeCommentPostId)) {
                        return {
                            ...p,
                            commentList: grouped,
                            comments: (comments.length > p.comments) ? comments.length : p.comments
                        }
                    }
                    return p;
                }));
            });
        }
    }, [activeCommentPostId]);


    // Handle Likes
    const handleLike = async (post: Post) => {
        if (!currentUser) return openAuthModal('Sign in to like posts');

        const originalPosts = [...posts];
        setPosts(posts.map(p => String(p.id) === String(post.id) ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? Math.max(0, p.likes - 1) : p.likes + 1 } : p));

        try {
            await toggleLikePost(post.id, currentUser.uid);
        } catch (error) {
            setPosts(originalPosts);
        }
    };

    // Handle Save Post
    const handleSavePost = async (post: Post) => {
        if (!currentUser) return openAuthModal('Sign in to save posts to your bookmarks');

        const result = await toggleSavePost(post.id, currentUser.uid);
        if (result.success) {
            setPosts(posts.map(p => String(p.id) === String(post.id) ? { ...p, isSaved: result.isSaved } : p));
            toast.success(result.isSaved ? "Saved to your bookmarks" : "Removed from bookmarks");
        }
    };

    // Handle Follow
    const handleToggleFollow = async (e: React.MouseEvent, post: Post) => {
        e.stopPropagation();
        if (!currentUser) return openAuthModal('Sign in to follow creators');
        if (currentUser.uid === post.authorId) return;

        const isCurrentlyFollowing = post.isFollowing;
        const originalPosts = [...posts];

        // Optimistic update for all posts by this author
        setPosts(prev => prev.map(p =>
            p.authorId === post.authorId ? { ...p, isFollowing: !isCurrentlyFollowing } : p
        ));

        try {
            if (isCurrentlyFollowing) {
                await unfollowUser(currentUser.uid, post.authorId);
                toast.info(`Unfollowed ${post.author}`);
            } else {
                await followUser(currentUser.uid, post.authorId);
                toast.success(`Following ${post.author}`);
            }
        } catch (error) {
            console.error("Follow toggling failed:", error);
            setPosts(originalPosts);
            toast.error("Failed to update follow status.");
        }
    };


    // Handle Delete - Show confirmation modal
    const handleDeletePost = (postId: string) => {
        setActiveMenuPostId(null);
        setDeleteConfirmPostId(postId);
    };

    // Confirm Delete
    const confirmDeletePost = async () => {
        if (!deleteConfirmPostId) return;
        try {
            await deletePost(deleteConfirmPostId);
            setPosts(posts.filter(p => p.id !== deleteConfirmPostId));
            toast.success("Post deleted successfully.");
            setDeleteConfirmPostId(null);
        } catch (error) {
            toast.error("Failed to delete post");
            setDeleteConfirmPostId(null);
        }
    };

    // Open Report Modal
    const handleReportPost = (postId: string) => {
        if (!currentUser) return openAuthModal('Sign in to report content');
        setReportModalPostId(postId);
        setActiveMenuPostId(null);
    };

    // Confirm Report (Logic shifted from handleReportPost)
    const confirmReport = async (reason: string) => {
        if (!reportModalPostId || !currentUser) return;

        try {
            await reportPost(reportModalPostId, currentUser.uid, reason);
            toast.success("Thanks for reporting. We will review this post.");
            setReportModalPostId(null);
        } catch (error) {
            toast.error("Failed to report post.");
        }
    };

    // Handle Submit Comment
    const handleSubmitComment = async () => {
        if (!commentText.trim() || !activeCommentPostId || !currentUser) return;

        const newComment = {
            postId: activeCommentPostId,
            author: userProfile?.displayName || currentUser.displayName || 'Anonymous',
            authorId: currentUser.uid,
            authorImage: userProfile?.photoURL || currentUser.photoURL || '',
            text: commentText,
            createdAt: Timestamp.now(),
            likes: 0,
            parentId: replyingTo ? String(replyingTo.id) : undefined,
            replyTo: replyingTo ? replyingTo.author : undefined
        };

        try {
            await addCommentToPost(newComment);
            setCommentText('');
            setReplyingTo(null);
            // Refresh and group comments
            const rawComments = await getCommentsForPost(activeCommentPostId);
            const grouped = groupComments(rawComments);

            setPosts(prev => prev.map(p => {
                if (String(p.id) === String(activeCommentPostId)) {
                    return {
                        ...p,
                        commentList: grouped,
                        comments: (rawComments.length > p.comments) ? rawComments.length : (p.comments + 1)
                    }
                }
                return p;
            }));
        } catch (error) {
            console.error("Failed to post comment", error);
        }
    }


    const scrollCarousel = (id: string, direction: 'left' | 'right') => {
        const container = document.getElementById(`carousel-${id}`);
        if (container) {
            container.scrollBy({ left: direction === 'right' ? 300 : -300, behavior: 'smooth' });
        }
    };

    // Auto-scroll carousels with multiple images
    useEffect(() => {
        const intervals: NodeJS.Timeout[] = [];

        posts.forEach(post => {
            if (post.images && post.images.length > 1) {
                const interval = setInterval(() => {
                    const container = document.getElementById(`carousel-${post.id}`);
                    if (container) {
                        const maxScroll = container.scrollWidth - container.clientWidth;
                        const currentScroll = container.scrollLeft;

                        // If at the end, scroll back to start, otherwise scroll right
                        if (currentScroll >= maxScroll - 10) {
                            container.scrollTo({ left: 0, behavior: 'smooth' });
                        } else {
                            container.scrollBy({ left: 300, behavior: 'smooth' });
                        }
                    }
                }, 3000); // Auto-scroll every 3 seconds

                intervals.push(interval);
            }
        });

        // Cleanup intervals on unmount or when posts change
        return () => {
            intervals.forEach(interval => clearInterval(interval));
        };
    }, [posts]);

    const filteredPosts = posts.filter(post => {
        if (feedFilter === 'All') return true;
        if (feedFilter === 'Opportunities') return !!post.jobId;
        const text = (post.content || '').toLowerCase();
        const role = (post.role || '').toLowerCase();
        if (feedFilter === 'BTS') {
            return text.includes('bts') || text.includes('behind') || text.includes('set') || text.includes('shoot') || text.includes('production');
        }
        if (feedFilter === 'Cinematography') {
            return text.includes('cinematography') || text.includes('dop') || text.includes('camera') || text.includes('lens') || role.includes('cinematographer') || role.includes('dop');
        }
        return true;
    });

    const formatNewsTimeAgo = (timestamp: number) => {
        if (!timestamp) return '';
        const diffMs = Date.now() - timestamp;
        if (diffMs < 0) return 'Recent';
        const mins = Math.floor(diffMs / (60 * 1000));
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getNewsIndustryBadge = (industry: NewsItem['industry']) => {
        switch (industry) {
            case 'telugu': return { label: 'Tollywood', color: 'text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/25' };
            case 'tamil': return { label: 'Kollywood', color: 'text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/25' };
            case 'malayalam': return { label: 'Mollywood', color: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25' };
            case 'kannada': return { label: 'Sandalwood', color: 'text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/25' };
            default: return { label: 'South', color: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/25' };
        }
    };

    const handleShareNews = async (item: NewsItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: `${item.title} - iFilm South Cinema Wire`,
                    url: item.link
                });
            } catch {}
        } else {
            await navigator.clipboard.writeText(item.link);
            toast.success('Story link copied to clipboard!');
        }
    };

    const filteredNews = news.filter((item) => {
        if (newsFilter === 'releases') return item.category === 'release';
        if (newsFilter === 'openings') return item.category === 'opening';
        if (newsFilter === 'reviews') return item.category === 'review';
        if (newsFilter === 'telugu') return item.industry === 'telugu';
        if (newsFilter === 'tamil') return item.industry === 'tamil';
        if (newsFilter === 'malayalam') return item.industry === 'malayalam';
        if (newsFilter === 'kannada') return item.industry === 'kannada';
        return true;
    });

    const reviewsCount = news.filter(n => n.category === 'review').length;
    const releasesCount = news.filter(n => n.category === 'release').length;
    const openingsCount = news.filter(n => n.category === 'opening').length;

    type CombinedFeedItem =
        | { type: 'post'; key: string; data: Post }
        | { type: 'news'; key: string; data: NewsItem };

    const combinedNewsFeed: CombinedFeedItem[] = useMemo(() => {
        let matchingPosts = posts;
        if (newsFilter === 'reviews') {
            const reviewPosts = posts.filter(p =>
                (p.content || '').toLowerCase().includes('review') ||
                (p.content || '').toLowerCase().includes('rating') ||
                (p.content || '').includes('⭐') ||
                (p.content || '').toLowerCase().includes('verdict')
            );
            matchingPosts = reviewPosts.length > 0 ? reviewPosts : posts;
        } else if (newsFilter !== 'all') {
            const langPosts = posts.filter(p => {
                const c = (p.content || '').toLowerCase();
                const r = (p.role || '').toLowerCase();
                return c.includes(newsFilter) || r.includes(newsFilter) ||
                       (newsFilter === 'telugu' && (c.includes('tollywood') || c.includes('telugu'))) ||
                       (newsFilter === 'tamil' && (c.includes('kollywood') || c.includes('tamil'))) ||
                       (newsFilter === 'malayalam' && (c.includes('mollywood') || c.includes('malayalam'))) ||
                       (newsFilter === 'kannada' && (c.includes('sandalwood') || c.includes('kannada')));
            });
            matchingPosts = langPosts.length > 0 ? langPosts : posts;
        }

        const items: CombinedFeedItem[] = [];
        let newsIdx = 0;
        let postIdx = 0;

        // If news is available, start with top 1 scoop
        if (newsIdx < filteredNews.length) {
            items.push({ type: 'news', key: `news-${filteredNews[newsIdx].id}`, data: filteredNews[newsIdx++] });
        }

        // Interleave: 1 creator post, then up to 2 news/review stories
        while (newsIdx < filteredNews.length || postIdx < matchingPosts.length) {
            if (postIdx < matchingPosts.length) {
                items.push({ type: 'post', key: `post-${matchingPosts[postIdx].id}`, data: matchingPosts[postIdx++] });
            }
            for (let i = 0; i < 2 && newsIdx < filteredNews.length; i++) {
                items.push({ type: 'news', key: `news-${filteredNews[newsIdx].id}`, data: filteredNews[newsIdx++] });
            }
        }

        return items;
    }, [filteredNews, posts, newsFilter]);

    const renderPostArticle = (post: Post) => (
        <article
            key={post.id}
            id={`post-${post.id}`}
            className="relative flex flex-col rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07] p-4 sm:p-5 gap-3.5 shadow-sm hover:border-amber-500/25 transition-all group"
        >
            {/* Author Row */}
            <div className="flex items-center gap-3">
                <div
                    className="size-11 rounded-full overflow-hidden shrink-0 ring-1 ring-black/10 dark:ring-white/10 cursor-pointer"
                    onClick={() => navigate(`/profile/${post.authorId}`)}
                >
                    <PostMedia
                        src={post.authorImage || ''}
                        fallbackType="USER_MALE"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/profile/${post.authorId}`)}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-zinc-900 dark:text-white font-bold text-sm sm:text-[15px] hover:text-amber-500 transition-colors truncate">
                            {post.author}
                        </p>
                        {(post.authorVerified || post.author === 'Junaid Siddiqui') && (
                            <span className="material-symbols-outlined text-amber-500 text-[16px] filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        )}
                        {post.role && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                {post.role}
                            </span>
                        )}
                        {mainFeedTab === 'news' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                Filmmaker
                            </span>
                        )}
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{post.time}</p>
                </div>

                {/* Follow Button */}
                {currentUser?.uid !== post.authorId && (
                    <button
                        onClick={(e) => handleToggleFollow(e, post)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                            post.isFollowing
                                ? 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/10'
                                : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500 hover:text-black border border-amber-500/30'
                        }`}
                    >
                        {post.isFollowing ? 'Following' : '+ Follow'}
                    </button>
                )}

                {/* Menu */}
                <div className="relative">
                    <button
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 size-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id); }}
                    >
                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                    </button>
                    {activeMenuPostId === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#18191D] rounded-xl shadow-xl border border-black/10 dark:border-white/10 z-20 overflow-hidden py-1">
                            {post.authorId === currentUser?.uid ? (
                                <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">delete</span> Delete Post
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleReportPost(post.id)}
                                    className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">flag</span>
                                    Report Post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Text */}
            <div className="text-zinc-800 dark:text-zinc-200 text-sm sm:text-[15px] leading-relaxed">
                <p className={`whitespace-pre-wrap ${!expandedPostIds[post.id] && post.content.length > 200 ? 'line-clamp-4' : ''}`}>
                    <Linkify>{post.content}</Linkify>
                </p>
                {post.content.length > 200 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandPost(post.id);
                        }}
                        className="text-amber-500 hover:text-amber-400 text-xs font-bold mt-1 inline-flex items-center gap-0.5 active:scale-95 transition-transform"
                    >
                        <span>{expandedPostIds[post.id] ? 'Show less' : 'Read more'}</span>
                        <span className="material-symbols-outlined text-xs">
                            {expandedPostIds[post.id] ? 'expand_less' : 'expand_more'}
                        </span>
                    </button>
                )}
            </div>

            {/* Job Callout */}
            {post.jobId && (
                <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-500/25 flex items-center justify-between gap-3">
                    <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">Film Opportunity</span>
                        {post.deadline && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Deadline: {new Date(post.deadline).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/job/${post.jobId}`);
                        }}
                        className="bg-amber-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg hover:bg-amber-400 transition-all flex items-center gap-1 active:scale-95 shrink-0"
                    >
                        View Details
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            )}

            {/* Blog Callout */}
            {post.blogId && (
                <div className="p-3.5 bg-zinc-100 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">article</span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">Editorial & Article</span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/blogs-events');
                        }}
                        className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1"
                    >
                        Read Story
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
            )}

            {/* Media (Images/Videos) */}
            {post.videoUrl ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-black/5 dark:border-white/5 bg-black">
                    <PostMedia src={post.videoUrl} className="w-full h-full object-cover" />
                </div>
            ) : post.images && post.images.length > 0 ? (
                <div className="relative group rounded-xl overflow-hidden border border-black/5 dark:border-white/5 bg-black">
                    <div id={`carousel-${post.id}`} className={`flex gap-2 overflow-x-auto pb-0 snap-x scrollbar-hide scroll-smooth ${post.images.length === 1 ? 'justify-center' : ''}`}>
                        {post.images.map((img, idx) => (
                            <div key={idx} className="relative shrink-0 snap-start overflow-hidden w-full aspect-video bg-black flex items-center justify-center">
                                <PostMedia
                                    src={img}
                                    alt={post.content ? `${post.author || 'Filmmaker'}: ${post.content.slice(0, 50)}` : `${post.author || 'Filmmaker'} creative portfolio media`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                    {post.images.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); scrollCarousel(post.id, 'left'); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); scrollCarousel(post.id, 'right'); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                            </button>
                        </>
                    )}
                </div>
            ) : post.image ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-black/5 dark:border-white/5 bg-black">
                    <PostMedia src={post.image} className="w-full h-full object-cover" />
                </div>
            ) : null}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400">
                <button
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        post.isLiked ? 'text-amber-500 bg-amber-500/10' : 'hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    title="Appreciate"
                >
                    <span className={`material-symbols-outlined text-[18px] ${post.isLiked ? 'filled' : ''}`} style={post.isLiked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                        {post.isLiked ? 'favorite' : 'favorite_border'}
                    </span>
                    <span>{post.likes}</span>
                </button>
                <button
                    onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        activeCommentPostId === post.id ? 'text-amber-500 bg-amber-500/10' : 'hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    title="Comments"
                >
                    <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                    <span>{post.comments}</span>
                </button>
                <button
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({ title: post.author + ' on iFILM', url: window.location.origin + '/post/' + post.id });
                        } else {
                            navigator.clipboard?.writeText(window.location.origin + '/post/' + post.id);
                            toast.success('Link copied to clipboard');
                        }
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    title="Share"
                >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                </button>
                <button
                    onClick={() => handleSavePost(post)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        post.isSaved ? 'text-amber-500 bg-amber-500/10' : 'hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    title="Bookmark"
                >
                    <span className={`material-symbols-outlined text-[18px] ${post.isSaved ? 'filled' : ''}`} style={post.isSaved ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                        {post.isSaved ? 'bookmark' : 'bookmark_border'}
                    </span>
                </button>
            </div>

            {/* Comment Section (Inline) */}
            {activeCommentPostId === post.id && (
                <div className="mt-2 bg-zinc-50/70 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-2xl p-3.5 animate-in slide-in-from-top-2">
                    <div className="space-y-3 mb-3 max-h-64 overflow-y-auto pr-1">
                        {post.commentList && post.commentList.length > 0 ? (
                            post.commentList.map(comment => (
                                <div key={comment.id} className="space-y-2.5">
                                    <div className="flex gap-2.5 items-start">
                                        <div className="size-8 rounded-full overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10">
                                            <PostMedia src={comment.authorImage} fallbackType="USER_FEMALE" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="bg-white dark:bg-[#18191D] p-2.5 rounded-2xl rounded-tl-none shadow-sm border border-black/[0.03] dark:border-white/[0.06]">
                                                <p className="text-xs font-bold text-zinc-900 dark:text-white mb-0.5">{comment.author}</p>
                                                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{comment.text}</p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 ml-1 text-xs text-zinc-400">
                                                <span className="text-[10px] text-zinc-500">{comment.time}</span>
                                                <button
                                                    onClick={() => initiateReply(comment.id, comment.author)}
                                                    className="text-zinc-400 hover:text-amber-500 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                                                >
                                                    <span className="material-symbols-outlined !text-[14px]">reply</span> Reply
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nested Replies with Offset and Connector */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="space-y-2.5 ml-10 border-l border-amber-500/20 pl-3 mt-2">
                                            {comment.replies.map(reply => (
                                                <div key={reply.id} className="flex gap-2 items-start">
                                                    <div className="size-6 rounded-full overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10">
                                                        <PostMedia src={reply.authorImage} fallbackType="USER_FEMALE" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="bg-white dark:bg-[#18191D]/80 p-2 rounded-xl rounded-tl-none border border-black/[0.02] dark:border-white/[0.04]">
                                                            <p className="text-xs font-bold text-zinc-900 dark:text-white mb-0.5">{reply.author}</p>
                                                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                                                <span className="text-amber-500 font-bold mr-1">@{reply.replyTo}</span>
                                                                {reply.text}
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] text-zinc-500 ml-1 mt-0.5 inline-block">{reply.time}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 py-3">No thoughts shared yet. Start the conversation!</p>
                        )}
                    </div>
                    {currentUser ? (
                        <div className="space-y-2">
                            {replyingTo && (
                                <div className="flex items-center justify-between px-3 py-1 bg-amber-500/10 rounded-lg text-xs font-semibold text-amber-500">
                                    <span>Replying to <span className="font-bold">@{replyingTo.author}</span></span>
                                    <button onClick={cancelReply} className="hover:text-white">
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2 items-center">
                                <div className="size-8 rounded-full overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10">
                                    <PostMedia src={userProfile?.photoURL || currentUser?.photoURL || ''} fallbackType="USER_MALE" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        id="comment-input"
                                        type="text"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
                                        placeholder={replyingTo ? `Reply to ${replyingTo.author}...` : "Write a comment..."}
                                        className="w-full bg-white dark:bg-[#18191D] border border-black/10 dark:border-white/10 rounded-xl py-2 px-3.5 pr-10 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSubmitComment}
                                        disabled={!commentText.trim()}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-amber-500 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-amber-500/10 rounded-lg transition-all"
                                        title="Send comment"
                                    >
                                        <span className="material-symbols-outlined text-base">send</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-3">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Sign in to join the filmmaker discussion</p>
                            <button
                                onClick={() => openAuthModal('Sign in to post comments and join discussions')}
                                className="px-4 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors"
                            >
                                Sign In / Join
                            </button>
                        </div>
                    )}
                </div>
            )}
        </article>
    );

    const renderNewsArticle = (item: NewsItem) => {
        const badge = getNewsIndustryBadge(item.industry);
        const isReview = item.category === 'review';
        const isExpanded = expandedNewsId === item.id;

        return (
            <article
                key={item.id}
                onClick={() => setSelectedNewsArticle(item)}
                className="group relative flex flex-col rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07] overflow-hidden shadow-sm hover:border-amber-500/30 transition-all cursor-pointer"
            >
                {item.thumbnail && (
                    <div className="aspect-[16/9] w-full relative overflow-hidden bg-black">
                        <img
                            src={item.thumbnail}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border backdrop-blur-md ${badge.color}`}>
                                {badge.label}
                            </span>
                            {isReview && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-amber-500 text-white shadow-md flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px] filled text-white">star</span>
                                    <span>{item.rating || 'REVIEW'}</span>
                                </span>
                            )}
                            {item.category === 'release' && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500 text-white shadow-md flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                                    <span>{item.releaseDate ? `Release: ${item.releaseDate}` : 'RELEASE'}</span>
                                </span>
                            )}
                            {item.category === 'opening' && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-rose-500 text-white shadow-md flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">celebration</span>
                                    <span>{item.openingType === 'pooja_launch' ? 'POOJA LAUNCH' : item.openingType === 'fdfs_boxoffice' ? 'BOX OFFICE' : 'OPENING'}</span>
                                </span>
                            )}
                        </div>

                        <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/10 text-[10px] font-bold text-zinc-300">
                            {item.source}
                        </div>

                        <div className="absolute bottom-2.5 right-3 text-[11px] font-medium text-zinc-300 bg-black/60 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                            {formatNewsTimeAgo(item.timestamp)}
                        </div>
                    </div>
                )}

                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                    <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors leading-snug">
                            {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {isExpanded ? (item.content || item.description) : item.description}
                        </p>
                    </div>

                    <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNewsArticle(item);
                            }}
                            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 group/btn"
                        >
                            <span>Read Full Story</span>
                            <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-0.5 transition-transform">arrow_forward</span>
                        </button>

                        <div className="flex items-center gap-2">
                            {item.content && item.content.length > 250 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedNewsId(isExpanded ? null : item.id);
                                    }}
                                    className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    {isExpanded ? 'Show Less' : 'Quick Read'}
                                </button>
                            )}
                            <button
                                onClick={(e) => handleShareNews(item, e)}
                                className="text-zinc-400 hover:text-amber-500 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                title="Share Story"
                            >
                                <span className="material-symbols-outlined text-sm">share</span>
                                <span>Share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        );
    };

    return (
        <div className="relative mx-auto flex h-full min-h-[100dvh] w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl flex-col bg-background-light dark:bg-[#090A0C] pb-36 md:pb-24 overflow-x-hidden transition-colors">
            <SEO
                title="Showcase & Showreels | Acting Monologues & Cinematography"
                description="Watch video showreels, acting audition clips, cinematography lighting tests, directing reels, and VFX breakdowns from top cinema professionals on iFilmDirectory."
                keywords={[
                    'film showreels',
                    'acting monologues',
                    'cinematography showreel',
                    'director portfolio',
                    'audition videos',
                    'stunt reel',
                    'vfx breakdown',
                    'film talents showcase'
                ]}
            />
            {/* Report Modal */}
            {reportModalPostId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
                    onClick={() => setReportModalPostId(null)}
                >
                    <div
                        className="bg-white dark:bg-[#121316] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Report Post</h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Why are you reporting this post?</p>
                        <div className="space-y-2">
                            {['Spam', 'Inappropriate Content', 'Harassment', 'Other'].map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => confirmReport(reason)}
                                    className="w-full text-left px-4 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-900 dark:text-white text-sm font-medium transition-colors"
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setReportModalPostId(null)}
                            className="w-full py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Cinema Header - Compact on mobile */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#090A0C]/85 px-3 sm:px-6 pt-2.5 sm:pt-4 pb-1.5 sm:pb-3 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06] flex flex-col gap-1.5 sm:gap-2.5">
                <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <button
                            onClick={() => navigate('/home')}
                            className="p-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            title="Back to Home"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>
                        <HamburgerMenu />
                        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/home')}>
                            <Logo size="sm" showText={true} />
                        </div>
                    </div>

                    {/* Quick navigation to Showreel Views */}
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] text-xs">
                        <span className="text-zinc-400 font-semibold text-[11px]">Showreels:</span>
                        <button
                            onClick={() => navigate('/showreel/view1')}
                            className="px-2 py-0.5 rounded-md hover:bg-amber-500/15 hover:text-amber-500 text-zinc-600 dark:text-zinc-300 font-bold text-[11px] transition-colors"
                        >
                            Cinema View
                        </button>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <button
                            onClick={() => navigate('/showreel/upload')}
                            className="px-2 py-0.5 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[13px]">upload</span>
                            <span>Upload Reel</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <button
                            onClick={toggleDarkMode}
                            className="flex md:hidden size-8 sm:size-9 rounded-lg sm:rounded-xl items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent dark:border-white/5 transition-all active:scale-95"
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            aria-label="Toggle theme"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {isDarkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>

                        <button
                            onClick={() => navigate('/search')}
                            className="size-8 sm:size-9 rounded-lg sm:rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                            title="Search"
                        >
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">search</span>
                        </button>

                        <button
                            onClick={() => {
                                if (!currentUser) return openAuthModal('Sign in to view notifications');
                                navigate('/messaging?tab=notifications');
                            }}
                            className="relative size-8 sm:size-9 rounded-lg sm:rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                            title="Notifications"
                        >
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">notifications</span>
                            {hasUnreadNotifications && (
                                <span className="absolute top-1.5 right-1.5 size-2 bg-amber-500 rounded-full animate-pulse shadow-sm shadow-amber-500/50" />
                            )}
                        </button>

                        <button
                            onClick={() => {
                                if (!currentUser) return openAuthModal('Sign in to view messages');
                                navigate('/messaging');
                            }}
                            className="relative size-8 sm:size-9 rounded-lg sm:rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                            title="Direct Messages"
                        >
                            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">chat_bubble</span>
                            {hasUnreadMessages && (
                                <span className="absolute top-1 right-1 size-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#090A0C] animate-pulse shadow-sm shadow-red-500/60" />
                            )}
                        </button>

                        {currentUser ? (
                            <div
                                onClick={() => navigate('/profile')}
                                className="size-8 sm:size-9 rounded-full overflow-hidden ring-1 ring-black/10 dark:ring-white/10 cursor-pointer active:scale-95 transition-transform shrink-0"
                                title="Your Profile"
                            >
                                <PostMedia
                                    src={userProfile?.photoURL || currentUser?.photoURL || ''}
                                    fallbackType="USER_MALE"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => openAuthModal('Sign in to your account')}
                                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold transition-all shrink-0 shadow-sm"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>

                {/* 2-Tab Main Switcher: Compact & Slim on Mobile */}
                <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-zinc-100 dark:bg-white/5 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/10 w-full max-w-sm sm:max-w-md mx-auto">
                    <button
                        onClick={() => setMainFeedTab('news')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                            mainFeedTab === 'news'
                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[15px] sm:text-[17px]">newspaper</span>
                        <span>News & Reviews</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1 py-0.2 rounded-full ${
                            mainFeedTab === 'news' ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-500 dark:text-red-400'
                        }`}>
                            Live
                        </span>
                    </button>
                    <button
                        onClick={() => setMainFeedTab('creators')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                            mainFeedTab === 'creators'
                                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[15px] sm:text-[17px]">groups</span>
                        <span>Creators Feed</span>
                    </button>
                </div>

                {/* Sub-filter Pills: Slim & Compact */}
                {mainFeedTab === 'news' ? (
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
                        {[
                            { id: 'all', label: `All Wire & Feed (${news.length + posts.length})` },
                            { id: 'releases', label: `📅 Releases (${releasesCount})` },
                            { id: 'openings', label: `🍿 Openings (${openingsCount})` },
                            { id: 'reviews', label: `Reviews ⭐ (${reviewsCount})` },
                            { id: 'telugu', label: 'Tollywood' },
                            { id: 'tamil', label: 'Kollywood' },
                            { id: 'malayalam', label: 'Mollywood' },
                            { id: 'kannada', label: 'Sandalwood' },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setNewsFilter(f.id as any)}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                                    newsFilter === f.id
                                        ? 'bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/25'
                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent dark:border-white/5'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
                        {(['All', 'BTS', 'Cinematography', 'Opportunities'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFeedFilter(cat)}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                                    feedFilter === cat
                                        ? 'bg-amber-500 text-white font-bold shadow-sm shadow-amber-500/25'
                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent dark:border-white/5'
                                }`}
                            >
                                {cat === 'BTS' ? 'BTS & Stills' : cat}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* Feed Layout: Centered single-column stream on mobile/tablet, 2-column with right rail on XL */}
            <div className="w-full xl:grid xl:grid-cols-12 xl:gap-8 px-0 sm:px-4">
                <main className="xl:col-span-8 max-w-2xl mx-auto w-full px-3 sm:px-0 py-3 space-y-4" onClick={() => setActiveMenuPostId(null)}>
                {mainFeedTab === 'creators' ? (
                filteredPosts.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl text-amber-500">movie</span>
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">No posts in this category</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-xs">Be the first filmmaker to share trailers, stills, or announcements.</p>
                        <button
                            onClick={() => setFeedFilter('All')}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors"
                        >
                            View All Feed
                        </button>
                    </div>
                ) : (
                    filteredPosts.map(renderPostArticle)
                )) : (
                    /* NEWS & REVIEWS + CREATOR FEED STREAM */
                    <div className="space-y-4">
                        {/* Live Wire Banner */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-red-500/10 to-transparent border border-amber-500/20 flex items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="size-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-lg">rss_feed</span>
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">South Cinema Live Wire & Creators</p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">Real-time industry scoops, reviews & filmmaker posts</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/south-cinema')}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all shrink-0 flex items-center gap-1 active:scale-95 shadow-sm"
                            >
                                <span>Full Wire</span>
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </button>
                        </div>

                        {combinedNewsFeed.length === 0 ? (
                            newsLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(n => (
                                        <div key={n} className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121316] border border-black/5 dark:border-white/5 p-4 space-y-3 animate-pulse">
                                            <div className="aspect-[16/9] w-full bg-zinc-200 dark:bg-white/5 rounded-2xl" />
                                            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-white/10 rounded" />
                                            <div className="h-3 w-1/2 bg-zinc-200 dark:bg-white/5 rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                                    <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-3xl text-amber-500">newspaper</span>
                                    </div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">No stories or posts found</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-xs">Try selecting 'All Wire & Feed' to view all updates.</p>
                                    <button
                                        onClick={() => setNewsFilter('all')}
                                        className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors"
                                    >
                                        View All
                                    </button>
                                </div>
                            )
                        ) : (
                            combinedNewsFeed.map(item =>
                                item.type === 'post'
                                    ? renderPostArticle(item.data)
                                    : renderNewsArticle(item.data)
                            )
                        )}
                    </div>
                )}
                </main>

                {/* Right Rail Column (Instagram Desktop style) */}
                <aside className="hidden xl:block xl:col-span-4 sticky top-24 self-start space-y-6 pt-3 pr-2">
                    {/* User Profile Card */}
                    {currentUser ? (
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.06] shadow-sm">
                            <div
                                onClick={() => navigate('/profile')}
                                className="flex items-center gap-3 cursor-pointer min-w-0"
                            >
                                <div className="size-11 rounded-full overflow-hidden ring-1 ring-amber-500/30 shrink-0 bg-black">
                                    <PostMedia
                                        src={userProfile?.photoURL || currentUser?.photoURL || ''}
                                        fallbackType="USER_MALE"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                                            {userProfile?.displayName || currentUser?.displayName || 'Filmmaker'}
                                        </span>
                                        <span className="material-symbols-outlined text-[15px] text-amber-500">verified</span>
                                    </div>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate block">
                                        {userProfile?.role || 'Creator'} • iFilm ID
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/profile')}
                                className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors"
                            >
                                Profile
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 shadow-sm space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className="size-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                    <span className="material-symbols-outlined text-lg">movie</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Join the Community</p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Post reels, apply for jobs & connect</p>
                                </div>
                            </div>
                            <button
                                onClick={() => openAuthModal('Sign in to access your filmmaker profile & post')}
                                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs transition-all shadow-sm"
                            >
                                Sign In / Join iFilm
                            </button>
                        </div>
                    )}

                    {/* Suggested For You */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.06] space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
                                Suggested for you
                            </span>
                            <button
                                onClick={() => navigate('/browse-profiles')}
                                className="text-xs font-bold text-amber-500 hover:underline"
                            >
                                See All
                            </button>
                        </div>

                        <div className="space-y-3">
                            {suggestedList.map((creator) => (
                                <div key={creator.id} className="flex items-center justify-between gap-3">
                                    <div
                                        onClick={() => navigate(`/profile/${creator.id}`)}
                                        className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                                    >
                                        <div className="size-9 rounded-full overflow-hidden shrink-0 bg-black">
                                            <PostMedia
                                                src={creator.image}
                                                fallbackType="USER_MALE"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1">
                                                <p className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                                                    {creator.name}
                                                </p>
                                                {creator.verified && (
                                                    <span className="material-symbols-outlined text-[13px] text-amber-500">verified</span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                {creator.role}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleFollowSuggested(creator.id, creator.name)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                            followedSuggestedIds[creator.id]
                                                ? 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300'
                                                : 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
                                        }`}
                                    >
                                        {followedSuggestedIds[creator.id] ? 'Following' : 'Follow'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trending Film Guilds & Topics */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.06] space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
                                Explore Guilds
                            </span>
                            <button
                                onClick={() => navigate('/groups-forums')}
                                className="text-xs font-bold text-amber-500 hover:underline"
                            >
                                Forums
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { name: 'Directing', icon: 'movie', path: '/groups-forums?cat=Directing' },
                                { name: 'Cinematography', icon: 'videocam', path: '/groups-forums?cat=Cinematography' },
                                { name: 'Screenwriting', icon: 'edit_note', path: '/groups-forums?cat=Screenwriting' },
                                { name: 'Editing & VFX', icon: 'auto_fix_high', path: '/groups-forums?cat=Editing' },
                                { name: 'Cast & Auditions', icon: 'theater_comedy', path: '/jobs' },
                            ].map((topic) => (
                                <button
                                    key={topic.name}
                                    onClick={() => navigate(topic.path)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-500 text-zinc-600 dark:text-zinc-300 text-xs font-semibold transition-all border border-transparent hover:border-amber-500/20"
                                >
                                    <span className="material-symbols-outlined text-[14px] text-amber-500">{topic.icon}</span>
                                    <span>{topic.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Instagram-style Minimal Footer */}
                    <div className="px-2 pt-1 space-y-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <button onClick={() => navigate('/privacy')} className="hover:underline">About</button>
                            <button onClick={() => navigate('/terms')} className="hover:underline">Terms</button>
                            <button onClick={() => navigate('/privacy')} className="hover:underline">Privacy</button>
                            <button onClick={() => navigate('/jobs')} className="hover:underline">Jobs</button>
                            <button onClick={() => navigate('/booking-facilities')} className="hover:underline">Studios</button>
                            <button onClick={() => navigate('/help')} className="hover:underline">Help</button>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-600 tracking-wider uppercase font-semibold">
                            © 2026 IFILMDIRECTORY • CINEMA NETWORK
                        </p>
                    </div>
                </aside>
            </div>
            {/* Article Reader Modal */}
            {selectedNewsArticle && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedNewsArticle(null)}
                >
                    <div
                        className="w-full max-w-2xl bg-white dark:bg-[#121316] border border-black/10 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selectedNewsArticle.thumbnail && (
                            <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden relative bg-black">
                                <img
                                    src={selectedNewsArticle.thumbnail}
                                    alt={selectedNewsArticle.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                                <button
                                    onClick={() => setSelectedNewsArticle(null)}
                                    className="absolute top-3 right-3 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border border-amber-500/30 text-amber-500 bg-amber-500/10">
                                    {selectedNewsArticle.source}
                                </span>
                                {selectedNewsArticle.category === 'review' && (
                                    <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                                        <span className="material-symbols-outlined text-xs filled text-white">star</span>
                                        <span>{selectedNewsArticle.rating || 'REVIEW'}</span>
                                    </span>
                                )}
                                <span className="text-xs text-zinc-400">
                                    {formatNewsTimeAgo(selectedNewsArticle.timestamp)}
                                </span>
                            </div>

                            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white leading-tight">
                                {selectedNewsArticle.title}
                            </h2>

                            <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line space-y-2 max-h-80 overflow-y-auto pr-2">
                                {selectedNewsArticle.content || selectedNewsArticle.description}
                            </div>

                            <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-3 flex-wrap">
                                <a
                                    href={selectedNewsArticle.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-all shadow-sm"
                                >
                                    <span>Open Source Link</span>
                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                </a>

                                <button
                                    onClick={() => setSelectedNewsArticle(null)}
                                    className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-white/20 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />

            {/* Delete Confirmation Modal */}
            {deleteConfirmPostId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirmPostId(null)}>
                    <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 mx-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-600">delete</span>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Delete Post?</h3>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmPostId(null)}
                                className="flex-1 py-2.5 px-4 rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeletePost}
                                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Popover Backdrops */}
            {activeMenuPostId && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setActiveMenuPostId(null)}
                />
            )}
        </div>
    );
}
