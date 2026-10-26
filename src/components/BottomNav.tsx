import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import DesktopSidebar from './DesktopSidebar';

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { modalRef: createModalRef } = useModalAccessibility({
        isOpen: isCreateOpen,
        onClose: () => setIsCreateOpen(false)
    });

    const isActive = (path: string) => location.pathname === path;

    const isHomeActive = isActive('/home');
    const isFeedActive = isActive('/showcase');
    const isDiscoverActive = isActive('/browse-profiles') || isActive('/guilds');
    const isJobsActive = isActive('/jobs') || (location.pathname.startsWith('/job/') && !location.pathname.includes('/applications'));

    const quickActions = [
        {
            icon: 'movie',
            title: 'Upload Showreel',
            desc: 'Share video reel or clip',
            color: 'from-amber-500 to-orange-600',
            path: '/showreel/upload'
        },
        {
            icon: 'work',
            title: 'Post Job / Audition',
            desc: 'Find cast, crew & talent',
            color: 'from-blue-500 to-indigo-600',
            path: '/post-job'
        },
        {
            icon: 'architecture',
            title: 'New Production',
            desc: 'Start project shortlist',
            color: 'from-purple-500 to-violet-600',
            path: '/projects'
        },
        {
            icon: 'edit_note',
            title: 'Publish Article',
            desc: 'Share insights or news',
            color: 'from-emerald-500 to-teal-600',
            path: '/create-blog'
        }
    ];

    const handleActionClick = (path: string, title?: string) => {
        setIsCreateOpen(false);
        if (!currentUser) {
            openAuthModal(`Sign in to ${title ? title.toLowerCase() : 'publish or create'}`);
            return;
        }
        navigate(path);
    };

    return (
        <>
            {/* Quick-Create Action Sheet Modal */}
            {isCreateOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsCreateOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-modal-title"
                >
                    <div
                        ref={createModalRef}
                        tabIndex={-1}
                        className="w-full max-w-sm rounded-[32px] bg-white dark:bg-[#121316] p-6 shadow-2xl border border-zinc-200 dark:border-white/10 mb-20 sm:mb-0 animate-in slide-in-from-bottom-6 duration-300 outline-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-white/5">
                            <div>
                                <h3 id="create-modal-title" className="text-base font-bold tracking-tight text-zinc-900 dark:text-white uppercase font-display">
                                    Create & Publish
                                </h3>
                                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                    Share with the filmmaker community
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="size-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                                aria-label="Close create menu"
                            >
                                <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {quickActions.map(action => (
                                <button
                                    key={action.title}
                                    onClick={() => handleActionClick(action.path, action.title)}
                                    className="flex flex-col text-left p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 hover:border-amber-500/40 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-all group active:scale-95"
                                >
                                    <div className={`size-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-2.5 shadow-md group-hover:scale-105 transition-transform`}>
                                        <span className="material-symbols-outlined text-xl">{action.icon}</span>
                                    </div>
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight font-display">
                                        {action.title}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                                        {action.desc}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Instagram-Style Desktop Navigation Sidebar (Strictly hidden on mobile) */}
            <DesktopSidebar isCreateOpen={isCreateOpen} setIsCreateOpen={setIsCreateOpen} />

            {/* Mobile Navigation Dock (Strictly hidden on tablet/desktop) */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md border-t border-zinc-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#141416]/95 backdrop-blur-2xl pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.6)] font-display transition-colors"
                aria-label="Mobile Navigation"
            >
                <div className="flex h-16 items-center justify-around px-2 sm:px-4">
                    {/* Home */}
                    <button
                        onClick={() => navigate('/home')}
                        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${isHomeActive ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                        aria-label="Home"
                        aria-current={isHomeActive ? 'page' : undefined}
                    >
                        <span className={`material-symbols-outlined text-[24px] transition-transform ${isHomeActive ? 'filled scale-105' : ''}`} aria-hidden="true">home</span>
                        <span className={`text-xs tracking-tight mt-0.5 ${isHomeActive ? 'font-extrabold' : 'font-bold'}`}>Home</span>
                        {isHomeActive && (
                            <span className="absolute -bottom-1 size-1 bg-amber-500 rounded-full animate-in zoom-in" aria-hidden="true" />
                        )}
                    </button>

                    {/* Feed */}
                    <button
                        onClick={() => navigate('/showcase')}
                        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${isFeedActive ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                        aria-label="Feed & Showcase"
                        aria-current={isFeedActive ? 'page' : undefined}
                    >
                        <span className={`material-symbols-outlined text-[24px] transition-transform ${isFeedActive ? 'filled scale-105' : ''}`} aria-hidden="true">movie</span>
                        <span className={`text-xs tracking-tight mt-0.5 ${isFeedActive ? 'font-extrabold' : 'font-bold'}`}>Feed</span>
                        {isFeedActive && (
                            <span className="absolute -bottom-1 size-1 bg-amber-500 rounded-full animate-in zoom-in" aria-hidden="true" />
                        )}
                    </button>

                    {/* Integrated Quick-Create Button */}
                    <div className="flex items-center justify-center px-2">
                        <button
                            onClick={() => setIsCreateOpen(!isCreateOpen)}
                            className={`size-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-500/25 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 border border-zinc-200/50 dark:border-white/20 ${isCreateOpen ? 'rotate-45' : ''}`}
                            title="Create New Post / Job"
                            aria-label="Open Create Menu"
                            aria-expanded={isCreateOpen}
                        >
                            <span className="material-symbols-outlined text-2xl font-black" aria-hidden="true">add</span>
                        </button>
                    </div>

                    {/* Discover */}
                    <button
                        onClick={() => navigate('/browse-profiles')}
                        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${isDiscoverActive ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                        aria-label="Discover Profiles & Guilds"
                        aria-current={isDiscoverActive ? 'page' : undefined}
                    >
                        <span className={`material-symbols-outlined text-[24px] transition-transform ${isDiscoverActive ? 'filled scale-105' : ''}`} aria-hidden="true">explore</span>
                        <span className={`text-xs tracking-tight mt-0.5 ${isDiscoverActive ? 'font-extrabold' : 'font-bold'}`}>Discover</span>
                        {isDiscoverActive && (
                            <span className="absolute -bottom-1 size-1 bg-amber-500 rounded-full animate-in zoom-in" aria-hidden="true" />
                        )}
                    </button>

                    {/* Jobs */}
                    <button
                        onClick={() => navigate('/jobs')}
                        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${isJobsActive ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
                        aria-label="Jobs & Auditions"
                        aria-current={isJobsActive ? 'page' : undefined}
                    >
                        <span className={`material-symbols-outlined text-[24px] transition-transform ${isJobsActive ? 'filled scale-105' : ''}`} aria-hidden="true">work</span>
                        <span className={`text-xs tracking-tight mt-0.5 ${isJobsActive ? 'font-extrabold' : 'font-bold'}`}>Jobs</span>
                        {isJobsActive && (
                            <span className="absolute -bottom-1 size-1 bg-amber-500 rounded-full animate-in zoom-in" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </nav>
        </>
    );
}
