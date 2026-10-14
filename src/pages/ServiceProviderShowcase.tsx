import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';

interface Post {
    id: number;
    author: string;
    authorImage: string;
    role: string;
    content: string;
    media: string;
    mediaType: 'image' | 'video';
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
    isBookmarked: boolean;
    tags: string[];
    ctaText: string;
    isVerified?: boolean;
}

export default function ServiceProviderShowcase() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    const filters = ['All', 'OTT Agents', 'Trailer Makers', 'Lyrical Video', 'Promo Makers'];

    const [posts, setPosts] = useState<Post[]>([
        {
            id: 1,
            author: 'Ravi Kumar',
            authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
            role: 'Cinematographer',
            content: "Showcasing my latest work on the set of 'Mumbai Dreams'. This project involved complex lighting setups and dynamic camera movements...",
            media: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=450&fit=crop',
            mediaType: 'image',
            likes: 1200,
            comments: 89,
            shares: 45,
            isLiked: false,
            isBookmarked: false,
            tags: ['#Cinematography', '#ColorGrading', '#AdFilm'],
            ctaText: 'View Portfolio',
            isVerified: true,
        },
        {
            id: 2,
            author: 'Priya Sharma',
            authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
            role: 'Makeup Artist',
            content: 'Bridal look for the new Manyavar campaign. Loved working with the amazing team!',
            media: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop',
            mediaType: 'video',
            likes: 3500,
            comments: 215,
            shares: 102,
            isLiked: false,
            isBookmarked: false,
            tags: ['#BridalMakeup', '#MUA'],
            ctaText: 'Contact Me',
            isVerified: false,
        },
    ]);

    const handleLike = (postId: number) => {
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
                : post
        ));
    };

    const handleBookmark = (postId: number) => {
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, isBookmarked: !post.isBookmarked }
                : post
        ));
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 flex flex-col gap-2 bg-background-light/80 p-4 pb-2 backdrop-blur-sm dark:bg-background-dark/80">
                <div className="flex h-12 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <HamburgerMenu />
                        <p className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
                            Showcase
                        </p>
                    </div>
                    <button className="flex h-12 max-w-[480px] min-w-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-transparent text-base font-bold leading-normal tracking-[0.015em] text-zinc-900 dark:text-white hover:opacity-70 transition-opacity">
                        <span className="material-symbols-outlined">tune</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-2 py-1">
                    <label className="flex h-12 flex-1 min-w-40 flex-col">
                        <div className="flex h-full w-full flex-1 items-stretch rounded-xl">
                            <div className="flex items-center justify-center rounded-l-xl border-y border-l border-zinc-200 bg-white pl-4 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="form-input h-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl border-y border-r border-zinc-200 bg-white px-4 text-base font-normal leading-normal text-zinc-900 placeholder:text-zinc-500 focus:outline-0 focus:ring-0 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-400"
                                placeholder="Search for skills, services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </label>
                </div>

                {/* Filters */}
                <div className="flex -mx-4 overflow-x-auto px-4 pb-2 pt-1 no-scrollbar">
                    <div className="flex flex-nowrap items-center gap-2">
                        {filters.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 whitespace-nowrap rounded-lg px-4 transition-colors ${activeFilter === filter
                                    ? 'bg-primary/20 text-primary'
                                    : 'border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <p className="text-sm font-semibold leading-normal">{filter}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="flex flex-col pb-24">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="flex flex-col border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 mb-4 last:mb-0"
                    >
                        {/* Post Header */}
                        <div className="flex items-center gap-3 p-4">
                            <img
                                className="h-12 w-12 rounded-full object-cover cursor-pointer"
                                src={post.authorImage}
                                alt={post.author}
                                onClick={() => navigate('/profile/1')}
                            />
                            <div className="flex-grow cursor-pointer" onClick={() => navigate('/profile/1')}>
                                <p className="text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-white hover:underline flex items-center gap-1">
                                    {post.author}
                                    {post.isVerified && (
                                        <span className="material-symbols-outlined text-blue-500 text-base" title="Verified User">verified</span>
                                    )}
                                </p>
                                <p className="text-sm font-normal leading-normal text-zinc-500 dark:text-zinc-400">
                                    {post.role}
                                </p>
                            </div>
                            <button className="text-zinc-900 dark:text-white hover:opacity-70 transition-opacity">
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                        </div>

                        {/* Media */}
                        <div
                            className={`w-full bg-cover bg-center bg-no-repeat ${post.mediaType === 'video' ? 'aspect-[9/16]' : 'aspect-video'
                                }`}
                            style={{ backgroundImage: `url(${post.media})` }}
                        >
                            {post.mediaType === 'video' && (
                                <div className="flex h-full w-full flex-col items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors">
                                    <button className="rounded-full bg-white/30 p-4 text-white backdrop-blur-sm">
                                        <span className="material-symbols-outlined !text-4xl">play_arrow</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-x-4 px-4 py-2">
                            <div className="flex items-center justify-center gap-2 py-2">
                                <button
                                    onClick={() => handleLike(post.id)}
                                    className={`text-zinc-500 dark:text-zinc-400 hover:opacity-70 transition-opacity ${post.isLiked ? 'text-red-500 dark:text-red-500' : ''
                                        }`}
                                >
                                    <span className={`material-symbols-outlined ${post.isLiked ? 'filled' : ''}`}>
                                        favorite
                                    </span>
                                </button>
                                <p className="text-[13px] font-bold leading-normal tracking-[0.015em] text-zinc-500 dark:text-zinc-400">
                                    {post.likes >= 1000 ? `${(post.likes / 1000).toFixed(1)}k` : post.likes}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 py-2">
                                <button className="text-zinc-500 dark:text-zinc-400 hover:opacity-70 transition-opacity">
                                    <span className="material-symbols-outlined">chat_bubble</span>
                                </button>
                                <p className="text-[13px] font-bold leading-normal tracking-[0.015em] text-zinc-500 dark:text-zinc-400">
                                    {post.comments}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 py-2">
                                <button className="text-zinc-500 dark:text-zinc-400 hover:opacity-70 transition-opacity">
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                                <p className="text-[13px] font-bold leading-normal tracking-[0.015em] text-zinc-500 dark:text-zinc-400">
                                    {post.shares}
                                </p>
                            </div>
                            <div className="flex flex-grow items-center justify-end gap-2 py-2">
                                <button
                                    onClick={() => handleBookmark(post.id)}
                                    className={`text-zinc-500 dark:text-zinc-400 hover:opacity-70 transition-opacity ${post.isBookmarked ? 'text-primary' : ''
                                        }`}
                                >
                                    <span className={`material-symbols-outlined ${post.isBookmarked ? 'filled' : ''}`}>
                                        bookmark
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-2 px-4 pb-4">
                            <p className="text-base font-normal leading-normal text-zinc-900 dark:text-white">
                                {post.content} <span className="font-semibold text-zinc-500 dark:text-zinc-400 cursor-pointer hover:underline">more</span>
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {post.tags.map((tag) => (
                                    <div
                                        key={tag}
                                        className="flex h-7 shrink-0 items-center justify-center gap-x-2 rounded-md bg-primary/20 px-3"
                                    >
                                        <p className="text-sm font-medium leading-normal text-primary">{tag}</p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => navigate('/messaging')}
                                className="mt-2 text-left text-base font-bold text-primary hover:underline"
                            >
                                {post.ctaText}
                            </button>
                        </div>
                    </div>
                ))}
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-24 right-4 z-20">
                <button
                    onClick={() => navigate('/post-job')}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:scale-110 transition-transform"
                >
                    <span className="material-symbols-outlined !text-3xl">add</span>
                </button>
            </div>

            <BottomNav />
        </div>
    );
}
