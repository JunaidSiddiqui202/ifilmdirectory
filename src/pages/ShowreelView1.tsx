import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, followUser, unfollowUser, isFollowing } from '../services/userService';
import {
    addCommentToPost,
    getCommentsForPost,
    toggleLikePost,
    toggleLikeComment,
    toggleSavePost,
    type CommentData
} from '../services/postService';
import { showreelService, type Showreel } from '../services/showreelService';

interface ShowreelExtended extends Showreel {
    isLiked?: boolean;
    isSaved?: boolean;
    isFollowing?: boolean;
}
import { Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Helper to get YouTube embed URL
const getYouTubeEmbedUrl = (url: string): string | null => {
    const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&]+)/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${shortsMatch[1]}`;
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${watchMatch[1]}`;
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${shortMatch[1]}`;
    return null;
};

const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
};

const HighlightMentions = ({ text }: { text: string }) => {
    const parts = text.split(/(@\w+)/g);
    return (
        <>
            {parts.map((part, i) =>
                part.startsWith('@') ? (
                    <span key={i} className="text-primary font-bold">{part}</span>
                ) : part
            )}
        </>
    );
};

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

export default function ShowreelView1() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [reels, setReels] = useState<ShowreelExtended[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

    // Interaction states
    const [activeCommentReelId, setActiveCommentReelId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [reelComments, setReelComments] = useState<any[]>([]);
    const [groupedComments, setGroupedComments] = useState<any[]>([]);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const [activeMoreMenuReelId, setActiveMoreMenuReelId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [searchParams] = useSearchParams();

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const init = async () => {
        try {
            const targetId = searchParams.get('id');
            const [trendingReels, savedIds] = await Promise.all([
                showreelService.getTrendingShowreels(20),
                currentUser ? getDocs(query(collection(db, 'saved_posts'), where('userId', '==', currentUser.uid), where('type', '==', 'showreel'))).then(snap => snap.docs.map(doc => doc.data().postId)) : Promise.resolve([])
            ]);

            let mergedReels = [...trendingReels];
            if (targetId && !mergedReels.find(r => r.id === targetId)) {
                const specificReel = await showreelService.getShowreelById(targetId);
                if (specificReel) {
                    mergedReels = [specificReel, ...mergedReels];
                }
            }

            const initialReels = await Promise.all(mergedReels.map(async (r) => {
                const isFollowingCreator = currentUser ? await isFollowing(currentUser.uid, r.creatorId) : false;
                return {
                    ...r,
                    isLiked: false,
                    isSaved: savedIds.includes(r.id),
                    isFollowing: isFollowingCreator
                };
            }));

            setReels(initialReels);

            if (currentUser) {
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);
            }
        } catch (err) {
            console.error("Failed to load reels:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        init();
    }, [currentUser]);

    // Scroll to the selected video based on URL parameter
    useEffect(() => {
        if (loading || reels.length === 0) return;

        const reelId = searchParams.get('id');
        const startIndex = searchParams.get('start');

        let targetId = reelId;
        if (!targetId && startIndex) {
            const idx = parseInt(startIndex);
            if (idx >= 0 && idx < reels.length) {
                targetId = reels[idx].id;
            }
        }

        if (targetId) {
            const targetIndex = reels.findIndex(r => r.id === targetId);
            if (targetIndex !== -1 && targetIndex !== 0) {
                setTimeout(() => {
                    if (containerRef.current) {
                        const scrollPosition = targetIndex * window.innerHeight;
                        containerRef.current.scrollTop = scrollPosition;
                    }
                }, 300);
            }
        }
    }, [reels, searchParams, loading]);

    // Handle Likes
    const handleLike = async (reelId: string) => {
        if (!currentUser) return alert("Please login to like!");

        setReels(prev => prev.map(r =>
            r.id === reelId ? { ...r, isLiked: !r.isLiked, likes: r.isLiked ? Math.max(0, r.likes - 1) : r.likes + 1 } : r
        ));

        try {
            await toggleLikePost(reelId, currentUser.uid, 'showreel');
        } catch (err) {
            console.error("Like failed:", err);
        }
    };

    // Handle Save Reel
    const handleSaveReel = async (reelId: string) => {
        if (!currentUser) return alert("Please login to save!");

        const result = await toggleSavePost(reelId, currentUser.uid, 'showreel');
        if (result.success) {
            setReels(prev => prev.map(r =>
                r.id === reelId ? { ...r, isSaved: result.isSaved } : r
            ));
            showToast(result.isSaved ? "Saved to your collection!" : "Removed from collection");
        }
    };
    const handleFollow = async (creatorId: string) => {
        if (!currentUser) return alert("Please login to follow creators!");
        if (currentUser.uid === creatorId) return alert("You cannot follow yourself.");

        const creatorReels = reels.filter(r => r.creatorId === creatorId);
        const isCurrentlyFollowing = creatorReels[0]?.isFollowing;

        // Optimistic update for all reels by this creator
        setReels(prev => prev.map(r =>
            r.creatorId === creatorId ? { ...r, isFollowing: !isCurrentlyFollowing } : r
        ));

        try {
            if (isCurrentlyFollowing) {
                await unfollowUser(currentUser.uid, creatorId);
                showToast("Unfollowed creator");
            } else {
                await followUser(currentUser.uid, creatorId);
                showToast("Creator followed!");
            }
        } catch (error) {
            console.error("Follow action failed:", error);
            // Revert on error
            setReels(prev => prev.map(r =>
                r.creatorId === creatorId ? { ...r, isFollowing: isCurrentlyFollowing } : r
            ));
        }
    };
    const groupCommentsTree = (raw: any[]) => {
        const mapped = raw.map(c => ({
            ...c,
            replies: [],
            isLiked: currentUser ? (c.likedBy?.includes(currentUser.uid) || false) : false
        }));
        const topLevel: any[] = [];
        const replyComments: any[] = [];
        mapped.forEach(c => {
            if (c.parentId) replyComments.push(c);
            else topLevel.push(c);
        });

        replyComments.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return timeA - timeB;
        });

        replyComments.forEach(r => {
            const parent = topLevel.find(p => String(p.id) === String(r.parentId));
            if (parent) {
                parent.replies.push(r);
            } else {
                topLevel.push(r);
            }
        });
        return topLevel;
    };

    const handleCommentLike = async (commentId: string) => {
        if (!currentUser) return alert("Please login to like!");

        const updatedRaw = reelComments.map(c => {
            if (c.id === commentId) {
                const isLiked = !c.isLiked;
                const likes = isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 1) - 1);
                const likedBy = isLiked
                    ? [...(c.likedBy || []), currentUser.uid]
                    : (c.likedBy || []).filter((id: string) => id !== currentUser.uid);

                return { ...c, isLiked, likes, likedBy };
            }
            return c;
        });

        setReelComments(updatedRaw);
        setGroupedComments(groupCommentsTree(updatedRaw));

        try {
            await toggleLikeComment(commentId, currentUser.uid);
        } catch (err) {
            console.error("Comment like failed:", err);
        }
    };

    // Load comments when modal opens
    useEffect(() => {
        if (activeCommentReelId) {
            getCommentsForPost(activeCommentReelId).then(comments => {
                setReelComments(comments);
                setGroupedComments(groupCommentsTree(comments));
                setReels(prev => prev.map(r =>
                    r.id === activeCommentReelId ? { ...r, comments: comments.length } : r
                ));
            });
        }
    }, [activeCommentReelId]);

    const handlePostComment = async () => {
        if (!commentText.trim() || !activeCommentReelId || !currentUser || isSubmittingComment) return;

        setIsSubmittingComment(true);
        const newComment: CommentData = {
            postId: activeCommentReelId,
            author: userProfile?.displayName || currentUser.displayName || 'Anonymous',
            authorId: currentUser.uid,
            authorImage: userProfile?.photoURL || currentUser.photoURL || '',
            text: commentText,
            createdAt: Timestamp.now(),
            likes: 0,
            type: 'showreel',
            parentId: replyingTo?.id || undefined,
            replyTo: replyingTo?.author || undefined
        };

        try {
            const saved = await addCommentToPost(newComment);
            const updatedRaw = [saved, ...reelComments];
            setReelComments(updatedRaw);
            setGroupedComments(groupCommentsTree(updatedRaw));
            setCommentText('');
            setReplyingTo(null);
            setReels(prev => prev.map(r =>
                r.id === activeCommentReelId ? { ...r, comments: (r.comments || 0) + 1 } : r
            ));
        } catch (err) {
            alert("Failed to post comment");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleShare = async (reel: Showreel) => {
        const shareData = {
            title: reel.title,
            text: `Check out this showreel by ${reel.creator} on iFilmDirectory!`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log("Share failed:", err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast("Link copied to clipboard!");
        }
    };

    // Observer for autoplay
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const videoId = entry.target.getAttribute('data-reel-id');
                    const video = videoRefs.current[videoId || ''];
                    if (video) {
                        if (entry.isIntersecting) {
                            video.play().catch(e => console.log("Autoplay blocked:", e));
                        } else {
                            video.pause();
                        }
                    }
                });
            },
            { threshold: 0.8 }
        );

        const currentReels = document.querySelectorAll('[data-reel-id]');
        currentReels.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [reels]);

    if (loading) {
        return (
            <div className="flex h-[100dvh] w-full items-center justify-center bg-black">
                <div className="size-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black" ref={containerRef}>
            {reels.map((reel) => (
                <div key={reel.id} className="h-[100dvh] w-full snap-start snap-always shrink-0 relative bg-black" data-reel-id={reel.id}>
                    {/* Media Container */}
                    <div className="absolute inset-0 z-0">
                        {reel.type === 'embed' ? (
                            <iframe
                                src={getYouTubeEmbedUrl(reel.videoUrl) || reel.videoUrl}
                                className="h-full w-full"
                                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={reel.title}
                            />
                        ) : (
                            <div className="relative h-full w-full group">
                                <video
                                    ref={(el) => { videoRefs.current[reel.id] = el; }}
                                    src={reel.videoUrl}
                                    className="h-full w-full object-contain"
                                    autoPlay
                                    loop
                                    muted={isMuted}
                                    playsInline
                                    preload="auto"
                                    poster={reel.thumbnail}
                                    onClick={(e) => {
                                        const v = e.currentTarget;
                                        if (v.paused) v.play();
                                        else v.pause();
                                    }}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMuted(!isMuted);
                                    }}
                                    className="absolute top-24 right-4 z-30 size-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {isMuted ? 'volume_off' : 'volume_up'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Overlays */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
                        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-xl border border-white/10">
                            <span className="material-symbols-outlined text-white">arrow_back_ios_new</span>
                        </button>
                        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10">
                            <span className="text-white text-xs font-black uppercase tracking-widest">Showreels</span>
                        </div>
                        <button
                            onClick={() => setActiveMoreMenuReelId(reel.id)}
                            className="size-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-xl border border-white/10 active:scale-90 transition-all"
                        >
                            <span className="material-symbols-outlined text-white">more_vert</span>
                        </button>
                    </div>

                    {/* Engagement Actions (Right Side) */}
                    <div className="absolute right-4 bottom-32 z-20 flex flex-col gap-6 items-center">
                        <div className="flex flex-col items-center gap-1.5">
                            <button
                                onClick={() => handleLike(reel.id)}
                                className={`size-12 flex items-center justify-center rounded-full backdrop-blur-3xl border border-white/20 transition-all active:scale-75 ${reel.isLiked ? 'bg-red-500 border-red-400 font-bold' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                <span className={`material-symbols-outlined text-2xl ${reel.isLiked ? 'filled text-white' : 'text-white'}`}>favorite</span>
                            </button>
                            <span className="text-[11px] font-black text-white">{formatViews(reel.likes)}</span>
                        </div>

                        <div className="flex flex-col items-center gap-1.5">
                            <button
                                onClick={() => setActiveCommentReelId(reel.id)}
                                className="size-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 hover:bg-white/20 active:scale-75 transition-all"
                            >
                                <span className="material-symbols-outlined text-2xl text-white">chat_bubble</span>
                            </button>
                            <span className="text-[11px] font-black text-white">{formatViews(reel.comments)}</span>
                        </div>

                        <div className="flex flex-col items-center gap-1.5">
                            <button
                                onClick={() => handleShare(reel)}
                                className="size-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 hover:bg-white/20 active:scale-75 transition-all"
                            >
                                <span className="material-symbols-outlined text-2xl text-white">share</span>
                            </button>
                            <span className="text-[11px] font-black text-white">Share</span>
                        </div>
                    </div>

                    {/* Info Overlay (Bottom) */}
                    <div className="absolute bottom-8 left-0 right-16 z-20 p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="size-10 rounded-full bg-cover bg-center border-2 border-primary shadow-lg cursor-pointer"
                                style={{ backgroundImage: `url(${reel.creatorPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'})` }}
                                onClick={() => navigate(`/profile/${reel.creatorId}`)}
                            />
                            <div className="flex-1">
                                <h3 className="text-white font-black text-sm tracking-tight cursor-pointer hover:underline" onClick={() => navigate(`/profile/${reel.creatorId}`)}>
                                    {reel.creator}
                                </h3>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{reel.category || 'Professional Actor'}</p>
                            </div>
                            {currentUser?.uid !== reel.creatorId && (
                                <button
                                    onClick={() => handleFollow(reel.creatorId)}
                                    className={`${reel.isFollowing ? 'bg-white/10 border border-white/20' : 'bg-primary shadow-primary/20'} text-white text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest shadow-lg active:scale-90 transition-all`}
                                >
                                    {reel.isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>
                        <p className="text-white/90 text-sm font-medium leading-snug line-clamp-2">
                            {reel.title}
                        </p>
                    </div>
                </div>
            ))}

            {/* Premium Comments Modal */}
            {activeCommentReelId && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => {
                    setActiveCommentReelId(null);
                    setReplyingTo(null);
                }}>
                    <div className="w-full max-w-md bg-zinc-900 rounded-t-[40px] border-t border-white/10 overflow-hidden animate-in slide-in-from-bottom flex flex-col h-[75dvh] max-h-[85dvh]" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 shrink-0" />
                        <div className="px-8 pb-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Comments</h3>
                            <button onClick={() => setActiveCommentReelId(null)} className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-sm">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar">
                            {groupedComments.map((comment: any) => (
                                <div key={comment.id} className="flex gap-4">
                                    <div className="size-8 rounded-full bg-cover bg-center shrink-0 ring-1 ring-white/10" style={{ backgroundImage: `url(${comment.authorImage})` }} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-black text-white">{comment.author}</span>
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase">{formatTimeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-zinc-300 leading-relaxed">
                                            <HighlightMentions text={comment.text} />
                                        </p>
                                        <div className="flex items-center gap-6 mt-3">
                                            <button onClick={() => handleCommentLike(comment.id)} className={`flex items-center gap-1.5 ${comment.isLiked ? 'text-primary' : 'text-zinc-500'}`}>
                                                <span className={`material-symbols-outlined text-[16px] ${comment.isLiked ? 'filled' : ''}`}>thumb_up</span>
                                                {comment.likes > 0 && <span className="text-[10px] font-black">{comment.likes}</span>}
                                            </button>
                                            <button onClick={() => {
                                                setReplyingTo(comment);
                                                setCommentText(`@${comment.author} `);
                                            }} className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
                                                Reply
                                            </button>
                                        </div>
                                        {comment.replies && comment.replies.map((reply: any) => (
                                            <div key={reply.id} className="mt-4 flex gap-3">
                                                <div className="size-6 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${reply.authorImage})` }} />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[11px] font-black text-white">{reply.author}</span>
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">{formatTimeAgo(reply.createdAt)}</span>
                                                    </div>
                                                    <p className="text-[13px] text-zinc-400">
                                                        <HighlightMentions text={reply.text} />
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-white/5">
                            {replyingTo && (
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-black text-primary uppercase">Replying to @{replyingTo.author}</p>
                                    <button onClick={() => setReplyingTo(null)} className="text-[10px] font-black text-zinc-500">Cancel</button>
                                </div>
                            )}
                            <div className="flex gap-3 bg-white/5 p-2 rounded-2xl ring-1 ring-white/5">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white px-2"
                                    onKeyDown={e => e.key === 'Enter' && handlePostComment()}
                                />
                                <button onClick={handlePostComment} className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium More Options Menu */}
            {activeMoreMenuReelId && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setActiveMoreMenuReelId(null)}>
                    <div className="w-full max-w-md bg-zinc-900 rounded-t-[48px] border-t border-white/20 p-8 flex flex-col gap-4 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

                        <button onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast("Link copied to clipboard!");
                            setActiveMoreMenuReelId(null);
                        }} className="flex items-center gap-5 p-6 rounded-[32px] bg-white/5 border border-white/10 text-left">
                            <span className="material-symbols-outlined text-blue-400">link</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-white uppercase tracking-wider">Copy Link</span>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Share with others</span>
                            </div>
                        </button>

                        <button onClick={() => {
                            const reel = reels.find(r => r.id === activeMoreMenuReelId);
                            if (reel) handleSaveReel(reel.id);
                            setActiveMoreMenuReelId(null);
                        }} className="flex items-center gap-5 p-6 rounded-[32px] bg-white/5 border border-white/10 text-left">
                            <span className={`material-symbols-outlined ${reels.find(r => r.id === activeMoreMenuReelId)?.isSaved ? 'text-primary filled' : 'text-amber-400'}`}>bookmark</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-white uppercase tracking-wider">
                                    {reels.find(r => r.id === activeMoreMenuReelId)?.isSaved ? 'Saved' : 'Save Reel'}
                                </span>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-0.5">
                                    {reels.find(r => r.id === activeMoreMenuReelId)?.isSaved ? 'In your bookmarks' : 'Add to bookmarks'}
                                </span>
                            </div>
                        </button>

                        <button onClick={() => {
                            showToast("Reel reported. Thank you.");
                            setActiveMoreMenuReelId(null);
                        }} className="flex items-center gap-5 p-6 rounded-[32px] bg-red-500/5 border border-red-500/10 text-left">
                            <span className="material-symbols-outlined text-red-400">report</span>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-red-400 uppercase tracking-wider">Report Content</span>
                                <span className="text-[10px] font-bold text-red-400/40 uppercase tracking-widest mt-0.5">Help keep us safe</span>
                            </div>
                        </button>

                        <button onClick={() => setActiveMoreMenuReelId(null)} className="w-full p-6 mt-4 rounded-[32px] bg-white text-sm font-black text-black uppercase tracking-widest">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Premium Toast Notification */}
            {toast && (
                <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-500">
                    <div className="px-6 py-3 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 flex items-center gap-3 shadow-2xl">
                        <div className={`size-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
