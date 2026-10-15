import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import PostMedia from './PostMedia';

interface DesktopSidebarProps {
    isCreateOpen: boolean;
    setIsCreateOpen: (open: boolean) => void;
}

export default function DesktopSidebar({ isCreateOpen, setIsCreateOpen }: DesktopSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useAuth();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    // Close 'More' popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
                setIsMoreOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (path: string) => {
        if (path === '/home') return location.pathname === '/home';
        if (path === '/showcase') return location.pathname === '/showcase';
        if (path === '/south-cinema') return location.pathname === '/south-cinema' || location.pathname === '/news';
        if (path === '/jobs') return location.pathname === '/jobs' || location.pathname.startsWith('/job/');
        if (path === '/browse-profiles') return location.pathname === '/browse-profiles';
        if (path === '/booking-facilities') return location.pathname === '/booking-facilities' || location.pathname.startsWith('/booking/');
        if (path === '/groups-forums') return location.pathname === '/groups-forums';
        if (path === '/messaging') return location.pathname === '/messaging' || location.pathname.startsWith('/chat/');
        if (path === '/notifications') return location.pathname === '/notifications';
        if (path === '/projects') return location.pathname === '/projects' || location.pathname.startsWith('/project/');
        if (path === '/saved') return location.pathname === '/saved';
        if (path === '/profile') return location.pathname === '/profile' || location.pathname === `/profile/${currentUser?.uid}`;
        return location.pathname === path;
    };

    const navItems = [
        { path: '/home', label: 'Home', icon: 'home' },
        { path: '/showcase', label: 'Feed', icon: 'movie' },
        { path: '/south-cinema', label: 'Cinema Wire', icon: 'newspaper' },
        { path: '/jobs', label: 'Jobs & Castings', icon: 'work' },
        { path: '/browse-profiles', label: 'Talent Directory', icon: 'explore' },
        { path: '/booking-facilities', label: 'Facilities & Gear', icon: 'domain' },
        { path: '/groups-forums', label: 'Guilds & Forums', icon: 'forum' },
        { path: '/messaging', label: 'Messages', icon: 'chat_bubble', hasBadge: false },
        { path: '/notifications', label: 'Notifications', icon: 'notifications', hasDot: true },
        { path: '/projects', label: 'My Projects', icon: 'architecture' },
        { path: '/saved', label: 'Saved Items', icon: 'bookmarks' },
        { path: '/profile', label: 'Profile', icon: 'person', isProfile: true },
    ];

    const handleLogout = async () => {
        try {
            setIsMoreOpen(false);
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-[#090A0C] border-r border-white/[0.08] w-20 xl:w-64 select-none px-3 py-4 font-display transition-all duration-300 overflow-y-auto overscroll-contain custom-scrollbar">
            {/* Top: Brand Header & Navigation */}
            <div className="flex flex-col gap-4 shrink-0">
                {/* Logo */}
                <div
                    onClick={() => navigate('/home')}
                    className="flex items-center justify-center xl:justify-start px-2 py-1 cursor-pointer group"
                    title="iFilmDirectory"
                >
                    <div className="xl:hidden">
                        <Logo size="md" showText={false} />
                    </div>
                    <div className="hidden xl:flex items-center gap-2.5">
                        <Logo size="md" showText={true} />
                    </div>
                </div>

                {/* Primary Nav Links */}
                <nav className="flex flex-col gap-1" aria-label="Desktop Primary Navigation">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                title={item.label}
                                className={`relative group flex items-center justify-center xl:justify-start gap-4 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                                    active
                                        ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                                }`}
                                aria-current={active ? 'page' : undefined}
                            >
                                {/* Icon */}
                                <div className="relative flex items-center justify-center shrink-0">
                                    {item.isProfile ? (
                                        <div className={`size-7 rounded-full overflow-hidden border-2 transition-all ${active ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-white/20 group-hover:border-white/50'}`}>
                                            <PostMedia
                                                src={currentUser?.photoURL || ''}
                                                fallbackType="USER_MALE"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <span
                                            className={`material-symbols-outlined text-[24px] transition-transform duration-200 group-hover:scale-110 ${
                                                active ? 'filled text-amber-400' : 'text-zinc-400 group-hover:text-white'
                                            }`}
                                            style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                                        >
                                            {item.icon}
                                        </span>
                                    )}

                                    {/* Unread Indicator Dot */}
                                    {item.hasDot && (
                                        <span className="absolute -top-0.5 -right-0.5 size-2 bg-amber-500 rounded-full animate-pulse" />
                                    )}
                                </div>

                                {/* Label (Visible on xl) */}
                                <span className={`hidden xl:inline text-sm tracking-tight truncate ${active ? 'font-bold text-white' : 'font-medium'}`}>
                                    {item.label}
                                </span>

                                {/* Tooltip on collapsed tablet/desktop (md - lg) */}
                                <span className="xl:hidden opacity-0 pointer-events-none group-hover:opacity-100 absolute left-full ml-3 px-2.5 py-1 bg-[#18191D] border border-white/10 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 transition-opacity">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* Instagram-Style Standout CREATE Button */}
                    <div className="pt-1.5">
                        <button
                            onClick={() => setIsCreateOpen(!isCreateOpen)}
                            className="w-full flex items-center justify-center xl:justify-start gap-3.5 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 group"
                            title="Create Post / Job / Reel"
                        >
                            <span className="material-symbols-outlined text-[24px] font-black">add_circle</span>
                            <span className="hidden xl:inline text-sm font-black tracking-wide">
                                Create / Post
                            </span>

                            {/* Tooltip on collapsed */}
                            <span className="xl:hidden opacity-0 pointer-events-none group-hover:opacity-100 absolute left-full ml-3 px-2.5 py-1 bg-[#18191D] border border-white/10 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 transition-opacity">
                                Create New
                            </span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Bottom: Settings, More Options & User Identity */}
            <div className="flex flex-col gap-1.5 relative mt-auto pt-4 shrink-0" ref={moreMenuRef}>
                {/* 'More' Options Popover (Instagram Style) */}
                {isMoreOpen && (
                    <div className="fixed md:left-20 xl:left-4 bottom-24 w-56 rounded-2xl bg-[#141519] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <button
                            onClick={() => { setIsMoreOpen(false); navigate('/settings'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">settings</span>
                            <span>Settings & Privacy</span>
                        </button>
                        <button
                            onClick={() => { setIsMoreOpen(false); navigate('/saved'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">bookmarks</span>
                            <span>Saved Items</span>
                        </button>
                        <button
                            onClick={() => { setIsMoreOpen(false); navigate('/privacy'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">security</span>
                            <span>Privacy Policy</span>
                        </button>
                        <button
                            onClick={() => { setIsMoreOpen(false); navigate('/terms'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">description</span>
                            <span>Terms of Service</span>
                        </button>
                        <div className="h-px bg-white/5 my-1" />
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">logout</span>
                            <span>Log Out</span>
                        </button>
                        <div className="pt-2 pb-1 px-2 border-t border-white/5 text-center">
                            <span className="text-[10px] text-zinc-500">Property of 5M Collective (5MC)</span>
                        </div>
                    </div>
                )}

                {/* Settings Item */}
                <button
                    onClick={() => navigate('/settings')}
                    title="Settings"
                    className={`group flex items-center justify-center xl:justify-start gap-4 px-3 py-2.5 rounded-2xl transition-all ${
                        isActive('/settings')
                            ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                >
                    <span className="material-symbols-outlined text-[24px]">settings</span>
                    <span className="hidden xl:inline text-sm font-medium">Settings</span>
                    <span className="xl:hidden opacity-0 pointer-events-none group-hover:opacity-100 absolute left-full ml-3 px-2.5 py-1 bg-[#18191D] border border-white/10 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 transition-opacity">
                        Settings
                    </span>
                </button>

                {/* 'More' Menu Trigger */}
                <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    title="More Options"
                    className="group flex items-center justify-center xl:justify-start gap-4 px-3 py-2.5 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                    <span className="material-symbols-outlined text-[24px]">menu</span>
                    <span className="hidden xl:inline text-sm font-medium">More Options</span>
                    <span className="xl:hidden opacity-0 pointer-events-none group-hover:opacity-100 absolute left-full ml-3 px-2.5 py-1 bg-[#18191D] border border-white/10 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 transition-opacity">
                        More
                    </span>
                </button>

                {/* User Card on expanded (xl) */}
                <div
                    onClick={() => navigate('/profile')}
                    title="My Profile"
                    className="hidden xl:flex items-center gap-3 p-2 mt-0.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer group"
                >
                    <div className="size-9 rounded-full overflow-hidden border border-white/20 group-hover:border-amber-500 transition-colors shrink-0">
                        <PostMedia
                            src={currentUser?.photoURL || ''}
                            fallbackType="USER_MALE"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                            {currentUser?.displayName || 'Filmmaker'}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                            {currentUser?.email?.split('@')[0] || 'Creator'}
                        </p>
                    </div>
                    <span className="material-symbols-outlined text-zinc-500 group-hover:text-white text-base">chevron_right</span>
                </div>
            </div>
        </aside>

    );
}
