import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { blogService, type BlogPost } from '../services/blogService';
import { addCommentToPost, getCommentsForPost } from '../services/postService';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import PostMedia from '../components/PostMedia';

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

export default function BlogsEvents() {
    const [activeTab, setActiveTab] = useState<'blogs' | 'events' | 'my-blogs'>('blogs');
    const [showFilters, setShowFilters] = useState(false);
    const [activePost, setActivePost] = useState<BlogPost | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [myBlogs, setMyBlogs] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();

    // Comment states
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    // Fetch comments when activePost changes
    useEffect(() => {
        const fetchComments = async () => {
            if (activePost?.id) {
                setLoadingComments(true);
                try {
                    const fetchedComments = await getCommentsForPost(activePost.id);
                    setComments(fetchedComments);
                } catch (error) {
                    console.error('Error fetching comments:', error);
                }
                setLoadingComments(false);
            }
        };
        fetchComments();
    }, [activePost?.id]);

    // Submit comment
    const handleSubmitComment = async () => {
        if (!commentText.trim() || !currentUser || !activePost?.id) return;

        setSubmittingComment(true);
        try {
            await addCommentToPost({
                postId: activePost.id,
                author: currentUser.displayName || 'Anonymous',
                authorId: currentUser.uid,
                authorImage: currentUser.photoURL || '',
                text: commentText,
                createdAt: Timestamp.now(),
                likes: 0
            });

            // Refresh comments
            const fetchedComments = await getCommentsForPost(activePost.id);
            setComments(fetchedComments);
            setCommentText('');
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
        setSubmittingComment(false);
    };

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            const data = await blogService.getBlogs();

            // Filter based on tab
            if (activeTab === 'events') {
                setPosts(data.filter(p => p.category === 'Events' || p.category === 'Workshops' || p.category === 'Screenings'));
            } else if (activeTab === 'my-blogs') {
                if (currentUser) {
                    setMyBlogs(data.filter(p => p.authorId === currentUser.uid));
                }
            } else {
                // Discover Tab (Default): Show EVERYTHING (Blogs + Events)
                setPosts(data);
            }
            setLoading(false);
        };
        fetchPosts();
    }, [activeTab, currentUser]);

    const filteredPosts = selectedCategory === 'All' ? posts : posts.filter(post => post.category === selectedCategory);

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-[#090A0C] text-zinc-900 dark:text-white overflow-x-hidden pb-36 md:pb-24 font-display transition-colors">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto flex flex-col flex-1">
                {/* Cinema Header */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#090A0C]/85 p-4 pb-3 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="md:hidden flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/home')}>
                            <HamburgerMenu />
                            <Logo size="sm" showText={true} />
                            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Editorial
                            </span>
                        </div>
                        <h1 className="hidden md:flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                            <span className="material-symbols-outlined text-amber-500 text-xl">auto_stories</span>
                            <span>Cinema Journal & Industry Events</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => navigate('/create-event')}
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                            Add Event
                        </button>
                        <button
                            onClick={() => navigate('/create-blog')}
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all border border-black/10 dark:border-white/10"
                        >
                            <span className="material-symbols-outlined text-sm">edit_square</span>
                            Write Article
                        </button>

                        {/* Mobile Action Buttons */}
                        <button
                            onClick={() => {
                                if (!currentUser) return openAuthModal('Sign in to publish an event');
                                navigate('/create-event');
                            }}
                            className="md:hidden p-2 text-amber-500 hover:bg-amber-500/10 rounded-full transition-colors"
                            aria-label="Add Event"
                        >
                            <span className="material-symbols-outlined text-xl">calendar_add_on</span>
                        </button>
                        <button
                            onClick={() => {
                                if (!currentUser) return openAuthModal('Sign in to write a film article');
                                navigate('/create-blog');
                            }}
                            className="md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                            aria-label="Write Article"
                        >
                            <span className="material-symbols-outlined text-xl">edit_square</span>
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="border-b border-black/[0.04] dark:border-white/[0.06] px-4 bg-white/50 dark:bg-[#090A0C]/50 backdrop-blur-sm">
                    <div className="flex justify-between max-w-md mx-auto">
                        <button
                            onClick={() => setActiveTab('blogs')}
                            className={`flex flex-1 flex-col items-center justify-center border-b-2 pb-3 pt-3.5 transition-all text-xs font-semibold ${activeTab === 'blogs'
                                ? 'border-b-amber-500 text-amber-500'
                                : 'border-b-transparent text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            Discover
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`flex flex-1 flex-col items-center justify-center border-b-2 pb-3 pt-3.5 transition-all text-xs font-semibold ${activeTab === 'events'
                                ? 'border-b-amber-500 text-amber-500'
                                : 'border-b-transparent text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            Events
                        </button>
                        <button
                            onClick={() => {
                                if (!currentUser) return openAuthModal('Sign in to view your published articles');
                                setActiveTab('my-blogs');
                            }}
                            className={`flex flex-1 flex-col items-center justify-center border-b-2 pb-3 pt-3.5 transition-all text-xs font-semibold ${activeTab === 'my-blogs'
                                ? 'border-b-amber-500 text-amber-500'
                                : 'border-b-transparent text-zinc-400 hover:text-zinc-200'
                                }`}
                        >
                            My Articles
                        </button>
                    </div>
                </div>

                <main className="flex-1 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                    {activeTab === 'my-blogs' ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-base font-bold text-zinc-900 dark:text-white">Your Stories</h2>
                            </div>
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                                </div>
                            ) : myBlogs.length === 0 ? (
                                <div className="text-center py-12 text-zinc-500 rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07]">
                                    <p className="text-xs">You haven't posted any blogs yet.</p>
                                    <button onClick={() => navigate('/create-blog')} className="text-amber-500 font-bold text-xs mt-2 hover:underline">Create one now</button>
                                </div>
                            ) : (
                                myBlogs.map((blog, index) => (
                                    <div key={index} className="p-4 rounded-2xl bg-white dark:bg-[#121316] shadow-sm border border-black/[0.04] dark:border-white/[0.07]">
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{blog.title}</h3>
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-3 line-clamp-2">{blog.excerpt}</p>
                                        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                                {blog.views} views
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">favorite</span>
                                                {blog.likes} likes
                                            </div>
                                            <div className="ml-auto text-xs text-zinc-400">
                                                {formatTimeAgo(blog.date)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Search and Filter Bar */}
                            <div className="flex items-center gap-2 pb-4">
                                <div className="flex h-11 flex-1 items-center rounded-xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07] px-3 shadow-sm">
                                    <span className="material-symbols-outlined text-zinc-400 text-lg mr-2 shrink-0">search</span>
                                    <input
                                        className="h-full min-w-0 flex-1 border-none bg-transparent text-xs font-medium placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-0 focus:ring-0"
                                        placeholder="Search articles & events..."
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07] text-zinc-500 dark:text-zinc-400 shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition-all ${showFilters ? 'ring-2 ring-amber-500 text-amber-500' : ''}`}
                                    aria-label="Filter"
                                >
                                    <span className="material-symbols-outlined text-lg">tune</span>
                                </button>
                            </div>

                            {/* Filters Dropdown */}
                            {showFilters && (
                                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar animate-in slide-in-from-top-2 fade-in relative z-40">
                                    {['All', 'Casting Calls', 'Interviews', 'Industry News', 'Workshops', 'Networking', 'Screenings'].map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => setSelectedCategory(category)}
                                            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${selectedCategory === category
                                                ? 'bg-amber-500 text-black font-bold shadow-sm'
                                                : 'bg-white dark:bg-[#121316] text-zinc-500 dark:text-zinc-400 border border-black/[0.04] dark:border-white/[0.07] hover:bg-black/5 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="flex justify-center py-10">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                                    </div>
                                ) : filteredPosts.length === 0 ? (
                                    <div className="text-center py-12 text-zinc-500 rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07]">
                                        <p className="text-xs">No posts found.</p>
                                    </div>
                                ) : (
                                    filteredPosts.map((post, index) => (
                                        <div key={index} className="overflow-hidden rounded-2xl bg-white dark:bg-[#121316] shadow-sm border border-black/[0.04] dark:border-white/[0.07] transition-all hover:border-amber-500/30 cursor-pointer group" onClick={() => setActivePost(post)}>
                                            <div className="flex flex-col items-stretch justify-start">
                                                <div className="aspect-video w-full overflow-hidden relative bg-black/40">
                                                    <PostMedia
                                                        src={post.image || ''}
                                                        fallbackType="FILM_SET"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute top-3 left-3">
                                                        <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-amber-400 text-xs font-semibold border border-amber-400/20 shadow-md">
                                                            {post.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex w-full flex-col items-stretch justify-center gap-2.5 p-4">
                                                    <h2 className="text-base font-bold leading-snug text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors">{post.title}</h2>

                                                    {/* Event Details Badge if available */}
                                                    {post.eventDetails && (
                                                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                                            <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                                <span className="material-symbols-outlined text-sm">calendar_month</span>
                                                                {new Date(post.eventDetails.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                {post.eventDetails.eventTime && ` • ${post.eventDetails.eventTime}`}
                                                            </span>
                                                            <span className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5">
                                                                <span className="material-symbols-outlined text-sm text-zinc-400">location_on</span>
                                                                {post.eventDetails.location}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                                        {post.excerpt}
                                                    </p>
                                                    <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-6 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shrink-0">
                                                                <PostMedia src={post.authorPhoto || ''} fallbackType="USER_MALE" className="w-full h-full object-cover" />
                                                            </div>
                                                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                                                {post.author}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500 group-hover:translate-x-1 transition-all">
                                                            {post.eventDetails ? 'View Event' : 'Read Article'} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>

            <BottomNav />

            {/* Read More Modal */}
            {activePost && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
                    onClick={() => setActivePost(null)}
                >
                    <div
                        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#121316] rounded-2xl shadow-2xl animate-in zoom-in-95 border border-black/10 dark:border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative h-64 w-full">
                            <PostMedia
                                className="absolute inset-0 w-full h-full object-cover"
                                src={activePost.image || ''}
                                fallbackType="FILM_SET"
                            />
                            <button
                                onClick={() => setActivePost(null)}
                                className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 backdrop-blur-sm transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-semibold border border-amber-500/20">
                                    {activePost.category}
                                </span>
                                <span className="text-xs text-zinc-400">
                                    {formatTimeAgo(activePost.date)}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">{activePost.title}</h2>
                            <div className="flex items-center gap-2 mb-6 pb-6 border-b border-black/[0.04] dark:border-white/[0.06]">
                                <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">person</span>
                                <span className="font-medium text-sm text-zinc-900 dark:text-white">{activePost.author}</span>
                            </div>
                            <div className="prose dark:prose-invert max-w-none">
                                {activePost.contentBlocks && activePost.contentBlocks.length > 0 ? (
                                    // Render structured content blocks
                                    <div className="space-y-4">
                                        {activePost.contentBlocks.map((block: any, idx: number) => (
                                            block.type === 'image' ? (
                                                <div
                                                    key={idx}
                                                    className={`${block.imageAlign === 'left' ? 'float-left mr-4 mb-4' :
                                                        block.imageAlign === 'right' ? 'float-right ml-4 mb-4' :
                                                            'mx-auto clear-both'
                                                        } ${block.imageSize === 'small' ? 'max-w-xs' :
                                                            block.imageSize === 'medium' ? 'max-w-md' :
                                                                block.imageSize === 'large' ? 'max-w-2xl' :
                                                                    'w-full'
                                                        }`}
                                                >
                                                    <PostMedia
                                                        src={block.content}
                                                        alt="Blog content"
                                                        className="w-full h-auto rounded-xl shadow-lg"
                                                        fallbackType="FILM_SET"
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    key={idx}
                                                    className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
                                                    dangerouslySetInnerHTML={{ __html: block.content }}
                                                />
                                            )
                                        ))}
                                        <div className="clear-both" />
                                    </div>
                                ) : (
                                    // Fallback to legacy content
                                    <>
                                        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 mb-4">
                                            {activePost.excerpt}
                                        </p>
                                        <div className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap">
                                            {activePost.content}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div className="border-t border-black/[0.04] dark:border-white/[0.06] pt-6 mt-6">
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500 text-lg">chat</span>
                                    Comments ({comments.length})
                                </h3>

                                {/* Comment Input */}
                                {currentUser ? (
                                    <div className="flex gap-3 mb-6">
                                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-black/10 dark:border-white/10">
                                            <PostMedia
                                                src={currentUser.photoURL || ''}
                                                fallbackType="USER_MALE"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="w-full p-3 rounded-xl border border-black/[0.04] dark:border-white/[0.07] bg-black/5 dark:bg-[#090A0C] text-xs resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-zinc-900 dark:text-white"
                                                rows={2}
                                            />
                                            <button
                                                onClick={handleSubmitComment}
                                                disabled={!commentText.trim() || submittingComment}
                                                className="mt-2 px-3.5 py-1.5 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all shadow-sm"
                                            >
                                                {submittingComment ? (
                                                    <>
                                                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                                        Posting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-sm">send</span>
                                                        Post Comment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-black/5 dark:bg-[#090A0C] rounded-xl mb-6 border border-black/[0.04] dark:border-white/[0.07]">
                                        <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                                            <button onClick={() => openAuthModal('Sign in to comment on this article')} className="text-amber-500 font-bold hover:underline">Sign In</button> to comment
                                        </p>
                                    </div>
                                )}

                                {/* Comments List */}
                                {loadingComments ? (
                                    <div className="flex justify-center py-6">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
                                        No comments yet. Be the first to comment!
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.map((comment: any) => (
                                            <div key={comment.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                                                    <PostMedia
                                                        src={comment.authorImage || ''}
                                                        fallbackType="USER_MALE"
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-bold text-sm text-zinc-900 dark:text-white">{comment.author}</span>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                            {formatTimeAgo(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Popover Backdrops */}
            {showFilters && (
                <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setShowFilters(false)}
                />
            )}
        </div>
    );
}
