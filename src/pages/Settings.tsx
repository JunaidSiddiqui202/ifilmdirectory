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
        <div className="relative flex h-auto min-h-[100dvh] w-full flex-col bg-[#090A0C] text-zinc-100 overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-300">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[400px] h-[350px] bg-amber-500/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[350px] bg-sky-500/[0.02] rounded-full blur-[140px]" />
            </div>

            <div className="relative z-10 w-full max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1 pb-16 px-4 md:px-6">
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between py-4 bg-[#090A0C]/85 backdrop-blur-md border-b border-white/[0.06] -mx-4 px-4 md:-mx-6 md:px-6 mb-6">
                    <div className="flex size-10 shrink-0 items-center justify-center">
                        <HamburgerMenu />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-xl">settings</span>
                        <h1 className="text-white text-base md:text-lg font-bold uppercase tracking-wider font-display">
                            Settings & Preferences
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-amber-400 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        Done
                    </button>
                </div>

                <div className="flex flex-col space-y-6">

                    {/* SHARE WITH FRIENDS - VIP INVITE BANNER */}
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-amber-400 animate-ping" />
                                Community Expansion
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                WhatsApp Connect
                            </span>
                        </div>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#121316] to-[#14161a] border border-emerald-500/30 p-4 md:p-5 shadow-lg group hover:border-emerald-500/50 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                                        <span className="material-symbols-outlined text-2xl">share</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wide">
                                            Invite Industry Colleagues
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            Share iFilmDirectory with directors, technicians, and crew
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const referralLink = `${window.location.origin}/welcome?ref=${currentUser?.uid || ''}`;
                                        const message = `Hey! Join me on iFilmDirectory, India's premier verified network for cinema & entertainment professionals. Register your portfolio here: ${referralLink}`;
                                        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                                        window.open(whatsappUrl, '_blank');
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0 active:scale-95"
                                >
                                    <span>Share via WhatsApp</span>
                                    <span className="material-symbols-outlined text-sm">send</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ACCOUNT SECTION */}
                    <div className="flex flex-col space-y-2">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                            Production Account
                        </span>
                        <div className="rounded-2xl bg-[#121316] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06]">
                            {/* User Profile Card */}
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-white/[0.03] transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div
                                            className="size-14 rounded-full bg-cover bg-center border-2 border-amber-500/40 shadow-md group-hover:border-amber-400 transition-colors"
                                            style={{
                                                backgroundImage: `url(${profile?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'})`
                                            }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950 text-[10px]">
                                            <span className="material-symbols-outlined text-xs">verified</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white text-base font-bold uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                                                {profile?.displayName || currentUser?.displayName || 'Film Professional'}
                                            </h4>
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-wider">
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 font-medium mt-0.5">
                                            {profile?.role === 'custom' && profile?.customRole
                                                ? profile.customRole
                                                : profile?.role || 'Director / Creative'}
                                        </p>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">
                                            {currentUser?.email}
                                        </p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-zinc-500 group-hover:text-white transition-colors">
                                    chevron_right
                                </span>
                            </button>

                            {/* Contact & Login Details */}
                            <button
                                onClick={() => navigate('/settings/contact-login')}
                                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
                                        <span className="material-symbols-outlined text-lg">mail</span>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                            Contact & Credentials
                                        </p>
                                        <p className="text-[11px] text-zinc-500">Manage verified email, phone, and username handle</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-300 transition-colors text-lg">
                                    chevron_right
                                </span>
                            </button>

                            {/* Subscription & Billing */}
                            <button
                                onClick={() => navigate('/settings/subscription')}
                                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                        <span className="material-symbols-outlined text-lg">workspace_premium</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                                Tier & Membership
                                            </p>
                                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                                Studio Pro
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500">Verified badge, priority casting, casting shortlists</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-300 transition-colors text-lg">
                                    chevron_right
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* STUDIO APPEARANCE */}
                    <div className="flex flex-col space-y-2">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                            Display & Cinema Palette
                        </span>
                        <div className="rounded-2xl bg-[#121316] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06]">
                            {/* Day/Night Toggle */}
                            <div className="flex items-center justify-between px-4 py-3.5">
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                                        <span className="material-symbols-outlined text-lg">
                                            {isDarkMode ? 'dark_mode' : 'light_mode'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                            {isDarkMode ? 'Cinematic Dark Mode' : 'Studio Light Mode'}
                                        </p>
                                        <p className="text-[11px] text-zinc-500">
                                            Optimized high-contrast viewing for editing suites and set monitors
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleDarkMode}
                                    className="relative inline-flex items-center cursor-pointer p-0.5"
                                    aria-label="Toggle Dark Mode"
                                >
                                    <div className={`w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                                        <div className={`size-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>
                            </div>

                            {/* Color Accent Picker */}
                            <div className="flex flex-col gap-3 p-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                                        <span className="material-symbols-outlined text-lg">palette</span>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                            Accent Color
                                        </p>
                                        <p className="text-[11px] text-zinc-500">Select signature aesthetic tone</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pl-12 overflow-x-auto pb-1 no-scrollbar">
                                    {[
                                        { id: 'gold', color: '#f59e0b', label: 'Cinema Gold' },
                                        { id: 'blue', color: '#3b82f6', label: 'Anamorphic Blue' },
                                        { id: 'red', color: '#ef4444', label: 'Tally Red' },
                                        { id: 'green', color: '#10b981', label: 'Matrix Emerald' },
                                        { id: 'purple', color: '#a855f7', label: 'Neon Velvet' },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id as any)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase transition-all ${
                                                theme === t.id
                                                    ? 'bg-white/[0.08] border-amber-500 text-white shadow-sm'
                                                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.12]'
                                            }`}
                                        >
                                            <span
                                                className="size-3 rounded-full shrink-0 shadow-sm"
                                                style={{ backgroundColor: t.color }}
                                            />
                                            <span className="text-[10px] tracking-wide">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRIVACY & COMMUNICATIONS */}
                    <div className="flex flex-col space-y-2">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                            Privacy & Inquiries
                        </span>
                        <div className="rounded-2xl bg-[#121316] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06]">
                            {/* Direct Calls */}
                            <div className="flex items-center justify-between px-4 py-3.5">
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                                        <span className="material-symbols-outlined text-lg">phone_in_talk</span>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                            Allow Direct Casting Calls
                                        </p>
                                        <p className="text-[11px] text-zinc-500">
                                            Verified casting directors can initiate direct contact
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAllowDirectCalls(!allowDirectCalls)}
                                    className="relative inline-flex items-center cursor-pointer p-0.5"
                                    aria-label="Allow Direct Calls"
                                >
                                    <div className={`w-12 h-6 rounded-full transition-colors ${allowDirectCalls ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                                        <div className={`size-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${allowDirectCalls ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>
                            </div>

                            {/* Notifications */}
                            <button
                                onClick={() => navigate('/settings/notifications')}
                                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 group-hover:text-amber-400 transition-colors">
                                        <span className="material-symbols-outlined text-lg">notifications</span>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                            Alert Preferences
                                        </p>
                                        <p className="text-[11px] text-zinc-500">Casting alerts, message updates, guild announcements</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-300 transition-colors text-lg">
                                    chevron_right
                                </span>
                            </button>

                            {/* Security / Password */}
                            <button
                                onClick={() => navigate('/settings/change-password')}
                                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 group-hover:text-amber-400 transition-colors">
                                        <span className="material-symbols-outlined text-lg">lock_reset</span>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                            Password & Access
                                        </p>
                                        <p className="text-[11px] text-zinc-500">Update security credentials and authentication methods</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-300 transition-colors text-lg">
                                    chevron_right
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* GENERAL & SUPPORT */}
                    <div className="flex flex-col space-y-2">
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                            Platform & Support
                        </span>
                        <div className="rounded-2xl bg-[#121316] border border-white/[0.08] overflow-hidden divide-y divide-white/[0.06]">
                            {/* Language */}
                            <button
                                onClick={() => navigate('/settings/language')}
                                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 group-hover:text-amber-400 transition-colors">
                                        <span className="material-symbols-outlined text-lg">translate</span>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                            System Language
                                        </p>
                                        <p className="text-[11px] text-zinc-500">English (India) · Regional film industries</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-amber-400">{language}</span>
                                    <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-300 transition-colors text-lg">
                                        chevron_right
                                    </span>
                                </div>
                            </button>

                            {/* Help & Support */}
                            <button
                                onClick={() => navigate('/settings/help')}
                                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 group-hover:text-amber-400 transition-colors">
                                        <span className="material-symbols-outlined text-lg">support_agent</span>
                                    </div>
                                    <div>
                                        <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                            Concierge & Help Desk
                                        </p>
                                        <p className="text-[11px] text-zinc-500">24/7 technical assistance and FAQs</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-300 transition-colors text-lg">
                                    chevron_right
                                </span>
                            </button>

                            {/* About iFilm */}
                            <button
                                onClick={() => navigate('/settings/about')}
                                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors group"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="size-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300 group-hover:text-amber-400 transition-colors">
                                        <span className="material-symbols-outlined text-lg">info</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs md:text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                                                About iFilmDirectory
                                            </p>
                                            <span className="text-[9px] font-bold text-zinc-400 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded">
                                                5MC
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500">Property of 5M Collective Services Pvt. Ltd.</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-300 transition-colors text-lg">
                                    chevron_right
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* LOGOUT BUTTON */}
                    <div className="pt-2">
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest transition-all active:scale-[0.99]"
                        >
                            <span className="material-symbols-outlined text-base">logout</span>
                            <span>Terminate Active Session</span>
                        </button>
                    </div>

                    {/* Attribution Footer */}
                    <div className="text-center pt-4 pb-2">
                        <p className="text-[11px] text-zinc-500 font-medium">
                            iFilmDirectory · Version 1.2.0
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">
                            A property of <span className="text-amber-500/80 font-semibold">5M Collective Services Pvt. Ltd. (5MC)</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutConfirm && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    <div
                        className="bg-[#14161a] border border-white/[0.1] rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-500/10">
                            <span className="material-symbols-outlined text-3xl">logout</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider font-display">
                                Sign Out Session
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                                Are you sure you wish to log out? Your active shortlists, messages, and studio submissions will remain safe.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2.5 pt-2">
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95"
                            >
                                Confirm Logout
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="w-full py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                            >
                                Stay Signed In
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
