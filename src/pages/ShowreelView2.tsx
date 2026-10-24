import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function ShowreelView2() {
    const navigate = useNavigate();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { currentUser } = useAuth();

    const showreels = [
        {
            id: 1,
            title: 'Monologue Showcase',
            author: 'Priya Sharma',
            views: '1.2M',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
            role: 'Actor'
        },
        {
            id: 2,
            title: '"Rajputana" Audition',
            author: 'Aditya Singh',
            views: '980K',
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
            role: 'Lead Artist'
        },
        {
            id: 3,
            title: 'Dance Reel 2024',
            author: 'Ananya Reddy',
            views: '854K',
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
            role: 'Choreographer'
        },
        {
            id: 4,
            title: 'Cinematography Reel',
            author: 'Rohan Joshi',
            views: '712K',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
            role: 'Cinematographer'
        },
    ];

    const recentJobs = [
        {
            id: 1,
            title: 'Lead Actor for "Mumbai Dreams"',
            company: 'Dharma Productions',
            location: 'Mumbai, MH',
            type: 'Feature Film',
            icon: 'movie',
        },
        {
            id: 2,
            title: 'Voice Over for Animation',
            company: 'Red Chillies Entertainment',
            location: 'Remote',
            type: 'Dubbing / VO',
            icon: 'campaign',
        },
    ];

    const auditions = [
        {
            id: 1,
            title: 'Walk-in for TV Serial',
            company: 'Balaji Telefilms',
            location: 'Andheri, Mumbai',
            type: 'Daily Soap',
            icon: 'theater_comedy',
        },
    ];

    return (
        <div className="relative mx-auto flex h-full min-h-screen w-full max-w-4xl flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-24 transition-colors">
            {/* Unified Responsive Cinema Header */}
            <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#090A0C]/85 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] px-4 sm:px-6 py-3 transition-colors">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex size-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
                            title="Go Back"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>
                        <HamburgerMenu />
                        <Logo />
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wide">
                            <span className="material-symbols-outlined text-xs">theaters</span>
                            Showreel Gallery
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Switch to Cinema View */}
                        <button
                            onClick={() => navigate('/showreel/view1')}
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-white hover:bg-amber-400 text-xs font-bold shadow-sm active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">play_circle</span>
                            <span>Cinema Player</span>
                        </button>

                        {/* Theme Toggle Button (Mobile only) */}
                        <button
                            onClick={toggleDarkMode}
                            className="flex md:hidden size-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
                            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            <span className="material-symbols-outlined text-lg">
                                {isDarkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>

                        {/* Search */}
                        <button
                            onClick={() => navigate('/browse-profiles')}
                            className="flex size-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
                            title="Search"
                        >
                            <span className="material-symbols-outlined text-lg">search</span>
                        </button>

                        {/* User Avatar */}
                        <button
                            onClick={() => navigate(currentUser ? `/profile/${currentUser.uid}` : '/login')}
                            className="size-9 rounded-full overflow-hidden ring-1 ring-black/10 dark:ring-white/15 cursor-pointer hover:ring-amber-500 transition-all shrink-0"
                        >
                            <img
                                src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 sm:px-6 py-6 space-y-8">
                {/* Showcase Reel Banner */}
                <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20">
                    <div className="relative z-10 max-w-xl space-y-3">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm">
                            Creator Spotlight
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                            Film Industry Showreels & Audition Clips
                        </h1>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Discover actors, directors, cinematographers, and crew work reels in high-definition cinema mode.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={() => navigate('/showreel/view1')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-400 shadow-md active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-base">play_arrow</span>
                                Watch Full Reels
                            </button>
                            <button
                                onClick={() => navigate('/showreel/upload')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-200 font-bold text-xs border border-black/5 dark:border-white/10 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-base">upload</span>
                                Upload Reel
                            </button>
                        </div>
                    </div>
                </section>

                {/* Showreels Carousel Section */}
                <section>
                    <div className="flex items-center justify-between pb-4">
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">Featured Showreels</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Trending acting, action, and monologue reels</p>
                        </div>
                        <button
                            onClick={() => navigate('/showreel/view1')}
                            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 group"
                        >
                            <span>Open Player</span>
                            <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {showreels.map((reel) => (
                            <div
                                key={reel.id}
                                onClick={() => navigate('/showreel/view1')}
                                className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 cursor-pointer border border-black/10 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-amber-500/40 transition-all"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                    style={{ backgroundImage: `url(${reel.image})` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[11px] font-bold text-white border border-white/15">
                                    <span className="material-symbols-outlined text-xs text-amber-400">play_arrow</span>
                                    <span>{reel.views}</span>
                                </div>

                                <div className="absolute bottom-0 inset-x-0 p-3.5 text-white flex flex-col justify-end">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                        {reel.role}
                                    </span>
                                    <p className="text-sm font-bold line-clamp-1 leading-snug drop-shadow-sm">{reel.title}</p>
                                    <p className="text-xs text-zinc-300 mt-0.5">{reel.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Navigation Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/browse-profiles')}
                        className="flex items-center gap-4 rounded-2xl p-5 bg-white dark:bg-[#121316] border border-black/[0.06] dark:border-white/[0.08] hover:border-amber-500/30 text-left shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">person_search</span>
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white text-base">Browse Profiles</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Explore 100+ verified film actors, directors, and technicians</p>
                        </div>
                    </button>
                    <button
                        onClick={() => navigate('/messaging')}
                        className="flex items-center gap-4 rounded-2xl p-5 bg-white dark:bg-[#121316] border border-black/[0.06] dark:border-white/[0.08] hover:border-amber-500/30 text-left shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">chat</span>
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white text-base">Cinema Messages</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Direct messaging with casting agents and filmmakers</p>
                        </div>
                    </button>
                </section>

                {/* Recent Jobs */}
                <section>
                    <div className="flex items-center justify-between pb-3">
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Recent Cinema Jobs</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Active casting calls & production roles</p>
                        </div>
                        <button onClick={() => navigate('/jobs')} className="text-xs font-bold text-amber-500 hover:text-amber-400">
                            See All
                        </button>
                    </div>
                    <div className="space-y-3">
                        {recentJobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => navigate(`/jobs`)}
                                className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121316] p-4 cursor-pointer hover:border-amber-500/30 shadow-sm transition-all flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <span className="material-symbols-outlined text-2xl">{job.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-white text-sm">{job.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                            <span>{job.company}</span>
                                            <span>•</span>
                                            <span>{job.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
                                    {job.type}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Auditions */}
                <section>
                    <div className="flex items-center justify-between pb-3">
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Auditions & Walk-ins</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Latest casting auditions in South & Bollywood</p>
                        </div>
                        <button onClick={() => navigate('/jobs')} className="text-xs font-bold text-amber-500 hover:text-amber-400">
                            See All
                        </button>
                    </div>
                    <div className="space-y-3">
                        {auditions.map((audition) => (
                            <div
                                key={audition.id}
                                onClick={() => navigate(`/jobs`)}
                                className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121316] p-4 cursor-pointer hover:border-amber-500/30 shadow-sm transition-all flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <span className="material-symbols-outlined text-2xl">{audition.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-white text-sm">{audition.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                            <span>{audition.company}</span>
                                            <span>•</span>
                                            <span>{audition.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">
                                    {audition.type}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}

