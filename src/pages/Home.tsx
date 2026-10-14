import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { blogService, type BlogPost } from '../services/blogService';
import { jobService, type Job } from '../services/jobService';
import { getLatestUsers, type UserProfile } from '../services/userService';
import { showreelService, type Showreel } from '../services/showreelService';
import { getPosts, type PostData } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import PostMedia from '../components/PostMedia';
import BreakingTicker from '../components/BreakingTicker';

const stories = [
    { name: 'Your Story', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', isUser: true },
    { name: 'Alia Bhatt', role: 'Actor & Producer', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', verified: true },
    { name: 'Ranbir K.', role: 'Lead Actor', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', verified: true },
    { name: 'Priyanka C.', role: 'Director', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', verified: true },
    { name: 'Deepika P.', role: 'Producer', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', verified: true },
    { name: 'Ranveer S.', role: 'Lead Actor', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', verified: true },
];

const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
};

export default function Home() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [newUsers, setNewUsers] = useState<UserProfile[]>([]);
    const [reels, setReels] = useState<Showreel[]>([]);
    const [networkPost, setNetworkPost] = useState<PostData | null>(null);
    const [networkPostLiked, setNetworkPostLiked] = useState(false);
    const [selectedPollOption, setSelectedPollOption] = useState<number | null>(null);

    useEffect(() => {
        const loadHomeData = async () => {
            try {
                const [fetchedBlogs, fetchedJobs, fetchedUsers, fetchedReels, fetchedPosts] = await Promise.all([
                    blogService.getBlogs(),
                    jobService.getJobs(),
                    getLatestUsers(8),
                    showreelService.getTrendingShowreels(10),
                    getPosts()
                ]);
                setBlogs(fetchedBlogs.slice(0, 4));
                setJobs(fetchedJobs.slice(0, 6));
                setNewUsers(fetchedUsers);

                if (fetchedPosts && fetchedPosts.length > 0) {
                    setNetworkPost(fetchedPosts[0]);
                }
                
                if (fetchedReels && fetchedReels.length > 0) {
                    setReels(fetchedReels);
                } else {
                    await showreelService.seedShowreels();
                    const freshShowreels = await showreelService.getTrendingShowreels(10);
                    setReels(freshShowreels);
                }
            } catch (err) {
                console.error('Error loading home data:', err);
            }
        };
        loadHomeData();
    }, []);

    const poll = {
        question: "Which filmmaking breakthrough are you most excited to use on your next shoot?",
        options: [
            { id: 1, text: "Virtual Production (LED Volumes & Unreal Engine)", votes: 142 },
            { id: 2, text: "AI Color Grading & Post-Production Clean-up", votes: 89 },
            { id: 3, text: "Large-Format Cinema Cameras (Alexa 35 / Venice 2)", votes: 115 },
            { id: 4, text: "Independent OTT & Direct Theatrical Distribution", votes: 64 }
        ]
    };

    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0) + (selectedPollOption ? 1 : 0);

    // Reusable Quick Actions
    const QuickActionsGrid = () => (
        <div className="grid grid-cols-4 gap-2">
            <button
                onClick={() => navigate('/post-job')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/30 hover:border-amber-500/60 transition-all group active:scale-95 text-center"
            >
                <div className="size-9 rounded-xl bg-amber-500 text-black flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">campaign</span>
                </div>
                <span className="text-xs font-bold text-white leading-tight">Post Call</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Cast & Crew</span>
            </button>

            <button
                onClick={() => navigate('/browse-profiles')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#121316] border border-white/5 hover:border-white/20 transition-all group active:scale-95 text-center"
            >
                <div className="size-9 rounded-xl bg-white/10 text-white flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">group</span>
                </div>
                <span className="text-xs font-bold text-white leading-tight">Directory</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Talent & Crew</span>
            </button>

            <button
                onClick={() => navigate('/booking-facilities')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#121316] border border-white/5 hover:border-white/20 transition-all group active:scale-95 text-center"
            >
                <div className="size-9 rounded-xl bg-white/10 text-white flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">apartment</span>
                </div>
                <span className="text-xs font-bold text-white leading-tight">Facilities</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Studios & Gear</span>
            </button>

            <button
                onClick={() => navigate('/groups-forums')}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[#121316] border border-white/5 hover:border-white/20 transition-all group active:scale-95 text-center"
            >
                <div className="size-9 rounded-xl bg-white/10 text-white flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">forum</span>
                </div>
                <span className="text-xs font-bold text-white leading-tight">Guilds</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Discussions</span>
            </button>
        </div>
    );

    // Reusable Featured Talent Section
    const FeaturedTalentSection = () => (
        <section className="rounded-2xl bg-[#121316] border border-white/5 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-purple-500" />
                    <h2 className="text-base font-bold text-white tracking-tight">
                        Featured Talent & Studios
                    </h2>
                </div>
                <button
                    onClick={() => navigate('/browse-profiles')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-0.5"
                >
                    <span>Directory</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3">
                {newUsers.slice(0, 4).map((user) => (
                    <div
                        key={user.uid}
                        onClick={() => navigate(`/profile/${user.uid}`)}
                        className="rounded-xl bg-white/[0.02] border border-white/5 p-3 hover:border-amber-500/30 transition-all cursor-pointer group flex flex-col items-center text-center"
                    >
                        <div className="size-12 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-amber-500/50 transition-colors mb-2">
                            <PostMedia
                                src={user.photoURL || ''}
                                fallbackType="USER_MALE"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h3 className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors truncate w-full">
                            {user.displayName || 'Filmmaker'}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium truncate w-full mt-0.5">
                            {(user as any).role || user.bio?.slice(0, 20) || 'Key Crew'}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );

    // Reusable Poll Section
    const DailyPollSection = () => (
        <section className="rounded-2xl bg-gradient-to-br from-[#121316] to-[#18191D] border border-white/5 p-5">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Industry Pulse • Daily Poll
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold">{totalVotes} votes</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-3.5 leading-snug">
                {poll.question}
            </h3>
            <div className="space-y-2.5">
                {poll.options.map((option) => {
                    const isSelected = selectedPollOption === option.id;
                    const voteCount = option.votes + (isSelected ? 1 : 0);
                    const percentage = Math.round((voteCount / totalVotes) * 100);

                    return (
                        <button
                            key={option.id}
                            onClick={() => setSelectedPollOption(option.id)}
                            className={`relative w-full text-left p-2.5 rounded-xl border transition-all overflow-hidden ${
                                isSelected
                                    ? 'border-amber-500 bg-amber-500/10'
                                    : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                            }`}
                        >
                            {selectedPollOption !== null && (
                                <div
                                    className="absolute inset-y-0 left-0 bg-amber-500/15 transition-all duration-500 pointer-events-none"
                                    style={{ width: `${percentage}%` }}
                                />
                            )}
                            <div className="relative flex items-center justify-between text-xs font-semibold text-white">
                                <span className="truncate pr-2">{option.text}</span>
                                {selectedPollOption !== null && (
                                    <span className="text-amber-400 font-bold shrink-0">{percentage}%</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );

    // Reusable Articles Section
    const EditorialArticlesSection = () => (
        <section className="rounded-2xl bg-[#121316] border border-white/5 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <h2 className="text-base font-bold text-white tracking-tight">
                        Industry Insights & Articles
                    </h2>
                </div>
                <button
                    onClick={() => navigate('/blogs-events')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-0.5"
                >
                    <span>Read All</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                {blogs.slice(0, 2).map((blog) => (
                    <div
                        key={blog.id}
                        onClick={() => navigate('/blogs-events')}
                        className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-amber-500/30 transition-all cursor-pointer group flex gap-3 p-2.5"
                    >
                        <div className="size-20 rounded-lg overflow-hidden shrink-0 relative">
                            <img
                                src={blog.image || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=300&fit=crop'}
                                alt={blog.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <div className="flex flex-col justify-between min-w-0 flex-1">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                    {blog.category || 'Film Trade'}
                                </span>
                                <h3 className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-2 mt-0.5">
                                    {blog.title}
                                </h3>
                            </div>
                            <span className="text-xs text-zinc-400">
                                3 min read
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-[#090A0C] text-white pb-36 md:pb-24 overflow-x-hidden font-display">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex flex-col flex-1 px-4 sm:px-6">
                
                {/* 1. CINEMA TOP HEADER: Official Logo + Quick Search + Comms (Mobile Only; on desktop the left sidebar provides full nav and branding) */}
                <header className="md:hidden sticky top-0 z-30 flex items-center justify-between py-3.5 bg-[#090A0C]/95 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <HamburgerMenu />
                        <Logo size="sm" showText={true} />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/search')}
                            className="p-2 rounded-xl bg-[#121316] border border-white/10 text-zinc-300 hover:text-white hover:border-amber-500/30 transition-all active:scale-95"
                            aria-label="Search"
                        >
                            <span className="material-symbols-outlined text-xl">search</span>
                        </button>
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative p-2 rounded-xl bg-[#121316] border border-white/10 text-zinc-300 hover:text-white hover:border-amber-500/30 transition-all active:scale-95"
                            aria-label="Notifications"
                        >
                            <span className="material-symbols-outlined text-xl">notifications</span>
                            <span className="absolute top-1.5 right-1.5 size-2 bg-amber-500 rounded-full animate-pulse" />
                        </button>
                        <button
                            onClick={() => navigate('/messaging')}
                            className="p-2 rounded-xl bg-[#121316] border border-white/10 text-zinc-300 hover:text-white hover:border-amber-500/30 transition-all active:scale-95"
                            aria-label="Messages"
                        >
                            <span className="material-symbols-outlined text-xl">chat_bubble</span>
                        </button>
                        <div
                            onClick={() => navigate('/profile')}
                            className="size-9 rounded-full overflow-hidden border border-white/20 ml-1 cursor-pointer hover:border-amber-500 transition-colors shrink-0"
                            title="My Profile"
                        >
                            <PostMedia
                                src={currentUser?.photoURL || ''}
                                fallbackType="USER_MALE"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </header>

                {/* 2. RESPONSIVE TWO-COLUMN GRID ON DESKTOP (xl:) / 1-COLUMN ON MOBILE */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-4">
                    
                    {/* PRIMARY CINEMA STREAM (Left 2 cols on xl) */}
                    <div className="xl:col-span-2 space-y-6">
                        
                        {/* Welcome Banner */}
                        <div className="flex items-center justify-between pb-1">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-amber-500" />
                                    Filmmaker Network & Production Hub
                                </span>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                                    Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Creator'}!
                                </h1>
                            </div>
                            <button
                                onClick={() => navigate('/showcase')}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-base">movie</span>
                                <span>Feed</span>
                            </button>
                        </div>

                        {/* Live South Cinema Breaking RSS Ticker */}
                        <BreakingTicker variant="home" />

                        {/* Quick Action Deck for Mobile & Tablet (hidden on xl desktop) */}
                        <div className="xl:hidden">
                            <QuickActionsGrid />
                        </div>

                        {/* Filmmaker On-Set Stories */}
                        <section className="py-1">
                            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1">
                                {stories.map((story, index) => (
                                    <div
                                        key={index}
                                        onClick={() => story.isUser ? navigate('/showreel/upload') : navigate('/showcase')}
                                        className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                                    >
                                        <div className="relative">
                                            <div className={`size-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
                                                story.isUser 
                                                    ? 'border-2 border-dashed border-amber-500' 
                                                    : 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600'
                                            }`}>
                                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#090A0C]">
                                                    <PostMedia
                                                        src={story.isUser ? (currentUser?.photoURL || story.image) : story.image}
                                                        fallbackType="USER_MALE"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            {story.isUser && (
                                                <div className="absolute bottom-0 right-0 size-5 bg-amber-500 text-black rounded-full flex items-center justify-center border-2 border-[#090A0C] shadow-sm font-bold text-xs">
                                                    <span className="material-symbols-outlined text-xs">add</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-semibold text-zinc-300 max-w-[68px] truncate text-center group-hover:text-amber-400 transition-colors">
                                            {story.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Trending Showreels & BTS */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                        Trending Showreels & BTS
                                    </h2>
                                </div>
                                <button
                                    onClick={() => navigate('/showreel/view1')}
                                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-0.5"
                                >
                                    <span>Watch All</span>
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>

                            <div className="flex overflow-x-auto gap-3.5 no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                                {reels.length > 0 ? (
                                    reels.map((reel) => (
                                        <div
                                            key={reel.id}
                                            onClick={() => navigate('/showreel/view1')}
                                            className="w-[130px] sm:w-[155px] shrink-0 aspect-[9/16] relative rounded-2xl overflow-hidden snap-start group cursor-pointer shadow-lg border border-white/5 hover:border-amber-500/40 transition-all bg-[#121316]"
                                        >
                                            <PostMedia
                                                src={reel.videoUrl || reel.thumbnail}
                                                fallbackType="FILM_SET"
                                                isThumbnail={true}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                            
                                            <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px] text-amber-400 filled" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                                <span className="text-white text-[9px] font-bold">{formatViews(reel.views)}</span>
                                            </div>

                                            <div className="absolute bottom-2.5 left-2.5 right-2.5">
                                                <p className="text-white text-xs font-bold truncate group-hover:text-amber-400 transition-colors">
                                                    {reel.title || 'Cinematic Reel'}
                                                </p>
                                                <p className="text-zinc-400 text-[10px] uppercase font-semibold tracking-wider truncate mt-0.5">
                                                    {reel.creator}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full py-10 text-center text-zinc-500 text-xs">
                                        Loading filmmaker showreels...
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* For You: Gigs & Casting Calls */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                        For You: Gigs & Casting Calls
                                    </h2>
                                </div>
                                <button
                                    onClick={() => navigate('/jobs')}
                                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-0.5"
                                >
                                    <span>Explore Gigs</span>
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>

                            <div className="flex overflow-x-auto gap-3.5 no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
                                {jobs.map((job) => (
                                    <div
                                        key={job.id}
                                        onClick={() => navigate(`/job/${job.id}`)}
                                        className="min-w-[285px] sm:min-w-[320px] rounded-2xl bg-[#121316] border border-white/5 p-4 shadow-sm hover:border-amber-500/30 snap-center transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="size-11 rounded-full overflow-hidden shrink-0 border border-white/10 bg-black">
                                                    <PostMedia
                                                        src={job.logo || ''}
                                                        fallbackType="COMPANY_LOGO"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-xs font-semibold text-amber-400 truncate block">
                                                        {job.company}
                                                    </span>
                                                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                                        {job.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-2.5">
                                                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
                                                    {job.location}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400">
                                                    {job.type}
                                                </span>
                                            </div>

                                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                                                {job.description || 'Production unit seeking passionate cinema professionals.'}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                                            <span className="text-xs font-bold text-white">
                                                ₹ {job.salary}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/job/${job.id}`);
                                                }}
                                                className="px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all flex items-center gap-1 active:scale-95"
                                            >
                                                <span>Apply</span>
                                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Latest From Your Network */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-blue-500" />
                                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                        Latest From Your Network
                                    </h2>
                                </div>
                                <button
                                    onClick={() => navigate('/showcase')}
                                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-0.5"
                                >
                                    <span>Open Feed</span>
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>

                            <div
                                onClick={() => navigate('/showcase')}
                                className="rounded-2xl bg-[#121316] border border-white/5 p-4 sm:p-5 hover:border-amber-500/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                                            <PostMedia
                                                src={networkPost?.authorImage || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'}
                                                fallbackType="USER_MALE"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                                                {networkPost?.author || 'Karan Johar'}
                                            </h3>
                                            <p className="text-xs text-zinc-400">
                                                Producer & Director • 2h ago
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                                        Network Update
                                    </span>
                                </div>

                                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed mb-3 line-clamp-3">
                                    {networkPost?.content || "Just wrapped up principal photography for our new feature film in Mumbai! Incredible work by our camera department and lighting team. Post-production starts Monday. #CinemaLife #Wrap"}
                                </p>

                                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/40 mb-3 border border-white/5">
                                    <PostMedia
                                        src={networkPost?.image || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop'}
                                        fallbackType="FILM_SET"
                                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                                    />
                                </div>

                                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 pt-2 border-t border-white/5">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNetworkPostLiked(!networkPostLiked);
                                        }}
                                        className={`flex items-center gap-1.5 transition-colors ${networkPostLiked ? 'text-red-500' : 'hover:text-white'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">
                                            {networkPostLiked ? 'favorite' : 'favorite_border'}
                                        </span>
                                        <span>{(networkPost?.likes || 124) + (networkPostLiked ? 1 : 0)}</span>
                                    </button>
                                    <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-base">chat_bubble_outline</span>
                                        <span>28 Comments</span>
                                    </span>
                                    <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-base">share</span>
                                        <span>Share</span>
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* On Mobile / Tablet, render remaining sections sequentially */}
                        <div className="xl:hidden space-y-6">
                            <FeaturedTalentSection />
                            <DailyPollSection />
                            <EditorialArticlesSection />

                            {/* Mobile Footer Links */}
                            <div className="pt-4 pb-4 px-2 text-center text-xs text-zinc-500 space-y-2 border-t border-white/5">
                                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                                    <span onClick={() => navigate('/privacy')} className="hover:text-zinc-300 cursor-pointer">Privacy</span>
                                    <span onClick={() => navigate('/terms')} className="hover:text-zinc-300 cursor-pointer">Terms</span>
                                    <span onClick={() => navigate('/blogs-events')} className="hover:text-zinc-300 cursor-pointer">Editorial</span>
                                    <span onClick={() => navigate('/booking-facilities')} className="hover:text-zinc-300 cursor-pointer">Facilities</span>
                                </div>
                                <p className="text-[11px] text-zinc-600">© 2026 iFilmDirectory. All rights reserved.</p>
                            </div>
                        </div>
                    </div>

                    {/* DESKTOP RIGHT SIDEBAR (1 col on xl desktop) */}
                    <div className="hidden xl:flex flex-col gap-6">
                        {/* Quick Actions Deck */}
                        <div className="rounded-2xl bg-[#121316] border border-white/5 p-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                                Creator Shortcuts
                            </h3>
                            <QuickActionsGrid />
                        </div>

                        {/* Featured Talent Directory */}
                        <FeaturedTalentSection />

                        {/* Industry Pulse (Daily Poll) */}
                        <DailyPollSection />

                        {/* Industry Insights & Editorial */}
                        <EditorialArticlesSection />

                        {/* Footer Links & Copyright (Instagram Style) */}
                        <div className="px-2 pt-2 text-[11px] text-zinc-500 space-y-2">
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                <span onClick={() => navigate('/privacy')} className="hover:text-zinc-300 cursor-pointer">Privacy</span>
                                <span onClick={() => navigate('/terms')} className="hover:text-zinc-300 cursor-pointer">Terms</span>
                                <span onClick={() => navigate('/blogs-events')} className="hover:text-zinc-300 cursor-pointer">Editorial</span>
                                <span onClick={() => navigate('/booking-facilities')} className="hover:text-zinc-300 cursor-pointer">Facilities</span>
                            </div>
                            <p>© 2026 iFilmDirectory. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
