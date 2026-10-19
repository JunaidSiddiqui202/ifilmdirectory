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

// Helper to get YouTube embed URL using privacy-enhanced youtube-nocookie.com
const getYouTubeEmbedUrl = (url: string, muted: boolean = true): string | null => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const baseParams = `rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}&mute=${muted ? 1 : 0}&controls=0&modestbranding=1&iv_load_policy=3&fs=0&disablekb=1`;

    const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&/]+)/);
    if (shortsMatch) return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}?autoplay=1&loop=1&playlist=${shortsMatch[1]}&${baseParams}`;

    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) return `https://www.youtube-nocookie.com/embed/${watchMatch[1]}?autoplay=1&loop=1&playlist=${watchMatch[1]}&${baseParams}`;

    const shortMatch = url.match(/youtu\.be\/([^?&#/]+)/);
    if (shortMatch) return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}?autoplay=1&loop=1&playlist=${shortMatch[1]}&${baseParams}`;

    const embedMatch = url.match(/youtube\.com\/embed\/([^?&/]+)/);
    if (embedMatch) return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}?autoplay=1&loop=1&playlist=${embedMatch[1]}&${baseParams}`;

    const liveMatch = url.match(/youtube\.com\/live\/([^?&/]+)/);
    if (liveMatch) return `https://www.youtube-nocookie.com/embed/${liveMatch[1]}?autoplay=1&loop=1&playlist=${liveMatch[1]}&${baseParams}`;

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
    const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

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

    // Synchronized sound toggle for both HTML5 videos and YouTube iframe embeds
    const toggleSound = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);

        // 1. Synchronize HTML5 video elements
        Object.values(videoRefs.current).forEach((video) => {
            if (video) {
                video.muted = nextMuted;
                if (!nextMuted) {
                    video.volume = 1.0;
                    if (video.paused) {
                        video.play().catch(() => {});
                    }
                }
            }
        });

        // 2. Broadcast to YouTube iframe elements via postMessage
        const sendIframeSound = (iframe: HTMLIFrameElement | null) => {
            if (!iframe || !iframe.contentWindow) return;
            try {
                iframe.contentWindow.postMessage(
                    JSON.stringify({
                        event: 'command',
                        func: nextMuted ? 'mute' : 'unMute',
                        args: []
                    }),
                    '*'
                );
                if (!nextMuted) {
                    iframe.contentWindow.postMessage(
                        JSON.stringify({
                            event: 'command',
                            func: 'setVolume',
                            args: [100]
                        }),
                        '*'
                    );
                    iframe.contentWindow.postMessage(
                        JSON.stringify({
                            event: 'command',
                            func: 'playVideo',
                            args: []
                        }),
                        '*'
                    );
                }
            } catch (err) {
                console.error("Iframe postMessage sound error:", err);
            }
        };

        Object.values(iframeRefs.current).forEach(sendIframeSound);
        document.querySelectorAll('iframe').forEach(sendIframeSound);
    };

    const handleVideoClick = (_reelId: string, e: React.MouseEvent<HTMLVideoElement>) => {
        const v = e.currentTarget;
        if (isMuted) {
            toggleSound(e);
            if (v.paused) v.play().catch(() => {});
        } else {
            if (v.paused) v.play().catch(() => {});
            else v.pause();
        }
    };

    // Observer for autoplay and sound sync
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const videoId = entry.target.getAttribute('data-reel-id');
                    const video = videoRefs.current[videoId || ''];
                    const iframe = iframeRefs.current[videoId || ''];

                    if (entry.isIntersecting) {
                        if (video) {
                            video.muted = isMuted;
                            if (!isMuted) {
                                video.volume = 1.0;
                            }
                            const playPromise = video.play();
                            if (playPromise !== undefined) {
                                playPromise.catch((e) => {
                                    console.log("Autoplay unmuted blocked, falling back to muted:", e);
                                    video.muted = true;
                                    video.play().catch((err) => console.log("Muted autoplay blocked:", err));
                                });
                            }
                        }
                        if (iframe && iframe.contentWindow) {
                            try {
                                iframe.contentWindow.postMessage(
                                    JSON.stringify({
                                        event: 'command',
                                        func: isMuted ? 'mute' : 'unMute',
                                        args: []
                                    }),
                                    '*'
                                );
                                iframe.contentWindow.postMessage(
                                    JSON.stringify({
                                        event: 'command',
                                        func: 'playVideo',
                                        args: []
                                    }),
                                    '*'
                                );
                            } catch {}
                        }
                    } else {
                        if (video) {
                            video.pause();
                        }
                        if (iframe && iframe.contentWindow) {
                            try {
                                iframe.contentWindow.postMessage(
                                    JSON.stringify({
                                        event: 'command',
                                        func: 'pauseVideo',
                                        args: []
                                    }),
                                    '*'
                                );
                            } catch {}
                        }
                    }
                });
            },
            { threshold: 0.6 }
        );

        const currentReels = document.querySelectorAll('[data-reel-id]');
        currentReels.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [reels, isMuted]);

    const scrollToNext = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ top: containerRef.current.clientHeight, behavior: 'smooth' });
        }
    };

    const scrollToPrev = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ top: -containerRef.current.clientHeight, behavior: 'smooth' });
        }
    };

    const handleBack = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/home');
        }
    };

    const handleHome = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        navigate('/home');
    };

    // Keyboard navigation (Arrow keys / M for mute)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeCommentReelId || activeMoreMenuReelId) return;
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

            if (e.key === 'ArrowDown' || e.key === 'j') {
                e.preventDefault();
                scrollToNext();
            } else if (e.key === 'ArrowUp' || e.key === 'k') {
                e.preventDefault();
                scrollToPrev();
            } else if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                toggleSound();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeCommentReelId, activeMoreMenuReelId, isMuted]);

    if (loading) {
        return (
            <div className="flex h-[100dvh] w-full items-center justify-center bg-black">
                <div className="size-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="showreel-cinema relative h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-zinc-950"
            data-reel-page="true"
            ref={containerRef}
        >
            {/* Desktop Side Navigation Buttons (Prev / Next Reel) */}
            <div className="hidden lg:flex fixed right-6 xl:right-10 top-1/2 -translate-y-1/2 flex-col gap-3 z-40">
                <button
                    type="button"
                    onClick={scrollToPrev}
                    className="size-11 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white/80 hover:text-white border border-white/15 flex items-center justify-center backdrop-blur-md shadow-2xl active:scale-90 transition-all cursor-pointer group"
                    title="Previous Showreel (↑ or K)"
                >
                    <span className="material-symbols-outlined text-xl group-hover:-translate-y-0.5 transition-transform">arrow_upward</span>
                </button>
                <button
                    type="button"
                    onClick={scrollToNext}
                    className="size-11 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white/80 hover:text-white border border-white/15 flex items-center justify-center backdrop-blur-md shadow-2xl active:scale-90 transition-all cursor-pointer group"
                    title="Next Showreel (↓ or J)"
                >
                    <span className="material-symbols-outlined text-xl group-hover:translate-y-0.5 transition-transform">arrow_downward</span>
                </button>
            </div>

            {reels.map((reel) => (
                <section
                    key={reel.id}
                    className="showreel-cinema h-[100dvh] w-full snap-start snap-always shrink-0 relative bg-zinc-950 flex items-center justify-center select-none overflow-hidden"
                    data-reel-id={reel.id}
                    data-reel-page="true"
                >
                    {/* Desktop Ambient Blurred Backdrop */}
                    <div
                        className="hidden md:block absolute inset-0 z-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125 pointer-events-none transition-all duration-700"
                        style={{ backgroundImage: `url(${reel.thumbnail || reel.creatorPhoto || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&fit=crop'})` }}
                    />
                    <div className="hidden md:block absolute inset-0 z-0 bg-black/60 pointer-events-none" />

                    {/* Centered Cinema Phone Frame - Mobile: Edge-to-Edge, Desktop: Sleek Rounded Card */}
                    <div className="relative w-full h-full sm:max-w-[420px] md:max-w-[430px] sm:h-[92vh] sm:max-h-[860px] sm:rounded-[32px] sm:border sm:border-white/15 sm:shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden bg-black flex flex-col justify-between z-10">

                        {/* Media Container */}
                        <div className="absolute inset-0 z-0 bg-black">
                            {reel.type === 'embed' ? (
                                <iframe
                                    ref={(el) => { iframeRefs.current[reel.id] = el; }}
                                    src={getYouTubeEmbedUrl(reel.videoUrl, isMuted) || reel.videoUrl}
                                    className="h-full w-full border-0"
                                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    title={reel.title}
                                />
                            ) : (
                                <video
                                    ref={(el) => { videoRefs.current[reel.id] = el; }}
                                    src={reel.videoUrl}
                                    className="h-full w-full object-cover cursor-pointer"
                                    autoPlay
                                    loop
                                    muted={isMuted}
                                    playsInline
                                    preload="auto"
                                    poster={reel.thumbnail}
                                    onClick={(e) => handleVideoClick(reel.id, e)}
                                />
                            )}
                        </div>

                        {/* Top and Bottom Atmospheric Gradients */}
                        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/75 via-transparent to-black/90 pointer-events-none" />

                        {/* Top Bar Header (ZERO OVERLAP - Single Unified Row) */}
                        <header className="relative z-30 flex items-center justify-between p-3.5 sm:p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
                            {/* Left: Back & Home Navigation Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="size-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white shadow-xl active:scale-90 transition-all cursor-pointer group"
                                    title="Go Back"
                                >
                                    <span className="material-symbols-outlined text-white text-xl drop-shadow group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleHome}
                                    className="size-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white shadow-xl active:scale-90 transition-all cursor-pointer group"
                                    title="Go to Home Feed"
                                >
                                    <span className="material-symbols-outlined text-white text-xl drop-shadow group-hover:scale-110 transition-transform">home</span>
                                </button>
                            </div>

                            {/* Center: Live Showreels Badge */}
                            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-xl">
                                <span className="size-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
                                <span className="text-white text-xs font-black uppercase tracking-wider drop-shadow">Showreels</span>
                            </div>

                            {/* Right: Exactly ONE Sound Button + More Options */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleSound}
                                    className={`size-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-all active:scale-90 shadow-xl cursor-pointer ${
                                        isMuted
                                            ? 'bg-black/60 hover:bg-black/85 border-white/20 text-white/90'
                                            : 'bg-amber-500 border-amber-400 text-white shadow-amber-500/40 ring-2 ring-amber-400/40'
                                    }`}
                                    title={isMuted ? "Unmute Audio (M)" : "Mute Audio (M)"}
                                >
                                    <span className="material-symbols-outlined text-xl text-white drop-shadow">
                                        {isMuted ? 'volume_off' : 'volume_up'}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveMoreMenuReelId(reel.id)}
                                    className="size-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white shadow-xl active:scale-90 transition-all cursor-pointer"
                                    title="More Options"
                                >
                                    <span className="material-symbols-outlined text-white text-xl drop-shadow">more_vert</span>
                                </button>
                            </div>
                        </header>

                        {/* Engagement Actions (Right Side Column) */}
                        <aside className="absolute right-3 sm:right-3.5 bottom-24 sm:bottom-28 z-30 flex flex-col gap-3.5 sm:gap-4 items-center pointer-events-auto">
                            {/* Like */}
                            <div className="flex flex-col items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleLike(reel.id)}
                                    className={`size-11 sm:size-12 flex items-center justify-center rounded-full backdrop-blur-md border transition-all active:scale-75 shadow-2xl cursor-pointer ${
                                        reel.isLiked
                                            ? 'bg-red-600 border-red-400 text-white shadow-red-500/40 ring-2 ring-red-400/30'
                                            : 'bg-black/50 hover:bg-black/75 border-white/20 text-white hover:border-white/40'
                                    }`}
                                    title={reel.isLiked ? "Unlike Reel" : "Like Reel"}
                                >
                                    <span className={`material-symbols-outlined text-2xl ${reel.isLiked ? 'filled text-white' : 'text-white'} drop-shadow`}>
                                        favorite
                                    </span>
                                </button>
                                <span className="text-[10px] font-black text-white drop-shadow bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                                    {formatViews(reel.likes)}
                                </span>
                            </div>

                            {/* Comment */}
                            <div className="flex flex-col items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setActiveCommentReelId(reel.id)}
                                    className="size-11 sm:size-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/20 hover:border-white/40 active:scale-75 transition-all shadow-2xl text-white cursor-pointer"
                                    title="Comments"
                                >
                                    <span className="material-symbols-outlined text-2xl text-white drop-shadow">
                                        chat_bubble
                                    </span>
                                </button>
                                <span className="text-[10px] font-black text-white drop-shadow bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                                    {formatViews(reel.comments)}
                                </span>
                            </div>

                            {/* Share */}
                            <div className="flex flex-col items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => handleShare(reel)}
                                    className="size-11 sm:size-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/20 hover:border-white/40 active:scale-75 transition-all shadow-2xl text-white cursor-pointer"
                                    title="Share Showreel"
                                >
                                    <span className="material-symbols-outlined text-2xl text-white drop-shadow">
                                        share
                                    </span>
                                </button>
                                <span className="text-[10px] font-black text-white drop-shadow bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                                    Share
                                </span>
                            </div>

                            {/* Direct YouTube Link (Integrated cleanly into action column for embeds) */}
                            {reel.type === 'embed' && (
                                <div className="flex flex-col items-center gap-1">
                                    <a
                                        href={reel.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="size-11 sm:size-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-red-600 backdrop-blur-md border border-white/20 hover:border-red-500 active:scale-75 transition-all shadow-2xl text-white group cursor-pointer"
                                        title="Watch Directly on YouTube"
                                    >
                                        <span className="material-symbols-outlined text-2xl text-red-500 group-hover:text-white transition-colors drop-shadow">
                                            smart_display
                                        </span>
                                    </a>
                                    <span className="text-[9px] font-black text-white/90 drop-shadow bg-black/60 px-1.5 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                                        YouTube
                                    </span>
                                </div>
                            )}
                        </aside>

                        {/* Bottom Info Overlay (Left aligned with right padding so it never collides with action column) */}
                        <footer className="relative z-20 p-4 sm:p-5 pr-18 sm:pr-20 pb-5 sm:pb-6 flex flex-col gap-2.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-auto">
                            {/* Creator Profile Row */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <div
                                    className="size-10 rounded-full bg-cover bg-center border-2 border-amber-500 shadow-md cursor-pointer shrink-0"
                                    style={{ backgroundImage: `url(${reel.creatorPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'})` }}
                                    onClick={() => navigate(`/profile/${reel.creatorId}`)}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <h3
                                            className="text-white font-bold text-sm tracking-tight truncate cursor-pointer hover:underline"
                                            onClick={() => navigate(`/profile/${reel.creatorId}`)}
                                        >
                                            {reel.creator}
                                        </h3>
                                        <span className="material-symbols-outlined text-amber-400 text-xs filled" title="Verified Creator">
                                            verified
                                        </span>
                                    </div>
                                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider truncate">
                                        {reel.category || 'Professional Actor'}
                                    </p>
                                </div>

                                {currentUser?.uid !== reel.creatorId && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFollow(reel.creatorId);
                                        }}
                                        className={`${
                                            reel.isFollowing
                                                ? 'bg-zinc-800/90 border border-white/20 text-white hover:bg-zinc-700'
                                                : 'bg-amber-500 hover:bg-amber-400 text-black font-black shadow-md shadow-amber-500/20'
                                        } text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider active:scale-95 transition-all shrink-0 cursor-pointer`}
                                    >
                                        {reel.isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}
                            </div>

                            {/* Showreel Title / Description */}
                            <p className="text-white/95 text-xs sm:text-sm font-normal leading-snug line-clamp-2 drop-shadow-md">
                                {reel.title}
                            </p>

                            {/* Original Sound Attribution */}
                            <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-medium">
                                <span className="material-symbols-outlined text-sm text-amber-400">music_note</span>
                                <span className="truncate">{reel.creator} • Original Audio</span>
                            </div>
                        </footer>
                    </div>
                </section>
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
