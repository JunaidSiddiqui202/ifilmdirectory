import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HamburgerMenu from '../components/HamburgerMenu';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, type UserProfile } from '../services/userService';

export default function Settings() {
    const navigate = useNavigate();
    const { isDarkMode, toggleDarkMode, theme, setTheme } = useTheme();
    const { currentUser, logout } = useAuth();
    const [allowDirectCalls, setAllowDirectCalls] = useState(true);
    const [language] = useState('English');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (currentUser) {
                const data = await getUserProfile(currentUser.uid);
                if (data) {
                    setProfile(data);
                }
            }
        };
        fetchProfile();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <div className="relative flex h-auto min-h-[100dvh] w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1 pb-12">
            {/* Top App Bar */}
            <div className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 p-4 pb-2 justify-between backdrop-blur-sm">
                <div className="flex size-12 shrink-0 items-center">
                    <HamburgerMenu />
                </div>
                <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center font-display uppercase tracking-wider">
                    Settings
                </h2>
                <div className="flex w-12 items-center justify-end">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-primary text-base font-bold leading-normal tracking-[0.015em] shrink-0 hover:opacity-80 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            </div>

            <div className="flex flex-col px-4 pt-4 pb-12 space-y-6">

                {/* SHARE WITH FRIENDS Section - PROMOTED TO TOP */}
                <div className="flex flex-col space-y-2">
                    <h3 className="text-primary text-[10px] font-black leading-tight tracking-[0.2em] px-2 pb-1 pt-2 uppercase flex items-center gap-2 font-display">
                        <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-sm animate-pulse">NEW</span>
                        Share with Friends
                    </h3>
                    <div className="flex flex-col bg-white dark:bg-zinc-900/50 rounded-2xl overflow-hidden border border-primary/20 shadow-sm transition-all hover:shadow-md active:scale-[0.99]">
                        <button
                            onClick={() => {
                                const referralLink = `${window.location.origin}/welcome?ref=${currentUser?.uid || ''}`;
                                const message = `Hey! Join me on iFilmDirectory, the ultimate platform for film professionals. Sign up using my link: ${referralLink}`;
                                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                                window.open(whatsappUrl, '_blank');
                            }}
                            className="flex items-center gap-4 bg-transparent px-4 py-4 justify-between hover:bg-green-500/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-white flex items-center justify-center rounded-xl bg-green-500 shrink-0 size-12 shadow-lg shadow-green-500/30">
                                    <span className="material-symbols-outlined text-2xl">share</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <p className="text-zinc-900 dark:text-white text-base font-black leading-tight uppercase tracking-tight">
                                        Invite via WhatsApp
                                    </p>
                                    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                        Help us grow the community
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                                <span className="text-primary text-[10px] font-bold uppercase">Send</span>
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                                    arrow_forward_ios
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* ACCOUNT Section */}
                <div className="flex flex-col space-y-2">
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black leading-tight tracking-[0.2em] px-2 pb-1 pt-2 uppercase font-display">
                        ACCOUNT
                    </h3>
                    <div className="flex flex-col bg-white dark:bg-zinc-900/50 rounded-2xl overflow-hidden shadow-sm">
                        {/* Profile Information */}
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-4 bg-transparent px-4 py-4 justify-between hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-14 shrink-0 border-2 border-primary/20"
                                    style={{
                                        backgroundImage: `url(${profile?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'})`,
                                    }}
                                />
                                <div className="flex flex-col justify-center items-start">
                                    <p className="text-zinc-900 dark:text-white text-base font-black leading-tight uppercase tracking-tight">
                                        {profile?.displayName || currentUser?.displayName || 'User'}
                                    </p>
                                    <p className="text-primary text-xs font-bold leading-normal uppercase tracking-wider">
                                        {profile?.role === 'custom' && profile?.customRole
                                            ? profile.customRole
                                            : profile?.role || 'Film Professional'}
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0">
                                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500" style={{ fontSize: '24px' }}>
                                    arrow_forward_ios
                                </span>
                            </div>
                        </button>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800/50" />

                        {/* Contact & Login Details */}
                        <button
                            onClick={() => navigate('/settings/contact-login')}
                            className="flex items-center gap-4 bg-transparent px-4 py-3 justify-between hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">mail</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    Contact & Login
                                </p>
                            </div>
                            <div className="shrink-0">
                                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500" style={{ fontSize: '20px' }}>
                                    arrow_forward_ios
                                </span>
                            </div>
                        </button>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800/50" />

                        {/* Subscription & Billing */}
                        <button
                            onClick={() => navigate('/settings/subscription')}
                            className="flex items-center gap-4 bg-transparent px-4 py-3 justify-between hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">credit_card</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    Subscription & Billing
                                </p>
                            </div>
                            <div className="shrink-0">
                                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500" style={{ fontSize: '20px' }}>
                                    arrow_forward_ios
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* APPEARANCE Section */}
                <div className="flex flex-col space-y-2">
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black leading-tight tracking-[0.2em] px-2 pb-1 pt-2 uppercase font-display">
                        APPEARANCE
                    </h3>
                    <div className="flex flex-col bg-white dark:bg-zinc-900/50 rounded-2xl overflow-hidden shadow-sm">
                        {/* Day/Night Toggle */}
                        <div className="flex items-center gap-4 bg-transparent px-4 py-3 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                                </p>
                            </div>
                            <div className="shrink-0">
                                <button
                                    onClick={toggleDarkMode}
                                    className="relative inline-flex items-center cursor-pointer"
                                >
                                    <div className={`w-11 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                                        <div className={`absolute top-0.5 left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${isDarkMode ? 'translate-x-[20px]' : ''}`} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800/50" />

                        {/* Theme Selector */}
                        <div className="flex flex-col gap-4 bg-transparent px-4 py-4">
                            <div className="flex items-center gap-4">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">palette</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    UI Theme
                                </p>
                            </div>
                            <div className="flex gap-4 pl-14 overflow-x-auto no-scrollbar pb-1">
                                {[
                                    { id: 'gold', color: '#da620b', label: 'Gold' },
                                    { id: 'blue', color: '#3b82f6', label: 'Blue' },
                                    { id: 'red', color: '#ef4444', label: 'Red' },
                                    { id: 'green', color: '#22c55e', label: 'Green' },
                                    { id: 'purple', color: '#a855f7', label: 'Purple' },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id as any)}
                                        className={`flex flex-col items-center gap-2 shrink-0 p-1.5 rounded-2xl transition-all ${theme === t.id ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                                    >
                                        <div className="w-10 h-10 rounded-full shadow-lg" style={{ backgroundColor: t.color }} />
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${theme === t.id ? 'text-primary' : 'text-zinc-500'}`}>
                                            {t.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PRIVACY & SECURITY Section */}
                <div className="flex flex-col space-y-2">
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black leading-tight tracking-[0.2em] px-2 pb-1 pt-2 uppercase font-display">
                        PRIVACY & SECURITY
                    </h3>
                    <div className="flex flex-col bg-white dark:bg-zinc-900/50 rounded-2xl overflow-hidden shadow-sm">
                        {/* Direct Call Permission */}
                        <div className="flex items-center gap-4 bg-transparent px-4 py-3 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">call</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    Allow Direct Calls
                                </p>
                            </div>
                            <div className="shrink-0">
                                <button
                                    onClick={() => setAllowDirectCalls(!allowDirectCalls)}
                                    className="relative inline-flex items-center cursor-pointer"
                                >
                                    <div className={`w-11 h-6 rounded-full transition-colors ${allowDirectCalls ? 'bg-primary' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                                        <div className={`absolute top-0.5 left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${allowDirectCalls ? 'translate-x-[20px]' : ''}`} />
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800/50" />

                        {/* Notifications */}
                        <button
                            onClick={() => navigate('/settings/notifications')}
                            className="flex items-center gap-4 bg-transparent px-4 py-3 justify-between hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">notifications</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    Notifications
                                </p>
                            </div>
                            <div className="shrink-0">
                                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500" style={{ fontSize: '20px' }}>
                                    arrow_forward_ios
                                </span>
                            </div>
                        </button>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800/50" />

                        {/* Change Password */}
                        <button
                            onClick={() => navigate('/settings/change-password')}
                            className="flex items-center gap-4 bg-transparent px-4 py-3 justify-between hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">lock</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    Change Password
                                </p>
                            </div>
                            <div className="shrink-0">
                                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500" style={{ fontSize: '20px' }}>
                                    arrow_forward_ios
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* GENERAL Section */}
                <div className="flex flex-col space-y-2">
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black leading-tight tracking-[0.2em] px-2 pb-1 pt-2 uppercase font-display">
                        GENERAL
                    </h3>
                    <div className="flex flex-col bg-white dark:bg-zinc-900/50 rounded-2xl overflow-hidden shadow-sm">
                        {/* Language */}
                        <button
                            onClick={() => navigate('/settings/language')}
                            className="flex items-center gap-4 bg-transparent px-4 py-3 justify-between hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">language</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    Language
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold">{language}</p>
                                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500" style={{ fontSize: '20px' }}>
                                    arrow_forward_ios
                                </span>
                            </div>
                        </button>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 ml-14" />

                        {/* Help & Support */}
                        <button
                            onClick={() => navigate('/settings/help')}
                            className="flex items-center gap-4 bg-transparent px-4 py-3 justify-between hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">help</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    Help & Support
                                </p>
                            </div>
                            <div className="shrink-0">
                                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500" style={{ fontSize: '20px' }}>
                                    arrow_forward_ios
                                </span>
                            </div>
                        </button>

                        <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 ml-14" />

                        {/* About iFilmDirectory */}
                        <button
                            onClick={() => navigate('/settings/about')}
                            className="flex items-center gap-4 bg-transparent px-4 py-3 justify-between hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-zinc-900 dark:text-white flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/10 shrink-0 size-10">
                                    <span className="material-symbols-outlined">info</span>
                                </div>
                                <p className="text-zinc-900 dark:text-white text-sm font-bold leading-normal uppercase tracking-wide">
                                    About iFilm
                                </p>
                            </div>
                            <div className="shrink-0">
                                <span className="material-symbols-outlined text-zinc-400 dark:text-zinc-500" style={{ fontSize: '20px' }}>
                                    arrow_forward_ios
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="pt-8">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full flex items-center justify-center gap-4 bg-red-50 dark:bg-red-500/10 px-4 py-4 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-[0.98] border border-red-200 dark:border-red-500/20"
                    >
                        <span className="material-symbols-outlined text-red-500">logout</span>
                        <p className="text-red-600 dark:text-red-500 text-base font-black uppercase tracking-[0.2em]">Logout</p>
                    </button>
                </div>
            </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    <div
                        className="bg-white dark:bg-zinc-900 rounded-[32px] w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center space-y-4">
                            <div className="size-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-red-500 text-4xl">logout</span>
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight font-display">Confirm Logout</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium px-4">
                                Are you sure you want to end your session? You can always log back in anytime.
                            </p>
                        </div>

                        <div className="p-6 pt-0 flex flex-col gap-3">
                            <button
                                onClick={handleLogout}
                                className="w-full h-14 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all"
                            >
                                Log Me Out
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="w-full h-14 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
