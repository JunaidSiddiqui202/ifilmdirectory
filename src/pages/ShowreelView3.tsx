import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, getLatestUsers, type UserProfile } from '../services/userService';
import PostMedia from '../components/PostMedia';
import { jobService, type Job } from '../services/jobService';
import { blogService, type BlogPost } from '../services/blogService';
import { pollService, type Poll } from '../services/pollService';
import { showreelService, type Showreel as DynamicShowreel } from '../services/showreelService';
import { facilityService } from '../services/facilityService';

const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
};





export default function ShowreelView3() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [recentJobs, setRecentJobs] = useState<Job[]>([]);
    const [recentAuditions, setRecentAuditions] = useState<Job[]>([]);
    const [recentBlogs, setRecentBlogs] = useState<BlogPost[]>([]);
    const [newUsers, setNewUsers] = useState<UserProfile[]>([]);
    const [showreels, setShowreels] = useState<DynamicShowreel[]>([]);
    const [activePoll, setActivePoll] = useState<Poll | null>(null);
    const [isVoting, setIsVoting] = useState(false);

    useEffect(() => {
        const fetchHomeData = async () => {
            const [fetchedJobs, fetchedBlogs, fetchedUsers, fetchedFacilities, fetchedPoll, fetchedShowreels] = await Promise.all([
                jobService.getJobs(),
                blogService.getBlogs(),
                getLatestUsers(10),
                facilityService.getLatestFacilities(6),
                pollService.getActiveDailyPoll(),
                showreelService.getTrendingShowreels(30)
            ]);

            // Jobs & Auditions
            let processedJobs = fetchedJobs;
            if (!fetchedJobs || fetchedJobs.length === 0) {
                console.log('No jobs found, seeding defaults...');
                await jobService.seedJobs();
                processedJobs = await jobService.getJobs();
            }

            const auditions = processedJobs.filter((j: Job) => j.type === 'Audition').slice(0, 5);
            setRecentAuditions(auditions);
            const jobs = processedJobs.filter((j: Job) => j.type !== 'Audition').slice(0, 5);
            setRecentJobs(jobs);

            // Blogs
            setRecentBlogs(fetchedBlogs.slice(0, 5));

            // Users & Services (Merged & Sorted)
            const combinedRecent = [
                ...fetchedUsers.map(u => ({ ...u, type: 'user' })),
                ...fetchedFacilities.map((f: any) => ({
                    ...f,
                    uid: f.id,
                    displayName: f.name,
                    photoURL: f.image,
                    role: f.type,
                    type: 'service'
                }))
            ].sort((a: any, b: any) => {
                // Robust date parsing
                const getTime = (item: any) => {
                    if (!item.createdAt) return 0;
                    const date = new Date(item.createdAt);
                    return isNaN(date.getTime()) ? 0 : date.getTime();
                };

                const timeA = getTime(a);
                const timeB = getTime(b);

                if (timeB !== timeA) {
                    return timeB - timeA;
                }

                // Fallback: prefer users over services if dates are equal (or both 0)
                if (a.type !== b.type) {
                    return a.type === 'user' ? -1 : 1;
                }

                return 0;
            });

            setNewUsers(combinedRecent);

            // Showreels - Seed if empty
            if (fetchedShowreels && fetchedShowreels.length > 0) {
                setShowreels(fetchedShowreels);
            } else {
                console.log('No showreels found, seeding defaults...');
                await showreelService.seedShowreels();
                const freshShowreels = await showreelService.getTrendingShowreels(30);
                setShowreels(freshShowreels);
            }

            // Poll - Seed if empty for demo
            if (fetchedPoll) {
                setActivePoll(fetchedPoll);
            } else {
                console.log('No active poll found, seeding default...');
                await pollService.createDailyPoll(
                    "Which film industry trend are you most excited about for 2024?",
                    ["AI in Post-Production", "Virtual Production (LED Walls)", "Regional Cinema going Global"]
                );
                const newPoll = await pollService.getActiveDailyPoll();
                if (newPoll) setActivePoll(newPoll);
            }
        };
        fetchHomeData();
    }, []);

    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (currentUser) {
                try {
                    const data = await getUserProfile(currentUser.uid);
                    if (data) {
                        setUserProfile(data);
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            }
        };
        fetchProfile();
    }, [currentUser]);

    const displayName = userProfile?.displayName || currentUser?.displayName || 'Guest';
    const photoURL = userProfile?.photoURL || currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';

    const handleVote = async (optionId: string) => {
        if (!activePoll || !currentUser || isVoting) return;
        if (activePoll.voters.includes(currentUser.uid)) return;

        setIsVoting(true);
        try {
            // Optimistic Update
            const updatedOptions = activePoll.options.map(opt => {
                if (opt.id === optionId) return { ...opt, votes: (opt.votes || 0) + 1 };
                return opt;
            });
            setActivePoll({
                ...activePoll,
                options: updatedOptions,
                totalVotes: activePoll.totalVotes + 1,
                voters: [...activePoll.voters, currentUser.uid]
            });

            await pollService.vote(activePoll.id, optionId, currentUser.uid);
        } catch (error) {
            console.error("Voting failed:", error);
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md md:max-w-xl lg:max-w-2xl flex-col bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/70 px-6 pt-5 pb-4 backdrop-blur-3xl border-b border-black/[0.02] dark:border-white/[0.02]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <HamburgerMenu />
                        <div
                            className="h-11 w-11 shrink-0 rounded-[14px] overflow-hidden ring-2 ring-primary/10 shadow-lg cursor-pointer transition-transform active:scale-90"
                            onClick={() => navigate('/profile')}
                        >
                            <PostMedia
                                src={photoURL}
                                fallbackType="USER_MALE"
                                className="w-full h-full"
                            />
                        </div>
                        <div className="cursor-pointer" onClick={() => navigate('/profile')}>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.1em] leading-none mb-1.5">Portfolio</p>
                            <h1 className="text-base font-black tracking-tight text-zinc-900 dark:text-white leading-none">{displayName}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${showSearch ? 'bg-primary text-white shadow-primary/30' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                        >
                            <span className="material-symbols-outlined font-bold">search</span>
                        </button>
                        <button
                            onClick={() => navigate('/messaging')}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <span className="material-symbols-outlined font-bold">chat_bubble_outline</span>
                        </button>
                    </div>
                </div>
                {/* Search Bar */}
                {showSearch && (
                    <div className="mt-4 animate-in slide-in-from-top-2 fade-in">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (searchText.trim()) {
                                            // Redirect to general search page with query
                                            navigate(`/search?q=${encodeURIComponent(searchText)}`);
                                        }
                                    }
                                }}
                                placeholder="Search showreels, people, jobs..."
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl pl-10 pr-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-primary"
                                autoFocus
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">search</span>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24 bg-zinc-50/50 dark:bg-transparent">
                {/* Showcase Section - Hero Treatment */}
                <section className="pt-1 pb-0 relative animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
                    {/* Background Glow for Hero feel */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-primary/5 blur-[100px] pointer-events-none" />

                    {/* Horizontal Scrolling Showreels - NO HEADER */}
                    <div className="flex snap-x snap-mandatory overflow-x-auto gap-2 px-3 pb-2 no-scrollbar -mx-3">
                        {showreels.map((reel) => (
                            <div
                                key={reel.id}
                                className="relative w-[80px] aspect-[9/16] shrink-0 snap-start overflow-hidden rounded-[16px] cursor-pointer hover:scale-105 transition-all shadow-md active:scale-95 group/reel"
                                onClick={() => {
                                    showreelService.incrementViews(reel.id);
                                    navigate(`/showreel/view1?id=${reel.id}`);
                                }}
                            >
                                <div className="absolute inset-0 group-hover/reel:scale-110 transition-transform duration-700">
                                    <PostMedia src={reel.videoUrl || reel.thumbnail} isThumbnail={true} className="w-full h-full" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                <div className="absolute bottom-0 left-0 p-2 text-white">
                                    <p className="text-[8px] font-black tracking-tight leading-tight uppercase mb-0.5 line-clamp-2">{reel.title}</p>
                                    <div className="flex items-center gap-1 opacity-90">
                                        <div className="size-2.5 rounded-full bg-primary flex items-center justify-center">
                                            <span className="material-symbols-outlined !text-[6px] text-white">person</span>
                                        </div>
                                        <p className="text-[6px] font-black truncate tracking-widest uppercase">{reel.creator}</p>
                                    </div>
                                </div>
                                <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-black/40 backdrop-blur-md px-1 py-0.5 text-[7px] font-black text-white pointer-events-none border border-white/20">
                                    <span className="material-symbols-outlined !text-[8px] text-primary filled">play_arrow</span>
                                    <span>{formatViews(reel.views)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>





                {/* Active Jobs Section - Indigo Accent */}
                <section className="mt-8 px-3 py-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="size-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200">Active Opportunities</h2>
                        </div>
                        <button onClick={() => navigate('/jobs')} className="text-indigo-500 text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-1">
                            Browse <span className="material-symbols-outlined text-[12px]">trending_flat</span>
                        </button>
                    </div>
                    <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1.5 -mx-3 px-3 snap-x">
                        {recentJobs.length > 0 ? recentJobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => navigate(`/job/${job.id}`)}
                                className="min-w-[180px] max-w-[180px] bg-white dark:bg-zinc-900/60 backdrop-blur-3xl border border-zinc-100 dark:border-white/5 rounded-2xl p-2 shadow-[0_15px_35px_-12px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] snap-center active:scale-95 transition-all ring-1 ring-black/[0.01] dark:ring-white/[0.01] group/job"
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="size-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center overflow-hidden border border-indigo-100/50 dark:border-indigo-500/20 shrink-0">
                                        <PostMedia
                                            src={job.logo || ''}
                                            fallbackType="COMPANY_LOGO"
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter truncate opacity-80">{job.company}</p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white truncate tracking-tight">{job.title}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mb-1.5">
                                    <span className="px-1.5 py-0.5 rounded-md bg-zinc-50 dark:bg-zinc-800 text-[7px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-100 dark:border-zinc-700/50">Full-Time</span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-[7px] font-black text-indigo-500 uppercase tracking-widest border border-indigo-500/10">Remote</span>
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-50 dark:border-zinc-800">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest truncate max-w-[80px]">{job.location}</span>
                                        <span className="size-1 bg-zinc-300 rounded-full shrink-0" />
                                        <span className="text-[9px] font-black text-indigo-500 uppercase whitespace-nowrap">₹ {job.salary}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-indigo-500/40 text-base">arrow_forward</span>
                                </div>
                            </div>
                        )) : (
                            <div className="w-full py-8 text-center text-zinc-400 text-sm italic">Searching jobs...</div>
                        )}
                    </div>
                </section>

                {/* Casting Calls Section - Emerald Accent & Vertical Stack */}
                <section className="mt-8 px-3 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="size-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200">Featured Casting</h2>
                        </div>
                        <button onClick={() => navigate('/jobs')} className="text-emerald-500 text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-1">
                            Explore All <span className="material-symbols-outlined text-[12px]">trending_flat</span>
                        </button>
                    </div>
                    <div className="space-y-1.5">
                        {recentAuditions.slice(0, 3).length > 0 ? recentAuditions.slice(0, 3).map((audition) => (
                            <div
                                key={audition.id}
                                onClick={() => navigate(`/job/${audition.id}`)}
                                className="flex items-center gap-4 bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 rounded-2xl p-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group/audition"
                            >
                                <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center overflow-hidden border border-emerald-100/50 dark:border-emerald-500/20 shrink-0">
                                    <span className="material-symbols-outlined text-emerald-500 text-2xl group-hover/audition:scale-110 transition-transform">theater_comedy</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest truncate">{audition.company}</p>
                                        <span className="text-[8px] text-zinc-300">•</span>
                                        <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{audition.location}</span>
                                    </div>
                                    <p className="text-sm font-black text-zinc-900 dark:text-white truncate tracking-tight uppercase">{audition.title}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[9px] font-black px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800">OPEN</span>
                                </div>
                            </div>
                        )) : (
                            <div className="py-8 text-center text-zinc-400 text-sm italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">Finding roles...</div>
                        )}
                    </div>
                </section>

                {/* Fresh Talent Section - Blue Accent & Grid */}
                <section className="mt-8 px-3 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[450ms] fill-mode-both border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="size-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200">Recently Joined Users & Services</h2>
                        </div>
                        <button onClick={() => navigate('/browse-profiles')} className="text-blue-500 text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-1">
                            View All <span className="material-symbols-outlined text-[12px]">trending_flat</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pb-0">
                        {newUsers.slice(0, 10).length > 0 ? newUsers.slice(0, 10).map((user) => (
                            <div
                                key={user.uid}
                                onClick={() => navigate(user.type === 'service' ? `/business/${user.uid}` : `/profile/${user.uid}`)}
                                className="relative flex flex-col items-center p-1.5 border border-zinc-100 dark:border-white/5 rounded-2xl cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group/talent overflow-hidden">
                                {/* Blurred Background */}
                                <div className="absolute inset-0 z-0">
                                    <PostMedia
                                        src={user.photoURL || ''}
                                        fallbackType={user.physicalAttributes?.languages ? 'ACTOR' : 'GENERAL'}
                                        className="w-full h-full object-cover blur-2xl scale-110 opacity-70"
                                    />
                                    <div className="absolute inset-0 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-sm" />
                                </div>

                                <div className="relative mb-1 z-10">
                                    <div className="size-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-md group-hover/talent:ring-2 group-hover/talent:ring-blue-500/50 transition-all">
                                        <PostMedia
                                            src={user.photoURL || ''}
                                            fallbackType={user.physicalAttributes?.languages ? 'ACTOR' : 'GENERAL'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {user.verification?.isVerified && (
                                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[8px] text-white filled">verified</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center w-full px-0 z-10 relative">
                                    <p className="text-[10px] font-black text-zinc-900 dark:text-white truncate tracking-tight">{user.displayName}</p>
                                    <p className="text-[7px] font-bold text-blue-500 uppercase tracking-widest opacity-80 mt-1 truncate">{user.role || 'Artist'}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 py-8 text-center text-zinc-400 text-xs italic">Syncing talent pool...</div>
                        )}
                    </div>
                </section>

                {/* Industry Insights Section */}
                <section className="mt-8 px-3 py-4 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="size-2 bg-fuchsia-500 rounded-full animate-pulse" />
                            <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200">Insights</h2>
                        </div>
                        <button
                            onClick={() => navigate('/blogs-events')}
                            className="text-fuchsia-500 text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-1"
                        >
                            Read More <span className="material-symbols-outlined text-[12px]">trending_flat</span>
                        </button>
                    </div>
                    {
                        recentBlogs.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 no-scrollbar snap-x">
                                {recentBlogs.map((blog) => (
                                    <div
                                        key={blog.id}
                                        onClick={() => navigate('/blogs-events')}
                                        className="min-w-[240px] max-w-[240px] rounded-[24px] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.2)] border border-black/[0.03] dark:border-white/[0.05] snap-center active:scale-95 transition-all ring-1 ring-black/[0.02] dark:ring-white/[0.02] group/blog"
                                    >
                                        <div className="h-32 w-full relative overflow-hidden">
                                            <PostMedia
                                                src={blog.image || ''}
                                                fallbackType="GENERAL"
                                                className="w-full h-full group-hover/blog:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[8px] font-black text-fuchsia-500 uppercase tracking-widest bg-fuchsia-100 dark:bg-fuchsia-900/30 px-1.5 py-0.5 rounded-full">Trending</span>
                                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">5 min read</span>
                                            </div>
                                            <h3 className="font-black text-[13px] text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight line-clamp-2 h-[1.8rem] mb-1.5">{blog.title}</h3>
                                            <div className="flex items-center justify-between pt-3 border-t border-zinc-50 dark:border-zinc-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden ring-1 ring-zinc-200">
                                                        <PostMedia src={`https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author)}&size=32`} fallbackType="USER_MALE" className="w-full h-full" />
                                                    </div>
                                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.1em]">{blog.author}</span>
                                                </div>
                                                <span className="material-symbols-outlined text-fuchsia-500 text-sm font-bold">arrow_outward</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-zinc-400 text-sm italic">Loading insights...</div>
                        )
                    }
                </section>

                {/* Guild Discussions Section */}
                <div className="px-4 py-4 mt-8 border border-zinc-200 dark:border-zinc-800 rounded-3xl mx-3">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-zinc-900 dark:text-white text-xl font-black tracking-tight flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">groups</span>
                            Guild Discussions
                        </h2>
                        <button onClick={() => navigate('/guilds')} className="text-primary text-xs font-bold uppercase tracking-wider hover:underline">View All</button>
                    </div>
                    <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4 -mx-4 px-4 snap-x">
                        {[
                            { guild: 'Cinematography Hub', category: 'Technical', title: 'Latest Color Grading Techniques for 2024', preview: 'Exploring modern color grading workflows...', likes: 124, comments: 42 },
                            { guild: 'Directors Guild', category: 'Creative', title: 'Blocking Techniques for Emotional Scenes', preview: 'How to use actor positioning...', likes: 89, comments: 31 },
                            { guild: 'VFX & CGI Pros', category: 'Technical', title: 'Real-time VFX in Virtual Production', preview: 'Leveraging Unreal Engine...', likes: 156, comments: 67 },
                            { guild: 'Acting Studio', category: 'Talent', title: 'Method Acting vs. Meisner Technique', preview: 'Understanding different approaches...', likes: 203, comments: 95 },
                            { guild: 'Post-Production Suite', category: 'Technical', title: 'Optimizing Editing Workflows', preview: 'Tips for faster turnaround times...', likes: 78, comments: 28 }
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate('/guilds')}
                                className="min-w-[300px] bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 snap-center hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">movie_filter</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-primary uppercase tracking-tight">{item.guild}</p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{item.category}</p>
                                    </div>
                                </div>
                                <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                                    {item.preview}
                                </p>
                                <div className="flex items-center gap-4 text-[10px] text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">favorite</span>
                                        {item.likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">comment</span>
                                        {item.comments}
                                    </span>
                                    <span className="ml-auto text-[9px]">2h ago</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Community Poll - Moved to End */}
                {activePoll && (
                    <div className="mt-8 mx-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative overflow-hidden group/poll">
                        {/* Premium Glow Effects */}
                        <div className="absolute -top-24 -right-24 size-64 bg-primary/5 rounded-full blur-[80px] opacity-50 group-hover/poll:bg-primary/10 transition-colors duration-1000" />
                        <div className="absolute -bottom-24 -left-24 size-64 bg-fuchsia-600/5 rounded-full blur-[80px] opacity-30 group-hover/poll:bg-fuchsia-600/10 transition-colors duration-1000" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 bg-primary rounded-full animate-pulse" />
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
                                        Daily Poll
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-40">
                                    <span className="material-symbols-outlined text-zinc-400 text-[14px]">groups</span>
                                    <span className="text-[10px] font-black text-zinc-500 dark:text-white uppercase tracking-widest">{activePoll.totalVotes}</span>
                                </div>
                            </div>

                            <h3 className="text-zinc-900 dark:text-white text-xl font-black tracking-tight mb-8 leading-tight group-hover/poll:text-primary transition-colors">
                                {activePoll.question}
                            </h3>

                            <div className="space-y-4">
                                {activePoll.options.map((opt) => {
                                    const totalVotes = activePoll.totalVotes;
                                    const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                                    const hasVoted = currentUser && activePoll.voters.includes(currentUser.uid);

                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleVote(opt.id)}
                                            disabled={!!hasVoted || isVoting}
                                            className={`w-full relative group/opt transition-all active:scale-[0.98] ${hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
                                        >
                                            <div className={`w-full p-5 rounded-2xl border transition-all duration-500 text-left flex items-center justify-between overflow-hidden relative ${hasVoted
                                                ? 'bg-zinc-50 dark:bg-white/[0.03] border-zinc-100 dark:border-white/10'
                                                : 'bg-zinc-50/50 dark:bg-white/[0.05] border-zinc-100 dark:border-white/10 hover:border-primary/40 hover:bg-white/[0.08] shadow-sm'
                                                }`}>
                                                {hasVoted && (
                                                    <div
                                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary/20 to-primary/5 transition-all duration-1000 ease-out"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                )}

                                                <div className="flex items-center gap-3 relative z-10">
                                                    {!hasVoted && (
                                                        <div className="size-4 rounded-full border-2 border-primary/30 group-hover/opt:border-primary transition-colors" />
                                                    )}
                                                    <span className={`text-[13px] font-black tracking-tight transition-colors ${hasVoted ? (percentage === Math.max(...activePoll.options.map(o => (o.votes / totalVotes) * 100)) ? 'text-primary' : 'text-zinc-400') : 'text-zinc-600 dark:text-zinc-200 group-hover/opt:text-primary'}`}>
                                                        {opt.text}
                                                    </span>
                                                </div>

                                                {hasVoted && (
                                                    <div className="flex items-baseline gap-1 relative z-10">
                                                        <span className="text-lg font-black text-zinc-900 dark:text-white">{percentage}</span>
                                                        <span className="text-[10px] font-black text-primary">%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {!currentUser && (
                                <p className="mt-6 text-center text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] animate-pulse">
                                    Sign in to participate
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="h-20" />
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
