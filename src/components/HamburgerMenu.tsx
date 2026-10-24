import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const { currentUser, logout } = useAuth();
    const { openAuthModal } = useAuthModal();
    const { isDarkMode, toggleDarkMode } = useTheme();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleNavigation = (path: string, label?: string) => {
        setIsOpen(false);
        if (!currentUser && ['/projects', '/saved', '/settings', '/-admin'].includes(path)) {
            openAuthModal(`Sign in to access ${label ? label.toLowerCase() : 'this feature'}`);
            return;
        }
        navigate(path);
    };

    const handleLogout = async () => {
        try {
            setIsOpen(false);
            await logout();
            navigate('/home');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const isAdmin = currentUser?.email && ['junaid202@gmail.com', 'junaid202@hotmail.com', 'ifilmdirectory@gmail.com', 'contact@ifilmdirectory.com'].includes(currentUser.email);

    const sections = [
        {
            title: 'Discovery & Feed',
            items: [
                { icon: 'home', label: 'Home', path: '/home' },
                { icon: 'movie', label: 'Feed & Showcase', path: '/showcase' },
                { icon: 'newspaper', label: 'Cinema Wire', path: '/south-cinema' },
                { icon: 'event', label: 'Blogs & Events', path: '/blogs-events' },
            ]
        },
        {
            title: 'Casting & Production',
            items: [
                { icon: 'work', label: 'Jobs & Castings', path: '/jobs' },
                { icon: 'person_search', label: 'Talent Directory', path: '/browse-profiles' },
                { icon: 'groups', label: 'Skill Guilds', path: '/guilds' },
                { icon: 'domain', label: 'Facilities & Gear', path: '/booking-facilities' },
                { icon: 'architecture', label: 'Production Projects', path: '/projects' },
                { icon: 'handshake', label: 'Service Marketplace', path: '/marketplace' },
            ]
        },
        {
            title: 'Community & Connect',
            items: [
                { icon: 'forum', label: 'Guilds & Forums', path: '/groups-forums' },
                { icon: 'chat_bubble', label: 'Messages', path: '/messaging' },
                { icon: 'bookmarks', label: 'Saved Items', path: '/saved' },
            ]
        },
        {
            title: 'Account & Settings',
            items: [
                ...(currentUser ? [{ icon: 'person', label: 'My Profile', path: '/profile' }] : []),
                ...(isAdmin ? [{ icon: 'admin_panel_settings', label: 'Admin Command HQ', path: '/-admin' }] : []),
                { icon: 'settings', label: 'Settings & Privacy', path: '/settings' },
            ]
        }
    ];

    return (
        <>
            {/* Trigger Button (Mobile only) */}
            <button
                onClick={toggleMenu}
                className="md:hidden flex size-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 hover:border-primary/30 hover:text-primary transition-all active:scale-95 text-zinc-900 dark:text-white"
                title="Open Menu"
            >
                <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            {/* Portal for Drawer and Overlay */}
            {createPortal(
                <>
                    {/* Overlay */}
                    {isOpen && (
                        <div
                            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md transition-opacity"
                            onClick={() => setIsOpen(false)}
                        />
                    )}

                    <div
                        className={`fixed top-0 left-0 z-[101] h-[100dvh] w-80 max-w-[85vw] transform bg-white dark:bg-[#0B0C0E] border-r border-black/5 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                            }`}
                    >
                        <div className="flex h-full flex-col">
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-zinc-100 dark:border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <Logo size="sm" />
                                    <div className="flex items-center gap-2">
                                        {/* Handy Theme Toggle */}
                                        <button
                                            type="button"
                                            onClick={toggleDarkMode}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 text-xs font-bold font-display cursor-pointer transition-all active:scale-95 shadow-sm"
                                            title={isDarkMode ? 'Switch to Day Theme' : 'Switch to Night Theme (Antigravity Gray)'}
                                        >
                                            <span className={`material-symbols-outlined text-base ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                                {isDarkMode ? 'light_mode' : 'dark_mode'}
                                            </span>
                                            <span>{isDarkMode ? 'Day' : 'Night'}</span>
                                        </button>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="size-8 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </div>
                                </div>
                                {currentUser ? (
                                    <div
                                        onClick={() => handleNavigation('/profile', 'Profile')}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:border-primary/40 cursor-pointer transition-all active:scale-98"
                                    >
                                        <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
                                            {currentUser.photoURL ? (
                                                <img src={currentUser.photoURL} alt="" className="size-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate font-display">
                                                {currentUser.displayName || 'Film Professional'}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                                {currentUser.email}
                                            </p>
                                        </div>
                                        <span className="material-symbols-outlined text-zinc-400 text-sm">chevron_right</span>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => {
                                            setIsOpen(false);
                                            openAuthModal('Sign in to access your filmmaker profile & portfolio');
                                        }}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 to-amber-600/10 border border-amber-500/30 cursor-pointer transition-all active:scale-98"
                                    >
                                        <div className="size-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                                            <span className="material-symbols-outlined text-2xl font-black">login</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-zinc-900 dark:text-white truncate font-display">
                                                Sign In / Join iFilm
                                            </p>
                                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold truncate">
                                                Free Access for Indian Cinema
                                            </p>
                                        </div>
                                        <span className="material-symbols-outlined text-amber-500 text-sm">chevron_right</span>
                                    </div>
                                )}
                            </div>

                            {/* Categorized Menu Items */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {sections.map((section) => (
                                    <div key={section.title} className="space-y-1">
                                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-display">
                                            {section.title}
                                        </p>
                                        <nav className="flex flex-col gap-0.5 pt-1">
                                            {section.items.map((item) => (
                                                <button
                                                    key={item.path}
                                                    onClick={() => handleNavigation(item.path, item.label)}
                                                    className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-left transition-all ${location.pathname === item.path
                                                        ? 'bg-primary/10 text-primary font-bold'
                                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/[0.04] font-medium'
                                                        }`}
                                                >
                                                    <span className={`material-symbols-outlined text-xl ${location.pathname === item.path ? 'filled text-primary' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                                        {item.icon}
                                                    </span>
                                                    <span className="text-xs tracking-tight">
                                                        {item.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </nav>
                                    </div>
                                ))}
                            </div>

                            {/* Footer / Theme & Logout */}
                            <div className="border-t border-zinc-100 dark:border-white/5 p-4 pb-safe space-y-2">
                                {/* Theme Switcher Card */}
                                <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`material-symbols-outlined text-xl ${isDarkMode ? 'text-amber-400' : 'text-zinc-600'}`}>
                                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                                        </span>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                                {isDarkMode ? 'Night Theme' : 'Day Theme'}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                                {isDarkMode ? 'Antigravity Gray' : 'Studio Light'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleDarkMode}
                                        className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 text-[11px] font-bold tracking-wider uppercase transition-all active:scale-95 cursor-pointer"
                                    >
                                        To {isDarkMode ? 'Day' : 'Night'}
                                    </button>
                                </div>

                                {currentUser ? (
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-xl">logout</span>
                                        <span className="text-xs font-bold">Sign Out</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            openAuthModal('Sign in to access your filmmaker profile & portfolio');
                                        }}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-lg font-black">login</span>
                                        <span>Sign In / Create Account</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
