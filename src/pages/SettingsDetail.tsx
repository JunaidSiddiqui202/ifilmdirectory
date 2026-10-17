import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updatePassword } from 'firebase/auth';
import { getUserProfile, type UserProfile } from '../services/userService';
import Logo from '../components/Logo';
import BottomNav from '../components/BottomNav';

export default function SettingsDetail() {
    const { section } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // State for forms
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentLanguage, setCurrentLanguage] = useState('English');
    const [notificationStates, setNotificationStates] = useState({
        email: true,
        push: true,
        jobs: true,
        marketing: false
    });

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

    const getTitle = () => {
        switch (section) {
            case 'contact-login': return 'Contact & Credentials';
            case 'subscription': return 'Membership & Studio Tiers';
            case 'notifications': return 'Alert Preferences';
            case 'change-password': return 'Password & Security';
            case 'language': return 'System Language';
            case 'help': return 'Concierge & Help Desk';
            case 'about': return 'About iFilmDirectory';
            default: return 'Settings Detail';
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            setMessageType('error');
            return;
        }
        setLoading(true);
        try {
            if (currentUser) {
                await updatePassword(currentUser, newPassword);
                setMessage('Security password updated successfully.');
                setMessageType('success');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            setMessage(error.message || 'Failed to update password');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (section) {
            case 'contact-login':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="p-5 bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                    Primary Email
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                                    Verified
                                </span>
                            </div>
                            <p className="text-base font-semibold text-zinc-900 dark:text-white">{currentUser?.email}</p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Used for casting notifications, project slates, and account recovery.</p>
                        </div>

                        <div className="p-5 bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                                Public Directory Handle
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-amber-500 font-bold">@</span>
                                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                                    {profile?.username || currentUser?.displayName?.toLowerCase().replace(/\s+/g, '') || 'filmmaker'}
                                </p>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-500/80 font-mono mt-2 bg-amber-500/[0.08] border border-amber-500/20 px-3 py-1.5 rounded-lg inline-block">
                                ifilmdirectory.com/profile/{profile?.username || 'filmmaker'}
                            </p>
                        </div>

                        <div className="p-5 bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                                Unique Production Identifier (UID)
                            </span>
                            <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all bg-zinc-100 dark:bg-black/40 p-3 rounded-xl border border-zinc-200 dark:border-white/[0.04]">
                                {currentUser?.uid}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
                                Provide this ID when querying priority support or linking studio facility bookings.
                            </p>
                        </div>
                    </div>
                );

            case 'subscription':
                return (
                    <div className="flex flex-col gap-6">
                        {/* Current Plan Badge */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-white to-amber-500/5 dark:via-[#14161a] dark:to-[#0d0e11] border border-amber-500/30 p-6 shadow-xl">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500 text-2xl">workspace_premium</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                        Active Membership
                                    </span>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                                    Pro Creator
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight font-display mb-1">
                                Professional Film Tier
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mb-6">
                                Unlocked direct messaging, verified portfolio credentials, 4K reel embeds, and unlimited production shortlists.
                            </p>

                            <div className="space-y-2.5 mb-6">
                                {[
                                    'Verified Gold Studio & Talent Badge',
                                    'Priority rank in Casting & Talent Directory searches',
                                    'Unlimited casting call submissions & direct messaging',
                                    'Host & book production facilities with zero platform surcharges',
                                    'Concierge production crew shortlist management'
                                ].map((perk, i) => (
                                    <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                                        <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-base shrink-0">
                                            check_circle
                                        </span>
                                        <span>{perk}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99] cursor-pointer">
                                Manage Billing & Invoices
                            </button>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="flex flex-col gap-3">
                        {[
                            {
                                id: 'jobs',
                                title: 'Casting & Job Alerts',
                                desc: 'Instant alerts when roles matching your craft or union guild are posted',
                                active: notificationStates.jobs,
                                toggle: () => setNotificationStates(prev => ({ ...prev, jobs: !prev.jobs }))
                            },
                            {
                                id: 'push',
                                title: 'Direct Messages & Slate Inquiries',
                                desc: 'Sound and banner alerts for new production chats and booking requests',
                                active: notificationStates.push,
                                toggle: () => setNotificationStates(prev => ({ ...prev, push: !prev.push }))
                            },
                            {
                                id: 'email',
                                title: 'Email Digests',
                                desc: 'Weekly roundup of shortlisted candidates, upcoming auditions, and industry news',
                                active: notificationStates.email,
                                toggle: () => setNotificationStates(prev => ({ ...prev, email: !prev.email }))
                            },
                            {
                                id: 'marketing',
                                title: 'Partner Equipment Discounts',
                                desc: 'Exclusive camera rental and studio gear offers from our verified facilities',
                                active: notificationStates.marketing,
                                toggle: () => setNotificationStates(prev => ({ ...prev, marketing: !prev.marketing }))
                            }
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm">
                                <div className="pr-4">
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wide">{item.title}</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                                </div>
                                <button
                                    onClick={item.toggle}
                                    type="button"
                                    className="relative inline-flex items-center cursor-pointer shrink-0"
                                    aria-label={`Toggle ${item.title}`}
                                >
                                    <div className={`w-11 h-6 rounded-full transition-colors ${item.active ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                                        <div className={`size-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${item.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                );

            case 'change-password':
                return (
                    <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                        <div className="p-5 bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-2xl space-y-4 shadow-sm">
                            <div>
                                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                                    New Passcode / Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter minimum 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#14161a] border border-zinc-300 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Re-type new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#14161a] border border-zinc-300 dark:border-white/[0.08] rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
                        >
                            {loading ? 'Updating Credentials...' : 'Update Password'}
                        </button>
                    </form>
                );

            case 'language':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { code: 'en', name: 'English', region: 'India & Global' },
                            { code: 'hi', name: 'हिंदी (Hindi)', region: 'Bollywood & North' },
                            { code: 'te', name: 'తెలుగు (Telugu)', region: 'Tollywood' },
                            { code: 'ta', name: 'தமிழ் (Tamil)', region: 'Kollywood' },
                            { code: 'mr', name: 'मराठी (Marathi)', region: 'Maharashtra' },
                            { code: 'ml', name: 'മലയാളം (Malayalam)', region: 'Mollywood' },
                            { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', region: 'Sandalwood' },
                            { code: 'bn', name: 'বাংলা (Bengali)', region: 'Tollywood East' },
                        ].map((lang) => (
                            <button
                                key={lang.name}
                                onClick={() => setCurrentLanguage(lang.name)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                                    currentLanguage === lang.name
                                        ? 'bg-amber-500/10 border-amber-500 text-zinc-900 dark:text-white shadow-md'
                                        : 'bg-white dark:bg-[#121316] border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/[0.15] hover:bg-zinc-50 dark:hover:bg-white/[0.02] shadow-sm'
                                }`}
                            >
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-wide">{lang.name}</p>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{lang.region}</p>
                                </div>
                                {currentLanguage === lang.name && (
                                    <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-xl">
                                        check_circle
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                );

            case 'help':
                return (
                    <div className="flex flex-col gap-4">
                        {/* Concierge Desk */}
                        <div className="p-5 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:via-[#121316] dark:to-[#14161a] border border-amber-500/30 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-amber-500 text-2xl">headset_mic</span>
                                <h4 className="text-base font-bold text-zinc-900 dark:text-white uppercase tracking-tight font-display">
                                    Direct Production Support
                                </h4>
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                                Need emergency studio assistance, verification support, or profile escalation? Our cinema concierge team responds within 24 hours.
                            </p>
                            <a
                                href="mailto:support@ifilmdirectory.com"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">mail</span>
                                <span>support@ifilmdirectory.com</span>
                            </a>
                        </div>

                        {/* FAQs */}
                        <div className="p-5 bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-2xl space-y-3 shadow-sm">
                            <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                Frequently Asked Questions
                            </h4>
                            {[
                                {
                                    q: 'How do I upload a verified showreel or video reference?',
                                    a: 'Go to your Profile page and select "Add Showreel". You can paste Vimeo, YouTube, or direct MP4 links with timestamp cue cards.'
                                },
                                {
                                    q: 'How do I obtain the Gold Verified Studio badge?',
                                    a: 'Submit your trade registration or guild accreditation card through the Profile verification tab. Review typically takes 1 business day.'
                                },
                                {
                                    q: 'How does client booking protection work for soundstages and gear?',
                                    a: 'All facility rentals through iFilmDirectory require mutual studio confirmation and contact verification to ensure legitimate production hires.'
                                }
                            ].map((faq, i) => (
                                <details key={i} className="group p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04]">
                                    <summary className="flex justify-between items-center text-xs md:text-sm font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer list-none select-none">
                                        <span>{faq.q}</span>
                                        <span className="material-symbols-outlined text-zinc-500 transition-transform duration-200 group-open:rotate-180">
                                            expand_more
                                        </span>
                                    </summary>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed pl-1">
                                        {faq.a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                );

            case 'about':
                return (
                    <div className="flex flex-col items-center gap-5 text-center py-8">
                        <div className="p-4 rounded-3xl bg-white dark:bg-[#121316] border border-amber-500/30 shadow-xl shadow-amber-500/10">
                            <Logo size="xl" showText={false} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-display">
                                iFilmDirectory
                            </h3>
                            <p className="text-xs text-amber-600 dark:text-amber-500 font-mono mt-0.5">Production Build 1.2.0</p>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-sm leading-relaxed">
                            India’s premier verified cinematic network connecting actors, directors, technicians, union guilds, and facilities under one seamless digital directory.
                        </p>
                        
                        {/* Company Attribution */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] max-w-sm w-full shadow-sm">
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                A registered property of:
                            </p>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-1">
                                5M Collective Services Pvt. Ltd. (5MC)
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-1">
                                All rights reserved © 2026 5MC. Designed for the Indian & global film fraternity.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 pt-2">
                            <Link to="/terms" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Terms of Service</Link>
                            <span className="text-zinc-400 dark:text-zinc-600">•</span>
                            <Link to="/privacy" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Privacy Policy</Link>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-12 text-zinc-500">
                        Section not found. Return to <Link to="/settings" className="text-amber-500 underline font-semibold">Settings</Link>.
                    </div>
                );
        }
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-zinc-100 overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-300 pb-32 md:pb-20 font-display transition-colors">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[400px] h-[350px] bg-amber-500/[0.04] rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[350px] bg-sky-500/[0.03] rounded-full blur-[140px]" />
            </div>

            {/* Centered Main Column */}
            <div className="relative z-10 w-full max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1 px-4 sm:px-6">
                {/* Balanced Top Header with perfect horizontal centering */}
                <header className="sticky top-0 z-30 flex items-center justify-between py-3.5 px-2 md:px-4 bg-white/85 dark:bg-[#090A0C]/85 backdrop-blur-md border-b border-zinc-200 dark:border-white/[0.06] -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
                    {/* Left Flank */}
                    <div className="w-24 flex items-center justify-start">
                        <button
                            onClick={() => navigate('/settings')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                            aria-label="Back to settings"
                        >
                            <span className="material-symbols-outlined text-base">arrow_back</span>
                            <span className="hidden sm:inline">Back</span>
                        </button>
                    </div>

                    {/* True Center Title */}
                    <div className="flex-1 flex items-center justify-center gap-2 text-center truncate px-2">
                        <h1 className="text-sm md:text-base font-bold uppercase tracking-wider font-display text-zinc-900 dark:text-white truncate">
                            {getTitle()}
                        </h1>
                    </div>

                    {/* Right Flank */}
                    <div className="w-24 flex items-center justify-end">
                        <button
                            onClick={() => navigate('/settings')}
                            className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                        >
                            Done
                        </button>
                    </div>
                </header>

                {/* Toast Message */}
                {message && (
                    <div className={`mb-6 p-3.5 rounded-xl text-xs font-bold uppercase tracking-wide text-center border animate-in fade-in ${
                        messageType === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                    }`}>
                        {message}
                    </div>
                )}

                {/* Subpage Content */}
                <div className="flex-1">
                    {renderContent()}
                </div>
            </div>

            {/* Global Bottom & Desktop Navigation */}
            <BottomNav />
        </div>
    );
}
