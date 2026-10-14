import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

export default function ShowreelView2() {
    const navigate = useNavigate();

    const showreels = [
        {
            id: 1,
            title: 'Monologue Showcase',
            author: 'Priya Sharma',
            views: '1.2M',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
        },
        {
            id: 2,
            title: '"Rajputana" Audition',
            author: 'Aditya Singh',
            views: '980K',
            image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
        },
        {
            id: 3,
            title: 'Dance Reel 2024',
            author: 'Ananya Reddy',
            views: '854K',
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
        },
        {
            id: 4,
            title: 'Stand-up Clip',
            author: 'Rohan Joshi',
            views: '712K',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
        },
    ];

    const recentJobs = [
        {
            id: 1,
            title: 'Lead Actor for "Mumbai Dreams"',
            company: 'Dharma Productions',
            location: 'Mumbai, MH',
            icon: 'movie',
        },
        {
            id: 2,
            title: 'Voice Over for Animation',
            company: 'Red Chillies Entertainment',
            location: 'Remote',
            icon: 'campaign',
        },
    ];

    const auditions = [
        {
            id: 1,
            title: 'Walk-in for TV Serial',
            company: 'Balaji Telefilms',
            location: 'Andheri, Mumbai',
            icon: 'theater_comedy',
        },
    ];

    return (
        <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md md:max-w-2xl lg:max-w-3xl flex-col bg-background-light dark:bg-background-dark pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background-light/80 p-4 backdrop-blur-sm dark:bg-background-dark/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div
                            className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center"
                            style={{
                                backgroundImage:
                                    'url(https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop)',
                            }}
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Welcome back,</p>
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Priya Sharma</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                        <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-background-light bg-red-500 dark:border-background-dark"></span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-24">
                {/* Showreels Section */}
                <section>
                    <div className="flex items-center justify-between px-4 py-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Showreels</h2>
                        <button className="text-sm font-semibold text-primary hover:underline">See All</button>
                    </div>
                    <div className="flex snap-x snap-mandatory scroll-p-4 space-x-4 overflow-x-auto px-4 pb-4 no-scrollbar">
                        {showreels.map((reel) => (
                            <div
                                key={reel.id}
                                className="relative w-40 shrink-0 aspect-[9/16] snap-start overflow-hidden rounded-xl cursor-pointer hover:scale-105 transition-transform"
                            >
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${reel.image})` }}
                                    onClick={() => navigate('/showreel/view1')}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                <div className="absolute bottom-0 left-0 p-3 text-white">
                                    <p className="text-sm font-semibold">{reel.title}</p>
                                    <p
                                        className="text-xs text-white/80 hover:underline cursor-pointer pointer-events-auto"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/profile/${reel.id}`);
                                        }}
                                    >
                                        {reel.author}
                                    </p>
                                </div>
                                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white pointer-events-none">
                                    <span className="material-symbols-outlined !text-sm">play_arrow</span>
                                    <span>{reel.views}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="px-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/browse-profiles')}
                            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-gray-100 p-4 text-center dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                                <span className="material-symbols-outlined">person_search</span>
                            </div>
                            <p className="font-semibold text-zinc-900 dark:text-white">Browse Profiles</p>
                        </button>
                        <button
                            onClick={() => navigate('/messaging')}
                            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-gray-100 p-4 text-center dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                                <span className="material-symbols-outlined">chat</span>
                            </div>
                            <p className="font-semibold text-zinc-900 dark:text-white">Messages</p>
                        </button>
                    </div>
                </section>

                {/* Recent Jobs */}
                <section className="px-4 py-3">
                    <div className="flex items-center justify-between pb-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Jobs</h2>
                        <button onClick={() => navigate('/jobs')} className="text-sm font-semibold text-primary hover:underline">See All</button>
                    </div>
                    <div className="space-y-3">
                        {recentJobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => navigate(`/job/${job.id}`)}
                                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                                        <span className="material-symbols-outlined text-3xl text-gray-500">
                                            {job.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-zinc-900 dark:text-white">{job.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{job.company}</p>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{job.location}</p>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Auditions */}
                <section className="px-4 py-3">
                    <div className="flex items-center justify-between pb-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Auditions</h2>
                        <button onClick={() => navigate('/jobs')} className="text-sm font-semibold text-primary hover:underline">See All</button>
                    </div>
                    <div className="space-y-3">
                        {auditions.map((audition) => (
                            <div
                                key={audition.id}
                                onClick={() => navigate(`/job/${audition.id}`)}
                                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                                        <span className="material-symbols-outlined text-3xl text-gray-500">
                                            {audition.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-zinc-900 dark:text-white">{audition.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{audition.company}</p>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {audition.location}
                                        </p>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
